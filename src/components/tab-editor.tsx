'use client';

import React, { useState, useEffect } from 'react';
import { SeatNode, Student, SeatingFunction } from '@/types';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

type Props = {
  seats: SeatNode[];
  students: Student[];
  cols: number;
  seatingFunc?: SeatingFunction;
  isCombined?: boolean;
  onUpdateSeats: (seats: SeatNode[]) => void;
  onSaveArchive: () => void;
};

export default function TabEditor({
  seats,
  students,
  cols,
  seatingFunc,
  isCombined = false,
  onUpdateSeats,
  onSaveArchive,
}: Props) {
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [selectedSeatIndex, setSelectedSeatIndex] = useState<number | null>(null);
  
  const [fontSizeScale, setFontSizeScale] = useState<number>(isCombined ? 85 : 100);
  const [zoomScale, setZoomScale] = useState<number>(isCombined ? 85 : 100);
  
  // ★ プロジェクター投影用：数式の大きさを自由に変えられるスケーラー！（デフォルト100%）
  const [mathSizeScale, setMathSizeScale] = useState<number>(100);

  useEffect(() => {
    setFontSizeScale(isCombined ? 85 : 100);
    setZoomScale(isCombined ? 85 : 100);
    setMathSizeScale(100); // 新しく生成した時は数式サイズもリセット
  }, [isCombined]);

  const handleSeatClick = (clickedIndex: number) => {
    const clickedSeat = seats.find(s => s.seatIndex === clickedIndex);
    if (!clickedSeat || clickedSeat.isInactive) return;

    if (selectedSeatIndex === null) {
      setSelectedSeatIndex(clickedIndex);
    } else if (selectedSeatIndex === clickedIndex) {
      setSelectedSeatIndex(null);
    } else {
      const idx1 = seats.findIndex(s => s.seatIndex === selectedSeatIndex);
      const idx2 = seats.findIndex(s => s.seatIndex === clickedIndex);
      if (idx1 !== -1 && idx2 !== -1) {
        const updated = [...seats];
        const tempStuId   = updated[idx1].studentId;
        const tempClass   = updated[idx1].studentClassId;
        const tempRole    = updated[idx1].role;
        const tempFormula = updated[idx1].formulaVal;

        updated[idx1].studentId      = updated[idx2].studentId;
        updated[idx1].studentClassId = updated[idx2].studentClassId;
        updated[idx1].role           = updated[idx2].role;
        updated[idx1].formulaVal     = updated[idx2].formulaVal;

        updated[idx2].studentId      = tempStuId;
        updated[idx2].studentClassId = tempClass;
        updated[idx2].role           = tempRole;
        updated[idx2].formulaVal     = tempFormula;

        onUpdateSeats(updated);
      }
      setSelectedSeatIndex(null);
    }
  };

  const getGroupBorderStyles = (seat: SeatNode) => {
    if (!seat.groupId) return 'border-2 border-slate-300';

    const r = seat.row;
    const c = seat.col;
    const sameTop = seats.find(s => s.row === r - 1 && s.col === c && s.groupId === seat.groupId);
    const sameRight = seats.find(s => s.row === r && s.col === c + 1 && s.groupId === seat.groupId);
    const sameBottom = seats.find(s => s.row === r + 1 && s.col === c && s.groupId === seat.groupId);
    const sameLeft = seats.find(s => s.row === r && s.col === c - 1 && s.groupId === seat.groupId);

    return [
      sameTop ? 'border-t border-slate-300/40' : 'border-t-[3.5px] border-t-slate-900',
      sameRight ? 'border-r border-slate-300/40' : 'border-r-[3.5px] border-r-slate-900',
      sameBottom ? 'border-b border-slate-300/40' : 'border-b-[3.5px] border-b-slate-900',
      sameLeft ? 'border-l border-slate-300/40' : 'border-l-[3.5px] border-l-slate-900',
    ].join(' ');
  };

  const getSeatColor = (seat: SeatNode) => {
    if (seat.isInactive) return 'bg-slate-200 text-slate-400 opacity-40 cursor-not-allowed';
    if (!seat.studentId) return 'bg-white text-slate-400';
    if (seat.role === 'focus') return 'bg-sky-100 text-sky-950 font-black shadow-sm';
    if (seat.role === 'leader') return 'bg-rose-100 text-rose-950 font-black shadow-sm';
    return 'bg-white text-slate-800 font-bold shadow-2xs';
  };

  const numFontSizeRem = (baseRem: number) => `${baseRem * (fontSizeScale / 100)}rem`;
  const cellMinPx = Math.round(85 * (zoomScale / 100));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* 左側カラム（8/12）：座席表グリッド */}
      <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 overflow-hidden">
        <div className="flex flex-col xl:flex-row items-center justify-between gap-3 bg-slate-50 py-3 px-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-4 text-xs font-extrabold flex-wrap">
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-sky-100 border-2 border-sky-400"></span><span>① 個人・集中(青)</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-white border-2 border-slate-900"></span><span>② グループ(白・鍵かっこ太枠)</span></div>
            <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded bg-rose-100 border-2 border-rose-400"></span><span className="text-rose-700">② リーダー(赤)</span></div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs">
              <span className="text-xs font-black text-slate-600">🔍 ズーム:</span>
              <button
                type="button"
                onClick={() => setZoomScale(prev => Math.max(prev - 5, 50))}
                className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded flex items-center justify-center text-xs transition cursor-pointer"
              >
                －
              </button>
              <span className="font-mono font-black text-xs text-indigo-700 w-9 text-center">
                {zoomScale}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale(prev => Math.min(prev + 5, 150))}
                className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded flex items-center justify-center text-xs transition cursor-pointer"
              >
                ＋
              </button>
            </div>

            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-300 shadow-2xs">
              <span className="text-xs font-black text-slate-600">🔤 文字:</span>
              <button
                type="button"
                onClick={() => setFontSizeScale(prev => Math.max(prev - 5, 60))}
                className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded flex items-center justify-center text-xs transition cursor-pointer"
              >
                －
              </button>
              <span className="font-mono font-black text-xs text-indigo-700 w-9 text-center">
                {fontSizeScale}%
              </span>
              <button
                type="button"
                onClick={() => setFontSizeScale(prev => Math.min(prev + 5, 180))}
                className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded flex items-center justify-center text-xs transition cursor-pointer"
              >
                ＋
              </button>
            </div>
          </div>
        </div>

        {selectedSeatIndex !== null && (
          <div className="text-xs font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-300 text-center animate-pulse">
            ⚡ 机を選択中です！ 入れ替え先の机をもう一つクリックしてください！
          </div>
        )}

        <div className="text-center font-black text-slate-500 text-xs tracking-widest bg-slate-100 py-2 rounded-xl border border-slate-200 shadow-inner">
          ――― 黒板 / プロジェクター / 教卓側 ―――
        </div>

        <div className="overflow-x-auto pb-4 pt-1">
          <div
            className="grid gap-2 mx-auto transition-all duration-200"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(${cellMinPx}px, 1fr))`,
              width: cols > 6 ? `${cols * (cellMinPx + 10)}px` : '100%'
            }}
          >
            {seats.map((seat) => {
              const borderStyle = getGroupBorderStyles(seat);
              const colorStyle = getSeatColor(seat);
              const isSelected = selectedSeatIndex === seat.seatIndex;

              return (
                <div
                  key={seat.seatIndex}
                  onClick={() => handleSeatClick(seat.seatIndex)}
                  className={`aspect-square rounded-xl p-1.5 sm:p-2 flex flex-col justify-between transition relative select-none cursor-pointer ${borderStyle} ${colorStyle} ${
                    isSelected ? 'ring-4 ring-amber-400 bg-amber-100/80 scale-105 z-20 shadow-xl' : 'hover:opacity-90'
                  }`}
                >
                  <div className="flex justify-between items-center text-[10px] leading-none opacity-60 font-mono">
                    <span>({seat.row},{seat.col})</span>
                    {isSelected && <span className="bg-amber-500 text-white px-1.5 py-0.5 rounded font-black text-[9px]">選択中</span>}
                  </div>

                  <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
                    <div className="h-3 flex items-center justify-center">
                      {showAnswer && seat.studentId && seat.studentClassId ? (
                        <span className="text-[10px] sm:text-[11px] font-mono font-extrabold opacity-70 leading-none tracking-tight">
                          {seat.studentClassId}
                        </span>
                      ) : (
                        <span className="text-[10px] opacity-0 select-none">placeholder</span>
                      )}
                    </div>

                    <div className="flex items-center justify-center leading-none mt-0.5">
                      {seat.studentId ? (
                        showAnswer ? (
                          <span
                            className="font-black text-slate-900 tracking-tighter transition-all duration-150"
                            style={{ fontSize: numFontSizeRem(1.6) }}
                          >
                            {seat.studentId}
                          </span>
                        ) : (
                          <span
                            className="font-mono font-black text-indigo-600 tracking-tighter leading-none animate-fade-in transition-all duration-150"
                            style={{ fontSize: numFontSizeRem(2.0) }}
                          >
                            {seat.formulaVal ?? '?'}
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-slate-400 font-bold">{seat.isInactive ? '無効' : '空席'}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-[9px] font-mono font-extrabold opacity-60 truncate h-3 flex items-end justify-end">
                    {seat.groupId || ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 右側カラム（4/12）：座席関数 ＆ コントローラー */}
      <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b pb-3">
          <h3 className="font-extrabold text-lg text-slate-800">座席表コントロール</h3>
          <p className="text-xs text-slate-500 mt-0.5">数式の計算値と答え（生徒番号）を切り替えます。</p>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowAnswer(!showAnswer)}
            className={`w-full py-4 px-4 rounded-xl font-black text-sm transition flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
              showAnswer
                ? 'bg-slate-800 hover:bg-slate-900 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {showAnswer ? (
              <span>🔢 戻す（関数の値の表示に戻す）</span>
            ) : (
              <span>👁️ 答え（出席番号とクラス）を見る</span>
            )}
          </button>

          {/* ★ 数式の大きさを自在に変えられる特大表示パネル！ */}
          <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-2xl shadow-inner text-center space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                現在適用中の座席関数
              </span>
              <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 shadow-sm">
                <span className="text-[10px] font-black text-slate-400">🧮 大きさ:</span>
                <button
                  type="button"
                  onClick={() => setMathSizeScale(prev => Math.max(prev - 10, 50))}
                  className="w-5 h-5 bg-slate-700 hover:bg-slate-600 text-white font-black rounded flex items-center justify-center text-xs transition cursor-pointer"
                >
                  －
                </button>
                <span className="font-mono font-black text-[10px] text-indigo-300 w-8 text-center">
                  {mathSizeScale}%
                </span>
                <button
                  type="button"
                  onClick={() => setMathSizeScale(prev => Math.min(prev + 10, 400))}
                  className="w-5 h-5 bg-slate-700 hover:bg-slate-600 text-white font-black rounded flex items-center justify-center text-xs transition cursor-pointer"
                >
                  ＋
                </button>
              </div>
            </div>

            {seatingFunc ? (
              <div
                className="font-mono overflow-x-auto py-2 flex justify-center transition-all duration-150"
                /* 1.125rem (text-lg相当) を基準にスケール */
                style={{ fontSize: `${1.125 * (mathSizeScale / 100)}rem` }}
              >
                <BlockMath math={seatingFunc.latexString} />
              </div>
            ) : (
              <div className="text-xs text-slate-400 font-bold py-3">
                ※デフォルト関数: f(n) = 3n + 5
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <button
            type="button"
            onClick={onSaveArchive}
            className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl shadow-2xs transition text-xs cursor-pointer flex items-center justify-center gap-2"
          >
            <span>💾 この配置を履歴に保存する</span>
          </button>
        </div>
      </div>
    </div>
  );
}