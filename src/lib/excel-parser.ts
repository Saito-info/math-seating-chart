import * as XLSX from 'xlsx';
import { Student, StudentProperties, ClassId } from '@/types';

export type ImportMode = 'seat-pref' | 'score';

export type SeatPrefImportSummary = {
  count: number;
  classes: ClassId[];
  focusCount: number;
  groupCount: number;
  sheetName: string;
};

export type ScoreImportSummary = {
  count: number;
  classes: ClassId[];
  fileCount: number;
  fileNames: string[];
  gradeYear: 1 | 2 | 3;
  format: 'gakuseki' | 'legacy';
};

export type ParseExcelResult = {
  students: Student[];
  seatPrefImport?: SeatPrefImportSummary;
  scoreImport?: ScoreImportSummary;
};

export type ScoreGradeYear = 1 | 2 | 3;

/** デフォルト列: F=5, J=9 (Microsoft Forms ふりかえり形式) */
const DEFAULT_ID_COL = 5;
const DEFAULT_PREF_COL = 9;

function isHeaderLike(value: string): boolean {
  return /出席|番号|希望|座席|クラス|氏名|name|id/i.test(value);
}

/** F列等の出席番号セルを { classId, exID } に変換 */
function parseStudentIdFromCell(
  raw: unknown,
  currentClassId: ClassId
): { classId: ClassId; exID: number } | null {
  if (raw === undefined || raw === null || raw === '') return null;

  const str = String(raw).trim();
  if (!str || isHeaderLike(str)) return null;

  const num = Number(str);
  if (isNaN(num)) return null;

  // 4桁形式 (例: 2502 → 2年5組2番)
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

/** J列等の希望座席セルを 1(集中) / 2(グループ) に変換 */
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

/** Microsoft Forms 等: ヘッダー行から出席番号列・希望列を自動検出 */
function detectSeatPrefColumns(rawData: unknown[][]): {
  idCol: number;
  prefCol: number;
  dataStartRow: number;
} {
  for (let rowIdx = 0; rowIdx < Math.min(10, rawData.length); rowIdx++) {
    const row = rawData[rowIdx] || [];
    let idCol = -1;
    let prefCol = -1;

    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      const cell = String(row[colIdx] ?? '').trim();
      if (/出席番号|4桁/.test(cell)) idCol = colIdx;
      if (/次回.*授業|どのように受け|希望.*座席|座席.*希望|受けたいですか/.test(cell)) prefCol = colIdx;
    }

    if (idCol !== -1) {
      return {
        idCol,
        prefCol: prefCol !== -1 ? prefCol : DEFAULT_PREF_COL,
        dataStartRow: rowIdx + 1,
      };
    }
  }

  return { idCol: DEFAULT_ID_COL, prefCol: DEFAULT_PREF_COL, dataStartRow: 1 };
}

/** 座席希望データを含むシートを優先選択 */
function pickWorksheet(workbook: XLSX.WorkBook): { sheetName: string; worksheet: XLSX.WorkSheet } {
  if (workbook.SheetNames.includes('配置決め')) {
    return { sheetName: '配置決め', worksheet: workbook.Sheets['配置決め'] };
  }

  for (const name of workbook.SheetNames) {
    const ws = workbook.Sheets[name];
    const preview: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    for (let r = 0; r < Math.min(5, preview.length); r++) {
      const row = preview[r] || [];
      if (row.some(cell => /出席番号|4桁/.test(String(cell ?? '')))) {
        return { sheetName: name, worksheet: ws };
      }
    }
  }

  const sheetName = workbook.SheetNames[0];
  return { sheetName, worksheet: workbook.Sheets[sheetName] };
}

function upsertStudentPref(
  studentsMap: Map<string, Student>,
  classId: ClassId,
  exID: number,
  defaultPref: 1 | 2
): void {
  const key = `${classId}-${exID}`;
  const existing = studentsMap.get(key);
  if (existing) {
    studentsMap.set(key, { ...existing, defaultPref });
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

function upsertStudentScore(
  studentsMap: Map<string, Student>,
  classId: ClassId,
  exID: number,
  score: number,
  replaceScore: boolean
): void {
  const key = `${classId}-${exID}`;
  const existing = studentsMap.get(key);
  if (existing) {
    studentsMap.set(key, {
      ...existing,
      score: replaceScore ? score : (existing.score || 0) + score,
    });
  } else {
    studentsMap.set(key, {
      id: exID,
      classId,
      name: `${classId} ${exID}番`,
      defaultPref: 2,
      score,
      props: { common: { customPairs: [], separateFrom: [] }, whenType1: {}, whenType2: {} },
    });
  }
}

/** 3桁学籍番号（先頭学年省略）: 501 → 学年Xの5組1番 */
function parseShortGakusekiId(
  raw: unknown,
  gradeYear: ScoreGradeYear
): { classId: ClassId; exID: number } | null {
  if (raw === undefined || raw === null || raw === '') return null;
  const str = String(raw).trim();
  if (!str || /学籍|番号|氏名/.test(str)) return null;

  const num = Number(str);
  if (isNaN(num)) return null;

  // すでに4桁なら学年込みとして解釈
  if (num >= 1000 && num <= 3999) {
    const exID = num % 100;
    const classNum = Math.floor((num % 1000) / 100);
    const gradeNum = Math.floor(num / 1000);
    if (exID >= 1 && exID <= 40 && classNum >= 1 && classNum <= 5 && gradeNum >= 1 && gradeNum <= 3) {
      return { classId: `${gradeNum}-${classNum}` as ClassId, exID };
    }
  }

  // 3桁形式: 組(1桁) + 出席番号(2桁) ※学年は UI で補完
  if (num >= 101 && num <= 540) {
    const exID = num % 100;
    const classNum = Math.floor(num / 100);
    if (exID >= 1 && exID <= 40 && classNum >= 1 && classNum <= 5) {
      return { classId: `${gradeYear}-${classNum}` as ClassId, exID };
    }
  }

  return null;
}

/** 「学籍順」シートの合計列を検出（合計100 / 合計 など） */
function detectGakusekiScoreLayout(rawData: unknown[][]): {
  idCol: number;
  scoreCol: number;
  dataStartRow: number;
} | null {
  for (let rowIdx = 0; rowIdx < Math.min(5, rawData.length); rowIdx++) {
    const row = rawData[rowIdx] || [];
    let idCol = -1;
    let scoreCol = -1;
    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      const cell = String(row[colIdx] ?? '').trim();
      if (/学籍番号/.test(cell)) idCol = colIdx;
      if (/^合計/.test(cell) || cell === '合計100') scoreCol = colIdx;
    }
    if (idCol !== -1 && scoreCol !== -1) {
      return { idCol, scoreCol, dataStartRow: rowIdx + 1 };
    }
  }
  return null;
}

function pickGakusekiSheet(workbook: XLSX.WorkBook): { sheetName: string; worksheet: XLSX.WorkSheet } | null {
  if (workbook.SheetNames.includes('学籍順')) {
    return { sheetName: '学籍順', worksheet: workbook.Sheets['学籍順'] };
  }
  for (const name of workbook.SheetNames) {
    const ws = workbook.Sheets[name];
    const preview: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
    if (detectGakusekiScoreLayout(preview)) {
      return { sheetName: name, worksheet: ws };
    }
  }
  return null;
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/** 1ファイルから学籍順形式の素点を抽出（数値がある行のみ） */
function extractGakusekiScores(
  workbook: XLSX.WorkBook,
  gradeYear: ScoreGradeYear
): Map<string, number> {
  const scores = new Map<string, number>();
  const picked = pickGakusekiSheet(workbook);
  if (!picked) return scores;

  const rawData: unknown[][] = XLSX.utils.sheet_to_json(picked.worksheet, { header: 1, defval: '' });
  const layout = detectGakusekiScoreLayout(rawData);
  if (!layout) return scores;

  for (let rowIdx = layout.dataStartRow; rowIdx < rawData.length; rowIdx++) {
    const row = rawData[rowIdx] || [];
    const parsed = parseShortGakusekiId(row[layout.idCol], gradeYear);
    if (!parsed) continue;

    const rawScore = row[layout.scoreCol];
    if (rawScore === undefined || rawScore === null || rawScore === '') continue;
    const score = Number(rawScore);
    if (isNaN(score)) continue;

    const key = `${parsed.classId}-${parsed.exID}`;
    scores.set(key, score);
  }
  return scores;
}

/**
 * 成績ファイル（複数可）を読み込み、合計点を既存データへ反映する。
 * - 新形式: 「学籍順」シート / 学籍番号(3桁・学年省略) / 合計列
 * - 複数ファイル: 同一生徒の素点を自動加算
 * - 旧形式: 単一ファイル時のみ従来レイアウトへフォールバック
 */
export async function parseExcelScoreFiles(
  files: File[],
  gradeYear: ScoreGradeYear,
  existingStudents: Student[],
  currentClassId: ClassId
): Promise<ParseExcelResult> {
  if (files.length === 0) {
    return { students: existingStudents };
  }

  const studentsMap = new Map<string, Student>();
  existingStudents.forEach(s =>
    studentsMap.set(`${s.classId}-${s.id}`, { ...s, props: { ...s.props, common: { ...s.props.common } } })
  );

  const totals = new Map<string, number>();
  let gakusekiFileCount = 0;
  const usedNames: string[] = [];

  for (const file of files) {
    const buffer = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    const fileScores = extractGakusekiScores(workbook, gradeYear);

    if (fileScores.size > 0) {
      gakusekiFileCount++;
      usedNames.push(file.name);
      for (const [key, score] of fileScores) {
        totals.set(key, (totals.get(key) || 0) + score);
      }
    }
  }

  if (gakusekiFileCount > 0) {
    const affectedClasses = new Set<ClassId>();
    for (const [key, score] of totals) {
      const [grade, classNum, idStr] = key.split('-');
      const classId = `${grade}-${classNum}` as ClassId;
      const exID = Number(idStr);
      upsertStudentScore(studentsMap, classId, exID, score, true);
      affectedClasses.add(classId);
    }

    return {
      students: Array.from(studentsMap.values()),
      scoreImport: {
        count: totals.size,
        classes: [...affectedClasses].sort(),
        fileCount: gakusekiFileCount,
        fileNames: usedNames,
        gradeYear,
        format: 'gakuseki',
      },
    };
  }

  // 旧形式フォールバック（先頭ファイルのみ）
  const legacy = await parseExcelData(files[0], currentClassId, 'score', existingStudents);
  return {
    ...legacy,
    scoreImport: {
      count: legacy.students.filter(s => s.score > 0).length,
      classes: [...new Set(legacy.students.filter(s => s.score > 0).map(s => s.classId))].sort(),
      fileCount: 1,
      fileNames: [files[0].name],
      gradeYear: Number(currentClassId.split('-')[0]) as ScoreGradeYear,
      format: 'legacy',
    },
  };
}

/**
 * Excelファイルを読み込み、選択されたモード（座席希望 or 成績入力）に応じて
 * 既存の生徒データとマージした新しい生徒配列を返します。
 */
export async function parseExcelData(
  file: File,
  currentClassId: ClassId,
  mode: ImportMode,
  existingStudents: Student[]
): Promise<ParseExcelResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const { sheetName, worksheet } = pickWorksheet(workbook);
        const rawData: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        const studentsMap = new Map<string, Student>();
        existingStudents.forEach(s => studentsMap.set(`${s.classId}-${s.id}`, { ...s, props: { ...s.props, common: { ...s.props.common } } }));

        const gradePrefix = currentClassId.split('-')[0] + '-';
        let seatPrefImport: SeatPrefImportSummary | undefined;

        if (mode === 'seat-pref') {
          const { idCol, prefCol, dataStartRow } = detectSeatPrefColumns(rawData);
          const affectedClasses = new Set<ClassId>();
          let focusCount = 0;
          let groupCount = 0;
          let count = 0;

          for (let rowIdx = dataStartRow; rowIdx < rawData.length; rowIdx++) {
            const rawId = rawData[rowIdx]?.[idCol];
            const rawPref = rawData[rowIdx]?.[prefCol];

            const parsed = parseStudentIdFromCell(rawId, currentClassId);
            if (!parsed) continue;

            const { classId, exID } = parsed;
            const defaultPref = parsePrefFromCell(rawPref);
            upsertStudentPref(studentsMap, classId, exID, defaultPref);

            affectedClasses.add(classId);
            count++;
            if (defaultPref === 1) focusCount++;
            else groupCount++;
          }

          seatPrefImport = {
            count,
            classes: [...affectedClasses].sort(),
            focusCount,
            groupCount,
            sheetName,
          };
        } else {
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
                    studentsMap.set(key, { ...existing, score, defaultPref });
                  } else {
                    const props: StudentProperties = {
                      common: {
                        avoidAC: (classNum === 5 && exID === 12),
                        fixedSeatId: (classNum === 2 && exID === 24) ? 24 : undefined,
                        customPairs: [],
                        separateFrom: [],
                      },
                      whenType1: {
                        preferFrontRow: (classNum === 1 && (exID === 15 || exID === 31 || exID === 2 || exID === 21)),
                      },
                      whenType2: {},
                    };

                    studentsMap.set(key, {
                      id: exID,
                      classId,
                      name: `${classId} ${exID}番`,
                      defaultPref,
                      score,
                      props,
                    });
                  }
                }
              }
            }

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

        resolve({
          students: Array.from(studentsMap.values()),
          seatPrefImport,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
