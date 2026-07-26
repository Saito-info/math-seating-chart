import { Student, SeatNode, ClassLayoutTemplate, SeatingFunction } from '@/types';

/** ①（集中・青）生徒の配置順序（後方から前方へ一続きに連続スキャン） */
function getFocusContinuousOrder(rows: number, cols: number, isCombined: boolean): { r: number; c: number }[] {
  const order: { r: number; c: number }[] = [];
  if (!isCombined) {
    // 通常(6列): 最後列から順に右から左へ
    for (let r = rows; r >= 1; r--) {
      for (let c = cols; c >= 1; c--) {
        order.push({ r, c });
      }
    }
  } else {
    // ★ 合同(8列): まず両端(1列目と8列目＝①専用エリア)を後方から順番に埋め、次に中央2~7列目の後方へ！
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

/** 1人〜36人の固定グループパターン辞書（幅6列基準） */
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

/** 37人以上でも下にスライド配置。★合同時(8列)は中央2~7列目に+1列シフトしてはめ込み！ */
function getScaledGroupPatterns(numPeople: number, isCombined: boolean): { id: string; coords: { r: number; c: number }[] }[] {
  const result: { id: string; coords: { r: number; c: number }[] }[] = [];
  let remaining = numPeople;
  let blockOffset = 0;
  let groupCounter = 1;

  // ★ 合同授業時(8列)は、幅6列辞書の列座標に +1 を足すことで、両端(1列目と8列目)を避けて中央2~7列目に配置！
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
 * 最適化席替えメインエンジン（配慮事項100%適用＆合同時両端①専用化版）
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
  const focusStudents = activeStudents.filter(s => s.defaultPref === 1); // ① 集中(青)
  const groupStudents = activeStudents.filter(s => s.defaultPref === 2); // ② グループ(白/赤)

  // ステップ0: 休みの生徒分の無効席作成（最後列右端から逆順に空席化）
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

  // ステップ0.5: 📍 固定席指定(fixedSeatId)の最優先配置
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
  // ★ ステップ1: ②（グループ学習）をご指定の辞書にはめ込み！
  // ★ 合同授業時は列+1シフトされ、両端（1列目と8列目）が確実に空いた状態になります！
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
          const member = members.shift()!;
          targetSeats[j].studentId = member.id;
          targetSeats[j].studentClassId = member.classId;
          targetSeats[j].role = 'member';
        }
      }
    }
  }

  // 万が一辞書で収まらなかった端数メンバーの補完（両端列は絶対に避ける！）
  while (members.length > 0) {
    const remainingEmptySeats = grid.flat().filter(s => 
      !s.isInactive && s.studentId === null && !s.groupId &&
      (!isCombined || (s.col >= 2 && s.col <= cols - 1)) // ★ 合同時に両端列へ漏れるのを防止！
    );
    if (remainingEmptySeats.length === 0) break;
    const member = members.shift()!;
    remainingEmptySeats[0].studentId = member.id;
    remainingEmptySeats[0].studentClassId = member.classId;
    remainingEmptySeats[0].role = 'member';
    remainingEmptySeats[0].groupId = 'Group-Extra';
  }

  // ==========================================
  // ★ ステップ2: ①（個人・集中）の後方から連続スキャン配置 ＆ 前列・後列希望の反映！
  // ★ 合同授業時、1列目と8列目（両端）が空いているため、①の生徒がまずその静かな両端列へ入り、残りは後方へ！
  // ==========================================
  const focusOrder = getFocusContinuousOrder(rows, cols, isCombined);
  const emptySeatsForFocus = grid.flat().filter(s => !s.isInactive && s.studentId === null);
  emptySeatsForFocus.sort((a, b) => {
    const idxA = focusOrder.findIndex(o => o.r === a.row && o.c === a.col);
    const idxB = focusOrder.findIndex(o => o.r === b.row && o.c === b.col);
    const valA = idxA === -1 ? 9999 : idxA;
    const valB = idxB === -1 ? 9999 : idxB;
    return valA - valB; // [0]が最後列(または両端)、最後が最前列になるようソート
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

  let focusIdx = 0;
  for (const seat of emptySeatsForFocus) {
    if (focusIdx >= orderedFocusStudents.length) break;
    const stu = orderedFocusStudents[focusIdx];
    seat.studentId = stu.id;
    seat.studentClassId = stu.classId;
    seat.role = 'focus';
    focusIdx++;
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
  // ★ ステップ4: ❄️ エアコン回避(avoidAC)の最適化スワップ！
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