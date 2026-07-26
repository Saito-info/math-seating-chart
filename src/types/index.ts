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

export type StudentProperties = {
  common: {
    avoidAC?: boolean;
    fixedSeatId?: number;
    customPairs?: number[];
    separateFrom?: number[];
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
  props: StudentProperties;
};

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
  lessonType: 'normal' | 'combined';
  targetClasses: ClassId[];
  seatingFunctionLatex: string;
  seats: SeatNode[];
  absenteeIds: string[]; // 文字列キー(例: "2-1-5")による完全独立管理
};