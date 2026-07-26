'use client';

import React, { useState, useEffect } from 'react';
import { Student, ClassId, SeatingFunction, ALL_CLASSES, getMaxStudents } from '@/types';
import { generateAICheckedSeatingFunction } from '@/lib/math-engine';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

type Props = {
  currentClass: ClassId;
  students: Student[];
  absenteeIds: string[];
  onToggleAbsentee: (classId: ClassId, id: number) => void;
  onGenerate: (func: SeatingFunction, isCombined: boolean, targetClasses: ClassId[]) => void;
};

export default function TabFormula({
  currentClass,
  students,
  absenteeIds,
  onToggleAbsentee,
  onGenerate,
}: Props) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isCombined, setIsCombined] = useState<boolean>(false);
  const [selectedClasses, setSelectedClasses] = useState<ClassId[]>([currentClass]);
  const [currentFunc, setCurrentFunc] = useState<SeatingFunction | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    handleRegenerateMath();
  }, [isCombined, selectedClasses, difficulty]);

  const handleToggleClass = (cId: ClassId) => {
    setSelectedClasses(prev => {
      const next = prev.includes(cId) ? prev.filter(x => x !== cId) : [...prev, cId];
      return next.length === 0 ? [currentClass] : next;
    });
  };

  const handleRegenerateMath = async () => {
    setIsGenerating(true);
    try {
      const func = await generateAICheckedSeatingFunction(
        isCombined ? selectedClasses : [currentClass],
        isCombined,
        difficulty
      );
      setCurrentFunc(func);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const targetClassesList = isCombined ? selectedClasses : [currentClass];

  const currentTargetAbsenteesCount = targetClassesList.reduce((sum, cId) => {
    const maxNum = getMaxStudents(cId);
    const classAbs = Array.from({ length: maxNum }, (_, i) => `${cId}-${i + 1}`)
      .filter(key => absenteeIds.includes(key)).length;
    return sum + classAbs;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-6 font-bold">
          <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-xl border border-slate-300">
            <input
              type="radio"
              checked={!isCombined}
              onChange={() => { setIsCombined(false); setSelectedClasses([currentClass]); }}
              className="w-4 h-4 text-indigo-600"
            />
            <span className="text-sm">通常授業（単一クラス / 横6列・縦7行）</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-xl border border-slate-300">
            <input
              type="radio"
              checked={isCombined}
              onChange={() => {
                setIsCombined(true);
                if (selectedClasses.length < 2) setSelectedClasses([currentClass, '2-2']);
              }}
              className="w-4 h-4 text-indigo-600"
            />
            <span className="text-sm">合同授業（複数クラス混合 / 横8列固定・両端①専用・中央6列②配置）</span>
          </label>
        </div>

        {isCombined && (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className="text-xs font-bold text-slate-500">対象:</span>
            {ALL_CLASSES.map(cId => (
              <button
                key={cId}
                type="button"
                onClick={() => handleToggleClass(cId)}
                className={`px-2.5 py-1 rounded-lg font-black text-xs transition cursor-pointer ${
                  selectedClasses.includes(cId)
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                {cId}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b pb-3 flex justify-between items-center">
            <div>
              {/* ★ ご指示通り、不要な説明テキストを削除！ */}
              <h3 className="font-extrabold text-lg text-slate-800">1. 欠席者の選択（全生徒表示）</h3>
            </div>
            <span className="bg-rose-100 text-rose-800 text-xs font-black px-3 py-1 rounded-full">
              選択中クラス欠席: {currentTargetAbsenteesCount}名
            </span>
          </div>

          <div className="space-y-6 max-h-[550px] overflow-y-auto pr-1">
            {targetClassesList.map((cId) => {
              const maxNum = getMaxStudents(cId);
              const allSeatNumbers = Array.from({ length: maxNum }, (_, i) => i + 1);
              const classAbsenteesCount = allSeatNumbers.filter(num => absenteeIds.includes(`${cId}-${num}`)).length;

              return (
                <div key={cId} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="font-extrabold text-slate-800 text-sm">
                      {cId} 出欠リスト ({maxNum}名中 / 欠席: {classAbsenteesCount}名)
                    </span>
                    <span className="text-[11px] text-slate-500 font-bold">※青字が①個人・集中希望</span>
                  </div>

                  <div className="grid grid-cols-10 gap-1.5">
                    {allSeatNumbers.map((num) => {
                      const key = `${cId}-${num}`;
                      const isAbsent = absenteeIds.includes(key);
                      const stuData = students.find(s => s.classId === cId && s.id === num);
                      const prefBadge = stuData ? (stuData.defaultPref === 1 ? '①' : '②') : '';

                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => onToggleAbsentee(cId, num)}
                          className={`p-1.5 rounded-lg font-extrabold text-xs border transition relative flex flex-col items-center justify-center min-h-[44px] shadow-2xs cursor-pointer ${
                            isAbsent
                              ? 'bg-rose-500 text-white border-rose-600 shadow-inner scale-95'
                              : 'bg-white text-slate-800 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/40'
                          }`}
                        >
                          <span className="text-sm leading-tight">{num}</span>
                          {prefBadge && !isAbsent && (
                            <span className={`text-[9px] absolute bottom-0.5 right-1 font-black ${
                              prefBadge === '①' ? 'text-sky-600' : 'text-slate-400'
                            }`}>
                              {prefBadge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b pb-3">
            <h3 className="font-extrabold text-lg text-slate-800">2. AI単射数式ジェネレーター</h3>
            <p className="text-xs text-slate-500 mt-0.5">機械的な単射チェックを自動試行し、被りのない数式を確定します。</p>
          </div>

          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as const).map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`flex-1 py-2.5 px-2 rounded-xl font-black text-xs transition cursor-pointer ${
                  difficulty === d ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d === 'easy' ? '✨ AI初級' : d === 'medium' ? '✨ AI中級' : '✨ AI上級'}
              </button>
            ))}
          </div>

          <div className="p-6 bg-slate-900 text-white rounded-2xl shadow-inner text-center relative min-h-[160px] flex flex-col justify-center items-center">
            {isGenerating ? (
              <div className="space-y-2 animate-pulse">
                <div className="text-2xl">🤖💭</div>
                <div className="text-xs font-extrabold text-indigo-300">AIが単射関数を生成＆衝突検証中...</div>
              </div>
            ) : currentFunc ? (
              <>
                <div className="text-[10px] font-black text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-full mb-2 border border-indigo-800">
                  {currentFunc.title}
                </div>
                <div className="text-lg sm:text-xl font-mono py-1 text-white w-full overflow-x-auto">
                  <BlockMath math={currentFunc.latexString} />
                </div>
                <div className="text-[10px] text-emerald-400 font-bold mt-2 flex items-center gap-1 justify-center">
                  <span>✓ 単射チェック合格（全席衝突ゼロ保証）</span>
                </div>
              </>
            ) : null}
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleRegenerateMath}
              disabled={isGenerating}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl transition text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🔄 AIで別の数式を作り直して単射検証する</span>
            </button>

            <button
              type="button"
              onClick={() => currentFunc && onGenerate(currentFunc, isCombined, isCombined ? selectedClasses : [currentClass])}
              disabled={isGenerating || !currentFunc}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-black rounded-xl shadow-lg transition text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>✨ このAI数式で席替えを実行する！</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}