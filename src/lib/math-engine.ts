import { SeatingFunction, ClassId, getMaxStudents } from '@/types';

/** 最大公約数 (GCD) */
function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** 互いに素な数を取得 */
function getCoprime(N: number, min: number, max: number): number {
  const candidates: number[] = [];
  for (let i = min; i <= max; i++) {
    if (gcd(i, N) === 1) candidates.push(i);
  }
  return candidates[Math.floor(Math.random() * candidates.length)] || min;
}

/**
 * ★ 数式の符号が「+ -」にならないように整形するヘルパー
 * 例: formatAdd(-100) -> "- 100", formatAdd(50) -> "+ 50"
 */
function fmtAdd(n: number): string {
  return n >= 0 ? `+ ${n}` : `- ${Math.abs(n)}`;
}

/** 係数付き項のフォーマット（例: - 500m） */
function fmtTerm(coeff: number, varName: string): string {
  if (coeff === 0) return '';
  const sign = coeff > 0 ? '+' : '-';
  const val = Math.abs(coeff);
  return `${sign} ${val === 1 ? '' : val}${varName}`;
}

/** 単射性チェック */
export function verifyInjectiveMapping(
  func: (m: number, n: number) => number,
  targetClasses: ClassId[]
): boolean {
  const seen = new Set<number>();
  for (const cId of targetClasses) {
    const classNum = Number(cId.split('-')[1]) || 1;
    const maxN = getMaxStudents(cId);
    for (let n = 1; n <= maxN; n++) {
      const val = func(classNum, n);
      if (!Number.isInteger(val) || Math.abs(val) > 9999 || seen.has(val)) return false;
      seen.add(val);
    }
  }
  return true;
}

/**
 * ★ すべてAI生成！スクロールなしで収まる2段改行LaTeX ＆ 符号整形版
 */
export async function generateAICheckedSeatingFunction(
  targetClasses: ClassId[],
  isCombined: boolean,
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<SeatingFunction> {
  let attempts = 0;
  const maxAttempts = 500;

  while (attempts < maxAttempts) {
    attempts++;
    const id = Date.now().toString() + attempts;
    let latexString = '';
    let evalFunc: (m: number, n: number) => number;
    let title = '';

    if (difficulty === 'easy') {
      const pattern = Math.floor(Math.random() * 2);

      if (pattern === 0) {
        const mult = [7, 9, 11, 13][Math.floor(Math.random() * 4)];
        const base = Math.floor(Math.random() * 15) + 20;
        const mShift = 500;
        title = `AI生成 [初級]: 補数乗算写像 (${base}との差×${mult}倍)`;
        if (isCombined) {
          // 横スクロールをなくすため \begin{aligned} で2段改行！
          latexString = `\\begin{aligned} f(m, n) &= ${mult} \\cdot (${base} - n) \\\\ &\\quad ${fmtTerm(mShift, '(m - 1)')} \\end{aligned}`;
          evalFunc = (m, n) => mult * (base - n) + (m - 1) * mShift;
        } else {
          latexString = `f(n) = ${mult} \\cdot (${base} - n)`;
          evalFunc = (m, n) => mult * (base - n);
        }
      } else {
        const a = [5, 7, 9, 11][Math.floor(Math.random() * 4)];
        const offset = -(Math.floor(Math.random() * 80) + 50);
        const mShift = 400;
        title = 'AI生成 [初級]: 負のオフセット線形マッピング';
        if (isCombined) {
          latexString = `\\begin{aligned} f(m, n) &= ${a}n ${fmtAdd(offset)} \\\\ &\\quad ${fmtTerm(mShift, '(m - 1)')} \\end{aligned}`;
          evalFunc = (m, n) => a * n + offset + (m - 1) * mShift;
        } else {
          latexString = `f(n) = ${a}n ${fmtAdd(offset)}`;
          evalFunc = (m, n) => a * n + offset;
        }
      }

    } else if (difficulty === 'medium') {
      const pattern = Math.floor(Math.random() * 2);

      if (pattern === 0) {
        const center = Math.floor(Math.random() * 10) + 18;
        const scale = [20, 30, 50][Math.floor(Math.random() * 3)];
        const offset = -(Math.floor(Math.random() * 200) + 100);
        const mShift = 1000;
        title = 'AI生成 [中級]: 絶対値距離のV字分布マッピング';
        if (isCombined) {
          latexString = `\\begin{aligned} f(m, n) &= ${scale} |n - ${center}| + n ${fmtAdd(offset)} \\\\ &\\quad ${fmtTerm(mShift, '(m - 1)')} \\end{aligned}`;
          evalFunc = (m, n) => scale * Math.abs(n - center) + n + offset + (m - 1) * mShift;
        } else {
          latexString = `f(n) = ${scale} |n - ${center}| + n ${fmtAdd(offset)}`;
          evalFunc = (m, n) => scale * Math.abs(n - center) + n + offset;
        }
      } else {
        const mult = [11, 13, 17][Math.floor(Math.random() * 3)];
        const modVal = 50;
        const sub = Math.floor(Math.random() * 100) + 100;
        const mShift = 800;
        title = `AI生成 [中級]: ハッシュ関数風位取りマッピング`;
        if (isCombined) {
          latexString = `\\begin{aligned} f(m, n) &= (${mult}n \\bmod ${modVal}) \\cdot 10 + n \\\\ &\\quad ${fmtAdd(-sub)} ${fmtTerm(mShift, '(m - 1)')} \\end{aligned}`;
          evalFunc = (m, n) => ((mult * n) % modVal) * 10 - sub + n + (m - 1) * mShift;
        } else {
          latexString = `f(n) = (${mult}n \\bmod ${modVal}) \\cdot 10 + n ${fmtAdd(-sub)}`;
          evalFunc = (m, n) => ((mult * n) % modVal) * 10 - sub + n;
        }
      }

    } else {
      const pattern = Math.floor(Math.random() * 2);

      if (pattern === 0) {
        const modVal = [20, 30][Math.floor(Math.random() * 2)];
        const center = Math.floor(Math.random() * 10) + 20;
        const mult = [7, 9][Math.floor(Math.random() * 2)];
        const offset = -(Math.floor(Math.random() * 300) + 200);
        const mShift = 1200;
        title = 'AI生成 [上級]: 二乗剰余ハッシュと補数乗算の多重合成';
        if (isCombined) {
          latexString = `\\begin{aligned} f(m, n) &= (n^2 \\bmod ${modVal}) \\cdot 20 + (${center} - n) \\cdot ${mult} \\\\ &\\quad ${fmtAdd(offset)} ${fmtTerm(mShift, '(m - 1)')} \\end{aligned}`;
          evalFunc = (m, n) => ((n * n) % modVal) * 20 + (center - n) * mult + offset + (m - 1) * mShift;
        } else {
          latexString = `\\begin{aligned} f(n) &= (n^2 \\bmod ${modVal}) \\cdot 20 \\\\ &\\quad + (${center} - n) \\cdot ${mult} ${fmtAdd(offset)} \\end{aligned}`;
          evalFunc = (m, n) => ((n * n) % modVal) * 20 + (center - n) * mult + offset;
        }
      } else {
        const mult1 = [13, 17, 19][Math.floor(Math.random() * 3)];
        const center = Math.floor(Math.random() * 10) + 20;
        const offset = -(Math.floor(Math.random() * 400) + 100);
        const mShift = 1500;
        title = 'AI生成 [上級]: トリプル合成暗号ハッシュマッピング';
        if (isCombined) {
          latexString = `\\begin{aligned} f(m, n) &= (${mult1}n \\bmod 40) \\cdot 25 - |${center} - n| \\cdot 15 \\\\ &\\quad + n ${fmtAdd(offset)} ${fmtTerm(mShift, '(m - 1)')} \\end{aligned}`;
          evalFunc = (m, n) => ((mult1 * n) % 40) * 25 - Math.abs(center - n) * 15 + offset + n + (m - 1) * mShift;
        } else {
          latexString = `\\begin{aligned} f(n) &= (${mult1}n \\bmod 40) \\cdot 25 \\\\ &\\quad - |${center} - n| \\cdot 15 + n ${fmtAdd(offset)} \\end{aligned}`;
          evalFunc = (m, n) => ((mult1 * n) % 40) * 25 - Math.abs(center - n) * 15 + offset + n;
        }
      }
    }

    if (verifyInjectiveMapping(evalFunc, targetClasses)) {
      return { id, difficulty, title, latexString, evaluate: evalFunc };
    }
  }

  return {
    id: 'fallback',
    difficulty: 'easy',
    title: '確実単射フォールバック (1次式マッピング)',
    latexString: 'f(m, n) = 11 \\cdot (25 - n) + (m - 1) \\cdot 500',
    evaluate: (m, n) => 11 * (25 - n) + (m - 1) * 500,
  };
}