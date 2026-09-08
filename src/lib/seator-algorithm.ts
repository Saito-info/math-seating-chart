import { Student, SeatNode, ClassLayoutTemplate, SeatingFunction } from '@/types';

/** ①（個人・集中・青）生徒の配置順序 */
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

/** 生徒キー（クラス跨ぎ合同対応） */
function studentKey(classId: string, id: number): string {
  return `${classId}-${id}`;
}

/** customPairs の連結成分（同クラス内・双方向）。2人以上のクラスタを返す */
function getPairClusters(students: Student[]): Student[][] {
  const byKey = new Map<string, Student>();
  for (const s of students) byKey.set(studentKey(s.classId, s.id), s);

  const parent = new Map<string, string>();
  const find = (k: string): string => {
    if (!parent.has(k)) parent.set(k, k);
    const p = parent.get(k)!;
    if (p !== k) parent.set(k, find(p));
    return parent.get(k)!;
  };
  const union = (a: string, b: string) => {
    const pa = find(a);
    const pb = find(b);
    if (pa !== pb) parent.set(pa, pb);
  };

  for (const s of students) {
    const sk = studentKey(s.classId, s.id);
    find(sk);
    for (const pid of s.props.common.customPairs || []) {
      const pk = studentKey(s.classId, pid);
      if (byKey.has(pk)) union(sk, pk);
    }
  }

  const groups = new Map<string, Student[]>();
  for (const s of students) {
    const root = find(studentKey(s.classId, s.id));
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(s);
  }
  return [...groups.values()].filter(g => g.length >= 2);
}

function arePaired(a: Student, b: Student): boolean {
  if (a.classId !== b.classId) return false;
  return (
    (a.props.common.customPairs?.includes(b.id) ?? false) ||
    (b.props.common.customPairs?.includes(a.id) ?? false)
  );
}

function isAdjacent(a: SeatNode, b: SeatNode): boolean {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

/** 空き席から size 個の連結ブロックを探す（BFS） */
function findConnectedEmptyBlock(
  emptySeats: SeatNode[],
  size: number,
  preferAvoidSeatIndices?: Set<number>
): SeatNode[] | null {
  const empties = emptySeats.filter(s => s.studentId === null);
  if (empties.length < size) return null;

  const sorted = [...empties].sort((a, b) => {
    const aPrev = preferAvoidSeatIndices?.has(a.seatIndex) ? 1 : 0;
    const bPrev = preferAvoidSeatIndices?.has(b.seatIndex) ? 1 : 0;
    if (aPrev !== bPrev) return aPrev - bPrev;
    return a.seatIndex - b.seatIndex;
  });

  for (const start of sorted) {
    const block: SeatNode[] = [start];
    const used = new Set<number>([start.seatIndex]);
    const queue = [start];
    while (queue.length > 0 && block.length < size) {
      const cur = queue.shift()!;
      const neighbors = empties
        .filter(s => !used.has(s.seatIndex) && isAdjacent(cur, s))
        .sort((a, b) => {
          const aPrev = preferAvoidSeatIndices?.has(a.seatIndex) ? 1 : 0;
          const bPrev = preferAvoidSeatIndices?.has(b.seatIndex) ? 1 : 0;
          return aPrev - bPrev;
        });
      for (const n of neighbors) {
        if (block.length >= size) break;
        used.add(n.seatIndex);
        block.push(n);
        queue.push(n);
      }
    }
    if (block.length >= size) return block.slice(0, size);
  }
  return null;
}

/** 既存配置クラスタに隣接する空き席を優先して複数人を成長配置 */
function placeClusterAdjacentToSeats(
  cluster: Student[],
  anchorSeats: SeatNode[],
  emptyPool: SeatNode[],
  role: SeatNode['role'],
  previousSeatMap: Map<string, number>
): void {
  const remaining = [...cluster];
  const occupiedCluster = [...anchorSeats];

  while (remaining.length > 0) {
    // 既存クラスタに隣接する空きを優先。アーカイブ重複席は後回し
    const candidates = emptyPool
      .filter(s => s.studentId === null && occupiedCluster.some(a => isAdjacent(a, s)))
      .sort((a, b) => {
        const nextStu = remaining[0];
        const pref = previousSeatMap.get(studentKey(nextStu.classId, nextStu.id));
        const aHit = pref === a.seatIndex ? 1 : 0;
        const bHit = pref === b.seatIndex ? 1 : 0;
        return aHit - bHit;
      });

    let seat: SeatNode | undefined = candidates[0];
    if (!seat) {
      seat = emptyPool.find(s => s.studentId === null);
    }
    if (!seat) break;

    const stu = remaining.shift()!;
    seat.studentId = stu.id;
    seat.studentClassId = stu.classId;
    seat.role = role;
    occupiedCluster.push(seat);
  }
}

function buildPreviousSeatMap(previousSeats?: SeatNode[]): Map<string, number> {
  const map = new Map<string, number>();
  if (!previousSeats) return map;
  for (const seat of previousSeats) {
    if (seat.studentId !== null && seat.studentClassId && !seat.isInactive) {
      map.set(studentKey(seat.studentClassId, seat.studentId), seat.seatIndex);
    }
  }
  return map;
}

function isFixedStudent(stu: Student): boolean {
  return stu.props.common.fixedSeatId !== undefined && stu.props.common.fixedSeatId > 0;
}

function areSeparated(a: Student, b: Student): boolean {
  if (a.classId !== b.classId) return false;
  return (
    (a.props.common.separateFrom?.includes(b.id) ?? false) ||
    (b.props.common.separateFrom?.includes(a.id) ?? false)
  );
}

function getAdjacentSeats(seat: SeatNode, allSeats: SeatNode[]): SeatNode[] {
  return allSeats.filter(s => !s.isInactive && isAdjacent(seat, s));
}

/** 隣席 or 同一グループ島に回避対象がいるか */
function wouldViolateSeparation(
  seat: SeatNode,
  stu: Student,
  allSeats: SeatNode[],
  roster: Student[]
): boolean {
  for (const otherSeat of allSeats) {
    if (otherSeat.seatIndex === seat.seatIndex) continue;
    if (otherSeat.isInactive || otherSeat.studentId === null || !otherSeat.studentClassId) continue;
    const other = roster.find(s => s.classId === otherSeat.studentClassId && s.id === otherSeat.studentId);
    if (!other || !areSeparated(stu, other)) continue;

    // 物理隣接を禁止
    if (isAdjacent(seat, otherSeat)) return true;
    // 同一グループ島も禁止（両方に groupId がある場合）
    if (seat.groupId && otherSeat.groupId && seat.groupId === otherSeat.groupId) return true;
  }
  return false;
}

/** 同じ島に回避対象が既にいるか */
function hasSeparatedInAssigned(assigned: Student[], candidate: Student): boolean {
  return assigned.some(a => areSeparated(a, candidate));
}

function hasMixedTypePair(stu: Student, roster: Student[]): boolean {
  return (stu.props.common.customPairs || []).some(pid => {
    const partner = roster.find(s => s.classId === stu.classId && s.id === pid);
    return partner && partner.defaultPref !== stu.defaultPref;
  });
}

/** グループ島の外側（①と隣接しうる）席か */
function isGroupPerimeterSeat(seat: SeatNode, groupId: string, allSeats: SeatNode[]): boolean {
  return getAdjacentSeats(seat, allSeats).some(n =>
    !n.isInactive && (n.studentId === null || n.groupId !== groupId)
  );
}

/**
 * 最適化席替えメインエンジン
 * 優先度: 固定席 > ペア/同グループ・隣接 > 隣り合わせ回避 > エアコン回避 > 最新アーカイブとの座席非重複
 */
export function generateOptimizedSeatingChart(
  students: Student[],
  absenteeIds: string[],
  layout: ClassLayoutTemplate,
  isCombined: boolean,
  seatingFunc?: SeatingFunction,
  previousSeats?: SeatNode[]
): SeatNode[] {
  const { rows, cols, acSeatIndices, disabledSeatIndices } = layout;
  const previousSeatMap = buildPreviousSeatMap(previousSeats);

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
  const allPairClusters = getPairClusters(activeStudents);

  const preferSeat = (stu: Student, seats: SeatNode[]): SeatNode | undefined => {
    const prev = previousSeatMap.get(studentKey(stu.classId, stu.id));
    const free = seats.filter(s => s.studentId === null);
    if (free.length === 0) return undefined;
    free.sort((a, b) => {
      const aSep = wouldViolateSeparation(a, stu, grid.flat(), activeStudents) ? 1 : 0;
      const bSep = wouldViolateSeparation(b, stu, grid.flat(), activeStudents) ? 1 : 0;
      if (aSep !== bSep) return aSep - bSep;
      const aHit = prev === a.seatIndex ? 1 : 0;
      const bHit = prev === b.seatIndex ? 1 : 0;
      if (aHit !== bHit) return aHit - bHit;
      return 0;
    });
    return free[0];
  };

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
    if (isFixedStudent(stu)) {
      const targetIdx = stu.props.common.fixedSeatId! - 1;
      const targetSeat = grid.flat().find(s => s.seatIndex === targetIdx);
      if (targetSeat && !targetSeat.isInactive && targetSeat.studentId === null) {
        targetSeat.studentId = stu.id;
        targetSeat.studentClassId = stu.classId;
        targetSeat.role = stu.defaultPref === 1 ? 'focus' : 'member';
      }
    }
  });

  const isPlaced = (stu: Student) =>
    grid.flat().some(s => s.studentClassId === stu.classId && s.studentId === stu.id);

  const remainingFocusStudents = focusStudents.filter(stu => !isPlaced(stu));
  const remainingGroupStudents = groupStudents.filter(stu => !isPlaced(stu));

  // ==========================================
  // ★ ステップ1: ②（グループ）配置 ＆ 複数人同グループ（ペアクラスタ）優先割当
  // ==========================================
  const groupPatterns = getScaledGroupPatterns(remainingGroupStudents.length, isCombined);

  const sortedGroupStudents = [...remainingGroupStudents].sort((a, b) => b.score - a.score);
  const leaderPoolSize = Math.min(sortedGroupStudents.length, groupPatterns.length + 3);
  const leaderPool = sortedGroupStudents.slice(0, leaderPoolSize);
  const shuffledPool = [...leaderPool].sort(() => Math.random() - 0.5);

  // リーダー選抜：同一ペアクラスタからは代表1人のみ（3人以上の分断防止）
  const leaders: Student[] = [];
  const leaderClusterRoots = new Set<string>();
  const clusterRootOf = (stu: Student): string => {
    const cluster = allPairClusters.find(c =>
      c.some(x => x.classId === stu.classId && x.id === stu.id)
    );
    if (!cluster) return studentKey(stu.classId, stu.id);
    const sorted = [...cluster].sort((a, b) => a.id - b.id);
    return studentKey(sorted[0].classId, sorted[0].id);
  };

  for (const stu of shuffledPool) {
    if (leaders.length >= groupPatterns.length) break;
    const root = clusterRootOf(stu);
    if (leaderClusterRoots.has(root) && allPairClusters.some(c =>
      c.some(x => x.classId === stu.classId && x.id === stu.id) && c.length >= 2
    )) {
      continue;
    }
    leaders.push(stu);
    leaderClusterRoots.add(root);
  }
  if (leaders.length < groupPatterns.length) {
    for (const stu of remainingGroupStudents) {
      if (leaders.length >= groupPatterns.length) break;
      if (!leaders.includes(stu)) leaders.push(stu);
    }
  }

  const members = remainingGroupStudents.filter(s => !leaders.includes(s));

  const groupsData = groupPatterns.map(pat => {
    const targetSeats: SeatNode[] = [];
    for (const coord of pat.coords) {
      if (coord.r <= rows && coord.c <= cols) {
        const s = grid[coord.r - 1][coord.c - 1];
        if (!s.isInactive && s.studentId === null) {
          targetSeats.push(s);
        }
      }
    }
    return { pat, targetSeats, assigned: [] as Student[] };
  });

  for (let i = 0; i < groupsData.length; i++) {
    if (leaders[i]) groupsData[i].assigned.push(leaders[i]);
  }

  /** 島へペアクラスタ全員を可能な限り引き込む（separateFrom は同島に入れない） */
  const pullClusterIntoGroup = (g: typeof groupsData[0], seed: Student) => {
    const capacity = g.targetSeats.length;
    const cluster = allPairClusters.find(c =>
      c.some(x => x.classId === seed.classId && x.id === seed.id)
    );

    let added = true;
    while (added && g.assigned.length < capacity) {
      added = false;
      for (let mi = members.length - 1; mi >= 0 && g.assigned.length < capacity; mi--) {
        const m = members[mi];
        if (hasSeparatedInAssigned(g.assigned, m)) continue;
        const linkedToAssigned = g.assigned.some(a => arePaired(a, m));
        const inSameCluster = cluster?.some(c => c.classId === m.classId && c.id === m.id) ?? false;
        if (linkedToAssigned || inSameCluster) {
          g.assigned.push(members.splice(mi, 1)[0]);
          added = true;
        }
      }
    }
  };

  for (const g of groupsData) {
    if (g.assigned[0]) pullClusterIntoGroup(g, g.assigned[0]);
  }

  // 残メンバー配置（複数人クラスタをまとめて同じ島へ／回避対象は同島に入れない）
  for (const g of groupsData) {
    const capacity = g.targetSeats.length;
    while (g.assigned.length < capacity && members.length > 0) {
      const free = capacity - g.assigned.length;
      let bestIdx = -1;
      let bestSize = 0;
      for (let mi = 0; mi < members.length; mi++) {
        const m = members[mi];
        if (hasSeparatedInAssigned(g.assigned, m)) continue;
        const cluster = allPairClusters.find(c =>
          c.some(x => x.classId === m.classId && x.id === m.id)
        );
        const pendingInCluster = cluster
          ? cluster.filter(c =>
              members.some(x => x.classId === c.classId && x.id === c.id) &&
              !hasSeparatedInAssigned(g.assigned, c)
            ).length
          : 1;
        if (pendingInCluster > 0 && pendingInCluster <= free && pendingInCluster > bestSize) {
          bestSize = pendingInCluster;
          bestIdx = mi;
        }
      }
      if (bestIdx === -1) {
        // 回避制約で誰も入れない場合は次の島へ
        break;
      }
      const member = members.splice(bestIdx, 1)[0];
      g.assigned.push(member);
      pullClusterIntoGroup(g, member);
    }
  }

  // 座席割当（アーカイブ重複を避ける並びを優先。①隣接希望の②は島の外周席へ）
  for (const g of groupsData) {
    if (g.targetSeats.length === 0) continue;
    g.targetSeats.forEach(s => { s.groupId = g.pat.id; });

    const seatsLeft = [...g.targetSeats];
    for (let j = 0; j < g.assigned.length; j++) {
      const stu = g.assigned[j];
      const pool = [...seatsLeft];
      if (hasMixedTypePair(stu, activeStudents)) {
        pool.sort((a, b) => {
          const aPerim = isGroupPerimeterSeat(a, g.pat.id, grid.flat()) ? 0 : 1;
          const bPerim = isGroupPerimeterSeat(b, g.pat.id, grid.flat()) ? 0 : 1;
          return aPerim - bPerim;
        });
      }
      const seat = preferSeat(stu, pool);
      if (!seat) break;
      seat.studentId = stu.id;
      seat.studentClassId = stu.classId;
      seat.role = j === 0 && leaders.includes(stu) ? 'leader' : 'member';
      const si = seatsLeft.indexOf(seat);
      if (si !== -1) seatsLeft.splice(si, 1);
    }
  }

  while (members.length > 0) {
    const remainingEmptySeats = grid.flat().filter(s =>
      !s.isInactive && s.studentId === null && !s.groupId &&
      (!isCombined || (s.col >= 2 && s.col <= cols - 1))
    );
    if (remainingEmptySeats.length === 0) break;
    const member = members.shift()!;
    const seat = preferSeat(member, remainingEmptySeats) || remainingEmptySeats[0];
    seat.studentId = member.id;
    seat.studentClassId = member.classId;
    seat.role = 'member';
    // 余り席は個別の島扱い（separateFrom の同一グループ判定を誤って共有しない）
    seat.groupId = `Group-Extra-${member.classId}-${member.id}`;
  }

  // ==========================================
  // ★ ステップ2: ①配置 ＆ 複数人隣接クラスタ
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

  // 【ステップ2-0】: ①②混合ペアの物理隣接（②配置済みの隣に①を置く）
  for (const stu of shuffle([...remainingFocusStudents])) {
    if (isPlaced(stu)) continue;
    for (const pairId of stu.props.common.customPairs || []) {
      const partner = activeStudents.find(s => s.classId === stu.classId && s.id === pairId);
      if (!partner || partner.defaultPref === stu.defaultPref) continue;
      const partnerSeat = grid.flat().find(s =>
        s.studentClassId === partner.classId && s.studentId === partner.id
      );
      if (!partnerSeat) continue;
      const adjCandidates = emptySeatsForFocus.filter(s =>
        s.studentId === null && isAdjacent(s, partnerSeat)
      );
      const adjSeat = preferSeat(stu, adjCandidates);
      if (adjSeat) {
        adjSeat.studentId = stu.id;
        adjSeat.studentClassId = stu.classId;
        adjSeat.role = 'focus';
        break;
      }
    }
  }

  // 【ステップ2-1】: ①と②の境界隣接（複数人クラスタを②側の島に隣接成長）
  const focusPairClusters = allPairClusters
    .map(c => c.filter(s => s.defaultPref === 1 && !isPlaced(s)))
    .filter(c => c.length > 0)
    .sort((a, b) => b.length - a.length);

  for (const focusPart of focusPairClusters) {
    const stillOpen = focusPart.filter(s => !isPlaced(s));
    if (stillOpen.length === 0) continue;

    // すでに座っている同クラスタの②・固定席をアンカーに
    const fullCluster = allPairClusters.find(c =>
      c.some(x => x.classId === stillOpen[0].classId && x.id === stillOpen[0].id)
    ) || stillOpen;

    const anchorSeats = grid.flat().filter(s =>
      s.studentId !== null &&
      fullCluster.some(x => x.classId === s.studentClassId && x.id === s.studentId)
    );

    if (anchorSeats.length > 0) {
      placeClusterAdjacentToSeats(stillOpen, anchorSeats, emptySeatsForFocus, 'focus', previousSeatMap);
    }
  }

  // 【ステップ2-2】: ①同士の複数人隣接ブロック配置
  const placedFocusKeys = new Set<string>();
  for (const stu of orderedFocusStudents) {
    if (isPlaced(stu)) continue;
    const key = studentKey(stu.classId, stu.id);
    if (placedFocusKeys.has(key)) continue;

    const cluster = (allPairClusters.find(c =>
      c.some(x => x.classId === stu.classId && x.id === stu.id)
    ) || [stu]).filter(s => s.defaultPref === 1 && !isPlaced(s));

    if (cluster.length >= 2) {
      const avoidSet = new Set<number>();
      for (const s of cluster) {
        const prev = previousSeatMap.get(studentKey(s.classId, s.id));
        if (prev !== undefined) avoidSet.add(prev);
      }
      const block = findConnectedEmptyBlock(emptySeatsForFocus, cluster.length, avoidSet)
        || findConnectedEmptyBlock(emptySeatsForFocus, cluster.length);
      if (block) {
        for (let i = 0; i < cluster.length; i++) {
          block[i].studentId = cluster[i].id;
          block[i].studentClassId = cluster[i].classId;
          block[i].role = 'focus';
          placedFocusKeys.add(studentKey(cluster[i].classId, cluster[i].id));
        }
        continue;
      }
      // 連結ブロックが取れなければ成長配置にフォールバック
      const seed = preferSeat(cluster[0], emptySeatsForFocus);
      if (seed) {
        seed.studentId = cluster[0].id;
        seed.studentClassId = cluster[0].classId;
        seed.role = 'focus';
        placedFocusKeys.add(studentKey(cluster[0].classId, cluster[0].id));
        placeClusterAdjacentToSeats(cluster.slice(1), [seed], emptySeatsForFocus, 'focus', previousSeatMap);
        for (const s of cluster) placedFocusKeys.add(studentKey(s.classId, s.id));
        continue;
      }
    }

    const seat = preferSeat(stu, emptySeatsForFocus);
    if (!seat) break;
    seat.studentId = stu.id;
    seat.studentClassId = stu.classId;
    seat.role = 'focus';
    placedFocusKeys.add(key);
  }

  // ==========================================
  // ★ ステップ3: セーフティネット
  // ==========================================
  const unassignedStudents = activeStudents.filter(stu => !isPlaced(stu));

  if (unassignedStudents.length > 0) {
    const finalEmptySeats = grid.flat().filter(s => !s.isInactive && s.studentId === null);
    for (const stu of unassignedStudents) {
      const seat = preferSeat(stu, finalEmptySeats);
      if (!seat) break;
      seat.studentId = stu.id;
      seat.studentClassId = stu.classId;
      seat.role = stu.defaultPref === 1 ? 'focus' : 'member';
    }
  }

  // ==========================================
  // ★ ステップ3.5: 隣り合わせ・同一グループ回避のスワップ修正
  // ==========================================
  const swapStudents = (a: SeatNode, b: SeatNode) => {
    const tempId = a.studentId;
    const tempClass = a.studentClassId;
    const tempRole = a.role;
    a.studentId = b.studentId;
    a.studentClassId = b.studentClassId;
    a.role = b.role;
    b.studentId = tempId;
    b.studentClassId = tempClass;
    b.role = tempRole;
  };

  /** スワップ後にペア隣接が壊れるか（同一グループ島の維持も含む） */
  const wouldBreakPairAdjacency = (seatA: SeatNode, seatB: SeatNode): boolean => {
    for (const from of [seatA, seatB]) {
      const to = from === seatA ? seatB : seatA;
      if (from.studentId === null || !from.studentClassId) continue;
      const stu = activeStudents.find(s => s.classId === from.studentClassId && s.id === from.studentId);
      if (!stu?.props.common.customPairs?.length) continue;
      for (const pid of stu.props.common.customPairs) {
        if (to.studentClassId === stu.classId && to.studentId === pid) continue;
        const partnerSeat = grid.flat().find(s => s.studentClassId === stu.classId && s.studentId === pid);
        if (!partnerSeat) continue;
        if (isAdjacent(from, partnerSeat) && !isAdjacent(to, partnerSeat)) return true;
        // ②同士で同じ島にいるペアは、島を跨ぐスワップを禁止
        if (
          from.groupId &&
          partnerSeat.groupId &&
          from.groupId === partnerSeat.groupId &&
          to.groupId !== from.groupId
        ) {
          return true;
        }
      }
    }
    return false;
  };

  const hasSeparationViolation = (seat: SeatNode): boolean => {
    if (seat.studentId === null || !seat.studentClassId || seat.isInactive) return false;
    const stu = activeStudents.find(s => s.classId === seat.studentClassId && s.id === seat.studentId);
    if (!stu || isFixedStudent(stu)) return false;
    return wouldViolateSeparation(seat, stu, grid.flat(), activeStudents);
  };

  const trySeparationSwap = (seat: SeatNode, target: SeatNode): boolean => {
    if (target.seatIndex === seat.seatIndex || target.studentId === null) return false;
    const other = activeStudents.find(s => s.classId === target.studentClassId && s.id === target.studentId);
    if (!other || isFixedStudent(other)) return false;
    if (wouldBreakPairAdjacency(seat, target)) return false;

    const aId = seat.studentId;
    const aClass = seat.studentClassId;
    const aRole = seat.role;
    const bId = target.studentId;
    const bClass = target.studentClassId;
    const bRole = target.role;

    seat.studentId = bId;
    seat.studentClassId = bClass;
    seat.role = bRole;
    target.studentId = aId;
    target.studentClassId = aClass;
    target.role = aRole;
    const ok = !hasSeparationViolation(seat) && !hasSeparationViolation(target);
    seat.studentId = aId;
    seat.studentClassId = aClass;
    seat.role = aRole;
    target.studentId = bId;
    target.studentClassId = bClass;
    target.role = bRole;
    return ok;
  };

  let sepPasses = 0;
  let sepFixed = true;
  while (sepFixed && sepPasses < 40) {
    sepFixed = false;
    sepPasses++;
    const occupied = grid.flat().filter(s => !s.isInactive && s.studentId !== null);
    for (const seat of occupied) {
      if (!hasSeparationViolation(seat)) continue;
      const stu = activeStudents.find(s => s.classId === seat.studentClassId && s.id === seat.studentId);
      if (!stu || isFixedStudent(stu)) continue;

      // 同ロール優先 → それでもダメなら異ロールも試す
      const candidates = [
        ...occupied.filter(t => t.role === seat.role),
        ...occupied.filter(t => t.role !== seat.role),
      ];
      const swapTarget = candidates.find(target => trySeparationSwap(seat, target));

      if (swapTarget) {
        swapStudents(seat, swapTarget);
        sepFixed = true;
        break;
      }
    }
  }

  // ==========================================
  // ★ ステップ4: エアコン回避スワップ
  // ==========================================
  grid.flat().forEach(seat => {
    if (seat.isAC_Zone && seat.studentId !== null) {
      const stu = activeStudents.find(s => s.classId === seat.studentClassId && s.id === seat.studentId);
      if (stu && stu.props.common.avoidAC && !isFixedStudent(stu)) {
        const safeSeat = grid.flat().find(target => {
          if (target.isInactive || target.isAC_Zone || target.studentId === null) return false;
          if (target.role !== seat.role || target.seatIndex === seat.seatIndex) return false;
          const other = activeStudents.find(s => s.classId === target.studentClassId && s.id === target.studentId);
          if (!other || isFixedStudent(other) || other.props.common.avoidAC) return false;
          if (wouldBreakPairAdjacency(seat, target)) return false;
          // スワップ後に隣回避が壊れないか
          const aId = seat.studentId;
          const aClass = seat.studentClassId;
          const aRole = seat.role;
          seat.studentId = target.studentId;
          seat.studentClassId = target.studentClassId;
          seat.role = target.role;
          target.studentId = aId;
          target.studentClassId = aClass;
          target.role = aRole;
          const ok = !hasSeparationViolation(seat) && !hasSeparationViolation(target);
          target.studentId = seat.studentId;
          target.studentClassId = seat.studentClassId;
          target.role = seat.role;
          seat.studentId = aId;
          seat.studentClassId = aClass;
          seat.role = aRole;
          return ok;
        });

        if (safeSeat) swapStudents(seat, safeSeat);
      }
    }
  });

  // ==========================================
  // ★ ステップ5: 最新アーカイブとの座席非重複スワップ（最低優先度）
  // 固定席・ペア・隣回避・エアコン回避を壊さない範囲で、前回と同じ席を避ける
  // ==========================================
  if (previousSeatMap.size > 0) {
    const isOnPreviousSeat = (seat: SeatNode): boolean => {
      if (seat.studentId === null || !seat.studentClassId) return false;
      const prev = previousSeatMap.get(studentKey(seat.studentClassId, seat.studentId));
      return prev !== undefined && prev === seat.seatIndex;
    };

    const tryArchiveSwap = (seat: SeatNode, target: SeatNode): boolean => {
      if (target.seatIndex === seat.seatIndex || target.studentId === null || target.isInactive) return false;
      const stu = activeStudents.find(s => s.classId === seat.studentClassId && s.id === seat.studentId);
      const other = activeStudents.find(s => s.classId === target.studentClassId && s.id === target.studentId);
      if (!stu || !other || isFixedStudent(stu) || isFixedStudent(other)) return false;
      if (wouldBreakPairAdjacency(seat, target)) return false;
      if (stu.props.common.avoidAC && target.isAC_Zone) return false;
      if (other.props.common.avoidAC && seat.isAC_Zone) return false;

      const aId = seat.studentId;
      const aClass = seat.studentClassId;
      const aRole = seat.role;
      const bId = target.studentId;
      const bClass = target.studentClassId;
      const bRole = target.role;

      seat.studentId = bId;
      seat.studentClassId = bClass;
      seat.role = bRole;
      target.studentId = aId;
      target.studentClassId = aClass;
      target.role = aRole;

      const sepOk = !hasSeparationViolation(seat) && !hasSeparationViolation(target);
      // スワップ後、少なくとも seat 側の生徒（移動先=target）が前回席でなくなること
      const movedOffPrev = !isOnPreviousSeat(target);
      // 相手が今回の席＝相手の前回席、にならないこと（相互悪化を防ぐ）
      const otherNotWorse = !isOnPreviousSeat(seat);

      seat.studentId = aId;
      seat.studentClassId = aClass;
      seat.role = aRole;
      target.studentId = bId;
      target.studentClassId = bClass;
      target.role = bRole;

      return sepOk && movedOffPrev && otherNotWorse;
    };

    let archivePasses = 0;
    let archiveFixed = true;
    while (archiveFixed && archivePasses < 60) {
      archiveFixed = false;
      archivePasses++;
      const occupied = grid.flat().filter(s => !s.isInactive && s.studentId !== null);

      for (const seat of occupied) {
        if (!isOnPreviousSeat(seat)) continue;
        const stu = activeStudents.find(s => s.classId === seat.studentClassId && s.id === seat.studentId);
        if (!stu || isFixedStudent(stu)) continue;

        // 1) 同ロール・同グループ島内
        // 2) 同ロール全体
        // 3) 任意ロール（最終手段）
        const sameGroup = occupied.filter(t =>
          t.role === seat.role &&
          ((seat.groupId && t.groupId === seat.groupId) || (!seat.groupId && !t.groupId))
        );
        const sameRole = occupied.filter(t => t.role === seat.role && !sameGroup.includes(t));
        const otherRole = occupied.filter(t => t.role !== seat.role);
        const candidates = [...sameGroup, ...sameRole, ...otherRole];

        const swapTarget = candidates.find(target => tryArchiveSwap(seat, target));
        if (swapTarget) {
          swapStudents(seat, swapTarget);
          archiveFixed = true;
          break;
        }
      }
    }
  }

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