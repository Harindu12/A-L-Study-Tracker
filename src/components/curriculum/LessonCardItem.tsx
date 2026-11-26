import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Lesson, LessonPart } from '../../types';
import { useStore } from '../../store';
import { useNavigation } from '../../navigation';
import { getSubjectColorById } from '../../utils/colors';
import {
  parseTelegramPost,
  isValidHttpUrl,
  convertTelegramHtmlToText,
  extractTextFromRichElement,
  extractHttpUrls,
} from '../../utils/telegramParser';
import { 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Check, 
  Circle, 
  Plus, 
  Video, 
  X, 
  Pencil, 
  AlertTriangle, 
  BookOpen,
  Send,
  Play,
  Link2,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal
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
  const { subjects, updateLesson, updateLessonParts, deleteLesson, markLessonDone, dailyEntries, saveDailyEntry } = useStore();
  const { activeOverlay, overlayData, openOverlay, closeOverlay } = useNavigation();
  const accentColor = getSubjectColorById(lesson.subjectId, subjects);

  const [newPartName, setNewPartName] = useState('');
  const [editingPartNames, setEditingPartNames] = useState<Record<string, string>>({});
  
  // Modals & Action Sheet state
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showEditTitleModal, setShowEditTitleModal] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(lesson.name);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // Telegram Import modal state (driven by NavigationContext overlay for Android back button support)
  const isTelegramModalOpen =
    activeOverlay === 'curriculum-telegram-import' && overlayData?.lessonId === lesson.id;
  const richPasteBoxRef = useRef<HTMLDivElement | null>(null);
  const [importStep, setImportStep] = useState<'paste' | 'review'>('paste');
  const [telegramText, setTelegramText] = useState('');
  const telegramTextRef = useRef(telegramText);
  telegramTextRef.current = telegramText;
  const [removedPreviewIds, setRemovedPreviewIds] = useState<Record<string, boolean>>({});
  const [editedLinks, setEditedLinks] = useState<Record<string, string>>({});
  const [showBulkLinks, setShowBulkLinks] = useState(false);
  const [bulkLinksText, setBulkLinksText] = useState('');
  const [importFeedback, setImportFeedback] = useState<{ added: number; skipped: number } | null>(null);

  useEffect(() => {
    if (isTelegramModalOpen) {
      setImportStep('paste');
      setTelegramText('');
      telegramTextRef.current = '';
      setRemovedPreviewIds({});
      setEditedLinks({});
      setShowBulkLinks(false);
      setBulkLinksText('');
      window.requestAnimationFrame(() => {
        if (richPasteBoxRef.current) {
          richPasteBoxRef.current.textContent = '';
          richPasteBoxRef.current.focus();
        }
      });
    }
  }, [isTelegramModalOpen]);

  // Restore uncontrolled contentEditable text when navigating back from Step 2 to Step 1
  useEffect(() => {
    if (!isTelegramModalOpen || importStep !== 'paste') return;
    window.requestAnimationFrame(() => {
      if (richPasteBoxRef.current) {
        if (richPasteBoxRef.current.textContent !== telegramTextRef.current) {
          richPasteBoxRef.current.textContent = telegramTextRef.current;
        }
        richPasteBoxRef.current.focus();
      }
    });
  }, [isTelegramModalOpen, importStep]);

  useEffect(() => {
    if (!importFeedback) return;
    const timer = window.setTimeout(() => {
      setImportFeedback(null);
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [importFeedback]);

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

  const parts = lesson.parts || [];
  const watchedPartsCount = parts.filter((p) => p.watched).length;
  const completedPartsCount = parts.filter((p) => p.watched && p.pastPaper).length;
  const allPartsComplete = parts.length > 0 && completedPartsCount === parts.length;
  const isFullyComplete = lesson.done || (parts.length > 0 && watchedPartsCount === parts.length);

  // Toggle done state directly
  const handleToggleDone = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!lesson.done) {
      markLessonDone(lesson.id, todayStr());
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

  // Telegram import live parsing & preview state
  const rawParsedTelegramParts = useMemo(() => parseTelegramPost(telegramText), [telegramText]);
  const bulkLinksList = useMemo(() => extractHttpUrls(bulkLinksText), [bulkLinksText]);

  const visibleRawTelegramParts = useMemo(
    () => rawParsedTelegramParts.filter((item) => !removedPreviewIds[item.id]),
    [rawParsedTelegramParts, removedPreviewIds]
  );

  const previewTelegramParts = useMemo(
    () =>
      visibleRawTelegramParts.map((item, idx) => {
        const bulkLink = bulkLinksList[idx] || '';
        const baseLink = bulkLink || item.videoLink;
        const rawLink = editedLinks[item.id] !== undefined ? editedLinks[item.id] : baseLink;
        return {
          ...item,
          rawLink,
          effectiveVideoLink: isValidHttpUrl(rawLink) ? rawLink.trim() : '',
        };
      }),
    [visibleRawTelegramParts, bulkLinksList, editedLinks]
  );

  const previewLinksCount = useMemo(
    () => previewTelegramParts.filter((item) => !!item.effectiveVideoLink).length,
    [previewTelegramParts]
  );

  const existingPartNamesSet = useMemo(
    () => new Set(parts.map((p) => p.name.trim().toLowerCase())),
    [parts]
  );

  const placeCaretAtEnd = (el: HTMLElement) => {
    try {
      const selection = window.getSelection();
      if (!selection) return;
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } catch {
      // Ignore selection errors
    }
  };

  const handleTelegramRichPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    try {
      const html = e.clipboardData?.getData('text/html');
      if (!html) return; // Fall back to native paste (contentEditable onInput will still inspect pasted DOM)

      const converted = convertTelegramHtmlToText(html);
      if (!converted) return;

      e.preventDefault();
      const el = e.currentTarget;
      const selection = window.getSelection();

      if (selection && selection.rangeCount > 0 && el.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(converted);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        el.textContent = (el.textContent || '') + converted;
        placeCaretAtEnd(el);
      }

      const normalized = extractTextFromRichElement(el);
      setTelegramText(normalized);
      setRemovedPreviewIds({});
      setEditedLinks({});
    } catch {
      // Fall back to default paste behavior without error
    }
  };

  const handleTelegramRichInput = (e: React.FormEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const hasRichAnchor = Boolean(el.querySelector('a[href]'));
    const extracted = extractTextFromRichElement(el);

    // If Android/browser natively pasted <a> tags into contentEditable, normalize into visible plain text + URLs
    if (hasRichAnchor) {
      el.textContent = extracted;
      placeCaretAtEnd(el);
    }

    setTelegramText(extracted);
    setRemovedPreviewIds({});
    setEditedLinks({});
  };

  const handleClearRichPasteBox = () => {
    if (richPasteBoxRef.current) {
      richPasteBoxRef.current.textContent = '';
      richPasteBoxRef.current.focus();
    }
    setTelegramText('');
    setRemovedPreviewIds({});
    setEditedLinks({});
  };

  const handleTelegramImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (previewTelegramParts.length === 0) return;

    const seenNames = new Set(parts.map((p) => p.name.trim().toLowerCase()));
    const newParts: LessonPart[] = [];
    let skipped = 0;

    for (const item of previewTelegramParts) {
      const normalized = item.name.trim().toLowerCase();
      if (seenNames.has(normalized)) {
        skipped++;
        continue;
      }
      seenNames.add(normalized);
      newParts.push({
        id: Math.random().toString(36).slice(2, 10),
        name: item.name,
        ...(item.title ? { title: item.title } : {}),
        ...(item.effectiveVideoLink ? { videoLink: item.effectiveVideoLink } : {}),
        watched: false,
        pastPaper: false,
      });
    }

    if (newParts.length > 0) {
      updateLessonParts(lesson.id, [...parts, ...newParts]);
    }

    setImportFeedback({ added: newParts.length, skipped });
    closeOverlay();
  };

  const handleToggleWatched = (partId: string, watched: boolean) => {
    const updated = parts.map((p) => (p.id === partId ? { ...p, watched } : p));
    updateLessonParts(lesson.id, updated);

    // Sync to today's dailyEntry for real-time live activity tracking across tabs
    const today = todayStr();
    const currentEntry = dailyEntries[today] || {
      date: today,
      hours: [],
      subjects: [],
      teachback: '',
      notes: '',
    };
    let updatedSubjects = [...(currentEntry.subjects || [])];
    const existingIdx = updatedSubjects.findIndex((s) => s.lessonId === lesson.id && s.partId === partId);
    if (existingIdx >= 0) {
      updatedSubjects[existingIdx] = {
        ...updatedSubjects[existingIdx],
        studied: watched,
      };
    } else if (watched) {
      updatedSubjects.push({
        id: Math.random().toString(36).slice(2, 10),
        subjectId: lesson.subjectId,
        lessonId: lesson.id,
        partId,
        studied: true,
        pastPaper: false,
      });
    }
    if (typeof saveDailyEntry === 'function') {
      saveDailyEntry(today, { ...currentEntry, subjects: updatedSubjects });
    }
  };

  const handleTogglePastPaper = (partId: string, pastPaper: boolean) => {
    const updated = parts.map((p) => (p.id === partId ? { ...p, pastPaper } : p));
    updateLessonParts(lesson.id, updated);

    // Sync to today's dailyEntry for real-time live activity tracking across tabs
    const today = todayStr();
    const currentEntry = dailyEntries[today] || {
      date: today,
      hours: [],
      subjects: [],
      teachback: '',
      notes: '',
    };
    let updatedSubjects = [...(currentEntry.subjects || [])];
    const existingIdx = updatedSubjects.findIndex((s) => s.lessonId === lesson.id && s.partId === partId);
    if (existingIdx >= 0) {
      updatedSubjects[existingIdx] = {
        ...updatedSubjects[existingIdx],
        pastPaper,
      };
    } else if (pastPaper) {
      updatedSubjects.push({
        id: Math.random().toString(36).slice(2, 10),
        subjectId: lesson.subjectId,
        lessonId: lesson.id,
        partId,
        studied: false,
        pastPaper: true,
      });
    }
    if (typeof saveDailyEntry === 'function') {
      saveDailyEntry(today, { ...currentEntry, subjects: updatedSubjects });
    }
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
        className="rounded-2xl border border-[#E4E0D8] bg-[#FFFDF9] hover:border-[#D6D1C7] transition-colors cursor-pointer select-none overflow-hidden shadow-[0_1px_2px_rgba(24,23,21,0.03)]"
      >
        {/* Collapsed Card Main Row */}
        <div className="p-4 sm:p-4.5 flex items-center justify-between gap-3 sm:gap-3.5">
          {/* Left Square Badge */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors tabular-nums border"
            style={
              isFullyComplete
                ? {
                    backgroundColor: accentColor,
                    borderColor: accentColor,
                    color: '#FFFDF9',
                  }
                : {
                    backgroundColor: `${accentColor}12`,
                    borderColor: `${accentColor}35`,
                    color: accentColor,
                  }
            }
          >
            {isFullyComplete ? (
              <Check size={18} strokeWidth={3} />
            ) : (
              <span className="font-sans font-bold text-sm">
                {watchedPartsCount}
              </span>
            )}
          </div>

          {/* Title & Parts Count */}
          <div className="flex-1 min-w-0">
            <h3 className="font-sans font-bold text-base text-[#181715] truncate leading-snug m-0">
              {lesson.name}
            </h3>
            <p className="text-xs font-sans text-[#78716C] font-medium mt-0.5 tabular-nums m-0">
              {watchedPartsCount} / {parts.length} parts
            </p>
          </div>

          {/* Explicit Options Menu + Expand Chevron */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowActionMenu(true);
              }}
              aria-label={`Lesson options for ${lesson.name}`}
              title="Lesson options"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#78716C] hover:text-[#181715] hover:bg-[#EDEAE2] transition-colors cursor-pointer"
            >
              <MoreHorizontal size={16} />
            </button>

            <div className="text-[#78716C] pl-0.5">
              {isExpanded ? (
                <ChevronUp size={18} strokeWidth={2.2} className="text-[#181715]" />
              ) : (
                <ChevronDown size={18} strokeWidth={2.2} />
              )}
            </div>
          </div>
        </div>

        {/* Expanded Checklist of Video / Parts */}
        {isExpanded && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#F6F4EF] border-t border-[#EFECE6] p-3.5 sm:p-4 animate-in fade-in duration-150"
          >
            {/* Clean Section Header (zero-pill unboxed typography) */}
            <div className="flex items-center justify-between gap-2 mb-2.5 px-0.5">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#78716C] flex items-center gap-1.5 tabular-nums">
                  <Video size={13} className="text-[#181715]" />
                  <span>Parts ({parts.length})</span>
                </span>

                {allPartsComplete && parts.length > 0 && (
                  <>
                    <span className="text-[#D6D1C7] select-none" aria-hidden="true">·</span>
                    <span className="text-[11px] font-sans font-semibold text-[#16A34A] inline-flex items-center gap-1">
                      <Check size={12} strokeWidth={2.75} />
                      <span>All complete</span>
                    </span>
                  </>
                )}
              </div>

              {parts.length > 0 && (
                <span className="text-[11px] font-sans font-medium text-[#78716C] tabular-nums flex-shrink-0">
                  {completedPartsCount}/{parts.length} done
                </span>
              )}
            </div>

            {/* Two-Tier Parts List */}
            {parts.length === 0 ? (
              <div className="p-4 text-center rounded-2xl border border-dashed border-[#D6D1C7] text-xs font-sans text-[#78716C] mb-3 bg-[#FFFDF9]">
                No parts added yet. Add individual parts below or import from Telegram.
              </div>
            ) : (
              <div className="flex flex-col gap-2 mb-3">
                {parts.map((part, index) => {
                  const isPartComplete = part.watched && part.pastPaper;
                  const isEditingName = editingPartNames[part.id] !== undefined;
                  const displayName = isEditingName ? editingPartNames[part.id] : part.name;
                  const safeVideoLink = isValidHttpUrl(part.videoLink) ? part.videoLink!.trim() : '';

                  return (
                    <div
                      key={part.id}
                      className={`rounded-2xl border bg-[#FFFDF9] transition-colors shadow-[0_1px_2px_rgba(24,23,21,0.02)] ${
                        isPartComplete
                          ? 'border-[#D6D1C7]'
                          : 'border-[#E4E0D8] hover:border-[#D6D1C7]'
                      }`}
                    >
                      {/* Tier 1: Identity, Actions & Full-Width Wrapped Sinhala Title */}
                      <div className="px-3.5 pt-3 pb-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-[#F6F4EF] border border-[#E4E0D8] text-[#57534E] font-sans font-bold text-[11px] tabular-nums flex items-center justify-center flex-shrink-0 select-none">
                              {String(index + 1).padStart(2, '0')}
                            </span>

                            {isEditingName ? (
                              <input
                                type="text"
                                value={displayName}
                                autoFocus
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
                                  } else if (e.key === 'Escape') {
                                    setEditingPartNames((prev) => {
                                      const next = { ...prev };
                                      delete next[part.id];
                                      return next;
                                    });
                                  }
                                }}
                                placeholder={`Part ${index + 1}`}
                                className="flex-1 min-w-0 font-sans text-xs px-2 py-1 rounded-lg border border-[#181715] bg-[#FFFDF9] text-[#181715]"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setEditingPartNames((prev) => ({
                                    ...prev,
                                    [part.id]: part.name,
                                  }))
                                }
                                title="Tap to rename part"
                                className={`text-left font-sans text-[13.5px] leading-snug text-[#181715] hover:bg-[#EDEAE2] px-1.5 py-1 -ml-1 rounded-lg transition-colors truncate cursor-text ${
                                  isPartComplete ? 'font-bold' : 'font-semibold'
                                }`}
                              >
                                {part.name || `Part ${index + 1}`}
                              </button>
                            )}
                          </div>

                          {/* Media Watch Action + Delete */}
                          <div className="flex items-center gap-1 flex-shrink-0 -mr-1">
                            {safeVideoLink && (
                              <a
                                href={safeVideoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="Open video link"
                                aria-label={`Open video for ${part.name}`}
                                className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-[#F6F4EF] border border-[#E4E0D8] text-[#181715] hover:bg-[#181715] hover:text-[#FFFDF9] hover:border-[#181715] text-[11px] font-sans font-semibold transition-colors whitespace-nowrap"
                              >
                                <Play size={11} className="fill-current" />
                                <span>Watch</span>
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeletePart(part.id)}
                              title="Delete part"
                              aria-label={`Delete ${part.name}`}
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#78716C] hover:text-[#DC2626] hover:bg-red-50/70 transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Optional Part Title beneath part name (full width, wraps cleanly in Noto Sans Sinhala) */}
                        {part.title && (
                          <p className="mt-1.5 pl-8 pr-1 text-[12.5px] font-sans text-[#57534E] leading-relaxed whitespace-normal break-words select-text m-0">
                            {part.title}
                          </p>
                        )}
                      </div>

                      {/* Tier 2: Progress Toggles Strip */}
                      <div className="border-t border-[#EFECE6] px-2.5 py-1.5 bg-[#F6F4EF]/60 rounded-b-2xl flex items-center gap-1.5">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={part.watched}
                          onClick={() => handleToggleWatched(part.id, !part.watched)}
                          className={`flex-1 sm:flex-initial inline-flex items-center justify-center sm:justify-start gap-2 min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-sans transition-colors cursor-pointer select-none whitespace-nowrap ${
                            part.watched
                              ? 'text-[#181715] font-semibold hover:bg-[#EDEAE2]'
                              : 'text-[#57534E] font-medium hover:bg-[#EDEAE2] hover:text-[#181715]'
                          }`}
                        >
                          <span
                            className={`w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 transition-colors border ${
                              part.watched
                                ? 'bg-[#16A34A] border-[#16A34A] text-[#FFFDF9]'
                                : 'bg-[#FFFDF9] border-[#D6D1C7] text-transparent'
                            }`}
                          >
                            <Check size={11} strokeWidth={3} />
                          </span>
                          <span>Watched</span>
                        </button>

                        <span className="h-4 w-px bg-[#E4E0D8] flex-shrink-0" aria-hidden="true" />

                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={part.pastPaper}
                          onClick={() => handleTogglePastPaper(part.id, !part.pastPaper)}
                          className={`flex-1 sm:flex-initial inline-flex items-center justify-center sm:justify-start gap-2 min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-sans transition-colors cursor-pointer select-none whitespace-nowrap ${
                            part.pastPaper
                              ? 'text-[#181715] font-semibold hover:bg-[#EDEAE2]'
                              : 'text-[#57534E] font-medium hover:bg-[#EDEAE2] hover:text-[#181715]'
                          }`}
                        >
                          <span
                            className={`w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 transition-colors border ${
                              part.pastPaper
                                ? 'bg-[#16A34A] border-[#16A34A] text-[#FFFDF9]'
                                : 'bg-[#FFFDF9] border-[#D6D1C7] text-transparent'
                            }`}
                          >
                            <Check size={11} strokeWidth={3} />
                          </span>
                          <span>Past paper done</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Import Feedback Notice (shows added + skipped duplicates count) */}
            {importFeedback && (
              <div className="mb-3 px-3.5 py-2.5 rounded-2xl border border-[#E4E0D8] bg-[#FFFDF9] flex items-center justify-between gap-2 text-xs font-sans text-[#181715] shadow-2xs animate-in fade-in duration-150">
                <span className="font-medium leading-snug">
                  {importFeedback.added > 0 && importFeedback.skipped > 0
                    ? `Imported ${importFeedback.added} ${importFeedback.added === 1 ? 'part' : 'parts'} (${importFeedback.skipped} ${importFeedback.skipped === 1 ? 'duplicate' : 'duplicates'} skipped).`
                    : importFeedback.added > 0
                    ? `Imported ${importFeedback.added} ${importFeedback.added === 1 ? 'part' : 'parts'}.`
                    : `No new parts added — ${importFeedback.skipped} ${importFeedback.skipped === 1 ? 'part' : 'parts'} skipped (already in this lesson).`}
                </span>
                <button
                  type="button"
                  onClick={() => setImportFeedback(null)}
                  className="p-1.5 text-[#78716C] hover:text-[#181715] rounded-lg transition-colors cursor-pointer flex-shrink-0"
                  aria-label="Dismiss notice"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Add Part Section: Single input + Even 2-column action row */}
            <div className="flex flex-col gap-2 pt-0.5">
              <form onSubmit={handleAddPart} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newPartName}
                  onChange={(e) => setNewPartName(e.target.value)}
                  placeholder={`Add single part (e.g. Part ${parts.length + 1})...`}
                  className="flex-1 min-w-0 font-sans text-xs px-3 py-2 rounded-xl border border-[#E4E0D8] bg-[#FFFDF9] hover:border-[#D6D1C7] focus:outline-none focus:border-[#181715] shadow-2xs text-[#181715] transition-all placeholder:text-[#78716C]"
                />
                <button
                  type="submit"
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#181715] text-[#FFFDF9] hover:bg-[#2E2C28] text-xs font-sans font-semibold shadow-2xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all whitespace-nowrap flex-shrink-0"
                >
                  <Plus size={14} strokeWidth={2.4} />
                  <span>Add Part</span>
                </button>
              </form>

              {/* Import from Telegram full-width trigger */}
              <button
                type="button"
                onClick={() => {
                  setImportFeedback(null);
                  openOverlay('curriculum-telegram-import', { lessonId: lesson.id });
                }}
                className="w-full min-h-[40px] px-3 py-2 text-xs font-sans font-semibold rounded-xl border bg-[#FFFDF9] text-[#181715] border-[#E4E0D8] hover:bg-[#EDEAE2] shadow-2xs transition-all inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-[0.99]"
                title="Paste a Telegram post to create parts at once"
              >
                <Send size={13} />
                <span>Import from Telegram</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Sheet Modal */}
      {showActionMenu && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#181715]/45 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setShowActionMenu(false);
          }}
        >
          <div
            className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 border border-[#E4E0D8] shadow-2xl bg-[#FFFDF9] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-[#EFECE6]">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div
                  className="w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs flex-shrink-0"
                  style={{
                    backgroundColor: `${accentColor}12`,
                    borderColor: `${accentColor}35`,
                    color: accentColor,
                  }}
                >
                  <BookOpen size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-sans text-base font-bold text-[#181715] truncate m-0">
                    {lesson.name}
                  </h3>
                  <p className="text-xs font-sans text-[#78716C] m-0">
                    Lesson options
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowActionMenu(false)}
                className="w-9 h-9 flex items-center justify-center text-[#78716C] hover:text-[#181715] hover:bg-[#EDEAE2] rounded-full transition-colors cursor-pointer"
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
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#E4E0D8] bg-[#FFFDF9] hover:bg-[#F6F4EF] hover:border-[#181715] text-left transition-colors cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#F6F4EF] border border-[#E4E0D8] text-[#181715] flex items-center justify-center flex-shrink-0 group-hover:bg-[#181715] group-hover:text-[#FFFDF9] transition-colors">
                  <Pencil size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans font-bold text-sm text-[#181715] transition-colors">
                    Edit Title
                  </div>
                  <div className="text-xs font-sans text-[#78716C]">
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
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#E4E0D8] bg-[#FFFDF9] hover:bg-[#F6F4EF] hover:border-[#181715] text-left transition-colors cursor-pointer group"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    lesson.done
                      ? 'bg-[#F6F4EF] border border-[#E4E0D8] text-[#78716C]'
                      : 'bg-[#181715] text-[#FFFDF9]'
                  }`}
                >
                  {lesson.done ? <Circle size={18} /> : <Check size={18} strokeWidth={2.8} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans font-bold text-sm text-[#181715] transition-colors">
                    {lesson.done ? 'Mark Incomplete' : 'Mark Done'}
                  </div>
                  <div className="text-xs font-sans text-[#78716C]">
                    {lesson.done ? 'Reset completion status' : 'Complete lesson & schedule review reminders'}
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
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-200 bg-[#FFFDF9] hover:bg-red-50/50 hover:border-red-400 text-left transition-colors cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <Trash2 size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans font-bold text-sm text-red-600 transition-colors">
                    Delete Lesson
                  </div>
                  <div className="text-xs font-sans text-red-500">
                    Remove lesson and all its parts
                  </div>
                </div>
              </button>
            </div>

            {/* Cancel Button */}
            <div className="mt-4 pt-2 border-t border-[#EFECE6]">
              <button
                type="button"
                onClick={() => setShowActionMenu(false)}
                className="w-full py-2.5 text-center text-xs font-sans font-semibold text-[#78716C] hover:text-[#181715] transition-colors cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#181715]/45 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setShowEditTitleModal(false);
          }}
        >
          <div
            className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 border border-[#E4E0D8] shadow-2xl bg-[#FFFDF9] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Pencil size={18} className="text-[#181715]" />
                <h3 className="font-sans text-lg font-extrabold text-[#181715] m-0">Edit Lesson Title</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditTitleModal(false)}
                className="w-9 h-9 flex items-center justify-center text-[#78716C] hover:text-[#181715] hover:bg-[#EDEAE2] rounded-full transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTitle} className="flex flex-col gap-4">
              <div>
                <label className="block text-[11px] font-sans font-bold text-[#78716C] uppercase tracking-wider mb-1.5">
                  Lesson Name
                </label>
                <input
                  type="text"
                  value={editTitleValue}
                  onChange={(e) => setEditTitleValue(e.target.value)}
                  className="w-full font-sans text-sm px-3.5 py-2.5 rounded-xl border border-[#E4E0D8] bg-[#F6F4EF] text-[#181715] focus:border-[#181715] focus:bg-[#FFFDF9] focus:outline-none"
                  placeholder="e.g. Chemical Bonding"
                  autoFocus
                  required
                />
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowEditTitleModal(false)}
                  className="min-h-[40px] px-4 py-2 text-xs font-semibold text-[#57534E] hover:text-[#181715] hover:bg-[#EDEAE2] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editTitleValue.trim()}
                  className="min-h-[40px] px-5 py-2 text-xs font-bold bg-[#181715] text-[#FFFDF9] rounded-xl disabled:opacity-40 hover:bg-[#2E2C28] transition-colors cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#181715]/45 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirmModal(false);
          }}
        >
          <div
            className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 border border-[#E4E0D8] shadow-2xl bg-[#FFFDF9] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-[#DC2626]/10 text-[#DC2626] flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-sans text-base font-bold text-[#181715] m-0">
                  Delete Lesson?
                </h3>
                <p className="text-xs font-sans text-[#78716C] mt-1.5 leading-relaxed">
                  Delete <strong className="text-[#181715] font-semibold">{lesson.name}</strong> and all its parts? This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="min-h-[40px] px-4 py-2 text-xs font-semibold text-[#57534E] hover:text-[#181715] hover:bg-[#EDEAE2] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="min-h-[40px] bg-[#DC2626] hover:bg-[#B91C1C] text-[#FFFDF9] font-sans font-bold text-xs py-2 px-5 rounded-xl transition-colors cursor-pointer"
              >
                Delete Lesson
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two-Step Import from Telegram Modal (back-button aware via NavigationContext) */}
      {isTelegramModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#181715]/45 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            closeOverlay();
          }}
        >
          <div
            className="w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[88dvh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-[#E4E0D8] shadow-2xl bg-[#FFFDF9] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Consistent Warm Editorial Paper Header */}
            <div className="px-5 pt-5 pb-3.5 border-b border-[#EFECE6] flex items-start justify-between gap-3 flex-shrink-0">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#F6F4EF] border border-[#E4E0D8] flex items-center justify-center text-[#181715] flex-shrink-0 mt-0.5">
                  <Send size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-sans text-base sm:text-lg font-extrabold text-[#181715] m-0 leading-snug">
                    Import from Telegram
                  </h3>
                  <p className="text-xs font-sans text-[#78716C] truncate m-0">
                    {lesson.name}
                  </p>
                  <p className="text-[11px] font-sans font-semibold text-[#57534E] tabular-nums mt-1 m-0">
                    {importStep === 'paste'
                      ? 'Step 1 of 2 · Paste post'
                      : 'Step 2 of 2 · Review & links'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeOverlay}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#78716C] hover:text-[#181715] hover:bg-[#EDEAE2] transition-colors cursor-pointer flex-shrink-0 -mr-1"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTelegramImport} noValidate className="flex flex-col flex-1 min-h-0">
              {importStep === 'paste' ? (
                <>
                  {/* Step 1: Dedicated Rich Paste Body */}
                  <div className="px-5 py-4 flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        id={`telegram-paste-label-${lesson.id}`}
                        className="text-[11px] font-sans font-bold text-[#78716C] uppercase tracking-wider"
                      >
                        Paste the Telegram post here
                      </span>
                      {telegramText.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearRichPasteBox}
                          className="min-h-[28px] px-2 text-xs font-sans font-semibold text-[#57534E] hover:text-[#181715] hover:bg-[#EDEAE2] rounded-lg transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="relative flex-1 min-h-[190px] flex flex-col">
                      {telegramText.length === 0 && (
                        <div className="pointer-events-none absolute inset-0 p-3.5 font-sans text-[13px] leading-relaxed text-[#78716C]/70 whitespace-pre-wrap select-none overflow-hidden">
                          {'👉 DAY 01 | යාන්ත්‍ර විද්‍යාව ආරම්භය - දෛශික\nhttps://youtu.be/...'}
                        </div>
                      )}
                      <div
                        ref={richPasteBoxRef}
                        id={`telegram-paste-${lesson.id}`}
                        contentEditable
                        role="textbox"
                        aria-multiline="true"
                        aria-labelledby={`telegram-paste-label-${lesson.id}`}
                        suppressContentEditableWarning
                        onPaste={handleTelegramRichPaste}
                        onInput={handleTelegramRichInput}
                        className="w-full flex-1 min-h-[190px] max-h-[42dvh] overflow-y-auto font-sans text-[13px] leading-relaxed p-3.5 rounded-2xl border border-[#E4E0D8] bg-[#F6F4EF] text-[#181715] focus:border-[#181715] focus:bg-[#FFFDF9] focus:outline-none whitespace-pre-wrap break-words transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <p className="text-[11.5px] font-sans text-[#78716C] m-0 leading-snug">
                        Long-press and tap Paste to keep hidden links from Telegram.
                      </p>

                      {telegramText.trim().length > 0 && (
                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          {rawParsedTelegramParts.length === 0 ? (
                            <p className="text-xs font-sans font-medium text-[#DC2626] m-0">
                              No DAY lines found - check the pasted text
                            </p>
                          ) : previewTelegramParts.length === 0 ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-sans text-[#78716C]">
                                All {rawParsedTelegramParts.length} parsed entries were removed.
                              </span>
                              <button
                                type="button"
                                onClick={() => setRemovedPreviewIds({})}
                                className="text-xs font-sans font-semibold text-[#181715] underline underline-offset-2 cursor-pointer"
                              >
                                Restore all
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs font-sans font-semibold text-[#181715] tabular-nums m-0">
                              {previewTelegramParts.length}{' '}
                              {previewTelegramParts.length === 1 ? 'part' : 'parts'} found
                              {previewLinksCount > 0 &&
                                ` · ${previewLinksCount} with ${previewLinksCount === 1 ? 'video link' : 'video links'}`}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 1 Sticky Footer */}
                  <div className="px-5 py-3.5 border-t border-[#EFECE6] bg-[#FFFDF9] flex items-center justify-between gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={closeOverlay}
                      className="min-h-[40px] px-4 text-xs font-sans font-semibold text-[#57534E] hover:text-[#181715] hover:bg-[#EDEAE2] rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportStep('review')}
                      disabled={previewTelegramParts.length === 0}
                      className="min-h-[40px] px-5 text-xs font-sans font-bold bg-[#181715] text-[#FFFDF9] rounded-xl disabled:opacity-40 hover:bg-[#2E2C28] transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <span>
                        {previewTelegramParts.length > 0
                          ? `Next: Review (${previewTelegramParts.length})`
                          : 'Next: Review'}
                      </span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Step 2 Summary & Bulk Toggle Bar */}
                  <div className="px-5 py-2.5 border-b border-[#EFECE6] bg-[#F6F4EF] flex items-center justify-between gap-2 flex-wrap flex-shrink-0">
                    <span className="text-xs font-sans font-semibold text-[#181715] tabular-nums">
                      {previewTelegramParts.length}{' '}
                      {previewTelegramParts.length === 1 ? 'part' : 'parts'} found ·{' '}
                      {previewLinksCount} with{' '}
                      {previewLinksCount === 1 ? 'video link' : 'video links'}
                    </span>
                    {previewTelegramParts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowBulkLinks((prev) => !prev)}
                        className="text-xs font-sans font-semibold text-[#181715] hover:text-[#57534E] underline underline-offset-2 cursor-pointer whitespace-nowrap"
                      >
                        {showBulkLinks ? 'Hide bulk links' : 'Paste links in bulk'}
                      </button>
                    )}
                  </div>

                  {/* Step 2 Scrollable Review Body */}
                  <div className="px-5 py-3.5 flex flex-col gap-2.5 flex-1 min-h-0 overflow-y-auto bg-[#F6F4EF]">
                    {previewTelegramParts.length > 0 && previewLinksCount === 0 && (
                      <div className="rounded-2xl border border-[#E4E0D8] bg-[#FFFDF9] px-3.5 py-2.5 text-xs font-sans text-[#57534E] leading-relaxed flex flex-col gap-1.5 flex-shrink-0">
                        <span>
                          No video links found in this paste. Try copying the whole post again, or add links by hand below.
                        </span>
                        {!showBulkLinks && (
                          <button
                            type="button"
                            onClick={() => setShowBulkLinks(true)}
                            className="self-start text-xs font-sans font-bold text-[#181715] underline underline-offset-2 hover:text-[#2E2C28] cursor-pointer"
                          >
                            Paste links in bulk →
                          </button>
                        )}
                      </div>
                    )}

                    {/* Collapsible Bulk Link Pasting Panel */}
                    {showBulkLinks && previewTelegramParts.length > 0 && (
                      <div className="p-3.5 rounded-2xl border border-[#E4E0D8] bg-[#FFFDF9] flex-shrink-0 flex flex-col gap-2 shadow-2xs animate-in fade-in duration-150">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[11px] font-sans font-bold text-[#181715] uppercase tracking-wider">
                            Paste video links (one per line)
                          </span>
                          <div className="flex items-center gap-2.5">
                            {bulkLinksList.length > 0 && (
                              <span className="text-[11px] font-sans font-medium text-[#57534E] tabular-nums">
                                {Math.min(bulkLinksList.length, previewTelegramParts.length)} of{' '}
                                {previewTelegramParts.length} matched
                                {bulkLinksList.length > previewTelegramParts.length
                                  ? ` (${bulkLinksList.length - previewTelegramParts.length} extra)`
                                  : ''}
                              </span>
                            )}
                            {bulkLinksText.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setBulkLinksText('')}
                                className="text-[11px] font-sans font-semibold text-[#78716C] hover:text-[#181715] cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                        <textarea
                          id={`telegram-bulk-links-${lesson.id}`}
                          rows={3}
                          value={bulkLinksText}
                          onChange={(e) => setBulkLinksText(e.target.value)}
                          placeholder={'https://youtu.be/...\nhttps://youtu.be/...'}
                          className="w-full font-sans text-xs p-2.5 rounded-xl border border-[#E4E0D8] bg-[#F6F4EF] text-[#181715] focus:border-[#181715] focus:bg-[#FFFDF9] focus:outline-none resize-y min-h-[72px] max-h-[120px]"
                        />
                      </div>
                    )}

                    {previewTelegramParts.length === 0 ? (
                      <div className="flex-1 min-h-[140px] flex flex-col items-center justify-center text-center px-4 gap-2">
                        <span className="text-xs font-sans text-[#78716C]">
                          All parsed entries were removed from the preview.
                        </span>
                        {rawParsedTelegramParts.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setRemovedPreviewIds({})}
                            className="text-xs font-sans font-semibold text-[#181715] underline underline-offset-2 cursor-pointer"
                          >
                            Restore all ({rawParsedTelegramParts.length})
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {previewTelegramParts.map((item) => {
                          const alreadyExists = existingPartNamesSet.has(item.name.trim().toLowerCase());
                          return (
                            <div
                              key={item.id}
                              className="rounded-2xl border border-[#E4E0D8] bg-[#FFFDF9] p-3 flex flex-col gap-2 shadow-[0_1px_2px_rgba(24,23,21,0.03)]"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-sans font-bold text-xs text-[#181715]">
                                      {item.name}
                                    </span>
                                    {item.effectiveVideoLink && (
                                      <span
                                        title={item.effectiveVideoLink}
                                        className="inline-flex items-center text-[#16A34A]"
                                      >
                                        <Link2 size={12} />
                                      </span>
                                    )}
                                    {alreadyExists && (
                                      <span className="text-[11px] font-sans font-medium text-[#78716C]">
                                        · Already exists (will skip)
                                      </span>
                                    )}
                                  </div>

                                  {item.title && (
                                    <p className="text-xs font-sans text-[#57534E] leading-relaxed whitespace-normal break-words mt-1 m-0">
                                      {item.title}
                                    </p>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setRemovedPreviewIds((prev) => ({
                                      ...prev,
                                      [item.id]: true,
                                    }))
                                  }
                                  title={`Remove ${item.name} from import`}
                                  aria-label={`Remove ${item.name}`}
                                  className="w-8 h-8 -mt-1 -mr-1 rounded-lg flex items-center justify-center text-[#78716C] hover:text-[#DC2626] hover:bg-red-50/70 transition-colors cursor-pointer flex-shrink-0"
                                >
                                  <X size={14} />
                                </button>
                              </div>

                              {/* Optional manual video link field (type="url" bypasses unlayered text-input rule) */}
                              <div className="flex items-center gap-2">
                                <Link2
                                  size={13}
                                  className={
                                    item.effectiveVideoLink
                                      ? 'text-[#181715] flex-shrink-0'
                                      : 'text-[#A8A29E] flex-shrink-0'
                                  }
                                />
                                <input
                                  type="url"
                                  value={item.rawLink}
                                  onChange={(e) =>
                                    setEditedLinks((prev) => ({
                                      ...prev,
                                      [item.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Optional video link (https://...)"
                                  aria-label={`Video link for ${item.name}`}
                                  className="w-full font-sans text-xs px-2.5 py-2 rounded-xl border border-[#E4E0D8] bg-[#F6F4EF] text-[#181715] placeholder:text-[#A8A29E] focus:border-[#181715] focus:bg-[#FFFDF9] focus:outline-none transition-colors"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Step 2 Sticky Footer */}
                  <div className="px-5 py-3.5 border-t border-[#EFECE6] bg-[#FFFDF9] flex items-center justify-between gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setImportStep('paste')}
                        className="min-h-[40px] px-3 text-xs font-sans font-semibold text-[#181715] hover:bg-[#EDEAE2] rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <ArrowLeft size={14} />
                        <span>Back</span>
                      </button>
                      <button
                        type="button"
                        onClick={closeOverlay}
                        className="min-h-[40px] px-3 text-xs font-sans font-semibold text-[#57534E] hover:text-[#181715] hover:bg-[#EDEAE2] rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Cancel
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={previewTelegramParts.length === 0}
                      className="min-h-[40px] px-5 text-xs font-sans font-bold bg-[#181715] text-[#FFFDF9] rounded-xl disabled:opacity-40 hover:bg-[#2E2C28] transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Import
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  );
};
