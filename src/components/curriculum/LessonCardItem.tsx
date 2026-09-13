import React, { useState, useRef } from 'react';
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
  Layers,
  Sparkles,
  ListPlus,
  X
} from 'lucide-react';
import { todayStr } from '../../utils';
import { useNavigation } from '../../navigation';

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
  const { activeOverlay, openOverlay, closeOverlay, isPopping } = useNavigation();

  const [lessonName, setLessonName] = useState(lesson.name);
  const [newPartName, setNewPartName] = useState('');
  const [editingPartNames, setEditingPartNames] = useState<Record<string, string>>({});
  const [showActionMenu, setShowActionMenu] = useState(false);

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

  // Sync lesson name if prop changes outside
  React.useEffect(() => {
    setLessonName(lesson.name);
  }, [lesson.name]);

  const parts = lesson.parts || [];
  const watchedPartsCount = parts.filter((p) => p.watched).length;
  const completedPartsCount = parts.filter((p) => p.watched && p.pastPaper).length;
  const allPartsComplete = parts.length > 0 && completedPartsCount === parts.length;
  const isFullyComplete = lesson.done || (parts.length > 0 && watchedPartsCount === parts.length);

  const handleToggleDone = (e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    if (!lesson.done) {
      markLessonDone(lesson.id, lesson.confidence || 'M', todayStr());
    } else {
      updateLesson(lesson.id, { done: false, completedDate: null });
    }
  };

  const handleBlurLessonName = () => {
    if (isPopping) return;
    const trimmed = lessonName.trim();
    if (trimmed && trimmed !== lesson.name) {
      updateLesson(lesson.id, { name: trimmed });
    } else {
      setLessonName(lesson.name);
    }
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
    // Zero-pad to two digits if range includes numbers under 10 alongside numbers 10+
    // (e.g. "Day 01" not "Day 1", so they sort/display consistently)
    // but don't zero-pad if every number in the range is a single digit
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
        {/* Collapsed Card Main Row (Matches Reference Structure) */}
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
            className="bg-[#FFFDF9] border-t border-[var(--line)] p-4 sm:p-5 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {/* Expanded Lesson Controls Bar: Rename, Mark Done & Delete */}
            <div className="flex flex-col gap-3 pb-3.5 mb-3.5 border-b border-[var(--line)]">
              {/* Rename Lesson input */}
              <div>
                <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-[var(--ink-soft)] mb-1">
                  Lesson Title (Click to edit)
                </label>
                <input
                  type="text"
                  value={lessonName}
                  onChange={(e) => setLessonName(e.target.value)}
                  onBlur={handleBlurLessonName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                  className="w-full font-sans font-semibold text-sm px-3 py-1.5 rounded-xl border border-[var(--line)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-line)] text-[var(--ink)]"
                />
              </div>

              {/* Actions Row: Mark Completed / Pending + Delete Lesson */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleToggleDone}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-sans font-bold transition-all cursor-pointer border ${
                    lesson.done
                      ? 'bg-[#5B8266]/15 text-[#2F5238] border-[#5B8266]/30 hover:bg-[#5B8266]/25'
                      : 'bg-white text-[var(--ink-soft)] hover:text-[var(--ink)] border-[var(--line)] hover:bg-black/5'
                  }`}
                  title={lesson.done ? 'Mark lesson pending' : 'Mark entire lesson done'}
                >
                  {lesson.done ? (
                    <CheckCircle2 size={15} className="text-[#5B8266]" />
                  ) : (
                    <Circle size={15} />
                  )}
                  <span>{lesson.done ? 'Marked Completed' : 'Mark Lesson Done'}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteLesson(lesson.id);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-sans font-semibold text-red-600 hover:bg-red-50 border border-red-200/80 transition-colors ml-auto cursor-pointer"
                  title="Delete this lesson"
                >
                  <Trash2 size={13} />
                  <span>Delete Lesson</span>
                </button>
              </div>

              {/* Confidence Rating row (when done) */}
              {lesson.done && (
                <div className="pt-2 border-t border-[var(--line)]/60 flex items-center justify-between">
                  <span className="text-[0.7rem] font-sans font-bold uppercase tracking-wider text-[var(--ink-soft)]">
                    Confidence Rating:
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateLesson(lesson.id, { confidence: 'L' })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
                        lesson.confidence === 'L'
                          ? 'bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B] shadow-xs'
                          : 'bg-white/70 text-[var(--ink-soft)] border border-[var(--line)] hover:bg-white'
                      }`}
                    >
                      Low
                    </button>
                    <button
                      type="button"
                      onClick={() => updateLesson(lesson.id, { confidence: 'M' })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
                        lesson.confidence === 'M'
                          ? 'bg-[#EFE8F5] text-[#5C3D77] border border-[#7A5C94] shadow-xs'
                          : 'bg-white/70 text-[var(--ink-soft)] border border-[var(--line)] hover:bg-white'
                      }`}
                    >
                      Medium
                    </button>
                    <button
                      type="button"
                      onClick={() => updateLesson(lesson.id, { confidence: 'H' })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-sans font-bold transition-all cursor-pointer ${
                        lesson.confidence === 'H'
                          ? 'bg-[#E4ECE0] text-[#2F5238] border border-[#5B8266] shadow-xs'
                          : 'bg-white/70 text-[var(--ink-soft)] border border-[var(--line)] hover:bg-white'
                      }`}
                    >
                      High
                    </button>
                  </div>
                </div>
              )}
            </div>
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[0.7rem] font-sans font-bold uppercase tracking-wider text-[var(--ink-soft)] flex items-center gap-1.5">
              <Video size={13} className="text-[var(--accent)]" />
              <span>Video & Topic Parts Checklist ({parts.length})</span>
            </span>

            {allPartsComplete && (
              <span className="text-[0.7rem] font-sans font-bold text-[#5B8266] flex items-center gap-1 bg-[#5B8266]/10 px-2 py-0.5 rounded-full">
                <Sparkles size={11} />
                <span>All Parts Complete</span>
              </span>
            )}
          </div>

          {/* Parts List */}
          {parts.length === 0 ? (
            <div className="p-3 text-center rounded-xl border border-dashed border-[var(--line)] text-xs font-sans text-[var(--ink-soft)] mb-3 bg-[#FAF7F0]/60">
              No parts added yet. Add individual videos or sub-topics below to track your progress.
            </div>
          ) : (
            <div className="flex flex-col gap-2 mb-3">
              {parts.map((part, index) => {
                const isPartComplete = part.watched && part.pastPaper;
                const displayName =
                  editingPartNames[part.id] !== undefined
                    ? editingPartNames[part.id]
                    : part.name;

                return (
                  <div
                    key={part.id}
                    className={`rounded-xl border p-2.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 transition-all ${
                      isPartComplete
                        ? 'border-[#5B8266]/30 bg-[#F4F8F2]'
                        : 'border-[var(--line)] bg-[#FAF7F0] hover:bg-[#FAF7F0]/90'
                    }`}
                  >
                    {/* Part Name (Editable) */}
                    <div className="flex-1 min-w-[140px] flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-[var(--ink-soft)] select-none">
                        {index + 1}.
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
                        className={`w-full font-sans text-xs px-2 py-1 rounded-lg border border-transparent hover:border-[var(--line)] focus:border-[var(--accent)] focus:bg-white transition-colors ${
                          isPartComplete
                            ? 'font-semibold text-[#2F5238]'
                            : 'font-medium text-[var(--ink)]'
                        }`}
                      />
                    </div>

                    {/* Checkboxes: Watched & Past Paper Done */}
                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                      {/* Watched Checkbox */}
                      <label className="inline-flex items-center gap-1.5 text-xs font-sans font-medium text-[var(--ink)] cursor-pointer select-none py-1 px-1.5 rounded-lg hover:bg-black/5 transition-colors">
                        <input
                          type="checkbox"
                          checked={part.watched}
                          onChange={(e) => handleToggleWatched(part.id, e.target.checked)}
                          className="cursor-pointer w-3.5 h-3.5 rounded accent-[var(--accent)]"
                        />
                        <span className={part.watched ? 'font-semibold text-[var(--accent)]' : 'text-[var(--ink-soft)]'}>
                          Watched
                        </span>
                      </label>

                      {/* Past Paper Done Checkbox */}
                      <label className="inline-flex items-center gap-1.5 text-xs font-sans font-medium text-[var(--ink)] cursor-pointer select-none py-1 px-1.5 rounded-lg hover:bg-black/5 transition-colors">
                        <input
                          type="checkbox"
                          checked={part.pastPaper}
                          onChange={(e) => handleTogglePastPaper(part.id, e.target.checked)}
                          className="cursor-pointer w-3.5 h-3.5 rounded accent-[#5B8266]"
                        />
                        <span className={part.pastPaper ? 'font-semibold text-[#4A6B53]' : 'text-[var(--ink-soft)]'}>
                          Past paper done
                        </span>
                      </label>

                      {/* Delete Part Button */}
                      <button
                        type="button"
                        onClick={() => handleDeletePart(part.id)}
                        title="Delete part"
                        className="p-1 text-[var(--ink-soft)] hover:text-red-600 rounded-lg hover:bg-black/5 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add Part Section: Single input + Add multiple toggle */}
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
              {/* Existing single Add Part input */}
              <form onSubmit={handleAddPart} className="flex-1 flex gap-2 items-center min-w-[200px]">
                <input
                  type="text"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  placeholder={`Add single part (e.g. Part ${parts.length + 1})...`}
                  className="flex-1 font-sans text-xs p-2 rounded-xl border border-[var(--line)] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[var(--accent-line)]"
                />
                <button
                  type="submit"
                  className="btn !py-2 !px-3.5 !text-xs whitespace-nowrap flex items-center gap-1"
                >
                  <Plus size={14} />
                  <span>Add Part</span>
                </button>
              </form>

              {/* Add multiple toggle button */}
              <button
                type="button"
                onClick={() => setShowBulkAdd((prev) => !prev)}
                className={`px-3 py-2 text-xs font-sans font-semibold rounded-xl border transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  showBulkAdd
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-xs'
                    : 'bg-[#FAF7F0] text-[var(--accent)] border-[var(--accent)]/30 hover:bg-[#7A5C94]/10'
                }`}
                title="Generate multiple numbered parts at once"
              >
                <ListPlus size={14} />
                <span>{showBulkAdd ? 'Hide multiple' : 'Add multiple'}</span>
              </button>
            </div>

            {/* Bulk Add Generator Form Panel */}
            {showBulkAdd && (
              <div className="p-3.5 bg-[#FAF7F0] rounded-2xl border border-[var(--accent)]/25 flex flex-col gap-3 shadow-[0_2px_8px_rgba(122,92,148,0.06)] animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-sans font-bold text-[var(--accent)] flex items-center gap-1.5 uppercase tracking-wider">
                    <ListPlus size={14} />
                    <span>Bulk Generate Parts</span>
                  </span>
                  <span className="text-[11px] font-sans text-[var(--ink-soft)] font-medium">
                    {isValidRange && bulkCount > 0
                      ? `${bulkCount} ${bulkCount === 1 ? 'part' : 'parts'} will be created`
                      : 'Please specify a valid range'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-sans font-bold text-[var(--ink)] mb-1">
                      From
                    </label>
                    <input
                      type="number"
                      value={bulkFrom}
                      onChange={(e) => setBulkFrom(e.target.value)}
                      min="1"
                      placeholder="1"
                      className="w-full font-sans text-xs p-2 rounded-xl border border-[var(--line)] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[var(--accent-line)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans font-bold text-[var(--ink)] mb-1">
                      To
                    </label>
                    <input
                      type="number"
                      value={bulkTo}
                      onChange={(e) => setBulkTo(e.target.value)}
                      min="1"
                      placeholder="12"
                      className="w-full font-sans text-xs p-2 rounded-xl border border-[var(--line)] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[var(--accent-line)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-sans font-bold text-[var(--ink)] mb-1">
                      Pattern <span className="font-normal text-[10px] text-[var(--ink-soft)]">({'{n}'} = number)</span>
                    </label>
                    <input
                      type="text"
                      value={bulkPattern}
                      onChange={(e) => setBulkPattern(e.target.value)}
                      placeholder="Day {n}"
                      className="w-full font-sans text-xs p-2 rounded-xl border border-[var(--line)] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[var(--accent-line)]"
                    />
                  </div>
                </div>

                {/* Live Preview + Generate Button Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--line)]/60">
                  <div className="text-[11px] font-sans text-[var(--ink)] flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-[var(--ink-soft)] flex-shrink-0">Preview:</span>
                    <span className="font-medium bg-white px-2 py-0.5 rounded-lg border border-[var(--line)] text-[var(--accent)] truncate">
                      {previewText}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                    <button
                      type="button"
                      onClick={() => setShowBulkAdd(false)}
                      className="text-xs font-sans font-medium text-[var(--ink-soft)] hover:text-[var(--ink)] px-2.5 py-1.5 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleBulkGenerate}
                      disabled={!isValidRange || bulkCount <= 0}
                      className="btn !py-1.5 !px-3.5 !text-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Sparkles size={13} />
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

    {/* Long-Press Action Sheet Modal */}
    {showActionMenu && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
        onClick={(e) => {
          e.stopPropagation();
          setShowActionMenu(false);
        }}
      >
        <div
          className="card paper-card max-w-sm w-full p-5 flex flex-col gap-4 shadow-xl border border-[var(--line)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[var(--line)] pb-2.5">
            <h3 className="font-caveat text-2xl font-bold text-[var(--accent)] truncate">
              {lesson.name}
            </h3>
            <button
              type="button"
              onClick={() => setShowActionMenu(false)}
              className="p-1 rounded-lg text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={(e) => {
                handleToggleDone(e);
                setShowActionMenu(false);
              }}
              className={`btn flex items-center justify-center gap-2 !py-2.5 text-xs font-sans font-bold cursor-pointer ${
                lesson.done
                  ? '!bg-[#FAF7F0] !text-[var(--ink)] border border-[var(--line)] hover:!bg-black/5'
                  : '!bg-[#5B8266] text-white'
              }`}
            >
              {lesson.done ? <Circle size={15} /> : <CheckCircle2 size={15} />}
              <span>{lesson.done ? 'Mark as Pending' : 'Mark as Completed'}</span>
            </button>

            {lesson.done && (
              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-sans font-bold text-[var(--ink-soft)]">Confidence:</span>
                <div className="flex gap-1.5">
                  {(['L', 'M', 'H'] as const).map((conf) => (
                    <button
                      key={conf}
                      type="button"
                      onClick={() => updateLesson(lesson.id, { confidence: conf })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-sans font-bold border transition-colors cursor-pointer ${
                        lesson.confidence === conf
                          ? conf === 'L'
                            ? 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]'
                            : conf === 'M'
                            ? 'bg-[#EFE8F5] text-[#5C3D77] border-[#7A5C94]'
                            : 'bg-[#E4ECE0] text-[#2F5238] border-[#5B8266]'
                          : 'bg-white text-[var(--ink-soft)] border-[var(--line)]'
                      }`}
                    >
                      {conf === 'L' ? 'Low' : conf === 'M' ? 'Med' : 'High'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
                setShowActionMenu(false);
              }}
              className="btn !bg-white !text-[var(--ink)] border border-[var(--line)] hover:!bg-black/5 flex items-center justify-center gap-2 !py-2.5 text-xs font-sans font-bold cursor-pointer"
            >
              <Layers size={15} />
              <span>{isExpanded ? 'Collapse Parts' : 'View / Edit Parts'}</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deleteLesson(lesson.id);
                setShowActionMenu(false);
              }}
              className="btn !bg-red-50 !text-red-700 hover:!bg-red-100 border border-red-200 flex items-center justify-center gap-2 !py-2.5 text-xs font-sans font-bold mt-1 cursor-pointer"
            >
              <Trash2 size={15} />
              <span>Delete Lesson</span>
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
};
