'use client';

import React, { useState, useEffect } from 'react';
import {
  Student, ClassId, SeatingFunction, CustomClass, ALL_CLASSES, getMaxStudents, getCustomClassClassIds,
} from '@/types';
import { generateAICheckedSeatingFunction, generateInjectiveFunctionForDomain } from '@/lib/math-engine';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

type Props = {
  currentClass: ClassId;
  customClasses: CustomClass[];
  selectedCustomClassId: string | null;
  students: Student[];
  absenteeIds: string[];
  onToggleAbsentee: (classId: ClassId, id: number) => void;
  onGenerate: (
    func: SeatingFunction,
    isCombined: boolean,
    targetClasses: ClassId[],
    customClassId?: string
  ) => void;
};

export default function TabFormula({
  currentClass,
  customClasses,
  selectedCustomClassId,
  students,
  absenteeIds,
  onToggleAbsentee,
  onGenerate,
}: Props) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isCombined, setIsCombined] = useState<boolean>(false);
  const [isCustom, setIsCustom] = useState<boolean>(
    () => !!selectedCustomClassId && customClasses.some(c => c.id === selectedCustomClassId)
  );
  const [customId, setCustomId] = useState<string>(
    () => selectedCustomClassId ?? customClasses[0]?.id ?? ''
  );
  const [selectedClasses, setSelectedClasses] = useState<ClassId[]>([currentClass]);
  const [currentFunc, setCurrentFunc] = useState<SeatingFunction | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const activeCustom = isCustom ? customClasses.find(c => c.id === customId) : undefined;

  useEffect(() => {
    handleRegenerateMath();
  }, [isCombined, selectedClasses, difficulty, isCustom, customId]);

  const handleToggleClass = (cId: ClassId) => {
    setSelectedClasses(prev => {
      const next = prev.includes(cId) ? prev.filter(x => x !== cId) : [...prev, cId];
      return next.length === 0 ? [currentClass] : next;
    });
  };

  const handleRegenerateMath = async () => {
    setIsGenerating(true);
    try {
      let func: SeatingFunction;
      if (activeCustom) {
        // 特別クラス: メンバー全員の (クラス番号 m, 出席番号 n) で単射になる2変数関数 f(m, n)
        const domain = activeCustom.members.map(mem => ({
          m: Number(mem.classId.split('-')[1]) || 1,
          n: mem.id,
        }));
        func = await generateInjectiveFunctionForDomain(domain, true, difficulty);
      } else {
        func = await generateAICheckedSeatingFunction(
          isCombined ? selectedClasses : [currentClass],
          isCombined,
          difficulty
        );
      }
      setCurrentFunc(func);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const targetClassesList = activeCustom
    ? getCustomClassClassIds(activeCustom)
    : isCombined ? selectedClasses : [currentClass];

  /** 出欠リストに表示する名簿（特別クラスはメンバーのみ） */
  const rosterGroups: { cId: ClassId; nums: number[] }[] = targetClassesList.map(cId => ({
    cId,
    nums: activeCustom
      ? activeCustom.members.filter(m => m.classId === cId).map(m => m.id).sort((a, b) => a - b)
      : Array.from({ length: getMaxStudents(cId) }, (_, i) => i + 1),
  }));

  const currentTargetAbsenteesCount = rosterGroups.reduce(
    (sum, g) => sum + g.nums.filter(n => absenteeIds.includes(`${g.cId}-${n}`)).length,
    0
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-6 font-bold">
          <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-xl border border-slate-300">
            <input
              type="radio"
              checked={!isCombined && !isCustom}
              onChange={() => { setIsCombined(false); setIsCustom(false); setSelectedClasses([currentClass]); }}
              className="w-4 h-4 text-indigo-600"
            />
            <span className="text-sm">通常授業（単一クラス / 横6列・縦7行）</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-xl border border-slate-300">
            <input
              type="radio"
              checked={isCombined && !isCustom}
              onChange={() => {
                setIsCombined(true);
                setIsCustom(false);
                if (selectedClasses.length < 2) setSelectedClasses([currentClass, '2-2']);
              }}
              className="w-4 h-4 text-indigo-600"
            />
            <span className="text-sm">合同授業（複数クラス混合 / 横8列固定・両端①専用・中央6列②配置）</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-300">
            <input
              type="radio"
              checked={isCustom}
              onChange={() => { setIsCombined(false); setIsCustom(true); }}
              className="w-4 h-4 text-emerald-600"
            />
            <span className="text-sm">特別クラス（特別割など / 横6列・縦7行 / 2変数関数）</span>
          </label>
        </div>

        {isCustom && (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className="text-xs font-bold text-slate-500">特別クラス:</span>
            {customClasses.length === 0 ? (
              <span className="text-xs font-bold text-rose-600">データ管理の「🏷️ 特別クラス」で作成してください</span>
            ) : (
              <select
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                className="border border-emerald-300 rounded-lg px-3 py-1.5 font-bold text-sm bg-white text-emerald-900 cursor-pointer"
              >
                {customClasses.map(c => (
                  <option key={c.id} value={c.id}>{c.label}（{c.members.length}名）</option>
                ))}
              </select>
            )}
          </div>
        )}

        {isCombined && !isCustom && (
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
            {rosterGroups.map(({ cId, nums: allSeatNumbers }) => {
              const maxNum = allSeatNumbers.length;
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
                  <span>
                    {activeCustom
                      ? `✓ 単射チェック合格（${activeCustom.members.length}名の (m, n) すべてで値が異なります）`
                      : '✓ 単射チェック合格（全席衝突ゼロ保証）'}
                  </span>
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
              onClick={() =>
                currentFunc &&
                onGenerate(
                  currentFunc,
                  isCombined && !isCustom,
                  targetClassesList.length > 0 && (isCombined || isCustom) ? targetClassesList : [currentClass],
                  activeCustom?.id
                )
              }
              disabled={isGenerating || !currentFunc || (isCustom && !activeCustom)}
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