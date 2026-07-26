import * as XLSX from 'xlsx';
import { Student, StudentProperties, ClassId } from '@/types';

/**
 * 従来形式と新形式（G列=出席番号2101~2540等, K列=希望1or2）を自動判別し、
 * 出席番号が必ず 1〜40 の正常な値になるよう厳格にインポートします。
 */
export async function parseExcelData(file: File, currentClassId: ClassId): Promise<Student[]> {
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
        const studentsMap = new Map<string, Student>();
        
        const gradePrefix = currentClassId.split('-')[0] + '-';

        // ==========================================
        // ★ 0. 新形式（G列=インデックス6に4桁番号があるか）を自動判別！
        // ==========================================
        let isNewFormat = false;
        for (let rowIdx = 0; rowIdx < Math.min(rawData.length, 100); rowIdx++) {
          const val = rawData[rowIdx]?.[6];
          if (val !== undefined && val !== null && !isNaN(Number(val)) && Number(val) >= 1000) {
            isNewFormat = true;
            break;
          }
        }

        if (isNewFormat) {
          // ==========================================
          // ★ 新形式専用パーサー（G列:出席番号 2101~2540等 / K列:希望 1or2）
          // 従来パーサーとの競合を完全にシャットアウトし、あり得ない数値を根絶します！
          // ==========================================
          for (let rowIdx = 0; rowIdx < rawData.length; rowIdx++) {
            const rawG = rawData[rowIdx]?.[6];  // G列
            const rawK = rawData[rowIdx]?.[10]; // K列

            if (rawG !== undefined && rawG !== null && rawG !== '') {
              const numG = Number(rawG);
              if (!isNaN(numG) && numG >= 1000 && numG <= 3999) {
                const exID = numG % 100; // 下2桁が出席番号 (01~40)
                const classNum = Math.floor((numG % 1000) / 100); // 組 (1~5)
                const gradeNum = Math.floor(numG / 1000); // 学年 (1~3)
                
                // 正常な出席番号(1~40)およびクラス番号(1~5)の確密バリデーション
                if (exID >= 1 && exID <= 40 && classNum >= 1 && classNum <= 5) {
                  const classId = `${gradeNum}-${classNum}` as ClassId;
                  const defaultPref = (Number(rawK) === 1) ? 1 : 2;
                  const key = `${classId}-${exID}`;
                  
                  const existing = studentsMap.get(key);
                  if (existing) {
                    existing.defaultPref = defaultPref;
                  } else {
                    studentsMap.set(key, {
                      id: exID,
                      classId: classId,
                      name: `${classId} ${exID}番`,
                      defaultPref,
                      score: 0,
                      props: { common: { customPairs: [] }, whenType1: {}, whenType2: {} }
                    });
                  }
                }
              }
            }
          }
        } else {
          // ==========================================
          // ★ 従来形式専用パーサー（A〜J列の各クラス2列）
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

                  studentsMap.set(`${classId}-${exID}`, {
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