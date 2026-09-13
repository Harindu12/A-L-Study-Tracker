import React, { useState } from 'react';
import { Lesson, LessonPart } from '../../types';
import { useStore } from '../../store';
import { 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  CheckCircle2, 
  Plus, 
  Video, 
  FileText,
  Layers,
  Sparkles
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

  // Sync lesson name if prop changes outside
  React.useEffect(() => {
    setLessonName(lesson.name);
  }, [lesson.name]);

  const parts = lesson.parts || [];
  const completedPartsCount = parts.filter((p) => p.watched && p.pastPaper).length;
  const allPartsComplete = parts.length > 0 && completedPartsCount === parts.length;

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
    <div
      onClick={onToggleExpand}
      className={`paper-card rounded-2xl border transition-all cursor-pointer select-none overflow-hidden ${
        lesson.done
          ? 'border-[#D2DEC8] bg-[#F7F9F5] shadow-[0_1px_4px_rgba(91,130,102,0.06)]'
          : 'border-[var(--line)] bg-[#FAF7F0] shadow-[0_2px_8px_rgba(120,100,70,0.06)] hover:bg-[#FFFDF9]'
      }`}
    >
      {/* Card Header: Checkbox + Name + Progress Indicator + Chevron */}
      <div className="p-3.5 sm:p-4">
        <div className="flex items-start gap-3">
          {/* Lesson Done Checkbox */}
          <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={lesson.done}
              onChange={handleToggleDone}
              title={lesson.done ? 'Mark lesson pending' : 'Mark lesson done'}
              className="cursor-pointer w-4 h-4 rounded accent-[#5B8266]"
            />
          </div>

          {/* Main Title & Metadata */}
          <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={lessonName}
              onChange={(e) => setLessonName(e.target.value)}
              onFocus={() => {
                if (activeOverlay !== `edit-lesson-${lesson.id}`) {
                  openOverlay(`edit-lesson-${lesson.id}`);
                }
              }}
              onBlur={() => {
                handleBlurLessonName();
                if (activeOverlay === `edit-lesson-${lesson.id}` && !isPopping) {
                  closeOverlay();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className={`w-full bg-transparent border border-transparent hover:border-[var(--line)] focus:border-[var(--accent)] focus:bg-white px-2 py-0.5 rounded-lg text-sm font-sans font-medium transition-colors ${
                lesson.done
                  ? 'line-through text-[var(--ink-soft)]'
                  : 'text-[var(--ink)] font-semibold'
              }`}
            />

            {/* Badges Row: Parts Progress Indicator & Done Date */}
            <div className="flex flex-wrap items-center gap-2 mt-1.5 ml-2">
              {/* Parts Progress Indicator (e.g. "3/5 parts") */}
              <span
                className={`inline-flex items-center gap-1 text-[0.7rem] font-sans font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                  allPartsComplete
                    ? 'bg-[#5B8266]/15 text-[#5B8266] border-[#5B8266]/30'
                    : parts.length > 0
                    ? 'bg-[#7A5C94]/10 text-[#7A5C94] border-[#7A5C94]/20'
                    : 'bg-black/5 text-[var(--ink-soft)] border-black/10'
                }`}
                title={
                  parts.length > 0
                    ? `${completedPartsCount} of ${parts.length} parts completed (watched & past paper done)`
                    : 'No sub-parts yet'
                }
              >
                <Layers size={11} />
                <span>
                  {parts.length > 0 ? `${completedPartsCount}/${parts.length} parts` : '0 parts'}
                </span>
              </span>

              {/* Completed Date Badge */}
              {lesson.done && lesson.completedDate && (
                <span className="text-[0.68rem] font-sans font-semibold text-[#4A6B53] bg-[#E4ECE0] px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-[#5B8266]/20">
                  <CheckCircle2 size={10} />
                  Done {lesson.completedDate}
                </span>
              )}
            </div>
          </div>

          {/* Right Controls: Delete & Expand Chevron */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                deleteLesson(lesson.id);
              }}
              title="Delete lesson"
              className="p-1.5 text-[var(--ink-soft)] hover:text-red-600 rounded-lg hover:bg-black/5 transition-colors"
            >
              <Trash2 size={15} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              title={isExpanded ? 'Collapse parts' : 'Expand parts'}
              className="p-1.5 text-[var(--ink-soft)] hover:text-[var(--accent)] rounded-lg hover:bg-black/5 transition-transform"
            >
              {isExpanded ? (
                <ChevronUp size={18} strokeWidth={2.2} />
              ) : (
                <ChevronDown size={18} strokeWidth={2.2} />
              )}
            </button>
          </div>
        </div>

        {/* Confidence Rating row (when done) */}
        {lesson.done && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-3 pt-2.5 border-t border-[rgba(91,130,102,0.2)] flex items-center justify-between"
          >
            <span className="text-[0.7rem] font-sans font-bold uppercase tracking-wider text-[var(--ink-soft)] ml-1">
              Confidence Rating:
            </span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => updateLesson(lesson.id, { confidence: 'L' })}
                className={`px-2.5 py-1 rounded-lg text-xs font-sans font-bold transition-all ${
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
                className={`px-2.5 py-1 rounded-lg text-xs font-sans font-bold transition-all ${
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
                className={`px-2.5 py-1 rounded-lg text-xs font-sans font-bold transition-all ${
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

      {/* Expanded Checklist of Video / Parts */}
      {isExpanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-[#FFFDF9] border-t border-[var(--line)] p-3.5 sm:p-4 animate-in fade-in slide-in-from-top-2 duration-150"
        >
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

          {/* Add Part Inline Form */}
          <form onSubmit={handleAddPart} className="flex gap-2 items-center">
            <input
              type="text"
              value={newPartName}
              onChange={(e) => setNewPartName(e.target.value)}
              placeholder={`Add part (e.g. Part ${parts.length + 1})...`}
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
        </div>
      )}
    </div>
  );
};
