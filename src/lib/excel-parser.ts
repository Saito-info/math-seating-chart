import * as XLSX from 'xlsx';
import { Student, StudentProperties, ClassId } from '@/types';

export type ImportMode = 'seat-pref' | 'score';

/** Excel列: F=5, J=9 (0始まり) */
const COL_SEAT_PREF_ID = 5;
const COL_SEAT_PREF_VALUE = 9;

function isHeaderLike(value: string): boolean {
  return /出席|番号|希望|座席|クラス|氏名|name/i.test(value);
}

/** F列の出席番号セルを { classId, exID } に変換 */
function parseStudentIdFromCell(
  raw: unknown,
  currentClassId: ClassId
): { classId: ClassId; exID: number } | null {
  if (raw === undefined || raw === null || raw === '') return null;

  const str = String(raw).trim();
  if (!str || isHeaderLike(str)) return null;

  const num = Number(str);
  if (isNaN(num)) return null;

  // 4桁形式 (例: 2201 → 2年2組1番)
  if (num >= 1000 && num <= 3999) {
    const exID = num % 100;
    const classNum = Math.floor((num % 1000) / 100);
    const gradeNum = Math.floor(num / 1000);
    if (exID >= 1 && exID <= 40 && classNum >= 1 && classNum <= 5 && gradeNum >= 1 && gradeNum <= 3) {
      return { classId: `${gradeNum}-${classNum}` as ClassId, exID };
    }
  }

  // 1〜40の出席番号（選択中クラスに紐付け）
  const simpleId = Math.trunc(num);
  if (simpleId >= 1 && simpleId <= 40) {
    return { classId: currentClassId, exID: simpleId };
  }

  return null;
}

/** J列の希望座席セルを 1(集中) / 2(グループ) に変換 */
function parsePrefFromCell(raw: unknown): 1 | 2 {
  if (raw === undefined || raw === null || raw === '') return 2;

  const str = String(raw).trim();
  if (!str || isHeaderLike(str)) return 2;

  const num = Number(str);
  if (num === 1) return 1;
  if (num === 2) return 2;

  if (/集中|個人|①/.test(str)) return 1;
  if (/グループ|②/.test(str)) return 2;

  return 2;
}

/**
 * Excelファイルを読み込み、選択されたモード（座席希望 or 成績入力）に応じて
 * 既存の生徒データと賢くマージ・更新した新しい生徒配列を返します。
 */
export async function parseExcelData(
  file: File,
  currentClassId: ClassId,
  mode: ImportMode,
  existingStudents: Student[]
): Promise<Student[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames.includes('配置決め')
          ? '配置決め'
          : workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // ★ 既存の生徒データを展開し、編集済みの配慮事項や他方のデータを消さないようにベースにします
        const studentsMap = new Map<string, Student>();
        existingStudents.forEach(s => studentsMap.set(`${s.classId}-${s.id}`, { ...s }));

        const gradePrefix = currentClassId.split('-')[0] + '-';

        if (mode === 'seat-pref') {
          // ==========================================
          // ★ モード1: 新形式（座席希望インポート・F列/J列）
          // F列: 出席番号（4桁形式 2201 または 1〜40）
          // J列: 希望座席（1:集中, 2:グループ）
          // ==========================================
          for (let rowIdx = 0; rowIdx < rawData.length; rowIdx++) {
            const rawF = rawData[rowIdx]?.[COL_SEAT_PREF_ID];
            const rawJ = rawData[rowIdx]?.[COL_SEAT_PREF_VALUE];

            const parsed = parseStudentIdFromCell(rawF, currentClassId);
            if (!parsed) continue;

            const { classId, exID } = parsed;
            const defaultPref = parsePrefFromCell(rawJ);
            const key = `${classId}-${exID}`;

            const existing = studentsMap.get(key);
            if (existing) {
              existing.defaultPref = defaultPref;
            } else {
              studentsMap.set(key, {
                id: exID,
                classId,
                name: `${classId} ${exID}番`,
                defaultPref,
                score: 0,
                props: { common: { customPairs: [], separateFrom: [] }, whenType1: {}, whenType2: {} },
              });
            }
          }
        } else {
          // ==========================================
          // ★ モード2: 旧形式（成績入力＆基本情報インポート・A〜J列 ＆ L〜U列）
          // 従来形式の全クラス（1〜5組）を走査し、成績スコアや固定席等の基本設定を反映します。
          // ==========================================
          for (let classNum = 1; classNum <= 5; classNum++) {
            const classId = `${gradePrefix}${classNum}` as ClassId;
            const maxStudents = (classNum === 1 || classNum === 5) ? 40 : 39;

            const idColIdx = (classNum - 1) * 2;
            const prefColIdx = idColIdx + 1;
            const scoreColIdx = 11 + (classNum - 1) * 2;
            const scoreValColIdx = scoreColIdx + 1;

            let hasData = false;

            for (let rowIdx = 1; rowIdx <= maxStudents; rowIdx++) {
              const rawID = rawData[rowIdx]?.[idColIdx];
              if (rawID !== undefined && rawID !== null && rawID !== '') {
                const exID = Number(rawID) % 100;
                if (exID >= 1 && exID <= maxStudents) {
                  hasData = true;
                  const rawPref = rawData[rowIdx]?.[prefColIdx];
                  const defaultPref = (Number(rawPref) === 1) ? 1 : 2;

                  let score = 0;
                  const rawScore = rawData[rowIdx]?.[scoreValColIdx];
                  if (rawScore !== undefined && !isNaN(Number(rawScore))) {
                    score = Number(rawScore);
                  }

                  const key = `${classId}-${exID}`;
                  const existing = studentsMap.get(key);

                  if (existing) {
                    // ★ 既存の配慮事項や希望区分を維持しつつ、成績スコアを厳格に反映！
                    existing.score = score;
                    // ※旧形式にも希望区分が載っていれば同期反映
                    existing.defaultPref = defaultPref;
                  } else {
                    const props: StudentProperties = {
                      common: {
                        avoidAC: (classNum === 5 && exID === 12),
                        fixedSeatId: (classNum === 2 && exID === 24) ? 24 : undefined,
                        customPairs: []
                      },
                      whenType1: {
                        preferFrontRow: (classNum === 1 && (exID === 15 || exID === 31 || exID === 2 || exID === 21))
                      },
                      whenType2: {}
                    };

                    studentsMap.set(key, {
                      id: exID,
                      classId: classId,
                      name: `${classId} ${exID}番`,
                      defaultPref,
                      score,
                      props
                    });
                  }
                }
              }
            }

            // 旧形式のペア希望読み取り (46〜48行目)
            if (hasData) {
              for (let rowIdx = 46; rowIdx <= 48; rowIdx++) {
                const pair1 = rawData[rowIdx]?.[idColIdx];
                const pair2 = rawData[rowIdx]?.[prefColIdx];
                if (pair1 && pair2) {
                  const pID1 = Number(pair1) % 100;
                  const pID2 = Number(pair2) % 100;
                  const s1 = studentsMap.get(`${classId}-${pID1}`);
                  const s2 = studentsMap.get(`${classId}-${pID2}`);
                  if (s1 && s2) {
                    if (!s1.props.common.customPairs) s1.props.common.customPairs = [];
                    if (!s2.props.common.customPairs) s2.props.common.customPairs = [];
                    if (!s1.props.common.customPairs.includes(pID2)) s1.props.common.customPairs.push(pID2);
                    if (!s2.props.common.customPairs.includes(pID1)) s2.props.common.customPairs.push(pID1);
                  }
                }
              }
            }
          }
        }

        resolve(Array.from(studentsMap.values()));
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}