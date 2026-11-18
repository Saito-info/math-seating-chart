'use client';

import React, { useState } from 'react';
import {
  Student, ClassId, ALL_CLASSES, ClassLayoutTemplate, getMaxStudents, SeatingArchive,
  CustomClass, Gender, GENDER_LABEL, SeatSide, SEAT_SIDE_LABEL, AdjacentWish,
  parseMemberList, memberToFourDigit, getCustomClassClassIds,
} from '@/types';
import {
  parseExcelData, parseExcelScoreFiles, parseGenderFromExcelFiles, ImportMode, ScoreGradeYear,
} from '@/lib/excel-parser';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

/** カンマ・全角カンマ・読点・スペース区切りの出席番号リストをパース */
function parseStudentNumberList(input: string, selfId: number): number[] {
  return input
    .split(/[,，、\s]+/)
    .map(s => Number(s.trim()))
    .filter(n => !isNaN(n) && n > 0 && n !== selfId);
}

/** 出席番号は入力中に確定せず、Enter でまとめて認識する */
function NumberListInput({
  value,
  placeholder,
  onCommit,
}: {
  value: string;
  placeholder: string;
  onCommit: (raw: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <input
      type="text"
      value={draft ?? value}
      placeholder={placeholder}
      onChange={(e) => {
        e.stopPropagation();
        setDraft(e.target.value);
      }}
      onKeyDown={(e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        e.stopPropagation();
        onCommit(draft ?? value);
        setDraft(null);
      }}
      onClick={(e) => e.stopPropagation()}
      className="w-full px-2 py-1 bg-indigo-950 border border-indigo-700 rounded text-white font-mono font-black outline-none focus:ring-1 focus:ring-indigo-400"
    />
  );
}

type Props = {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  currentClass: ClassId;
  onChangeClass: (cId: ClassId) => void;
  customClasses: CustomClass[];
  onUpdateCustomClasses: (classes: CustomClass[]) => void;
  selectedCustomClassId: string | null;
  onSelectCustomClass: (id: string | null) => void;
  layouts: { [key in ClassId]?: ClassLayoutTemplate };
  onUpdateLayouts: (layouts: { [key in ClassId]?: ClassLayoutTemplate }) => void;
  sharedAcSeatIndices: number[];
  onUpdateSharedAc: (indices: number[]) => void;
  archives: SeatingArchive[];
  onDeleteArchive: (id: string) => void;
};

export default function TabStudents({
  students,
  onUpdateStudents,
  currentClass,
  onChangeClass,
  customClasses,
  onUpdateCustomClasses,
  selectedCustomClassId,
  onSelectCustomClass,
  layouts,
  onUpdateLayouts,
  sharedAcSeatIndices,
  onUpdateSharedAc,
  archives,
  onDeleteArchive,
}: Props) {
  const [subTab, setSubTab] = useState<'list' | 'layout' | 'archive' | 'gender' | 'custom'>('list');
  const [showScores, setShowScores] = useState<boolean>(false);
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);
  const [customLabelDraft, setCustomLabelDraft] = useState<string>('');
  const [customMembersDraft, setCustomMembersDraft] = useState<string>('');
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [selectedArchive, setSelectedArchive] = useState<SeatingArchive | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('seat-pref');
  const [scoreGradeYear, setScoreGradeYear] = useState<ScoreGradeYear>(
    () => (Number(currentClass.split('-')[0]) as ScoreGradeYear) || 2
  );

  const maxNum = getMaxStudents(currentClass);

  const activeCustom = customClasses.find(c => c.id === selectedCustomClassId);
  const viewLabel = activeCustom ? activeCustom.label : currentClass;
  const effectiveSubTab = activeCustom && subTab === 'layout' ? 'list' : subTab;

  const makeStub = (classId: ClassId, id: number): Student => ({
    id,
    classId,
    name: `${classId} ${id}番 (未登録)`,
    defaultPref: 2,
    score: 0,
    props: { common: { customPairs: [], separateFrom: [] }, whenType1: {}, whenType2: {} },
  });

  const allStudentsList: Student[] = activeCustom
    ? activeCustom.members.map(m =>
        students.find(s => s.classId === m.classId && s.id === m.id) || makeStub(m.classId, m.id)
      )
    : Array.from({ length: maxNum }, (_, i) => {
        const id = i + 1;
        return students.find(s => s.classId === currentClass && s.id === id) || makeStub(currentClass, id);
      });

  const studentRowKey = (s: Student) => `${s.classId}-${s.id}`;

  /** 隣接クラス希望の選択肢: 生徒本人と同じ学年の5クラス */
  const sameGradeClasses = (s: Student): ClassId[] =>
    ALL_CLASSES.filter(c => c.split('-')[0] === s.classId.split('-')[0]);

  const updateAdjacentWish = (stu: Student, patch: Partial<AdjacentWish>) => {
    const next: AdjacentWish = { ...stu.props.common.adjacentWish, ...patch };
    if (!next.classIds || next.classIds.length === 0) delete next.classIds;
    if (!next.gender) delete next.gender;
    handleUpdateStudentProp(stu, {
      props: {
        ...stu.props,
        common: {
          ...stu.props.common,
          adjacentWish: next.classIds || next.gender ? next : undefined,
        },
      },
    });
  };

  const genderCounts = {
    male: allStudentsList.filter(s => s.gender === 'male').length,
    female: allStudentsList.filter(s => s.gender === 'female').length,
    unset: allStudentsList.filter(s => !s.gender).length,
  };

  const currentLayout: ClassLayoutTemplate = layouts[currentClass] || {
    classLabel: currentClass,
    cols: 6,
    rows: 7,
    acSeatIndices: sharedAcSeatIndices,
    disabledSeatIndices: [],
  };

  const relevantArchives = activeCustom
    ? archives.filter(a => a.lessonType === 'custom' && a.customClassId === activeCustom.id)
    : archives.filter(a => a.lessonType !== 'custom' && a.targetClasses.includes(currentClass));

  /** アーカイブ表示用: 対象クラスに属する欠席者数のみ数える */
  const countArchiveAbsentees = (arch: SeatingArchive): number => {
    return (arch.absenteeIds || []).filter(key =>
      arch.targetClasses.some(c => key === `${c}` || key.startsWith(`${c}-`))
    ).length;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    try {
      if (importMode === 'seat-pref') {
        const result = await parseExcelData(files[0], currentClass, importMode, students);
        onUpdateStudents(result.students);

        const summary = result.seatPrefImport;
        if (!summary || summary.count === 0) {
          alert(
            '座席希望データが見つかりませんでした。\n' +
            'F列（出席番号・4桁）と J列（希望: 1=集中, 2=グループ）を含む Microsoft Forms 形式のファイルか確認してください。'
          );
        } else {
          const classList = summary.classes.join(', ');
          if (summary.classes.length === 1 && summary.classes[0] !== currentClass) {
            onChangeClass(summary.classes[0]);
          }
          alert(
            `座席希望をインポートしました！\n\n` +
            `シート: ${summary.sheetName}\n` +
            `反映: ${summary.count}名（①集中 ${summary.focusCount}名 / ②グループ ${summary.groupCount}名）\n` +
            `対象クラス: ${classList}\n\n` +
            `${summary.classes.includes(currentClass) || summary.classes.length === 1
              ? 'データ管理画面で希望区分が更新されているかご確認ください。'
              : `画面上部のクラスを「${classList}」に切り替えてご確認ください。`}`
          );
        }
      } else {
        const result = await parseExcelScoreFiles(files, scoreGradeYear, students, currentClass);
        onUpdateStudents(result.students);

        const summary = result.scoreImport;
        if (!summary || summary.count === 0) {
          alert(
            '成績データが見つかりませんでした。\n' +
            '「学籍順」シートに学籍番号・合計点があるファイルか、旧形式の成績ファイルを確認してください。'
          );
        } else if (summary.format === 'gakuseki') {
          alert(
            `成績（合計点）をインポートしました！\n\n` +
            `学年補完: ${summary.gradeYear}年生（学籍番号の先頭桁）\n` +
            `ファイル数: ${summary.fileCount}（複数時は自動合計）\n` +
            `反映: ${summary.count}名\n` +
            `対象クラス: ${summary.classes.join(', ')}\n\n` +
            `${summary.fileNames.map(n => `・${n}`).join('\n')}`
          );
        } else {
          alert(
            `旧形式の成績ファイルをインポートしました！\n` +
            `反映: ${summary.count}名 / 対象: ${summary.classes.join(', ') || '—'}`
          );
        }
      }
    } catch (err) {
      console.error(err);
      alert('Excelの読み込みに失敗しました。ファイルの形式を確認してください。');
    } finally {
      e.target.value = '';
    }
  };

  // ★ ペア(customPairs)の双方向・複数人相互リンク自動更新
  const handleUpdateStudentProp = (stu: Student, updates: Partial<Student>) => {
    let updatedStudents = [...students];

    if (updates.props?.common?.customPairs !== undefined) {
      const oldPairs = stu.props.common.customPairs || [];
      const newPairs = updates.props.common.customPairs;
      const removed = oldPairs.filter(p => !newPairs.includes(p));
      const clique = [stu.id, ...newPairs];

      updatedStudents = updatedStudents.map(s => {
        if (s.classId !== stu.classId) return s;

        // クリューク内の生徒は、互いの番号をすべて持つ
        if (clique.includes(s.id)) {
          const others = clique.filter(id => id !== s.id);
          const existing = s.props.common.customPairs || [];
          // クリューク外の既存リンクは維持（今回 stu から外された番号は除く）
          const outside = existing.filter(id => !clique.includes(id) && !removed.includes(id));
          return {
            ...s,
            props: {
              ...s.props,
              common: {
                ...s.props.common,
                customPairs: Array.from(new Set([...others, ...outside])),
              },
            },
          };
        }

        // クリュークから外された生徒は、stu とのリンクだけ外す
        if (removed.includes(s.id)) {
          const cp = s.props.common.customPairs || [];
          if (cp.includes(stu.id)) {
            return {
              ...s,
              props: {
                ...s.props,
                common: { ...s.props.common, customPairs: cp.filter(id => id !== stu.id) },
              },
            };
          }
        }
        return s;
      });
    }

    if (updates.props?.common?.separateFrom !== undefined) {
      const oldSep = stu.props.common.separateFrom || [];
      const newSep = updates.props.common.separateFrom;
      const added = newSep.filter(p => !oldSep.includes(p));
      const removed = oldSep.filter(p => !newSep.includes(p));

      updatedStudents = updatedStudents.map(s => {
        if (s.classId !== stu.classId) return s;
        if (added.includes(s.id)) {
          const sf = s.props.common.separateFrom || [];
          if (!sf.includes(stu.id)) {
            return {
              ...s,
              props: {
                ...s.props,
                common: { ...s.props.common, separateFrom: [...sf, stu.id] },
              },
            };
          }
        }
        if (removed.includes(s.id)) {
          const sf = s.props.common.separateFrom || [];
          if (sf.includes(stu.id)) {
            return {
              ...s,
              props: {
                ...s.props,
                common: { ...s.props.common, separateFrom: sf.filter(id => id !== stu.id) },
              },
            };
          }
        }
        return s;
      });
    }

    const idx = updatedStudents.findIndex(s => s.classId === stu.classId && s.id === stu.id);
    if (idx !== -1) {
      updatedStudents[idx] = { ...updatedStudents[idx], ...updates };
    } else {
      updatedStudents.push({ ...stu, ...updates });
    }

    onUpdateStudents(updatedStudents);
  };

  const handleToggleSeatState = (idx: number) => {
    const isAC = sharedAcSeatIndices.includes(idx);
    const isDisabled = currentLayout.disabledSeatIndices.includes(idx);

    let nextAC = [...sharedAcSeatIndices];
    let nextDisabled = [...currentLayout.disabledSeatIndices];

    if (!isAC && !isDisabled) {
      // 通常 → エアコン（全教室共通）
      nextAC.push(idx);
      onUpdateSharedAc(nextAC);
    } else if (isAC && !isDisabled) {
      // エアコン → このクラスのみ無効席（エアコン指定自体は全教室から外す）
      nextAC = nextAC.filter(i => i !== idx);
      nextDisabled.push(idx);
      onUpdateSharedAc(nextAC);
      onUpdateLayouts({
        ...layouts,
        [currentClass]: { ...currentLayout, acSeatIndices: nextAC, disabledSeatIndices: nextDisabled },
      });
      return;
    } else {
      // 無効 → 通常
      nextDisabled = nextDisabled.filter(i => i !== idx);
    }

    onUpdateLayouts({
      ...layouts,
      [currentClass]: { ...currentLayout, acSeatIndices: nextAC, disabledSeatIndices: nextDisabled },
    });
  };

  const handleSetGender = (stu: Student, gender: Gender | undefined) => {
    handleUpdateStudentProp(stu, { gender });
  };

  /** 表示中の生徒全員の性別をまとめて設定 */
  const handleBulkGender = (gender: Gender | undefined) => {
    if (!confirm(`${viewLabel} の ${allStudentsList.length}名すべての性別を「${gender ? GENDER_LABEL[gender] : '未設定'}」にします。よろしいですか？`)) return;
    const keys = new Set(allStudentsList.map(studentRowKey));
    const updated = students.map(s => (keys.has(studentRowKey(s)) ? { ...s, gender } : s));
    const existingKeys = new Set(students.map(studentRowKey));
    for (const s of allStudentsList) {
      if (!existingKeys.has(studentRowKey(s))) updated.push({ ...s, gender });
    }
    onUpdateStudents(updated);
  };

  const handleGenderFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    try {
      const result = await parseGenderFromExcelFiles(Array.from(fileList), scoreGradeYear, students);
      const summary = result.summary;
      if (summary.count === 0) {
        alert(
          '性別データが見つかりませんでした。\n' +
          '「学籍番号」列と「性別」列（男/女）を持つシートを含むファイルか確認してください。'
        );
      } else {
        onUpdateStudents(result.students);
        alert(
          `性別をインポートしました！\n\n` +
          `学年補完: ${summary.gradeYear}年生\n` +
          `反映: ${summary.count}名（男 ${summary.male}名 / 女 ${summary.female}名）\n` +
          `対象クラス: ${summary.classes.join(', ')}\n\n` +
          summary.fileNames.map(n => `・${n}`).join('\n')
        );
      }
    } catch (err) {
      console.error(err);
      alert('Excelの読み込みに失敗しました。ファイルの形式を確認してください。');
    } finally {
      e.target.value = '';
    }
  };

  const resetCustomEditor = () => {
    setEditingCustomId(null);
    setCustomLabelDraft('');
    setCustomMembersDraft('');
  };

  const handleSaveCustomClass = () => {
    const label = customLabelDraft.trim();
    if (!label) { alert('クラス名を入力してください。'); return; }
    const { members, invalid } = parseMemberList(customMembersDraft);
    if (members.length === 0) { alert('メンバーを4桁の出席番号（例: 2403）で入力してください。'); return; }
    if (invalid.length > 0) {
      if (!confirm(`次の入力は認識できなかったため無視されます:\n${invalid.join(', ')}\n\nこのまま保存しますか？`)) return;
    }
    const gradeYear = (Number(members[0].classId.split('-')[0]) as 1 | 2 | 3) || 2;
    if (editingCustomId) {
      onUpdateCustomClasses(customClasses.map(c =>
        c.id === editingCustomId ? { ...c, label, gradeYear, members } : c
      ));
    } else {
      onUpdateCustomClasses([...customClasses, { id: `custom-${Date.now()}`, label, gradeYear, members }]);
    }
    resetCustomEditor();
  };

  const handleEditCustomClass = (c: CustomClass) => {
    setEditingCustomId(c.id);
    setCustomLabelDraft(c.label);
    setCustomMembersDraft(c.members.map(memberToFourDigit).join(', '));
  };

  const handleDeleteCustomClass = (c: CustomClass) => {
    if (!confirm(`特別クラス『${c.label}』を削除しますか？（生徒データやアーカイブは残ります）`)) return;
    onUpdateCustomClasses(customClasses.filter(x => x.id !== c.id));
    if (selectedCustomClassId === c.id) onSelectCustomClass(null);
    if (editingCustomId === c.id) resetCustomEditor();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <label className="font-bold text-slate-700">対象クラス:</label>
          <select
            value={activeCustom ? `custom:${activeCustom.id}` : currentClass}
            onChange={(e) => {
              const v = e.target.value;
              if (v.startsWith('custom:')) {
                onSelectCustomClass(v.slice('custom:'.length));
              } else {
                onSelectCustomClass(null);
                onChangeClass(v as ClassId);
              }
              setSelectedArchive(null);
              setOpenStudentId(null);
            }}
            className="border border-slate-300 rounded-lg px-4 py-2 font-bold text-lg bg-slate-50 text-indigo-950 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <optgroup label="通常クラス">
              {ALL_CLASSES.map((cId) => (
                <option key={cId} value={cId}>
                  {cId} ({getMaxStudents(cId)}名)
                </option>
              ))}
            </optgroup>
            {customClasses.length > 0 && (
              <optgroup label="特別クラス（特別割など）">
                {customClasses.map((c) => (
                  <option key={c.id} value={`custom:${c.id}`}>
                    {c.label} ({c.members.length}名)
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        <div className="flex items-center gap-4">
          {effectiveSubTab === 'list' && (
            <label className="flex items-center gap-2 cursor-pointer bg-slate-100 px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={showScores}
                onChange={(e) => setShowScores(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <span>🔒 成績を表示する</span>
            </label>
          )}

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-extrabold flex-wrap">
            <button
              type="button"
              onClick={() => { setSubTab('list'); setSelectedArchive(null); }}
              className={`px-3.5 py-2 rounded-lg transition cursor-pointer ${effectiveSubTab === 'list' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:bg-slate-200/60'}`}
            >
              📋 生徒名簿＆成績
            </button>
            <button
              type="button"
              onClick={() => { setSubTab('gender'); setSelectedArchive(null); }}
              className={`px-3.5 py-2 rounded-lg transition cursor-pointer ${effectiveSubTab === 'gender' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:bg-slate-200/60'}`}
            >
              ⚧ 性別プリセット
            </button>
            <button
              type="button"
              onClick={() => { setSubTab('custom'); setSelectedArchive(null); }}
              className={`px-3.5 py-2 rounded-lg transition cursor-pointer ${effectiveSubTab === 'custom' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:bg-slate-200/60'}`}
            >
              🏷️ 特別クラス
            </button>
            {!activeCustom && (
              <button
                type="button"
                onClick={() => { setSubTab('layout'); setSelectedArchive(null); }}
                className={`px-3.5 py-2 rounded-lg transition cursor-pointer ${effectiveSubTab === 'layout' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:bg-slate-200/60'}`}
              >
                🏫 デフォルト座席設定
              </button>
            )}
            <button
              type="button"
              onClick={() => setSubTab('archive')}
              className={`px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center gap-1 ${effectiveSubTab === 'archive' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:bg-slate-200/60'}`}
            >
              <span>📂 アーカイブ履歴</span>
              {relevantArchives.length > 0 && (
                <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded-full text-[10px] font-black">
                  {relevantArchives.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {effectiveSubTab === 'list' ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col xl:flex-row justify-between xl:items-center border-b pb-4 gap-4">
            <div>
              <h3 className="font-extrabold text-lg text-slate-800">{viewLabel} 全員分データ ({allStudentsList.length}名表示)</h3>
              <p className="text-xs text-slate-500 mt-0.5">※生徒行をクリックするとその場で配慮事項や希望区分をアコーディオン編集できます。</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setImportMode('seat-pref')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    importMode === 'seat-pref' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>✨ 新形式 (座席希望)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('score')}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    importMode === 'score' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>📊 成績入力</span>
                </button>
              </div>

              {importMode === 'score' && (
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-xl text-xs font-black text-amber-900">
                  <span className="shrink-0">学年補完:</span>
                  {([1, 2, 3] as ScoreGradeYear[]).map(y => (
                    <label
                      key={y}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer transition ${
                        scoreGradeYear === y ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="scoreGradeYear"
                        checked={scoreGradeYear === y}
                        onChange={() => setScoreGradeYear(y)}
                        className="sr-only"
                      />
                      <span>{y}年</span>
                    </label>
                  ))}
                  <span className="text-[10px] font-bold text-amber-700 ml-1 hidden sm:inline">
                    ※学籍番号が「501」形式のとき先頭学年を補います
                  </span>
                </div>
              )}

              <label className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs cursor-pointer shadow transition flex items-center gap-1.5 shrink-0">
                <span>
                  {importMode === 'seat-pref'
                    ? '📂 新形式で希望をインポート'
                    : '📂 成績ファイルをインポート（複数可）'}
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xlsm,.xls"
                  multiple={importMode === 'score'}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-200 text-slate-600 font-bold">
                  <th className="py-2.5 px-3 text-center w-16">{activeCustom ? '元クラス-番号' : '番号'}</th>
                  <th className="py-2.5 px-3">氏名・ラベル</th>
                  <th className="py-2.5 px-3 text-center w-14">性別</th>
                  <th className="py-2.5 px-3 text-center">希望区分</th>
                  <th className="py-2.5 px-3 text-center">成績スコア</th>
                  <th className="py-2.5 px-3">特殊配慮・ペアタグ (クリックで展開)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold">
                {allStudentsList.map(stu => {
                  const rowKey = studentRowKey(stu);
                  const isOpen = openStudentId === rowKey;
                  const pairsStr = stu.props.common.customPairs?.join(', ') || '';
                  const separateStr = stu.props.common.separateFrom?.join(', ') || '';
                  const adjWish = stu.props.common.adjacentWish;

                  return (
                    <React.Fragment key={rowKey}>
                      <tr
                        onClick={() => setOpenStudentId(isOpen ? null : rowKey)}
                        className={`hover:bg-indigo-50/70 cursor-pointer transition ${isOpen ? 'bg-indigo-50 font-black' : ''}`}
                      >
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                          {activeCustom ? `${stu.classId}-${stu.id}` : stu.id}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800">{stu.name}</td>
                        <td className="py-2.5 px-3 text-center">
                          {stu.gender ? (
                            <span className={`px-2 py-0.5 rounded-full font-black text-[11px] ${stu.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'}`}>
                              {GENDER_LABEL[stu.gender]}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-black text-[11px] ${stu.defaultPref === 1 ? 'bg-sky-100 text-sky-800 border border-sky-300' : 'bg-slate-100 text-slate-700 border border-slate-300'}`}>
                            {stu.defaultPref === 1 ? '① 個人・集中(青)' : '② グループ'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-600">
                          {showScores ? stu.score : '****'}
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-indigo-600 font-extrabold flex items-center gap-1">
                          <span>{isOpen ? '▼ 閉じる' : '▶ 配慮編集'}</span>
                          <span className="text-slate-500 font-normal ml-1">
                            {stu.props.common.avoidAC && '❄️エアコン回避 '}
                            {stu.props.common.fixedSeatId && `📍固定(${stu.props.common.fixedSeatId}番席) `}
                            {stu.props.whenType1.preferFrontRow && '⬆️前列希望 '}
                            {stu.props.whenType1.preferBackRow && '⬇️後列希望 '}
                            {stu.props.common.preferSide && `${stu.props.common.preferSide === 'window' ? '🪟窓側' : '🚪廊下側'}希望 `}
                            {adjWish && `👥隣希望(${[
                              ...(adjWish.classIds || []),
                              ...(adjWish.gender ? [GENDER_LABEL[adjWish.gender]] : []),
                            ].join('・')}) `}
                            {stu.props.common.customPairs && stu.props.common.customPairs.length > 0 && `🤝同G/隣接(${stu.props.common.customPairs.join(',')}) `}
                            {stu.props.common.separateFrom && stu.props.common.separateFrom.length > 0 && `🚫隣/同G回避(${stu.props.common.separateFrom.join(',')}) `}
                          </span>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="bg-indigo-950 text-white animate-fade-in border-y-2 border-indigo-700 shadow-inner">
                          <td colSpan={6} className="p-4 sm:p-5">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center border-b border-indigo-800 pb-2">
                                <span className="font-black text-sm text-indigo-300">
                                  ⚡ 配慮詳細エディタ: {stu.name} ({stu.id}番)
                                </span>
                                <span className="text-[10px] text-indigo-400 font-medium">※変更は自動で即時反映・双方向保存されます</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-bold">
                                <div className="flex items-center justify-between bg-indigo-900/60 p-2.5 rounded-xl border border-indigo-800 sm:col-span-2 lg:col-span-1">
                                  <span className="shrink-0 mr-2">希望区分:</span>
                                  <div className="flex gap-1.5">
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleUpdateStudentProp(stu, { defaultPref: 1 }); }}
                                      className={`px-2.5 py-1 rounded font-black text-xs transition cursor-pointer ${
                                        stu.defaultPref === 1 ? 'bg-sky-500 text-white shadow' : 'bg-indigo-950 text-indigo-300 hover:bg-indigo-900'
                                      }`}
                                    >
                                      ① 個人・集中(青)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); handleUpdateStudentProp(stu, { defaultPref: 2 }); }}
                                      className={`px-2.5 py-1 rounded font-black text-xs transition cursor-pointer ${
                                        stu.defaultPref === 2 ? 'bg-slate-200 text-slate-800 shadow' : 'bg-indigo-950 text-indigo-300 hover:bg-indigo-900'
                                      }`}
                                    >
                                      ② グループ(白/赤)
                                    </button>
                                  </div>
                                </div>

                                <label className="flex items-center gap-2 bg-indigo-900/60 p-3 rounded-xl border border-indigo-800 cursor-pointer hover:bg-indigo-900">
                                  <input
                                    type="checkbox"
                                    checked={stu.props.common.avoidAC || false}
                                    onChange={(e) => handleUpdateStudentProp(stu, {
                                      props: { ...stu.props, common: { ...stu.props.common, avoidAC: e.target.checked } }
                                    })}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 text-cyan-400 rounded"
                                  />
                                  <span>❄️ エアコン直撃席を回避</span>
                                </label>

                                <div className="flex items-center justify-between bg-indigo-900/60 p-2.5 rounded-xl border border-indigo-800">
                                  <span>📍 固定座席番号(1~120等):</span>
                                  <input
                                    type="number"
                                    min="0"
                                    max="120"
                                    value={stu.props.common.fixedSeatId || ''}
                                    placeholder="なし"
                                    onChange={(e) => {
                                      const val = e.target.value ? Number(e.target.value) : undefined;
                                      handleUpdateStudentProp(stu, {
                                        props: { ...stu.props, common: { ...stu.props.common, fixedSeatId: val } }
                                      });
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-16 px-2 py-1 bg-indigo-950 border border-indigo-700 rounded text-center text-white font-mono font-black outline-none focus:ring-1 focus:ring-indigo-400"
                                  />
                                </div>

                                <div className="flex items-center justify-between bg-indigo-900/60 p-2.5 rounded-xl border border-indigo-800">
                                  <span className="shrink-0 mr-2">🤝 隣接/同グループ(Enterで確定):</span>
                                  <NumberListInput
                                    value={pairsStr}
                                    placeholder="例: 3, 6, 12"
                                    onCommit={(raw) => {
                                      const nums = parseStudentNumberList(raw, stu.id);
                                      handleUpdateStudentProp(stu, {
                                        props: { ...stu.props, common: { ...stu.props.common, customPairs: nums } }
                                      });
                                    }}
                                  />
                                </div>

                                <div className="flex items-center justify-between bg-indigo-900/60 p-2.5 rounded-xl border border-indigo-800">
                                  <span className="shrink-0 mr-2">🚫 隣・同一グループ回避(Enterで確定):</span>
                                  <NumberListInput
                                    value={separateStr}
                                    placeholder="例: 3, 6"
                                    onCommit={(raw) => {
                                      const nums = parseStudentNumberList(raw, stu.id);
                                      handleUpdateStudentProp(stu, {
                                        props: { ...stu.props, common: { ...stu.props.common, separateFrom: nums } }
                                      });
                                    }}
                                  />
                                </div>

                                <label className="flex items-center gap-2 bg-indigo-900/60 p-3 rounded-xl border border-indigo-800 cursor-pointer hover:bg-indigo-900">
                                  <input
                                    type="checkbox"
                                    checked={stu.props.whenType1.preferFrontRow || false}
                                    onChange={(e) => handleUpdateStudentProp(stu, {
                                      props: { ...stu.props, whenType1: { ...stu.props.whenType1, preferFrontRow: e.target.checked } }
                                    })}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 text-cyan-400 rounded"
                                  />
                                  <span>⬆️ ①選択時：前列を希望</span>
                                </label>

                                <label className="flex items-center gap-2 bg-indigo-900/60 p-3 rounded-xl border border-indigo-800 cursor-pointer hover:bg-indigo-900">
                                  <input
                                    type="checkbox"
                                    checked={stu.props.whenType1.preferBackRow || false}
                                    onChange={(e) => handleUpdateStudentProp(stu, {
                                      props: { ...stu.props, whenType1: { ...stu.props.whenType1, preferBackRow: e.target.checked } }
                                    })}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 text-cyan-400 rounded"
                                  />
                                  <span>⬇️ ①選択時：後列を希望</span>
                                </label>

                                <div className="flex items-center justify-between bg-indigo-900/60 p-2.5 rounded-xl border border-indigo-800">
                                  <span className="shrink-0 mr-2">⚧ 本人の性別:</span>
                                  <div className="flex gap-1.5">
                                    {([undefined, 'male', 'female'] as (Gender | undefined)[]).map(g => (
                                      <button
                                        key={g ?? 'none'}
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleSetGender(stu, g); }}
                                        className={`px-2.5 py-1 rounded font-black text-xs transition cursor-pointer ${
                                          stu.gender === g ? 'bg-emerald-500 text-white shadow' : 'bg-indigo-950 text-indigo-300 hover:bg-indigo-900'
                                        }`}
                                      >
                                        {g ? GENDER_LABEL[g] : '未設定'}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between bg-indigo-900/60 p-2.5 rounded-xl border border-indigo-800">
                                  <span className="shrink-0 mr-2">🪟 座席の左右位置:</span>
                                  <div className="flex gap-1.5">
                                    {([undefined, 'window', 'corridor'] as (SeatSide | undefined)[]).map(side => (
                                      <button
                                        key={side ?? 'none'}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateStudentProp(stu, {
                                            props: { ...stu.props, common: { ...stu.props.common, preferSide: side } }
                                          });
                                        }}
                                        className={`px-2.5 py-1 rounded font-black text-xs transition cursor-pointer ${
                                          stu.props.common.preferSide === side ? 'bg-amber-500 text-white shadow' : 'bg-indigo-950 text-indigo-300 hover:bg-indigo-900'
                                        }`}
                                      >
                                        {side ? SEAT_SIDE_LABEL[side] : '指定なし'}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between bg-indigo-900/60 p-2.5 rounded-xl border border-indigo-800 sm:col-span-2 lg:col-span-1">
                                  <span className="shrink-0 mr-2">👥 隣に希望するクラス:</span>
                                  <div className="flex gap-1 flex-wrap justify-end">
                                    {sameGradeClasses(stu).map(cId => {
                                      const selected = adjWish?.classIds?.includes(cId) || false;
                                      return (
                                        <button
                                          key={cId}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const cur = adjWish?.classIds || [];
                                            updateAdjacentWish(stu, {
                                              classIds: selected ? cur.filter(c => c !== cId) : [...cur, cId],
                                            });
                                          }}
                                          className={`px-2 py-1 rounded font-black text-xs transition cursor-pointer ${
                                            selected ? 'bg-violet-500 text-white shadow' : 'bg-indigo-950 text-indigo-300 hover:bg-indigo-900'
                                          }`}
                                        >
                                          {cId}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between bg-indigo-900/60 p-2.5 rounded-xl border border-indigo-800">
                                  <span className="shrink-0 mr-2">👥 隣に希望する性別:</span>
                                  <div className="flex gap-1.5">
                                    {([undefined, 'male', 'female'] as (Gender | undefined)[]).map(g => (
                                      <button
                                        key={g ?? 'none'}
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); updateAdjacentWish(stu, { gender: g }); }}
                                        className={`px-2.5 py-1 rounded font-black text-xs transition cursor-pointer ${
                                          adjWish?.gender === g || (!adjWish?.gender && g === undefined)
                                            ? 'bg-violet-500 text-white shadow'
                                            : 'bg-indigo-950 text-indigo-300 hover:bg-indigo-900'
                                        }`}
                                      >
                                        {g ? GENDER_LABEL[g] : '指定なし'}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : effectiveSubTab === 'gender' ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col xl:flex-row justify-between xl:items-center border-b pb-4 gap-4">
            <div>
              <h3 className="font-extrabold text-lg text-slate-800">{viewLabel} 性別プリセット ({allStudentsList.length}名)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ※「隣に希望する性別」の判定に使います。ボタンで個別に設定するか、学籍順シートの「性別」列（男/女）を一括インポートできます。
              </p>
              <p className="text-xs font-black mt-1.5 flex gap-3">
                <span className="text-blue-700">男 {genderCounts.male}名</span>
                <span className="text-pink-700">女 {genderCounts.female}名</span>
                <span className="text-slate-500">未設定 {genderCounts.unset}名</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-xl text-xs font-black text-amber-900">
                <span className="shrink-0">学年補完:</span>
                {([1, 2, 3] as ScoreGradeYear[]).map(y => (
                  <label
                    key={y}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg cursor-pointer transition ${
                      scoreGradeYear === y ? 'bg-amber-500 text-white shadow-sm' : 'bg-white text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="genderGradeYear"
                      checked={scoreGradeYear === y}
                      onChange={() => setScoreGradeYear(y)}
                      className="sr-only"
                    />
                    <span>{y}年</span>
                  </label>
                ))}
              </div>
              <label className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs cursor-pointer shadow transition shrink-0">
                📂 学籍順Excelから性別をインポート（複数可）
                <input
                  type="file"
                  accept=".xlsx,.xlsm,.xls"
                  multiple
                  onChange={handleGenderFileUpload}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => handleBulkGender('male')}
                className="px-3 py-2 rounded-xl text-xs font-black bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer"
              >
                全員を男に
              </button>
              <button
                type="button"
                onClick={() => handleBulkGender('female')}
                className="px-3 py-2 rounded-xl text-xs font-black bg-pink-100 text-pink-800 hover:bg-pink-200 cursor-pointer"
              >
                全員を女に
              </button>
              <button
                type="button"
                onClick={() => handleBulkGender(undefined)}
                className="px-3 py-2 rounded-xl text-xs font-black bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                全員を未設定に
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2">
            {allStudentsList.map(stu => (
              <div
                key={studentRowKey(stu)}
                className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2"
              >
                <span className="font-mono font-extrabold text-sm text-slate-700">
                  {activeCustom ? `${stu.classId}-${stu.id}` : `${stu.id}番`}
                  <span className="ml-2 font-sans text-[11px] text-slate-500 font-bold">
                    {stu.name.replace(/ \(未登録\)$/, '')}
                  </span>
                </span>
                <div className="flex gap-1">
                  {([undefined, 'male', 'female'] as (Gender | undefined)[]).map(g => (
                    <button
                      key={g ?? 'none'}
                      type="button"
                      onClick={() => handleSetGender(stu, g)}
                      className={`px-2.5 py-1 rounded font-black text-xs transition cursor-pointer ${
                        stu.gender === g
                          ? g === 'male' ? 'bg-blue-500 text-white shadow'
                            : g === 'female' ? 'bg-pink-500 text-white shadow'
                            : 'bg-slate-500 text-white shadow'
                          : 'bg-white text-slate-500 border border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {g ? GENDER_LABEL[g] : '—'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : effectiveSubTab === 'custom' ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-extrabold text-lg text-slate-800">特別クラス（特別割など）の管理</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              複数クラスの生徒から編成した授業用クラスを登録できます。登録すると上の「対象クラス」と「② 条件＆数式設定」で選べます。
              席の関数は 2変数 f(m, n)（m=元クラス番号, n=出席番号）で、全メンバーが単射になるよう自動検証されます。
            </p>
          </div>

          <div className="space-y-3">
            {customClasses.length === 0 && (
              <div className="p-6 text-center text-slate-400 font-bold bg-slate-50 rounded-xl border border-dashed border-slate-300 text-sm">
                特別クラスはまだありません。下のフォームから作成してください。
              </div>
            )}
            {customClasses.map(c => {
              const perClass = getCustomClassClassIds(c).map(cid => `${cid}: ${c.members.filter(m => m.classId === cid).length}名`);
              return (
                <div
                  key={c.id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    selectedCustomClassId === c.id ? 'border-emerald-400 bg-emerald-50/50' : 'border-slate-300 bg-white'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-extrabold text-slate-800">
                      {c.label} <span className="text-xs text-slate-500 font-bold">（{c.members.length}名）</span>
                    </div>
                    <div className="text-xs text-slate-500 font-bold mt-0.5">内訳: {perClass.join(' / ')}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-1 break-all">
                      {c.members.map(memberToFourDigit).join(', ')}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => { onSelectCustomClass(c.id); setSubTab('list'); }}
                      className="px-3 py-2 rounded-xl text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                    >
                      このクラスを選択
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditCustomClass(c)}
                      className="px-3 py-2 rounded-xl text-xs font-black bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      ✏️ 編集
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomClass(c)}
                      className="px-3 py-2 rounded-xl text-xs font-black text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      🗑️ 削除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-300 space-y-3">
            <h4 className="font-extrabold text-sm text-slate-800">
              {editingCustomId ? '✏️ 特別クラスを編集' : '＋ 特別クラスを新規作成'}
            </h4>
            <input
              type="text"
              value={customLabelDraft}
              onChange={(e) => setCustomLabelDraft(e.target.value)}
              placeholder="クラス名（例: 2年 特別割（3グループ））"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold bg-white"
            />
            <textarea
              value={customMembersDraft}
              onChange={(e) => setCustomMembersDraft(e.target.value)}
              rows={4}
              placeholder="メンバーの4桁出席番号をカンマ・空白・改行区切りで入力（例: 2303, 2326, 2402, 2404 ...）"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono bg-white"
            />
            <p className="text-[11px] text-slate-500 font-bold">
              ※4桁=学年+組+出席番号（2403 = 2年4組3番）。「保存」ボタンを押したときに認識されます。
              {customMembersDraft.trim() && ` 現在の入力: ${parseMemberList(customMembersDraft).members.length}名を認識`}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveCustomClass}
                className="px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
              >
                {editingCustomId ? '変更を保存' : '作成'}
              </button>
              {(editingCustomId || customLabelDraft || customMembersDraft) && (
                <button
                  type="button"
                  onClick={resetCustomEditor}
                  className="px-4 py-2 rounded-xl text-xs font-black bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                >
                  キャンセル
                </button>
              )}
            </div>
          </div>
        </div>
      ) : effectiveSubTab === 'layout' ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h3 className="font-extrabold text-lg text-slate-800">{currentClass} デフォルト教室レイアウト設定</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ※❄️エアコン席は<strong className="text-cyan-700">全教室共通</strong>です。無効席のみクラスごとに設定できます。変更は即座に保存されます。
              </p>
            </div>
            <div className="flex gap-4 text-xs font-extrabold">
              <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 bg-white border-2 border-slate-300 inline-block rounded"></span>通常</span>
              <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 bg-cyan-100 border-2 border-cyan-500 inline-block rounded"></span>エアコン席（共通）</span>
              <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 bg-slate-200 border-2 border-slate-400 inline-block rounded"></span>使わない席</span>
            </div>
          </div>

          <div className="p-6 bg-slate-100 rounded-2xl border border-slate-300 max-w-xl mx-auto">
            <div className="text-center font-black text-slate-400 text-xs tracking-widest mb-6 border-b border-dashed border-slate-300 pb-2">
              ――― 黒板 / 教卓側 ―――
            </div>
            <div className="grid grid-cols-6 gap-2.5">
              {Array.from({ length: 42 }, (_, i) => {
                const isAC = sharedAcSeatIndices.includes(i);
                const isDisabled = currentLayout.disabledSeatIndices.includes(i);
                const r = Math.floor(i / 6) + 1;
                const c = (i % 6) + 1;

                let style = 'bg-white border-slate-300 text-slate-700 hover:border-indigo-400 shadow-2xs';
                if (isAC && !isDisabled) style = 'bg-cyan-100 border-cyan-500 text-cyan-950 font-black shadow-inner';
                if (isDisabled) style = 'bg-slate-200 border-slate-400 text-slate-400 opacity-60 line-through';

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleToggleSeatState(i)}
                    className={`h-14 rounded-lg border-2 flex flex-col items-center justify-center text-xs transition cursor-pointer select-none ${style}`}
                  >
                    <span className="text-[9px] font-mono opacity-60">({r},{c})</span>
                    <span>{isDisabled ? '🚫 無効' : isAC ? '❄️ エアコン' : `席 ${i + 1}`}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b pb-4">
            <h3 className="font-extrabold text-lg text-slate-800">{viewLabel} 関連のアーカイブ保存履歴</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeCustom
                ? '※この特別クラスで保存した座席表が表示されます。'
                : '※単一クラス・合同授業にかかわらず、このクラスが含まれている保存データがすべて表示されます。'}
            </p>
          </div>

          {selectedArchive ? (
            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-300 animate-fade-in">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3 flex-wrap gap-2">
                <div>
                  <h4 className="font-black text-base sm:text-lg text-indigo-950">{selectedArchive.title}</h4>
                  <p className="text-xs font-bold text-slate-500">保存日時: {selectedArchive.date} / 対象: {selectedArchive.targetClasses.join(', ')}</p>
                </div>
                <button
                  onClick={() => setSelectedArchive(null)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold px-4 py-2 rounded-xl text-xs shadow transition cursor-pointer"
                >
                  ◀ 履歴一覧に戻る
                </button>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-xl text-center">
                <span className="text-[10px] font-black text-indigo-400 block mb-1">その時に使われた座席関数</span>
                <div className="font-mono text-sm sm:text-base overflow-x-auto">
                  <BlockMath math={selectedArchive.seatingFunctionLatex} />
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 overflow-x-auto">
                <div
                  className="grid gap-2 mx-auto"
                  style={{
                    gridTemplateColumns: `repeat(${selectedArchive.lessonType === 'combined' ? 8 : 6}, minmax(70px, 1fr))`,
                    width: selectedArchive.lessonType === 'combined' ? '700px' : '100%'
                  }}
                >
                  {selectedArchive.seats.map((seat) => (
                    <div
                      key={seat.seatIndex}
                      className={`aspect-square rounded-lg border p-1.5 flex flex-col justify-between text-center select-none ${
                        seat.isInactive ? 'bg-slate-100 border-slate-200 opacity-40' :
                        !seat.studentId ? 'bg-white border-slate-300' :
                        seat.role === 'focus' ? 'bg-sky-100 border-sky-400 text-sky-950 font-black' :
                        seat.role === 'leader' ? 'bg-rose-100 border-rose-400 text-rose-950 font-black' :
                        'bg-white border-slate-300 text-slate-800 font-bold shadow-2xs'
                      }`}
                    >
                      <span className="text-[9px] font-mono opacity-60">({seat.row},{seat.col})</span>
                      <div className="my-auto">
                        {seat.studentId ? (
                          <>
                            {seat.studentClassId && <span className="text-[9px] block opacity-60 font-mono">{seat.studentClassId}</span>}
                            <span className="font-black text-sm">{seat.studentId}番</span>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">{seat.isInactive ? '無効' : '空席'}</span>
                        )}
                      </div>
                      <span className="text-[8px] font-mono opacity-50 truncate">{seat.groupId || ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {relevantArchives.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-bold bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  まだ {viewLabel} 関連の座席表は保存されていません。<br />
                  「③ 座席表エディタ＆結果」画面の「💾 この配置を履歴に保存する」ボタンから保存してください。
                </div>
              ) : (
                relevantArchives.map(arch => (
                  <div
                    key={arch.id}
                    onClick={() => setSelectedArchive(arch)}
                    className="p-4 rounded-xl border border-slate-300 hover:border-indigo-400 bg-white hover:bg-indigo-50/30 transition cursor-pointer flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          arch.lessonType === 'combined' ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                            : arch.lessonType === 'custom' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-300'
                        }`}>
                          {arch.lessonType === 'combined' ? '合同授業' : arch.lessonType === 'custom' ? '特別クラス' : '通常授業'}
                        </span>
                        <span className="font-extrabold text-sm text-slate-800">{arch.title}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-bold">
                        保存日時: {arch.date} / 対象クラス: [ {arch.targetClasses.join(', ')} ] / 欠席者: {countArchiveAbsentees(arch)}名
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
                        👁️ 配置を確認
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`履歴『 ${arch.title} 』を削除してもよろしいですか？`)) {
                            onDeleteArchive(arch.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 font-bold text-xs transition cursor-pointer"
                      >
                        🗑️ 削除
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}