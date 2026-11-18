// ==========================================
// 1. 生徒・配慮・成績データの型定義
// ==========================================

export type ClassId = '1-1' | '1-2' | '1-3' | '1-4' | '1-5' | '2-1' | '2-2' | '2-3' | '2-4' | '2-5' | '3-1' | '3-2' | '3-3' | '3-4' | '3-5';

export const ALL_CLASSES: ClassId[] = [
  '1-1', '1-2', '1-3', '1-4', '1-5',
  '2-1', '2-2', '2-3', '2-4', '2-5',
  '3-1', '3-2', '3-3', '3-4', '3-5'
];

export function getMaxStudents(classId: ClassId): number {
  const num = Number(classId.split('-')[1]);
  return (num === 1 || num === 5) ? 40 : 39;
}

export type Gender = 'male' | 'female';

export const GENDER_LABEL: Record<Gender, string> = { male: '男', female: '女' };

/** 窓側＝教室の左側（列番号が小さい側）／廊下側＝右側（列番号が大きい側） */
export type SeatSide = 'window' | 'corridor';

export const SEAT_SIDE_LABEL: Record<SeatSide, string> = {
  window: '窓側（左）',
  corridor: '廊下側（右）',
};

/** 隣に座りたい生徒の条件（クラス・性別。指定した条件をすべて満たす生徒が隣にいれば充足） */
export type AdjacentWish = {
  classIds?: ClassId[];
  gender?: Gender;
};

export type StudentProperties = {
  common: {
    avoidAC?: boolean;
    fixedSeatId?: number;
    customPairs?: number[];
    separateFrom?: number[];
    preferSide?: SeatSide;
    adjacentWish?: AdjacentWish;
  };
  whenType1: {
    preferFrontRow?: boolean;
    preferBackRow?: boolean;
  };
  whenType2: {
    preferCenter?: boolean;
  };
};

export type Student = {
  id: number;
  classId: ClassId;
  name: string;
  defaultPref: 1 | 2; // 1: 集中(青), 2: グループ(白/赤)
  score: number;
  gender?: Gender;
  props: StudentProperties;
};

// ==========================================
// 1.5 特別クラス（特別割など、複数クラスから編成した授業クラス）
// ==========================================

export type CustomClassMember = { classId: ClassId; id: number };

export type CustomClass = {
  id: string;
  label: string;
  gradeYear: 1 | 2 | 3;
  members: CustomClassMember[];
};

/** 4桁の出席番号（例: 2403 = 2年4組3番）を生徒キーへ */
export function parseFourDigitStudentId(raw: string | number): CustomClassMember | null {
  const num = Number(String(raw).trim());
  if (!Number.isInteger(num) || num < 1000 || num > 3999) return null;
  const grade = Math.floor(num / 1000);
  const classNum = Math.floor((num % 1000) / 100);
  const id = num % 100;
  if (classNum < 1 || classNum > 5 || id < 1) return null;
  const classId = `${grade}-${classNum}` as ClassId;
  if (!ALL_CLASSES.includes(classId) || id > getMaxStudents(classId)) return null;
  return { classId, id };
}

/** カンマ・空白・改行区切りの4桁出席番号リストを解析（重複除去・クラス順にソート） */
export function parseMemberList(input: string): { members: CustomClassMember[]; invalid: string[] } {
  const tokens = input.split(/[,，、\s]+/).map(t => t.trim()).filter(Boolean);
  const seen = new Set<string>();
  const members: CustomClassMember[] = [];
  const invalid: string[] = [];
  for (const token of tokens) {
    const m = parseFourDigitStudentId(token);
    if (!m) {
      invalid.push(token);
      continue;
    }
    const key = `${m.classId}-${m.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    members.push(m);
  }
  members.sort((a, b) => (a.classId === b.classId ? a.id - b.id : a.classId.localeCompare(b.classId)));
  return { members, invalid };
}

export function memberToFourDigit(m: CustomClassMember): number {
  const [grade, classNum] = m.classId.split('-').map(Number);
  return grade * 1000 + classNum * 100 + m.id;
}

export function getCustomClassClassIds(c: CustomClass): ClassId[] {
  return Array.from(new Set(c.members.map(m => m.classId))).sort();
}

/** 特別クラスのデフォルト座席の継承元: メンバーが最も多い元クラス（同数なら番号の小さい組） */
export function getCustomBaseClassId(c: CustomClass): ClassId {
  const counts = new Map<ClassId, number>();
  for (const m of c.members) counts.set(m.classId, (counts.get(m.classId) || 0) + 1);
  let best: ClassId = c.members[0]?.classId ?? '2-4';
  let bestCount = -1;
  for (const cid of [...counts.keys()].sort()) {
    const n = counts.get(cid)!;
    if (n > bestCount) { best = cid; bestCount = n; }
  }
  return best;
}

/** 2年 特別割（資料の「4」グループ）: 2-3×2名 / 2-4×27名 / 2-5×10名 = 39名 */
export const SPECIAL_2_GROUP4_IDS: number[] = [
  2303, 2326,
  2402, 2404, 2405, 2406, 2409, 2410, 2411, 2413, 2415, 2416, 2418, 2419, 2420, 2421, 2422, 2423,
  2424, 2426, 2427, 2428, 2431, 2433, 2434, 2435, 2436, 2437, 2438,
  2502, 2505, 2514, 2522, 2528, 2532, 2537, 2538, 2539, 2540,
];

export function createDefaultSpecialClass(): CustomClass {
  return {
    id: 'special-2-group4',
    label: '2年 特別割（4グループ）',
    gradeYear: 2,
    members: parseMemberList(SPECIAL_2_GROUP4_IDS.join(',')).members,
  };
}

// ==========================================
// 2. 座席関数・教室グリッド・レイアウト設定
// ==========================================

export type SeatingFunction = {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'ai-custom';
  title: string;
  latexString: string;
  evaluate: (m: number, n: number) => number;
};

export type SeatNode = {
  seatIndex: number;
  row: number;
  col: number;
  isAC_Zone: boolean;
  isInactive?: boolean; // 欠席者用・使わない空き席
  studentId: number | null;
  studentClassId?: ClassId;
  groupId?: string;
  role?: 'focus' | 'member' | 'leader';
  formulaVal?: number | string;
};

export type ClassLayoutTemplate = {
  classLabel: string;
  cols: number;
  rows: number;
  acSeatIndices: number[];
  disabledSeatIndices: number[];
};

export type SeatingArchive = {
  id: string;
  title: string;
  date: string;
  lessonType: 'normal' | 'combined' | 'custom';
  customClassId?: string;
  targetClasses: ClassId[];
  seatingFunctionLatex: string;
  seats: SeatNode[];
  absenteeIds: string[]; // 文字列キー(例: "2-1-5")による完全独立管理
};