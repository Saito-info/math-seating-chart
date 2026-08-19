import { Student, SeatNode, ClassLayoutTemplate, SeatingFunction } from '@/types';

/** ①（集中・青）生徒の配置順序（後方から連続スキャン） */
function getFocusContinuousOrder(rows: number, cols: number, isCombined: boolean): { r: number; c: number }[] {
  const order: { r: number; c: number }[] = [];
  if (!isCombined) {
    for (let r = rows; r >= 1; r--) {
      for (let c = cols; c >= 1; c--) {
        order.push({ r, c });
      }
    }
  } else {
    for (let r = rows; r >= 1; r--) {
      order.push({ r, c: 8 });
      order.push({ r, c: 1 });
    }
    for (let r = rows; r >= 1; r--) {
      for (let c = 7; c >= 2; c--) {
        order.push({ r, c });
      }
    }
  }
  return order;
}

/** 1人〜36人の固定グループパターン辞書 */
function getFixedGroupPatterns(numPeople: number): { id: string; coords: { r: number; c: number }[] }[] {
  switch (numPeople) {
    case 1: return [{ id: 'Group-1', coords: [{ r: 1, c: 3 }] }];
    case 2: return [{ id: 'Group-1', coords: [{ r: 1, c: 3 }, { r: 1, c: 4 }] }];
    case 3: return [{ id: 'Group-1', coords: [{ r: 1, c: 3 }, { r: 1, c: 4 }, { r: 2, c: 4 }] }];
    case 4: return [{ id: 'Group-1', coords: [{ r: 1, c: 3 }, { r: 1, c: 4 }, { r: 2, c: 3 }, { r: 2, c: 4 }] }];
    case 5: return [
      { id: 'Group-1', coords: [{ r: 1, c: 3 }, { r: 1, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 4 }, { r: 2, c: 4 }, { r: 2, c: 3 }] }
    ];
    case 6: return [
      { id: 'Group-1', coords: [{ r: 2, c: 3 }, { r: 1, c: 2 }, { r: 1, c: 3 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 4 }, { r: 2, c: 4 }, { r: 1, c: 5 }] }
    ];
    case 7: return [
      { id: 'Group-1', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 2 }, { r: 2, c: 3 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 4 }, { r: 2, c: 4 }, { r: 1, c: 5 }] }
    ];
    case 8: return [
      { id: 'Group-1', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 2 }, { r: 2, c: 3 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 4 }, { r: 2, c: 5 }] }
    ];
    case 9: return [
      { id: 'Group-1', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 2, c: 3 }, { r: 2, c: 4 }, { r: 3, c: 3 }] },
      { id: 'Group-3', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 5 }] }
    ];
    case 10: return [
      { id: 'Group-1', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 5 }] },
      { id: 'Group-3', coords: [{ r: 2, c: 3 }, { r: 2, c: 4 }, { r: 3, c: 3 }, { r: 3, c: 4 }] }
    ];
    case 11: return [
      { id: 'Group-1', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 2 }, { r: 2, c: 3 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 4 }, { r: 2, c: 5 }] },
      { id: 'Group-3', coords: [{ r: 3, c: 3 }, { r: 3, c: 4 }, { r: 4, c: 3 }] }
    ];
    case 12: return [
      { id: 'Group-1', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 5 }] },
      { id: 'Group-3', coords: [{ r: 2, c: 3 }, { r: 2, c: 4 }, { r: 3, c: 4 }] },
      { id: 'Group-4', coords: [{ r: 3, c: 3 }, { r: 4, c: 3 }, { r: 4, c: 4 }] }
    ];
    case 13: return [
      { id: 'Group-1', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 4 }, { r: 2, c: 5 }] },
      { id: 'Group-3', coords: [{ r: 2, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 3 }] },
      { id: 'Group-4', coords: [{ r: 3, c: 4 }, { r: 4, c: 3 }, { r: 4, c: 4 }] }
    ];
    case 14: return [
      { id: 'Group-1', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 2 }, { r: 2, c: 3 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 4 }, { r: 2, c: 5 }] },
      { id: 'Group-3', coords: [{ r: 3, c: 2 }, { r: 3, c: 3 }, { r: 4, c: 3 }] },
      { id: 'Group-4', coords: [{ r: 3, c: 4 }, { r: 3, c: 5 }, { r: 4, c: 4 }] }
    ];
    case 15: return [
      { id: 'Group-1', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 5 }] },
      { id: 'Group-3', coords: [{ r: 3, c: 2 }, { r: 4, c: 2 }, { r: 4, c: 3 }] },
      { id: 'Group-4', coords: [{ r: 2, c: 3 }, { r: 2, c: 4 }, { r: 3, c: 3 }] },
      { id: 'Group-5', coords: [{ r: 3, c: 4 }, { r: 3, c: 5 }, { r: 4, c: 4 }] }
    ];
    case 16: return [
      { id: 'Group-1', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 5 }] },
      { id: 'Group-3', coords: [{ r: 3, c: 2 }, { r: 4, c: 2 }, { r: 4, c: 3 }] },
      { id: 'Group-4', coords: [{ r: 3, c: 5 }, { r: 4, c: 4 }, { r: 4, c: 5 }] },
      { id: 'Group-5', coords: [{ r: 2, c: 3 }, { r: 2, c: 4 }, { r: 3, c: 3 }, { r: 3, c: 4 }] }
    ];
    case 17: return [
      { id: 'Group-1', coords: [{ r: 1, c: 1 }, { r: 1, c: 2 }, { r: 2, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 3 }, { r: 2, c: 3 }, { r: 2, c: 4 }] },
      { id: 'Group-3', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 5 }] },
      { id: 'Group-4', coords: [{ r: 3, c: 2 }, { r: 3, c: 3 }, { r: 4, c: 2 }, { r: 4, c: 3 }] },
      { id: 'Group-5', coords: [{ r: 3, c: 4 }, { r: 3, c: 5 }, { r: 4, c: 4 }, { r: 4, c: 5 }] }
    ];
    case 18: return [
      { id: 'Group-1', coords: [{ r: 1, c: 1 }, { r: 1, c: 2 }, { r: 2, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 3 }, { r: 1, c: 4 }, { r: 2, c: 4 }] },
      { id: 'Group-3', coords: [{ r: 1, c: 5 }, { r: 1, c: 6 }, { r: 2, c: 5 }] },
      { id: 'Group-4', coords: [{ r: 2, c: 3 }, { r: 3, c: 3 }, { r: 3, c: 4 }] },
      { id: 'Group-5', coords: [{ r: 3, c: 2 }, { r: 4, c: 2 }, { r: 4, c: 3 }] },
      { id: 'Group-6', coords: [{ r: 3, c: 5 }, { r: 4, c: 4 }, { r: 4, c: 5 }] }
    ];
    case 19: return [
      { id: 'Group-1', coords: [{ r: 1, c: 1 }, { r: 1, c: 2 }, { r: 2, c: 1 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 3 }, { r: 1, c: 4 }, { r: 2, c: 4 }] },
      { id: 'Group-3', coords: [{ r: 2, c: 2 }, { r: 2, c: 3 }, { r: 3, c: 2 }] },
      { id: 'Group-4', coords: [{ r: 1, c: 5 }, { r: 1, c: 6 }, { r: 2, c: 5 }] },
      { id: 'Group-5', coords: [{ r: 3, c: 3 }, { r: 4, c: 2 }, { r: 4, c: 3 }] },
      { id: 'Group-6', coords: [{ r: 3, c: 4 }, { r: 3, c: 5 }, { r: 4, c: 4 }, { r: 4, c: 5 }] }
    ];
    case 20: return [
      { id: 'Group-1', coords: [{ r: 1, c: 1 }, { r: 1, c: 2 }, { r: 2, c: 1 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 3 }, { r: 2, c: 2 }, { r: 2, c: 3 }] },
      { id: 'Group-3', coords: [{ r: 1, c: 4 }, { r: 2, c: 4 }, { r: 2, c: 5 }] },
      { id: 'Group-4', coords: [{ r: 1, c: 5 }, { r: 1, c: 6 }, { r: 2, c: 6 }] },
      { id: 'Group-5', coords: [{ r: 3, c: 2 }, { r: 3, c: 3 }, { r: 4, c: 2 }, { r: 4, c: 3 }] },
      { id: 'Group-6', coords: [{ r: 3, c: 4 }, { r: 3, c: 5 }, { r: 4, c: 4 }, { r: 4, c: 5 }] }
    ];
    case 21: return [
      { id: 'Group-1', coords: [{ r: 1, c: 1 }, { r: 1, c: 2 }, { r: 2, c: 1 }] },
      { id: 'Group-2', coords: [{ r: 2, c: 2 }, { r: 3, c: 1 }, { r: 3, c: 2 }] },
      { id: 'Group-3', coords: [{ r: 3, c: 3 }, { r: 4, c: 2 }, { r: 4, c: 3 }] },
      { id: 'Group-4', coords: [{ r: 1, c: 3 }, { r: 1, c: 4 }, { r: 2, c: 3 }] },
      { id: 'Group-5', coords: [{ r: 3, c: 4 }, { r: 4, c: 4 }, { r: 4, c: 5 }] },
      { id: 'Group-6', coords: [{ r: 2, c: 4 }, { r: 2, c: 5 }, { r: 3, c: 5 }] },
      { id: 'Group-7', coords: [{ r: 1, c: 5 }, { r: 1, c: 6 }, { r: 2, c: 6 }] }
    ];
    case 22: return [
      { id: 'Group-1', coords: [{ r: 1, c: 1 }, { r: 2, c: 1 }, { r: 2, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 }] },
      { id: 'Group-3', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 4 }] },
      { id: 'Group-4', coords: [{ r: 1, c: 6 }, { r: 2, c: 5 }, { r: 2, c: 6 }] },
      { id: 'Group-5', coords: [{ r: 3, c: 1 }, { r: 3, c: 2 }, { r: 4, c: 2 }] },
      { id: 'Group-6', coords: [{ r: 3, c: 3 }, { r: 3, c: 4 }, { r: 4, c: 3 }, { r: 4, c: 4 }] },
      { id: 'Group-7', coords: [{ r: 3, c: 5 }, { r: 3, c: 6 }, { r: 4, c: 5 }] }
    ];
    case 23: return [
      { id: 'Group-1', coords: [{ r: 1, c: 1 }, { r: 2, c: 1 }, { r: 2, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 }] },
      { id: 'Group-3', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 4 }] },
      { id: 'Group-4', coords: [{ r: 1, c: 6 }, { r: 2, c: 5 }, { r: 2, c: 6 }] },
      { id: 'Group-5', coords: [{ r: 3, c: 1 }, { r: 3, c: 2 }, { r: 4, c: 1 }, { r: 4, c: 2 }] },
      { id: 'Group-6', coords: [{ r: 3, c: 3 }, { r: 3, c: 4 }, { r: 4, c: 3 }, { r: 4, c: 4 }] },
      { id: 'Group-7', coords: [{ r: 3, c: 5 }, { r: 3, c: 6 }, { r: 4, c: 5 }] }
    ];
    case 24: return [
      { id: 'Group-1', coords: [{ r: 1, c: 1 }, { r: 2, c: 1 }, { r: 2, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 }] },
      { id: 'Group-3', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 4 }] },
      { id: 'Group-4', coords: [{ r: 1, c: 6 }, { r: 2, c: 5 }, { r: 2, c: 6 }] },
      { id: 'Group-5', coords: [{ r: 3, c: 1 }, { r: 4, c: 1 }, { r: 4, c: 2 }] },
      { id: 'Group-6', coords: [{ r: 3, c: 2 }, { r: 3, c: 3 }, { r: 4, c: 3 }] },
      { id: 'Group-7', coords: [{ r: 3, c: 4 }, { r: 3, c: 5 }, { r: 4, c: 4 }] },
      { id: 'Group-8', coords: [{ r: 3, c: 6 }, { r: 4, c: 5 }, { r: 4, c: 6 }] }
    ];
    case 25: return [
      { id: 'Group-1', coords: [{ r: 1, c: 1 }, { r: 1, c: 2 }, { r: 2, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 2, c: 1 }, { r: 3, c: 1 }, { r: 3, c: 2 }] },
      { id: 'Group-3', coords: [{ r: 4, c: 1 }, { r: 4, c: 2 }, { r: 5, c: 1 }] },
      { id: 'Group-4', coords: [{ r: 1, c: 3 }, { r: 1, c: 4 }, { r: 2, c: 3 }] },
      { id: 'Group-5', coords: [{ r: 1, c: 5 }, { r: 1, c: 6 }, { r: 2, c: 6 }] },
      { id: 'Group-6', coords: [{ r: 3, c: 3 }, { r: 4, c: 3 }, { r: 4, c: 4 }] },
      { id: 'Group-7', coords: [{ r: 3, c: 6 }, { r: 4, c: 5 }, { r: 4, c: 6 }] },
      { id: 'Group-8', coords: [{ r: 2, c: 4 }, { r: 2, c: 5 }, { r: 3, c: 4 }, { r: 3, c: 5 }] }
    ];
    case 26: return [
      { id: 'Group-1', coords: [{ r: 1, c: 1 }, { r: 2, c: 1 }, { r: 2, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 }] },
      { id: 'Group-3', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 4 }] },
      { id: 'Group-4', coords: [{ r: 1, c: 6 }, { r: 2, c: 5 }, { r: 2, c: 6 }] },
      { id: 'Group-5', coords: [{ r: 3, c: 1 }, { r: 3, c: 2 }, { r: 4, c: 2 }] },
      { id: 'Group-6', coords: [{ r: 4, c: 1 }, { r: 5, c: 1 }, { r: 5, c: 2 }] },
      { id: 'Group-7', coords: [{ r: 3, c: 3 }, { r: 3, c: 4 }, { r: 4, c: 3 }, { r: 4, c: 4 }] },
      { id: 'Group-8', coords: [{ r: 3, c: 5 }, { r: 3, c: 6 }, { r: 4, c: 5 }, { r: 4, c: 6 }] }
    ];
    case 27: return [
      { id: 'Group-1', coords: [{ r: 1, c: 1 }, { r: 1, c: 2 }, { r: 2, c: 1 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 3 }, { r: 1, c: 4 }, { r: 2, c: 4 }] },
      { id: 'Group-3', coords: [{ r: 1, c: 5 }, { r: 1, c: 6 }, { r: 2, c: 6 }] },
      { id: 'Group-4', coords: [{ r: 2, c: 2 }, { r: 2, c: 3 }, { r: 3, c: 3 }] },
      { id: 'Group-5', coords: [{ r: 2, c: 5 }, { r: 3, c: 4 }, { r: 3, c: 5 }] },
      { id: 'Group-6', coords: [{ r: 3, c: 1 }, { r: 3, c: 2 }, { r: 4, c: 2 }] },
      { id: 'Group-7', coords: [{ r: 4, c: 1 }, { r: 5, c: 1 }, { r: 5, c: 2 }] },
      { id: 'Group-8', coords: [{ r: 4, c: 3 }, { r: 4, c: 4 }, { r: 5, c: 3 }] },
      { id: 'Group-9', coords: [{ r: 3, c: 6 }, { r: 4, c: 5 }, { r: 4, c: 6 }] }
    ];
    case 28: return [
      { id: 'Group-1', coords: [{ r: 1, c: 1 }, { r: 2, c: 1 }, { r: 2, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 }] },
      { id: 'Group-3', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 4 }] },
      { id: 'Group-4', coords: [{ r: 1, c: 6 }, { r: 2, c: 5 }, { r: 2, c: 6 }] },
      { id: 'Group-5', coords: [{ r: 3, c: 1 }, { r: 3, c: 2 }, { r: 4, c: 2 }] },
      { id: 'Group-6', coords: [{ r: 4, c: 1 }, { r: 5, c: 1 }, { r: 5, c: 2 }] },
      { id: 'Group-7', coords: [{ r: 3, c: 3 }, { r: 3, c: 4 }, { r: 4, c: 4 }] },
      { id: 'Group-8', coords: [{ r: 4, c: 3 }, { r: 5, c: 3 }, { r: 5, c: 4 }] },
      { id: 'Group-9', coords: [{ r: 3, c: 5 }, { r: 3, c: 6 }, { r: 4, c: 5 }, { r: 4, c: 6 }] }
    ];
    case 29: return [
      { id: 'Group-1', coords: [{ r: 1, c: 1 }, { r: 1, c: 2 }, { r: 2, c: 1 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 3 }, { r: 1, c: 4 }, { r: 2, c: 4 }] },
      { id: 'Group-3', coords: [{ r: 1, c: 5 }, { r: 1, c: 6 }, { r: 2, c: 6 }] },
      { id: 'Group-4', coords: [{ r: 2, c: 2 }, { r: 3, c: 1 }, { r: 3, c: 2 }] },
      { id: 'Group-5', coords: [{ r: 2, c: 3 }, { r: 3, c: 3 }, { r: 3, c: 4 }] },
      { id: 'Group-6', coords: [{ r: 2, c: 5 }, { r: 3, c: 5 }, { r: 3, c: 6 }] },
      { id: 'Group-7', coords: [{ r: 4, c: 1 }, { r: 4, c: 2 }, { r: 5, c: 1 }, { r: 5, c: 2 }] },
      { id: 'Group-8', coords: [{ r: 4, c: 3 }, { r: 4, c: 4 }, { r: 5, c: 3 }, { r: 5, c: 4 }] },
      { id: 'Group-9', coords: [{ r: 4, c: 5 }, { r: 4, c: 6 }, { r: 5, c: 5 }] }
    ];
    case 30: return [
      { id: 'Group-1', coords: [{ r: 1, c: 1 }, { r: 2, c: 1 }, { r: 2, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 }] },
      { id: 'Group-3', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 4 }] },
      { id: 'Group-4', coords: [{ r: 1, c: 6 }, { r: 2, c: 5 }, { r: 2, c: 6 }] },
      { id: 'Group-5', coords: [{ r: 3, c: 1 }, { r: 3, c: 2 }, { r: 4, c: 2 }] },
      { id: 'Group-6', coords: [{ r: 4, c: 1 }, { r: 5, c: 1 }, { r: 5, c: 2 }] },
      { id: 'Group-7', coords: [{ r: 3, c: 3 }, { r: 3, c: 4 }, { r: 4, c: 4 }] },
      { id: 'Group-8', coords: [{ r: 4, c: 3 }, { r: 5, c: 3 }, { r: 5, c: 4 }] },
      { id: 'Group-9', coords: [{ r: 3, c: 5 }, { r: 3, c: 6 }, { r: 4, c: 5 }] },
      { id: 'Group-10', coords: [{ r: 4, c: 6 }, { r: 5, c: 5 }, { r: 5, c: 6 }] }
    ];
    case 31: return [
      { id: 'Group-1', coords: [{ r: 1, c: 1 }, { r: 2, c: 1 }, { r: 2, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 }] },
      { id: 'Group-3', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 4 }] },
      { id: 'Group-4', coords: [{ r: 1, c: 6 }, { r: 2, c: 5 }, { r: 2, c: 6 }] },
      { id: 'Group-5', coords: [{ r: 3, c: 1 }, { r: 3, c: 2 }, { r: 4, c: 1 }, { r: 4, c: 2 }] },
      { id: 'Group-6', coords: [{ r: 5, c: 1 }, { r: 5, c: 2 }, { r: 6, c: 1 }] },
      { id: 'Group-7', coords: [{ r: 3, c: 3 }, { r: 3, c: 4 }, { r: 4, c: 4 }] },
      { id: 'Group-8', coords: [{ r: 4, c: 3 }, { r: 5, c: 3 }, { r: 5, c: 4 }] },
      { id: 'Group-9', coords: [{ r: 3, c: 5 }, { r: 3, c: 6 }, { r: 4, c: 5 }] },
      { id: 'Group-10', coords: [{ r: 4, c: 6 }, { r: 5, c: 5 }, { r: 5, c: 6 }] }
    ];
    case 32: return [
      { id: 'Group-1', coords: [{ r: 1, c: 1 }, { r: 2, c: 1 }, { r: 2, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 }] },
      { id: 'Group-3', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 4 }] },
      { id: 'Group-4', coords: [{ r: 1, c: 6 }, { r: 2, c: 5 }, { r: 2, c: 6 }] },
      { id: 'Group-5', coords: [{ r: 3, c: 1 }, { r: 3, c: 2 }, { r: 4, c: 1 }, { r: 4, c: 2 }] },
      { id: 'Group-6', coords: [{ r: 5, c: 1 }, { r: 5, c: 2 }, { r: 6, c: 1 }, { r: 6, c: 2 }] },
      { id: 'Group-7', coords: [{ r: 3, c: 3 }, { r: 3, c: 4 }, { r: 4, c: 4 }] },
      { id: 'Group-8', coords: [{ r: 4, c: 3 }, { r: 5, c: 3 }, { r: 5, c: 4 }] },
      { id: 'Group-9', coords: [{ r: 3, c: 5 }, { r: 3, c: 6 }, { r: 4, c: 5 }] },
      { id: 'Group-10', coords: [{ r: 4, c: 6 }, { r: 5, c: 5 }, { r: 5, c: 6 }] }
    ];
    case 33: return [
      { id: 'Group-1', coords: [{ r: 1, c: 1 }, { r: 2, c: 1 }, { r: 2, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 }] },
      { id: 'Group-3', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 4 }] },
      { id: 'Group-4', coords: [{ r: 1, c: 6 }, { r: 2, c: 5 }, { r: 2, c: 6 }] },
      { id: 'Group-5', coords: [{ r: 3, c: 1 }, { r: 3, c: 2 }, { r: 4, c: 1 }] },
      { id: 'Group-6', coords: [{ r: 3, c: 3 }, { r: 3, c: 4 }, { r: 4, c: 4 }] },
      { id: 'Group-7', coords: [{ r: 4, c: 2 }, { r: 4, c: 3 }, { r: 5, c: 2 }] },
      { id: 'Group-8', coords: [{ r: 5, c: 1 }, { r: 6, c: 1 }, { r: 6, c: 2 }] },
      { id: 'Group-9', coords: [{ r: 5, c: 3 }, { r: 5, c: 4 }, { r: 6, c: 3 }] },
      { id: 'Group-10', coords: [{ r: 3, c: 5 }, { r: 3, c: 6 }, { r: 4, c: 5 }] },
      { id: 'Group-11', coords: [{ r: 4, c: 6 }, { r: 5, c: 5 }, { r: 5, c: 6 }] }
    ];
    case 34: return [
      { id: 'Group-1', coords: [{ r: 1, c: 1 }, { r: 2, c: 1 }, { r: 2, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 }] },
      { id: 'Group-3', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 4 }] },
      { id: 'Group-4', coords: [{ r: 1, c: 6 }, { r: 2, c: 5 }, { r: 2, c: 6 }] },
      { id: 'Group-5', coords: [{ r: 3, c: 1 }, { r: 3, c: 2 }, { r: 4, c: 1 }] },
      { id: 'Group-6', coords: [{ r: 3, c: 3 }, { r: 3, c: 4 }, { r: 4, c: 4 }] },
      { id: 'Group-7', coords: [{ r: 4, c: 2 }, { r: 4, c: 3 }, { r: 5, c: 2 }] },
      { id: 'Group-8', coords: [{ r: 5, c: 1 }, { r: 6, c: 1 }, { r: 6, c: 2 }] },
      { id: 'Group-9', coords: [{ r: 5, c: 3 }, { r: 5, c: 4 }, { r: 6, c: 3 }, { r: 6, c: 4 }] },
      { id: 'Group-10', coords: [{ r: 3, c: 5 }, { r: 3, c: 6 }, { r: 4, c: 5 }] },
      { id: 'Group-11', coords: [{ r: 4, c: 6 }, { r: 5, c: 5 }, { r: 5, c: 6 }] }
    ];
    case 35: return [
      { id: 'Group-1', coords: [{ r: 1, c: 1 }, { r: 2, c: 1 }, { r: 2, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 }] },
      { id: 'Group-3', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 4 }] },
      { id: 'Group-4', coords: [{ r: 1, c: 6 }, { r: 2, c: 5 }, { r: 2, c: 6 }] },
      { id: 'Group-5', coords: [{ r: 3, c: 1 }, { r: 4, c: 1 }, { r: 4, c: 2 }] },
      { id: 'Group-6', coords: [{ r: 3, c: 2 }, { r: 3, c: 3 }, { r: 4, c: 3 }] },
      { id: 'Group-7', coords: [{ r: 3, c: 4 }, { r: 3, c: 5 }, { r: 4, c: 4 }] },
      { id: 'Group-8', coords: [{ r: 3, c: 6 }, { r: 4, c: 5 }, { r: 4, c: 6 }] },
      { id: 'Group-9', coords: [{ r: 5, c: 1 }, { r: 5, c: 2 }, { r: 6, c: 1 }, { r: 6, c: 2 }] },
      { id: 'Group-10', coords: [{ r: 5, c: 3 }, { r: 5, c: 4 }, { r: 6, c: 3 }, { r: 6, c: 4 }] },
      { id: 'Group-11', coords: [{ r: 5, c: 5 }, { r: 5, c: 6 }, { r: 6, c: 5 }] }
    ];
    case 36: return [
      { id: 'Group-1', coords: [{ r: 1, c: 1 }, { r: 2, c: 1 }, { r: 2, c: 2 }] },
      { id: 'Group-2', coords: [{ r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 }] },
      { id: 'Group-3', coords: [{ r: 1, c: 4 }, { r: 1, c: 5 }, { r: 2, c: 4 }] },
      { id: 'Group-4', coords: [{ r: 1, c: 6 }, { r: 2, c: 5 }, { r: 2, c: 6 }] },
      { id: 'Group-5', coords: [{ r: 3, c: 1 }, { r: 4, c: 1 }, { r: 4, c: 2 }] },
      { id: 'Group-6', coords: [{ r: 3, c: 2 }, { r: 3, c: 3 }, { r: 4, c: 3 }] },
      { id: 'Group-7', coords: [{ r: 3, c: 4 }, { r: 3, c: 5 }, { r: 4, c: 4 }] },
      { id: 'Group-8', coords: [{ r: 3, c: 6 }, { r: 4, c: 5 }, { r: 4, c: 6 }] },
      { id: 'Group-9', coords: [{ r: 5, c: 1 }, { r: 6, c: 1 }, { r: 6, c: 2 }] },
      { id: 'Group-10', coords: [{ r: 5, c: 2 }, { r: 5, c: 3 }, { r: 6, c: 3 }] },
      { id: 'Group-11', coords: [{ r: 5, c: 4 }, { r: 5, c: 5 }, { r: 6, c: 4 }] },
      { id: 'Group-12', coords: [{ r: 5, c: 6 }, { r: 6, c: 5 }, { r: 6, c: 6 }] }
    ];
    default: return [];
  }
}

/** 37人以上でも下にスライド配置。合同時は+1列シフト */
function getScaledGroupPatterns(numPeople: number, isCombined: boolean): { id: string; coords: { r: number; c: number }[] }[] {
  const result: { id: string; coords: { r: number; c: number }[] }[] = [];
  let remaining = numPeople;
  let blockOffset = 0;
  let groupCounter = 1;
  const colShift = isCombined ? 1 : 0;

  while (remaining > 0) {
    const currentBatch = Math.min(remaining, 36);
    const basePatterns = getFixedGroupPatterns(currentBatch);
    for (const pat of basePatterns) {
      result.push({
        id: `Group-${groupCounter++}`,
        coords: pat.coords.map(c => ({ r: c.r + (blockOffset * 6), c: c.c + colShift }))
      });
    }
    remaining -= currentBatch;
    blockOffset++;
  }
  return result;
}

/**
 * 最適化席替えメインエンジン（双方向リンクのペア絶対隣接アルゴリズム搭載版）
 */
export function generateOptimizedSeatingChart(
  students: Student[],
  absenteeIds: string[],
  layout: ClassLayoutTemplate,
  isCombined: boolean,
  seatingFunc?: SeatingFunction
): SeatNode[] {
  const { rows, cols, acSeatIndices, disabledSeatIndices } = layout;
  
  const grid: SeatNode[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      const serialIdx = r * cols + c;
      return {
        seatIndex: serialIdx,
        row: r + 1,
        col: c + 1,
        isAC_Zone: acSeatIndices.includes(serialIdx),
        isInactive: disabledSeatIndices?.includes(serialIdx) || false,
        studentId: null,
      };
    })
  );

  const activeStudents = students.filter(s => !absenteeIds.includes(`${s.classId}-${s.id}`));
  const focusStudents = activeStudents.filter(s => s.defaultPref === 1);
  const groupStudents = activeStudents.filter(s => s.defaultPref === 2);

  const validSeatsCount = grid.flat().filter(s => !s.isInactive).length;
  let seatsToDeactivate = validSeatsCount - activeStudents.length;

  if (seatsToDeactivate > 0) {
    for (let r = rows - 1; r >= 0 && seatsToDeactivate > 0; r--) {
      for (let c = cols - 1; c >= 0 && seatsToDeactivate > 0; c--) {
        if (!grid[r][c].isInactive) {
          grid[r][c].isInactive = true;
          seatsToDeactivate--;
        }
      }
    }
  }

  // ステップ0.5: 固定席指定の最優先配置
  activeStudents.forEach(stu => {
    if (stu.props.common.fixedSeatId !== undefined && stu.props.common.fixedSeatId > 0) {
      const targetIdx = stu.props.common.fixedSeatId - 1;
      const targetSeat = grid.flat().find(s => s.seatIndex === targetIdx);
      if (targetSeat && !targetSeat.isInactive && targetSeat.studentId === null) {
        targetSeat.studentId = stu.id;
        targetSeat.studentClassId = stu.classId;
        targetSeat.role = stu.defaultPref === 1 ? 'focus' : 'member';
      }
    }
  });

  const remainingFocusStudents = focusStudents.filter(stu => 
    !grid.flat().some(s => s.studentClassId === stu.classId && s.studentId === stu.id)
  );
  const remainingGroupStudents = groupStudents.filter(stu => 
    !grid.flat().some(s => s.studentClassId === stu.classId && s.studentId === stu.id)
  );

  // ==========================================
  // ★ ステップ1: ②（グループ）を辞書にはめ込み ＆ 「🤝 同グループペア希望」の最優先割り当て！
  // 双方向リンクにより、確実に相手を同じ島に引き込みます。
  // ==========================================
  const groupPatterns = getScaledGroupPatterns(remainingGroupStudents.length, isCombined);
  
  const sortedGroupStudents = [...remainingGroupStudents].sort((a, b) => b.score - a.score);
  const leaderPoolSize = Math.min(sortedGroupStudents.length, groupPatterns.length + 3);
  const leaderPool = sortedGroupStudents.slice(0, leaderPoolSize);
  const shuffledPool = [...leaderPool].sort(() => Math.random() - 0.5);
  
  const leaders = shuffledPool.slice(0, groupPatterns.length);
  const members = remainingGroupStudents.filter(s => !leaders.includes(s));

  for (let i = 0; i < groupPatterns.length; i++) {
    const pat = groupPatterns[i];
    const targetSeats: SeatNode[] = [];

    for (const coord of pat.coords) {
      if (coord.r <= rows && coord.c <= cols) {
        const s = grid[coord.r - 1][coord.c - 1];
        if (!s.isInactive && s.studentId === null) {
          targetSeats.push(s);
        }
      }
    }

    if (targetSeats.length > 0) {
      targetSeats.forEach(s => s.groupId = pat.id);

      if (leaders[i] && targetSeats[0]) {
        targetSeats[0].studentId = leaders[i].id;
        targetSeats[0].studentClassId = leaders[i].classId;
        targetSeats[0].role = 'leader';
      }

      for (let j = 1; j < targetSeats.length; j++) {
        if (members.length > 0) {
          let memberToAssign: Student | undefined = undefined;

          // すでにこの島に入っている生徒のペア希望を双方向でチェック！
          const currentGroupStudents = targetSeats.slice(0, j)
            .map(s => activeStudents.find(st => st.classId === s.studentClassId && st.id === s.studentId))
            .filter(Boolean) as Student[];

          for (const currStu of currentGroupStudents) {
            if (currStu.props.common.customPairs && currStu.props.common.customPairs.length > 0) {
              const pairIdx = members.findIndex(m => currStu.props.common.customPairs?.includes(m.id) && m.classId === currStu.classId);
              if (pairIdx !== -1) {
                memberToAssign = members.splice(pairIdx, 1)[0];
                break;
              }
            }
          }

          if (!memberToAssign) {
            memberToAssign = members.shift()!;
          }

          targetSeats[j].studentId = memberToAssign.id;
          targetSeats[j].studentClassId = memberToAssign.classId;
          targetSeats[j].role = 'member';
        }
      }
    }
  }

  while (members.length > 0) {
    const remainingEmptySeats = grid.flat().filter(s => 
      !s.isInactive && s.studentId === null && !s.groupId &&
      (!isCombined || (s.col >= 2 && s.col <= cols - 1))
    );
    if (remainingEmptySeats.length === 0) break;
    const member = members.shift()!;
    remainingEmptySeats[0].studentId = member.id;
    remainingEmptySeats[0].studentClassId = member.classId;
    remainingEmptySeats[0].role = 'member';
    remainingEmptySeats[0].groupId = 'Group-Extra';
  }

  // ==========================================
  // ★ ステップ2: ①（個人・集中）の後方から連続スキャン配置 ＆ 【①と②の境界ペア・①同士の絶対隣接ペア】の反映！
  // ==========================================
  const focusOrder = getFocusContinuousOrder(rows, cols, isCombined);
  const emptySeatsForFocus = grid.flat().filter(s => !s.isInactive && s.studentId === null);
  emptySeatsForFocus.sort((a, b) => {
    const idxA = focusOrder.findIndex(o => o.r === a.row && o.c === a.col);
    const idxB = focusOrder.findIndex(o => o.r === b.row && o.c === b.col);
    const valA = idxA === -1 ? 9999 : idxA;
    const valB = idxB === -1 ? 9999 : idxB;
    return valA - valB;
  });

  const backWishers = remainingFocusStudents.filter(s => s.props.whenType1.preferBackRow && !s.props.whenType1.preferFrontRow);
  const frontWishers = remainingFocusStudents.filter(s => s.props.whenType1.preferFrontRow && !s.props.whenType1.preferBackRow);
  const normalFocus = remainingFocusStudents.filter(s => !backWishers.includes(s) && !frontWishers.includes(s));

  const shuffle = (arr: Student[]) => [...arr].sort(() => Math.random() - 0.5);
  
  const orderedFocusStudents = [
    ...shuffle(backWishers),
    ...shuffle(normalFocus),
    ...shuffle(frontWishers)
  ];

  // 【ステップ2-1】: ①と②のペア（すでに配置済みの②の隣接に、優先して①を配置する！）
  for (const stu of orderedFocusStudents) {
    if (grid.flat().some(s => s.studentClassId === stu.classId && s.studentId === stu.id)) continue;
    
    if (stu.props.common.customPairs && stu.props.common.customPairs.length > 0) {
      for (const pairId of stu.props.common.customPairs) {
        // ペア相手がすでに②（または固定席）として座っているか探す
        const pairSeat = grid.flat().find(s => s.studentClassId === stu.classId && s.studentId === pairId && s.role !== 'focus');
        if (pairSeat) {
          // その席の「上下左右」で、まだ①用の空き席として残っている席をピンポイントで探す
          const adjSeat = emptySeatsForFocus.find(s => 
            s.studentId === null && 
            (Math.abs(s.row - pairSeat.row) + Math.abs(s.col - pairSeat.col) === 1)
          );
          if (adjSeat) {
            adjSeat.studentId = stu.id;
            adjSeat.studentClassId = stu.classId;
            adjSeat.role = 'focus';
            break; // 境界での隣接配置成功！
          }
        }
      }
    }
  }

  // 【ステップ2-2】: ①同士のペア（残りの①を配置しながら、ペアなら強制的に隣の空き席に置く！）
  for (const stu of orderedFocusStudents) {
    if (grid.flat().some(s => s.studentClassId === stu.classId && s.studentId === stu.id)) continue;

    // 次に優先順位が高い空き席を探す
    const seat = emptySeatsForFocus.find(s => s.studentId === null);
    if (!seat) break;

    seat.studentId = stu.id;
    seat.studentClassId = stu.classId;
    seat.role = 'focus';

    // もしこの生徒にペア相手がいて、まだ座っていない場合、今の席の「上下左右」の空き席へ強制配置する！
    if (stu.props.common.customPairs && stu.props.common.customPairs.length > 0) {
      for (const pairId of stu.props.common.customPairs) {
        const pairStu = orderedFocusStudents.find(s => s.classId === stu.classId && s.id === pairId);
        if (pairStu && !grid.flat().some(s => s.studentClassId === pairStu.classId && s.studentId === pairStu.id)) {
          // 今座った seat の上下左右で空いている席を最優先確保
          const adjSeat = emptySeatsForFocus.find(s => 
            s.studentId === null && 
            (Math.abs(s.row - seat.row) + Math.abs(s.col - seat.col) === 1)
          );
          if (adjSeat) {
            adjSeat.studentId = pairStu.id;
            adjSeat.studentClassId = pairStu.classId;
            adjSeat.role = 'focus';
          }
        }
      }
    }
  }

  // ==========================================
  // ★ ステップ3: セーフティネット（出席生徒の席消失を100%防止！）
  // ==========================================
  const unassignedStudents = activeStudents.filter(stu => 
    !grid.flat().some(s => s.studentClassId === stu.classId && s.studentId === stu.id)
  );

  if (unassignedStudents.length > 0) {
    const finalEmptySeats = grid.flat().filter(s => !s.isInactive && s.studentId === null);
    let unassignedIdx = 0;
    for (const seat of finalEmptySeats) {
      if (unassignedIdx >= unassignedStudents.length) break;
      const stu = unassignedStudents[unassignedIdx];
      seat.studentId = stu.id;
      seat.studentClassId = stu.classId;
      seat.role = stu.defaultPref === 1 ? 'focus' : 'member';
      unassignedIdx++;
    }
  }

  // ==========================================
  // ★ ステップ4: エアコン回避の最適化スワップ！
  // ==========================================
  grid.flat().forEach(seat => {
    if (seat.isAC_Zone && seat.studentId !== null) {
      const stu = activeStudents.find(s => s.classId === seat.studentClassId && s.id === seat.studentId);
      if (stu && stu.props.common.avoidAC) {
        const safeSeat = grid.flat().find(target => 
          !target.isInactive &&
          !target.isAC_Zone &&
          target.studentId !== null &&
          target.role === seat.role &&
          target.seatIndex !== seat.seatIndex &&
          !activeStudents.find(s => s.classId === target.studentClassId && s.id === target.studentId)?.props.common.avoidAC
        );

        if (safeSeat) {
          const tempId = seat.studentId;
          const tempClass = seat.studentClassId;
          const tempRole = seat.role;

          seat.studentId = safeSeat.studentId;
          seat.studentClassId = safeSeat.studentClassId;
          seat.role = safeSeat.role;

          safeSeat.studentId = tempId;
          safeSeat.studentClassId = tempClass;
          safeSeat.role = tempRole;
        }
      }
    }
  });

  const flatSeats = grid.flat();
  flatSeats.forEach(seat => {
    if (seat.studentId !== null && !seat.isInactive) {
      const classNum = seat.studentClassId ? Number(seat.studentClassId.split('-')[1]) || 1 : 1;
      if (seatingFunc) {
        seat.formulaVal = seatingFunc.evaluate(classNum, seat.studentId);
      } else {
        seat.formulaVal = seat.studentId * 3 + 5;
      }
    } else {
      seat.formulaVal = undefined;
    }
  });

  return flatSeats;
}