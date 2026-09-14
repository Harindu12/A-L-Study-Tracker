import React, { useState, useRef, useEffect } from 'react';
import { Lesson, LessonPart } from '../../types';
import { useStore } from '../../store';
import { 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  CheckCircle2, 
  Check,
  Circle,
  Plus, 
  Video, 
  Sparkles,
  ListPlus,
  X,
  Pencil,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { todayStr } from '../../utils';

interface LessonCardItemProps {
  lesson: Lesson;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const LessonCardItem: React.FC<LessonCardItemProps> = ({
  lesson,
  isExpanded,
  onToggleExpand,
}) => {
  const { updateLesson, updateLessonParts, deleteLesson, markLessonDone } = useStore();

  const [newPartName, setNewPartName] = useState('');
  const [editingPartNames, setEditingPartNames] = useState<Record<string, string>>({});
  
  // Modals & Action Sheet state
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showEditTitleModal, setShowEditTitleModal] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(lesson.name);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // Sync edit title value if lesson name changes
  useEffect(() => {
    setEditTitleValue(lesson.name);
  }, [lesson.name]);

  // Long-press handling (500ms threshold)
  const timerRef = useRef<number | null>(null);
  const isLongPressTriggered = useRef(false);
  const touchStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    isLongPressTriggered.current = false;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      isLongPressTriggered.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(40);
        } catch (_) {}
      }
      setShowActionMenu(true);
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (timerRef.current === null) return;
    const dx = e.touches[0].clientX - touchStartPos.current.x;
    const dy = e.touches[0].clientY - touchStartPos.current.y;
    if (Math.hypot(dx, dy) > 10) {
      clearTimer();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    clearTimer();
    if (isLongPressTriggered.current) {
      if (e.cancelable) e.preventDefault();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    mouseStartPos.current = { x: e.clientX, y: e.clientY };
    isLongPressTriggered.current = false;
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      isLongPressTriggered.current = true;
      setShowActionMenu(true);
    }, 500);
  };

  const handleMouseUp = () => {
    clearTimer();
  };

  const handleMouseLeave = () => {
    clearTimer();
  };

  const handleCardClick = () => {
    if (isLongPressTriggered.current) {
      isLongPressTriggered.current = false;
      return;
    }
    onToggleExpand();
  };

  // Bulk add parts state
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [bulkFrom, setBulkFrom] = useState('1');
  const [bulkTo, setBulkTo] = useState('12');
  const [bulkPattern, setBulkPattern] = useState('Day {n}');

  const parts = lesson.parts || [];
  const watchedPartsCount = parts.filter((p) => p.watched).length;
  const completedPartsCount = parts.filter((p) => p.watched && p.pastPaper).length;
  const allPartsComplete = parts.length > 0 && completedPartsCount === parts.length;
  const isFullyComplete = lesson.done || (parts.length > 0 && watchedPartsCount === parts.length);

  // Toggle done state directly
  const handleToggleDone = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!lesson.done) {
      markLessonDone(lesson.id, lesson.confidence || 'M', todayStr());
    } else {
      updateLesson(lesson.id, { done: false, completedDate: null });
    }
  };

  // Edit Title Submission
  const handleSaveTitle = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editTitleValue.trim();
    if (trimmed) {
      updateLesson(lesson.id, { name: trimmed });
      setShowEditTitleModal(false);
    }
  };

  // Delete Lesson Confirmation
  const handleConfirmDelete = () => {
    deleteLesson(lesson.id);
    setShowDeleteConfirmModal(false);
  };

  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const finalName = newPartName.trim() || `Part ${parts.length + 1}`;
    const newPart: LessonPart = {
      id: Math.random().toString(36).slice(2, 10),
      name: finalName,
      watched: false,
      pastPaper: false,
    };
    updateLessonParts(lesson.id, [...parts, newPart]);
    setNewPartName('');
  };

  // Helper formatting for part numbers and patterns
  const formatPartNumber = (n: number, min: number, max: number): string => {
    const hasUnder10 = min < 10;
    const has10OrMore = max >= 10;
    const shouldZeroPad = hasUnder10 && has10OrMore;
    return shouldZeroPad && n < 10 ? `0${n}` : `${n}`;
  };

  const formatPartName = (pattern: string, numStr: string): string => {
    if (pattern.includes('{n}')) {
      return pattern.replace(/\{n\}/g, numStr);
    }
    const trimmed = pattern.trim();
    if (trimmed) {
      return `${trimmed} ${numStr}`;
    }
    return `Part ${numStr}`;
  };

  // Bulk add computation
  const fromNum = parseInt(bulkFrom, 10);
  const toNum = parseInt(bulkTo, 10);
  const isValidRange = !isNaN(fromNum) && !isNaN(toNum) && fromNum >= 1 && toNum >= 1;
  const startNum = isValidRange ? Math.min(fromNum, toNum) : 0;
  const endNum = isValidRange ? Math.max(fromNum, toNum) : 0;
  const bulkCount = isValidRange ? endNum - startNum + 1 : 0;

  // Generate preview text
  let previewText = 'No preview';
  if (isValidRange && bulkCount > 0) {
    const p1 = formatPartName(bulkPattern || 'Day {n}', formatPartNumber(startNum, startNum, endNum));
    if (bulkCount === 1) {
      previewText = p1;
    } else if (bulkCount === 2) {
      const p2 = formatPartName(bulkPattern || 'Day {n}', formatPartNumber(endNum, startNum, endNum));
      previewText = `${p1}, ${p2}`;
    } else {
      const p2 = formatPartName(bulkPattern || 'Day {n}', formatPartNumber(startNum + 1, startNum, endNum));
      const pEnd = formatPartName(bulkPattern || 'Day {n}', formatPartNumber(endNum, startNum, endNum));
      previewText = `${p1}, ${p2}, … ${pEnd}`;
    }
  }

  const handleBulkGenerate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isValidRange || bulkCount <= 0) return;

    const pattern = bulkPattern.trim() || 'Day {n}';
    const newGeneratedParts: LessonPart[] = [];
    for (let i = startNum; i <= endNum; i++) {
      const numStr = formatPartNumber(i, startNum, endNum);
      newGeneratedParts.push({
        id: Math.random().toString(36).slice(2, 10),
        name: formatPartName(pattern, numStr),
        watched: false,
        pastPaper: false,
      });
    }

    updateLessonParts(lesson.id, [...parts, ...newGeneratedParts]);
    setShowBulkAdd(false);
  };

  const handleToggleWatched = (partId: string, watched: boolean) => {
    const updated = parts.map((p) => (p.id === partId ? { ...p, watched } : p));
    updateLessonParts(lesson.id, updated);
  };

  const handleTogglePastPaper = (partId: string, pastPaper: boolean) => {
    const updated = parts.map((p) => (p.id === partId ? { ...p, pastPaper } : p));
    updateLessonParts(lesson.id, updated);
  };

  const handleDeletePart = (partId: string) => {
    const updated = parts.filter((p) => p.id !== partId);
    updateLessonParts(lesson.id, updated);
  };

  const handleBlurPartName = (partId: string, fallbackName: string) => {
    const updatedName = editingPartNames[partId];
    if (updatedName !== undefined) {
      const trimmed = updatedName.trim() || fallbackName;
      const updated = parts.map((p) => (p.id === partId ? { ...p, name: trimmed } : p));
      updateLessonParts(lesson.id, updated);
      setEditingPartNames((prev) => {
        const next = { ...prev };
        delete next[partId];
        return next;
      });
    }
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={`paper-card rounded-2xl sm:rounded-3xl border transition-all cursor-pointer select-none overflow-hidden ${
          isFullyComplete
            ? 'border-[#D2DEC8] bg-[#FAF7F0] shadow-[0_2px_8px_rgba(91,130,102,0.06)] hover:bg-[#FFFDF9]'
            : 'border-[var(--line)] bg-[#FAF7F0] shadow-[0_2px_8px_rgba(120,100,70,0.06)] hover:bg-[#FFFDF9]'
        }`}
      >
        {/* Collapsed Card Main Row */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-3.5 sm:gap-4">
          {/* Left Square Badge */}
          <div
            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
              isFullyComplete
                ? 'bg-[#5B8266] text-white shadow-xs'
                : 'bg-[#EAE6DC] text-[var(--ink)] border border-[var(--line)]/50'
            }`}
          >
            {isFullyComplete ? (
              <Check size={20} strokeWidth={2.8} />
            ) : (
              <span className="font-sans font-bold text-base sm:text-lg">
                {watchedPartsCount}
              </span>
            )}
          </div>

          {/* Title & Parts Count */}
          <div className="flex-1 min-w-0">
            <h3 className="font-sans font-bold text-base sm:text-lg text-[var(--ink)] truncate leading-snug">
              {lesson.name}
            </h3>
            <p className="text-xs sm:text-sm font-sans text-[var(--ink-soft)] font-medium mt-0.5">
              {watchedPartsCount} / {parts.length} parts
            </p>
          </div>

          {/* Chevron to expand/collapse */}
          <div className="flex-shrink-0 text-[var(--ink-soft)] pl-1">
            {isExpanded ? (
              <ChevronUp size={20} strokeWidth={2.2} className="text-[var(--accent)]" />
            ) : (
              <ChevronDown size={20} strokeWidth={2.2} />
            )}
          </div>
        </div>

        {/* Expanded Checklist of Video / Parts */}
        {isExpanded && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--paper)] bg-[radial-gradient(var(--dot)_1.5px,transparent_1.5px)] [background-size:24px_24px] border-t border-[var(--line)] p-3 sm:p-4 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {/* Shrunk, Clean Section Header matching app section labels */}
            <div className="flex items-center justify-between mb-2 px-0.5">
              <span className="text-[10px] sm:text-[11px] font-sans font-bold uppercase tracking-wider text-[var(--ink-soft)] flex items-center gap-1.5">
                <Video size={12} className="text-[var(--accent)]" />
                <span>Video & Topic Parts Checklist ({parts.length})</span>
              </span>

              {allPartsComplete && parts.length > 0 && (
                <span className="text-[10px] font-sans font-bold text-[#2F5238] flex items-center gap-1 bg-[#E8F1EA] border border-[#9DBCA4]/60 px-2 py-0.5 rounded-full">
                  <Sparkles size={10} className="text-[#5B8266]" />
                  <span>All Parts Complete</span>
                </span>
              )}
            </div>

            {/* Compact Parts List */}
            {parts.length === 0 ? (
              <div className="p-3 text-center rounded-xl border border-dashed border-[var(--line)] text-xs font-sans text-[var(--ink-soft)] mb-2.5 bg-[#FAF7F0] paper-card">
                No parts added yet. Add individual videos or sub-topics below to track your progress.
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 mb-2.5">
                {parts.map((part, index) => {
                  const isPartComplete = part.watched && part.pastPaper;
                  const displayName =
                    editingPartNames[part.id] !== undefined
                      ? editingPartNames[part.id]
                      : part.name;

                  return (
                    <div
                      key={part.id}
                      className={`paper-card rounded-xl border px-2.5 py-1.5 sm:px-3 sm:py-1.5 flex items-center justify-between gap-2 transition-all shadow-2xs ${
                        isPartComplete
                          ? 'border-[#9DBCA4]/70 bg-[#F4F8F2]'
                          : 'border-[var(--line)] bg-[#FAF7F0] hover:bg-[#FFFDF9] hover:border-[var(--accent-line)]/70'
                      }`}
                    >
                      {/* Part Number & Name on One Line */}
                      <div className="flex-1 min-w-[100px] flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-md bg-[#EAE6DC]/80 border border-[var(--line)]/60 text-[var(--ink-soft)] font-mono font-bold text-[10px] flex items-center justify-center flex-shrink-0 select-none">
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) =>
                            setEditingPartNames((prev) => ({
                              ...prev,
                              [part.id]: e.target.value,
                            }))
                          }
                          onBlur={() => handleBlurPartName(part.id, part.name)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          placeholder={`Part ${index + 1}`}
                          className={`w-full font-sans text-xs px-1.5 py-0.5 rounded border border-transparent hover:border-[var(--line)] focus:border-[var(--accent)] focus:bg-[#FFFDF9] focus:ring-1 focus:ring-[var(--accent-soft)] transition-all truncate ${
                            isPartComplete
                              ? 'font-semibold text-[#2F5238]'
                              : 'font-medium text-[var(--ink)]'
                          }`}
                        />
                      </div>

                      {/* Small Inline Checkboxes (Watched, Past paper done) + Delete */}
                      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <label className="inline-flex items-center gap-1.5 text-xs font-sans text-[var(--ink)] cursor-pointer select-none py-0.5 px-1 rounded hover:bg-black/5 transition-colors">
                          <input
                            type="checkbox"
                            checked={part.watched}
                            onChange={(e) => handleToggleWatched(part.id, e.target.checked)}
                            className="cursor-pointer"
                          />
                          <span className={`text-[11px] font-sans ${part.watched ? 'font-semibold text-[#2F5238]' : 'text-[var(--ink-soft)]'}`}>
                            Watched
                          </span>
                        </label>

                        <label className="inline-flex items-center gap-1.5 text-xs font-sans text-[var(--ink)] cursor-pointer select-none py-0.5 px-1 rounded hover:bg-black/5 transition-colors">
                          <input
                            type="checkbox"
                            checked={part.pastPaper}
                            onChange={(e) => handleTogglePastPaper(part.id, e.target.checked)}
                            className="cursor-pointer"
                          />
                          <span className={`text-[11px] font-sans ${part.pastPaper ? 'font-semibold text-[#2F5238]' : 'text-[var(--ink-soft)]'}`}>
                            Past paper done
                          </span>
                        </label>

                        <button
                          type="button"
                          onClick={() => handleDeletePart(part.id)}
                          title="Delete part"
                          className="p-1 text-[var(--ink-soft)] hover:text-[#A64B2A] rounded hover:bg-black/5 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Part Section: Compact single input + Add multiple toggle */}
            <div className="flex flex-col gap-2 pt-0.5">
              <div className="flex flex-wrap sm:flex-nowrap gap-1.5 items-center">
                {/* Single Add Part input */}
                <form onSubmit={handleAddPart} className="flex-1 flex gap-1.5 items-center min-w-[180px]">
                  <input
                    type="text"
                    value={newPartName}
                    onChange={(e) => setNewPartName(e.target.value)}
                    placeholder={`Add single part (e.g. Part ${parts.length + 1})...`}
                    className="flex-1 font-sans text-xs px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[#FFFDF9] hover:border-[var(--accent-line)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] shadow-2xs text-[var(--ink)] transition-all placeholder:text-[var(--ink-soft)]/60"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-full bg-[var(--accent)] text-white hover:bg-[#684c80] text-xs font-sans font-semibold shadow-xs flex items-center gap-1 cursor-pointer active:scale-95 transition-all whitespace-nowrap"
                  >
                    <Plus size={13} strokeWidth={2.4} />
                    <span>Add Part</span>
                  </button>
                </form>

                {/* Add multiple toggle button */}
                <button
                  type="button"
                  onClick={() => setShowBulkAdd((prev) => !prev)}
                  className={`px-3 py-1.5 text-xs font-sans font-semibold rounded-full border transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer active:scale-95 ${
                    showBulkAdd
                      ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs'
                      : 'bg-[#FFFDF9] text-[var(--accent)] border border-[var(--accent-line)] hover:bg-[var(--accent-soft)] shadow-2xs'
                  }`}
                  title="Generate multiple numbered parts at once"
                >
                  <ListPlus size={13} />
                  <span>{showBulkAdd ? 'Hide multiple' : 'Add multiple'}</span>
                </button>
              </div>

              {/* Bulk Add Generator Form Panel */}
              {showBulkAdd && (
                <div className="p-3 bg-[#FAF7F0] paper-card rounded-xl border border-[var(--accent-line)]/50 flex flex-col gap-2.5 shadow-xs animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-sans font-bold text-[var(--accent)] flex items-center gap-1.5 uppercase tracking-wider">
                      <ListPlus size={13} />
                      <span>Bulk Generate Parts</span>
                    </span>
                    <span className="text-[10px] font-sans text-[var(--ink-soft)] font-medium">
                      {isValidRange && bulkCount > 0
                        ? `${bulkCount} ${bulkCount === 1 ? 'part' : 'parts'} will be created`
                        : 'Please specify a valid range'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-sans font-bold text-[var(--ink)] mb-0.5">
                        From
                      </label>
                      <input
                        type="number"
                        value={bulkFrom}
                        onChange={(e) => setBulkFrom(e.target.value)}
                        min="1"
                        placeholder="1"
                        className="w-full font-sans text-xs px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[#FFFDF9] hover:border-[var(--accent-line)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-sans font-bold text-[var(--ink)] mb-0.5">
                        To
                      </label>
                      <input
                        type="number"
                        value={bulkTo}
                        onChange={(e) => setBulkTo(e.target.value)}
                        min="1"
                        placeholder="12"
                        className="w-full font-sans text-xs px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[#FFFDF9] hover:border-[var(--accent-line)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-sans font-bold text-[var(--ink)] mb-0.5">
                        Pattern <span className="font-normal text-[9px] text-[var(--ink-soft)]">({'{n}'} = number)</span>
                      </label>
                      <input
                        type="text"
                        value={bulkPattern}
                        onChange={(e) => setBulkPattern(e.target.value)}
                        placeholder="Day {n}"
                        className="w-full font-sans text-xs px-2.5 py-1.5 rounded-lg border border-[var(--line)] bg-[#FFFDF9] hover:border-[var(--accent-line)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* Live Preview + Generate Button Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-[var(--line)]/60">
                    <div className="text-[10px] font-sans text-[var(--ink)] flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-[var(--ink-soft)] flex-shrink-0">Preview:</span>
                      <span className="font-medium bg-[#FFFDF9] px-2 py-0.5 rounded border border-[var(--line)] text-[var(--accent)] truncate">
                        {previewText}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
                      <button
                        type="button"
                        onClick={() => setShowBulkAdd(false)}
                        className="text-[11px] font-sans font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] px-2 py-1 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkGenerate}
                        disabled={!isValidRange || bulkCount <= 0}
                        className="px-3.5 py-1.5 rounded-full bg-[var(--accent)] text-white hover:bg-[#684c80] text-xs font-sans font-semibold shadow-xs flex items-center gap-1 disabled:opacity-50 cursor-pointer active:scale-95 transition-all"
                      >
                        <Sparkles size={12} />
                        <span>Generate {bulkCount > 0 ? `${bulkCount} Parts` : ''}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Long-Press Action Sheet Modal (same design language as Subject card menu) */}
      {showActionMenu && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation();
            setShowActionMenu(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl sm:rounded-2xl p-5 border border-[var(--line)] shadow-[0_16px_40px_rgba(120,100,70,0.2)] paper-card bg-[#FAF7F0] animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-3 mb-3 border-b border-[var(--line)]">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-xs flex-shrink-0">
                  <BookOpen size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-sans text-base font-bold text-[var(--ink)] truncate m-0">
                    {lesson.name}
                  </h3>
                  <p className="text-[0.7rem] font-sans text-[var(--ink-soft)] m-0">
                    Lesson options
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowActionMenu(false)}
                className="p-1.5 text-[var(--ink-soft)] hover:text-[var(--ink)] rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Three Options */}
            <div className="flex flex-col gap-2 my-2">
              {/* Option 1: Edit Title */}
              <button
                type="button"
                onClick={() => {
                  setEditTitleValue(lesson.name);
                  setShowActionMenu(false);
                  setShowEditTitleModal(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--line)] bg-[#FFFDF9] hover:bg-[#FAF7F0] hover:border-[var(--accent)] text-left transition-colors group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--accent)] group-hover:text-white transition-colors">
                  <Pencil size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans font-bold text-sm text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                    Edit Title
                  </div>
                  <div className="text-xs font-sans text-[var(--ink-soft)]">
                    Rename this lesson
                  </div>
                </div>
              </button>

              {/* Option 2: Mark Done / Mark Incomplete */}
              <button
                type="button"
                onClick={() => {
                  setShowActionMenu(false);
                  handleToggleDone();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--line)] bg-[#FFFDF9] hover:bg-[#FAF7F0] hover:border-[var(--accent)] text-left transition-colors group cursor-pointer"
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                    lesson.done
                      ? 'bg-[var(--accent)]/10 text-[var(--accent)] group-hover:bg-[var(--accent)] group-hover:text-white'
                      : 'bg-[#5B8266]/15 text-[#5B8266] group-hover:bg-[#5B8266] group-hover:text-white'
                  }`}
                >
                  {lesson.done ? <Circle size={18} /> : <CheckCircle2 size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans font-bold text-sm text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                    {lesson.done ? 'Mark Incomplete' : 'Mark Done'}
                  </div>
                  <div className="text-xs font-sans text-[var(--ink-soft)]">
                    {lesson.done ? 'Reset completion status' : 'Complete lesson & trigger confidence and reminders'}
                  </div>
                </div>
              </button>

              {/* Option 3: Delete Lesson */}
              <button
                type="button"
                onClick={() => {
                  setShowActionMenu(false);
                  setShowDeleteConfirmModal(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-200/80 bg-[#FFFDF9] hover:bg-red-50/50 hover:border-red-300 text-left transition-colors group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <Trash2 size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans font-bold text-sm text-red-700 group-hover:text-red-800 transition-colors">
                    Delete Lesson
                  </div>
                  <div className="text-xs font-sans text-red-600/80">
                    Remove lesson and all its parts
                  </div>
                </div>
              </button>
            </div>

            {/* Cancel Button */}
            <div className="mt-3 pt-2 border-t border-[var(--line)]">
              <button
                type="button"
                onClick={() => setShowActionMenu(false)}
                className="w-full py-2 text-center text-xs font-sans font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Title Modal */}
      {showEditTitleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation();
            setShowEditTitleModal(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 border border-[var(--line)] shadow-[0_12px_36px_rgba(120,100,70,0.18)] paper-card bg-[#FAF7F0] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Pencil size={20} className="text-[var(--accent)]" />
                <h3 className="font-caveat text-2xl font-bold text-[var(--accent)] m-0">Edit Lesson Title</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditTitleModal(false)}
                className="p-1 text-[var(--ink-soft)] hover:text-[var(--ink)] rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTitle} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-sans font-bold text-[var(--ink)] mb-1">
                  Lesson Name
                </label>
                <input
                  type="text"
                  value={editTitleValue}
                  onChange={(e) => setEditTitleValue(e.target.value)}
                  className="w-full font-sans text-sm p-2.5 rounded-xl border border-[var(--line)] bg-[#FFFDF9] hover:border-[var(--accent-line)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] text-[var(--ink)] shadow-xs transition-all"
                  placeholder="e.g. Chemical Bonding"
                  autoFocus
                  required
                />
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowEditTitleModal(false)}
                  className="btn ghost !py-2 !px-3 !text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editTitleValue.trim()}
                  className="btn !py-2 !px-4 !text-xs disabled:opacity-50 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Lesson Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirmModal(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-5 border border-red-200 shadow-[0_12px_36px_rgba(120,100,70,0.18)] paper-card bg-[#FAF7F0] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-full bg-red-100 text-red-600 mt-0.5 flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-sans text-base font-bold text-[var(--ink)] m-0">
                  Delete Lesson?
                </h3>
                <p className="text-xs font-sans text-[var(--ink-soft)] mt-1.5 leading-relaxed">
                  Delete <strong className="text-[var(--ink)] font-semibold">{lesson.name}</strong> and all its parts? This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="btn ghost !py-1.5 !px-3 !text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="bg-[#C2410C] hover:bg-[#9A3412] text-white font-sans font-bold text-xs py-1.5 px-4 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Delete Lesson
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
