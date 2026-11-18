'use client';

import React, { useState, useEffect } from 'react';
import {
  Student, SeatNode, SeatingFunction, ClassLayoutTemplate, ClassId, SeatingArchive, CustomClass,
  getMaxStudents, getCustomClassClassIds, getCustomBaseClassId, createDefaultSpecialClass,
} from '@/types';
import TabStudents from '@/components/tab-students';
import TabFormula from '@/components/tab-formula';
import TabEditor from '@/components/tab-editor';
import { generateOptimizedSeatingChart } from '@/lib/seator-algorithm';
import { verifyInjectiveOnDomain } from '@/lib/math-engine';

const LAYOUT_STORAGE_KEY = 'seating_app_layouts_v5';
const SHARED_AC_STORAGE_KEY = 'seating_app_shared_ac_v5';
const STUDENTS_STORAGE_KEY = 'seating_app_students_v5';
const ABSENTEES_STORAGE_KEY = 'seating_app_absentees_v5';
const CLASS_STORAGE_KEY = 'seating_app_class_v5';
const ARCHIVES_STORAGE_KEY = 'seating_app_archives_v5';
const CUSTOM_CLASSES_STORAGE_KEY = 'seating_app_custom_classes_v5';
const SELECTED_CUSTOM_STORAGE_KEY = 'seating_app_selected_custom_v5';

const DEFAULT_SHARED_AC: number[] = [19, 20, 21, 22, 25, 26, 27, 28];

/** 既存レイアウトから共通ACを推定（移行用） */
function resolveSharedAc(layouts: { [key in ClassId]?: ClassLayoutTemplate }, saved?: number[] | null): number[] {
  if (saved && Array.isArray(saved)) return saved;
  for (const layout of Object.values(layouts)) {
    if (layout?.acSeatIndices && layout.acSeatIndices.length > 0) return [...layout.acSeatIndices];
  }
  return [...DEFAULT_SHARED_AC];
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'students' | 'formula' | 'editor'>('students');
  const [currentClass, setCurrentClass] = useState<ClassId>('2-1');
  const [students, setStudents] = useState<Student[]>([]);
  const [absenteeIds, setAbsenteeIds] = useState<string[]>([]);
  const [seats, setSeats] = useState<SeatNode[]>([]);
  const [cols, setCols] = useState<number>(6);
  const [layouts, setLayouts] = useState<{ [key in ClassId]?: ClassLayoutTemplate }>({});
  const [sharedAcSeatIndices, setSharedAcSeatIndices] = useState<number[]>(DEFAULT_SHARED_AC);
  const [archives, setArchives] = useState<SeatingArchive[]>([]);
  const [currentFunc, setCurrentFunc] = useState<SeatingFunction | undefined>(undefined);
  const [isCombinedMode, setIsCombinedMode] = useState<boolean>(false);
  const [targetClassesList, setTargetClassesList] = useState<ClassId[]>(['2-1']);
  const [customClasses, setCustomClasses] = useState<CustomClass[]>([]);
  /** データ管理・数式設定で選択中の特別クラス（null=通常クラス） */
  const [selectedCustomClassId, setSelectedCustomClassId] = useState<string | null>(null);
  /** 現在の座席表の生成元特別クラス */
  const [activeCustomClassId, setActiveCustomClassId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const savedLayouts = localStorage.getItem(LAYOUT_STORAGE_KEY);
    const savedSharedAc = localStorage.getItem(SHARED_AC_STORAGE_KEY);
    const savedStudents = localStorage.getItem(STUDENTS_STORAGE_KEY);
    const savedAbsentees = localStorage.getItem(ABSENTEES_STORAGE_KEY);
    const savedClass = localStorage.getItem(CLASS_STORAGE_KEY);
    const savedArchives = localStorage.getItem(ARCHIVES_STORAGE_KEY);

    let parsedLayouts: { [key in ClassId]?: ClassLayoutTemplate } = {};
    if (savedLayouts) try { parsedLayouts = JSON.parse(savedLayouts); setLayouts(parsedLayouts); } catch (e) { console.error(e); }
    let parsedSharedAc: number[] | null = null;
    if (savedSharedAc) try { parsedSharedAc = JSON.parse(savedSharedAc); } catch (e) { console.error(e); }
    setSharedAcSeatIndices(resolveSharedAc(parsedLayouts, parsedSharedAc));
    if (savedStudents) try { setStudents(JSON.parse(savedStudents)); } catch (e) { console.error(e); }
    if (savedAbsentees) try { setAbsenteeIds(JSON.parse(savedAbsentees)); } catch (e) { console.error(e); }
    if (savedArchives) try { setArchives(JSON.parse(savedArchives)); } catch (e) { console.error(e); }
    if (savedClass) setCurrentClass(savedClass as ClassId);
    const savedCustom = localStorage.getItem(CUSTOM_CLASSES_STORAGE_KEY);
    let loadedCustomClasses: CustomClass[] = [];
    if (savedCustom === null) {
      // 初回のみ、2年 特別割（4グループ）39名を自動作成
      loadedCustomClasses = [createDefaultSpecialClass()];
    } else {
      try { loadedCustomClasses = JSON.parse(savedCustom); } catch (e) { console.error(e); }
    }
    setCustomClasses(loadedCustomClasses);
    // 最後に開いていたクラスが特別クラスなら、通常クラスと同様に復元する
    const savedSelectedCustom = localStorage.getItem(SELECTED_CUSTOM_STORAGE_KEY);
    if (savedSelectedCustom && loadedCustomClasses.some(c => c.id === savedSelectedCustom)) {
      setSelectedCustomClassId(savedSelectedCustom);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => { if (isLoaded) localStorage.setItem(STUDENTS_STORAGE_KEY, JSON.stringify(students)); }, [students, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(ABSENTEES_STORAGE_KEY, JSON.stringify(absenteeIds)); }, [absenteeIds, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layouts)); }, [layouts, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(SHARED_AC_STORAGE_KEY, JSON.stringify(sharedAcSeatIndices)); }, [sharedAcSeatIndices, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(CLASS_STORAGE_KEY, currentClass); }, [currentClass, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(ARCHIVES_STORAGE_KEY, JSON.stringify(archives)); }, [archives, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem(CUSTOM_CLASSES_STORAGE_KEY, JSON.stringify(customClasses)); }, [customClasses, isLoaded]);
  useEffect(() => {
    if (!isLoaded) return;
    if (selectedCustomClassId) localStorage.setItem(SELECTED_CUSTOM_STORAGE_KEY, selectedCustomClassId);
    else localStorage.removeItem(SELECTED_CUSTOM_STORAGE_KEY);
  }, [selectedCustomClassId, isLoaded]);

  const handleToggleAbsentee = (classId: ClassId, id: number) => {
    const key = `${classId}-${id}`;
    setAbsenteeIds(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]);
  };

  const makeStubStudent = (classId: ClassId, id: number): Student => ({
    id,
    classId,
    name: `${classId} ${id}番`,
    defaultPref: 2,
    score: 0,
    props: { common: { customPairs: [], separateFrom: [] }, whenType1: {}, whenType2: {} },
  });

  const handleGenerate = (
    func: SeatingFunction,
    isCombined: boolean,
    targetClasses: ClassId[],
    customClassId?: string
  ) => {
    const custom = customClassId ? customClasses.find(c => c.id === customClassId) : undefined;
    const isCustom = !!custom;
    const effectiveCombined = isCustom ? false : isCombined;

    setCurrentFunc(func);
    setIsCombinedMode(effectiveCombined);
    setActiveCustomClassId(custom ? custom.id : null);
    setTargetClassesList(custom ? getCustomClassClassIds(custom) : targetClasses);
    const numClasses = effectiveCombined ? targetClasses.length : 1;

    const layoutCols = effectiveCombined ? 8 : 6;
    const layoutRows = effectiveCombined ? (numClasses * 5 + 1) : 7;
    setCols(layoutCols);

    // 特別クラスは、メンバー数が最も多い元クラス（特別割4なら2-4）のデフォルト座席を引き継ぐ
    const baseClassId = custom ? getCustomBaseClassId(custom) : (targetClasses[0] || currentClass);
    const savedLayout = layouts[baseClassId];
    const activeDisabledIndices = effectiveCombined ? [] : (savedLayout?.disabledSeatIndices || []);

    const layout: ClassLayoutTemplate = {
      classLabel: custom ? custom.label : effectiveCombined ? `${targetClasses.join('・')} 合同` : currentClass,
      cols: layoutCols,
      rows: layoutRows,
      acSeatIndices: sharedAcSeatIndices,
      disabledSeatIndices: activeDisabledIndices,
    };

    const targetStudents: Student[] = [];
    const classesToProcess = custom
      ? getCustomClassClassIds(custom)
      : effectiveCombined ? targetClasses : [currentClass];

    if (custom) {
      for (const m of custom.members) {
        targetStudents.push(students.find(s => s.classId === m.classId && s.id === m.id) || makeStubStudent(m.classId, m.id));
      }
    } else {
      for (const cId of classesToProcess) {
        const maxN = getMaxStudents(cId);
        for (let id = 1; id <= maxN; id++) {
          targetStudents.push(students.find(s => s.classId === cId && s.id === id) || makeStubStudent(cId, id));
        }
      }
    }

    // 実際に着席する生徒（欠席者を除く）の (m, n) で関数が単射か再検証
    const seated = targetStudents.filter(s => !absenteeIds.includes(`${s.classId}-${s.id}`));
    const domain = seated.map(s => ({ m: Number(s.classId.split('-')[1]) || 1, n: s.id }));
    if (!verifyInjectiveOnDomain(func.evaluate, domain)) {
      alert('この関数は着席する生徒の間で値が重複します。「関数を再生成」してからもう一度実行してください。');
      return;
    }

    // 対象クラスを含む最新アーカイブを非重複参照に使う（id=保存時刻の降順）
    const lessonType: SeatingArchive['lessonType'] = custom ? 'custom' : effectiveCombined ? 'combined' : 'normal';
    const sortedArchives = [...archives].sort((a, b) => Number(b.id) - Number(a.id));
    const newestArchive = custom
      ? sortedArchives.find(a => a.lessonType === 'custom' && a.customClassId === custom.id)
      : sortedArchives.find(a =>
          a.lessonType === lessonType &&
          classesToProcess.every(c => a.targetClasses.includes(c))
        ) ||
        sortedArchives.find(a =>
          a.lessonType === lessonType &&
          classesToProcess.some(c => a.targetClasses.includes(c))
        ) ||
        sortedArchives.find(a =>
          a.lessonType !== 'custom' &&
          classesToProcess.every(c => a.targetClasses.includes(c))
        );

    const generatedSeats = generateOptimizedSeatingChart(
      targetStudents,
      absenteeIds,
      layout,
      effectiveCombined,
      func,
      newestArchive?.seats
    );
    setSeats(generatedSeats);
    setActiveTab('editor');
  };

  const handleSaveArchive = () => {
    const activeCustom = activeCustomClassId ? customClasses.find(c => c.id === activeCustomClassId) : undefined;
    const today = new Date().toLocaleDateString('ja-JP');
    const title = activeCustom
      ? `${activeCustom.label} 座席表 (${today})`
      : isCombinedMode
        ? `${targetClassesList.join('・')} 合同座席表 (${today})`
        : `${currentClass} 通常座席表 (${today})`;

    const archiveTargetClasses = activeCustom
      ? getCustomClassClassIds(activeCustom)
      : isCombinedMode ? targetClassesList : [currentClass];
    // 対象クラス（特別クラスはメンバー）に属する欠席者だけをアーカイブに保存
    const archiveAbsenteeIds = absenteeIds.filter(key =>
      activeCustom
        ? activeCustom.members.some(m => key === `${m.classId}-${m.id}`)
        : archiveTargetClasses.some(c => key.startsWith(`${c}-`))
    );

    const newArchive: SeatingArchive = {
      id: Date.now().toString(),
      title,
      date: new Date().toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      lessonType: activeCustom ? 'custom' : isCombinedMode ? 'combined' : 'normal',
      customClassId: activeCustom?.id,
      targetClasses: archiveTargetClasses,
      seatingFunctionLatex: currentFunc?.latexString || 'f(n) = 3n + 5',
      seats: seats,
      absenteeIds: archiveAbsenteeIds,
    };

    setArchives(prev => [newArchive, ...prev]);
    alert(`『 ${title} 』をアーカイブ履歴に正常に保存しました！\n「データ管理」ページの「📂 アーカイブ履歴」からいつでも確認できます。`);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16 overflow-x-hidden">
      <header className="bg-slate-900 text-white py-5 px-4 sm:px-8 shadow-md flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">数学 席替え座席表</h1>
        </div>
        <div className="text-sm font-bold bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
          {selectedCustomClassId && customClasses.some(c => c.id === selectedCustomClassId) ? (
            <>
              選択中: <span className="text-indigo-400 text-base">{customClasses.find(c => c.id === selectedCustomClassId)?.label}</span>{' '}
              ({customClasses.find(c => c.id === selectedCustomClassId)?.members.length}名)
            </>
          ) : (
            <>
              選択中: <span className="text-indigo-400 font-mono text-base">{currentClass}</span> ({students.filter(s => s.classId === currentClass).length}名登録)
            </>
          )}
        </div>
      </header>

      {/* ★ ここが究極の拡張ポイント！ max-w-none にして画面幅100%フルサイズ対応にしました */}
      <div className="w-full max-w-none px-2 sm:px-6 lg:px-8 mx-auto mt-6">
        <div className="flex border-b border-slate-300 gap-1 sm:gap-2 font-extrabold text-sm sm:text-base overflow-x-auto">
          <button
            onClick={() => setActiveTab('students')}
            className={`py-3 px-4 sm:px-6 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'students' ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl shadow-sm' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ① 生徒・成績データ管理
          </button>
          <button
            onClick={() => setActiveTab('formula')}
            className={`py-3 px-4 sm:px-6 border-b-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'formula' ? 'border-indigo-600 text-indigo-600 bg-white rounded-t-xl shadow-sm' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ② 条件＆数式設定
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`py-3 px-4 sm:px-6 border-b-2 transition cursor-pointer whitespace-nowrap ${
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
              customClasses={customClasses}
              onUpdateCustomClasses={setCustomClasses}
              selectedCustomClassId={selectedCustomClassId}
              onSelectCustomClass={setSelectedCustomClassId}
              layouts={layouts}
              onUpdateLayouts={setLayouts}
              sharedAcSeatIndices={sharedAcSeatIndices}
              onUpdateSharedAc={setSharedAcSeatIndices}
              archives={archives}
              onDeleteArchive={(id) => setArchives(prev => prev.filter(a => a.id !== id))}
            />
          )}
          {activeTab === 'formula' && (
            <TabFormula
              currentClass={currentClass}
              customClasses={customClasses}
              selectedCustomClassId={selectedCustomClassId}
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
              isCombined={isCombinedMode}
              onUpdateSeats={setSeats}
              onSaveArchive={handleSaveArchive}
            />
          )}
        </div>
      </div>
    </main>
  );
}