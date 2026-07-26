'use client';

import React, { useState, useEffect } from 'react';
import { Student, SeatNode, SeatingFunction, ClassLayoutTemplate, ClassId, SeatingArchive, getMaxStudents } from '@/types';
import TabStudents from '@/components/tab-students';
import TabFormula from '@/components/tab-formula';
import TabEditor from '@/components/tab-editor';
import { generateOptimizedSeatingChart } from '@/lib/seator-algorithm';

const LAYOUT_STORAGE_KEY = 'seating_app_layouts_v5';
const STUDENTS_STORAGE_KEY = 'seating_app_students_v5';
const ABSENTEES_STORAGE_KEY = 'seating_app_absentees_v5';
const CLASS_STORAGE_KEY = 'seating_app_class_v5';
const ARCHIVES_STORAGE_KEY = 'seating_app_archives_v5';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'students' | 'formula' | 'editor'>('students');
  const [currentClass, setCurrentClass] = useState<ClassId>('2-1');
  const [students, setStudents] = useState<Student[]>([]);
  const [absenteeIds, setAbsenteeIds] = useState<string[]>([]);
  const [seats, setSeats] = useState<SeatNode[]>([]);
  const [cols, setCols] = useState<number>(6);
  const [layouts, setLayouts] = useState<{ [key in ClassId]?: ClassLayoutTemplate }>({});
  const [archives, setArchives] = useState<SeatingArchive[]>([]);
  const [currentFunc, setCurrentFunc] = useState<SeatingFunction | undefined>(undefined);
  const [isCombinedMode, setIsCombinedMode] = useState<boolean>(false);
  const [targetClassesList, setTargetClassesList] = useState<ClassId[]>(['2-1']);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const savedLayouts = localStorage.getItem(LAYOUT_STORAGE_KEY);
    const savedStudents = localStorage.getItem(STUDENTS_STORAGE_KEY);
    const savedAbsentees = localStorage.getItem(ABSENTEES_STORAGE_KEY);
    const savedClass = localStorage.getItem(CLASS_STORAGE_KEY);
    const savedArchives = localStorage.getItem(ARCHIVES_STORAGE_KEY);

    if (savedLayouts) try { setLayouts(JSON.parse(savedLayouts)); } catch (e) { console.error(e); }
    if (savedStudents) try { setStudents(JSON.parse(savedStudents)); } catch (e) { console.error(e); }
    if (savedAbsentees) try { setAbsenteeIds(JSON.parse(savedAbsentees)); } catch (e) { console.error(e); }
    if (savedArchives) try { setArchives(JSON.parse(savedArchives)); } catch (e) { console.error(e); }
    if (savedClass) setCurrentClass(savedClass as ClassId);
    setIsLoaded(true);
  }, []);

  useEffect(() => { if (isLoaded) localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students)); }, [students, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(ABSENTEES_STORAGE_KEY, JSON.stringify(absenteeIds)); }, [absenteeIds, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layouts)); }, [layouts, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(CLASS_STORAGE_KEY, currentClass); }, [currentClass, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(ARCHIVES_STORAGE_KEY, JSON.stringify(archives)); }, [archives, isLoaded]);

  const handleToggleAbsentee = (classId: ClassId, id: number) => {
    const key = `${classId}-${id}`;
    setAbsenteeIds(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]);
  };

  const handleGenerate = (func: SeatingFunction, isCombined: boolean, targetClasses: ClassId[]) => {
    setCurrentFunc(func);
    setIsCombinedMode(isCombined);
    setTargetClassesList(targetClasses);
    const numClasses = isCombined ? targetClasses.length : 1;
    
    const layoutCols = isCombined ? 8 : 6;
    const layoutRows = isCombined ? (numClasses * 5 + 1) : 7;
    setCols(layoutCols);

    const baseClassId = targetClasses[0] || currentClass;
    const savedLayout = layouts[baseClassId];
    const has2_5 = isCombined ? targetClasses.includes('2-5') : currentClass === '2-5';
    const defaultAcIndices = has2_5 ? [19, 20, 21, 22, 25, 26, 27, 28] : [];
    const activeDisabledIndices = isCombined ? [] : (savedLayout?.disabledSeatIndices || []);

    const layout: ClassLayoutTemplate = {
      classLabel: isCombined ? `${targetClasses.join('・')} 合同` : currentClass,
      cols: layoutCols,
      rows: layoutRows,
      acSeatIndices: savedLayout?.acSeatIndices || defaultAcIndices,
      disabledSeatIndices: activeDisabledIndices,
    };

    const targetStudents: Student[] = [];
    const classesToProcess = isCombined ? targetClasses : [currentClass];

    for (const cId of classesToProcess) {
      const maxN = getMaxStudents(cId);
      for (let id = 1; id <= maxN; id++) {
        const existing = students.find(s => s.classId === cId && s.id === id);
        if (existing) targetStudents.push(existing);
        else {
          targetStudents.push({
            id,
            classId: cId,
            name: `${cId} ${id}番`,
            defaultPref: 2,
            score: 0,
            props: { common: { customPairs: [] }, whenType1: {}, whenType2: {} }
          });
        }
      }
    }

    const generatedSeats = generateOptimizedSeatingChart(targetStudents, absenteeIds, layout, isCombined, func);
    setSeats(generatedSeats);
    setActiveTab('editor');
  };

  // ★ 座席表の保存処理（アーカイブ履歴へ永続保存）
  const handleSaveArchive = () => {
    const title = isCombinedMode
      ? `${targetClassesList.join('・')} 合同座席表 (${new Date().toLocaleDateString('ja-JP')})`
      : `${currentClass} 通常座席表 (${new Date().toLocaleDateString('ja-JP')})`;

    const newArchive: SeatingArchive = {
      id: Date.now().toString(),
      title,
      date: new Date().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      lessonType: isCombinedMode ? 'combined' : 'normal',
      targetClasses: isCombinedMode ? targetClassesList : [currentClass],
      seatingFunctionLatex: currentFunc?.latexString || 'f(n) = 3n + 5',
      seats: seats,
      absenteeIds: absenteeIds,
    };

    setArchives(prev => [newArchive, ...prev]);
    alert(`『 ${title} 』をアーカイブ履歴に正常に保存しました！\n「データ管理」ページの「📂 アーカイブ履歴」からいつでも確認できます。`);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* ★ ご指示通り、タイトルを「数学 席替え座席表」へ変更！ */}
      <header className="bg-slate-900 text-white py-5 px-8 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">数学 席替え座席表</h1>
        </div>
        <div className="text-sm font-bold bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
          選択中: <span className="text-indigo-400 font-mono text-base">{currentClass}</span> ({students.filter(s => s.classId === currentClass).length}名登録)
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="flex border-b border-slate-300 gap-2 font-extrabold text-base">
          <button
            onClick={() => setActiveTab('students')}
            className={`py-3 px-6 border-b-2 transition cursor-pointer ${
              activeTab === 'students' ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl shadow-sm' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ① 生徒・成績データ管理
          </button>
          <button
            onClick={() => setActiveTab('formula')}
            className={`py-3 px-6 border-b-2 transition cursor-pointer ${
              activeTab === 'formula' ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl shadow-sm' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ② 条件＆数式設定
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`py-3 px-6 border-b-2 transition cursor-pointer ${
              activeTab === 'editor' ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl shadow-sm' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ③ 座席表エディタ＆結果
          </button>
        </div>

        <div className="mt-6">
          {activeTab === 'students' && (
            <TabStudents
              students={students}
              onUpdateStudents={setStudents}
              currentClass={currentClass}
              onChangeClass={setCurrentClass}
              layouts={layouts}
              onUpdateLayouts={setLayouts}
              archives={archives} // ★ アーカイブ履歴データを引き渡し
              onDeleteArchive={(id) => setArchives(prev => prev.filter(a => a.id !== id))}
            />
          )}
          {activeTab === 'formula' && (
            <TabFormula
              currentClass={currentClass}
              students={students}
              absenteeIds={absenteeIds}
              onToggleAbsentee={handleToggleAbsentee}
              onGenerate={handleGenerate}
            />
          )}
          {activeTab === 'editor' && (
            <TabEditor
              seats={seats}
              students={students}
              cols={cols}
              seatingFunc={currentFunc}
              isCombined={isCombinedMode} // ★ 合同授業フラグ（デフォルト85%設定用）
              onUpdateSeats={setSeats}
              onSaveArchive={handleSaveArchive} // ★ アーカイブ保存コールバック
            />
          )}
        </div>
      </div>
    </main>
  );
}