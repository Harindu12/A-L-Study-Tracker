import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Lesson, LessonPart } from '../../types';
import { useStore } from '../../store';
import { useNavigation } from '../../navigation';
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
  Sparkles, 
  ListPlus, 
  X, 
  Pencil, 
  AlertTriangle, 
  BookOpen,
  Send,
  Play,
  Link2,
  ArrowLeft,
  ArrowRight
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
  const { updateLesson, updateLessonParts, deleteLesson, markLessonDone, dailyEntries, saveDailyEntry } = useStore();
  const { activeOverlay, overlayData, openOverlay, closeOverlay } = useNavigation();

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
      wakeTime: '',
      sleepTime: '',
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
        confidence: null,
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
      wakeTime: '',
      sleepTime: '',
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
        confidence: null,
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
        className="rounded-2xl border border-[#E0E0E0] bg-[#FFFFFF] hover:border-[#BDBDBD] transition-all cursor-pointer select-none overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04)]"
      >
        {/* Collapsed Card Main Row */}
        <div className="p-4 sm:p-4.5 flex items-center justify-between gap-3.5 sm:gap-4">
          {/* Left Square Badge */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
              isFullyComplete
                ? 'bg-[#111111] text-[#FFFFFF] shadow-2xs'
                : 'bg-[#F5F5F5] text-[#111111] border border-[#E0E0E0]'
            }`}
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
            <h3 className="font-sans font-bold text-base text-[#111111] truncate leading-snug">
              {lesson.name}
            </h3>
            <p className="text-xs font-sans text-[#8A8A8A] font-medium mt-0.5">
              {watchedPartsCount} / {parts.length} parts
            </p>
          </div>

          {/* Chevron to expand/collapse */}
          <div className="flex-shrink-0 text-[#8A8A8A] pl-1">
            {isExpanded ? (
              <ChevronUp size={18} strokeWidth={2.2} className="text-[#111111]" />
            ) : (
              <ChevronDown size={18} strokeWidth={2.2} />
            )}
          </div>
        </div>

        {/* Expanded Checklist of Video / Parts */}
        {isExpanded && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FAFAFA] border-t border-[#E0E0E0] p-3.5 sm:p-4 animate-in fade-in duration-150"
          >
            {/* Clean Section Header (zero-pill unboxed typography) */}
            <div className="flex items-center justify-between gap-2 mb-2.5 px-0.5">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#8A8A8A] flex items-center gap-1.5 tabular-nums">
                  <Video size={13} className="text-[#111111]" />
                  <span>Parts ({parts.length})</span>
                </span>

                {allPartsComplete && parts.length > 0 && (
                  <>
                    <span className="text-[#D4D4D4] select-none" aria-hidden="true">·</span>
                    <span className="text-[11px] font-sans font-semibold text-[#16A34A] inline-flex items-center gap-1">
                      <Check size={12} strokeWidth={2.75} />
                      <span>All complete</span>
                    </span>
                  </>
                )}
              </div>

              {parts.length > 0 && (
                <span className="text-[11px] font-sans font-medium text-[#8A8A8A] tabular-nums flex-shrink-0">
                  {completedPartsCount}/{parts.length} done
                </span>
              )}
            </div>

            {/* Two-Tier Parts List */}
            {parts.length === 0 ? (
              <div className="p-4 text-center rounded-2xl border border-dashed border-[#E0E0E0] text-xs font-sans text-[#8A8A8A] mb-3 bg-[#FFFFFF]">
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
                      className={`rounded-2xl border bg-[#FFFFFF] transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
                        isPartComplete
                          ? 'border-[#D4D4D4]'
                          : 'border-[#E0E0E0] hover:border-[#BDBDBD]'
                      }`}
                    >
                      {/* Tier 1: Identity, Actions & Full-Width Wrapped Sinhala Title */}
                      <div className="px-3.5 pt-3 pb-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="w-6 h-6 rounded-lg bg-[#F5F5F5] border border-[#E0E0E0] text-[#525252] font-sans font-bold text-[11px] tabular-nums flex items-center justify-center flex-shrink-0 select-none">
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
                                className="flex-1 min-w-0 font-sans text-xs px-2 py-1 rounded-lg border border-[#111111] bg-[#FFFFFF] text-[#111111]"
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
                                className={`text-left font-sans text-[13.5px] leading-snug text-[#111111] hover:bg-[#F5F5F5] px-1.5 py-1 -ml-1 rounded-lg transition-colors truncate cursor-text ${
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
                                className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-[#F5F5F5] border border-[#E0E0E0] text-[#111111] hover:bg-[#111111] hover:text-[#FFFFFF] hover:border-[#111111] text-[11px] font-sans font-semibold transition-colors whitespace-nowrap"
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
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#8A8A8A] hover:text-[#EF4444] hover:bg-red-50/70 transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Optional Part Title beneath part name (full width, wraps cleanly in Noto Sans Sinhala) */}
                        {part.title && (
                          <p className="mt-1.5 pl-8 pr-1 text-[12.5px] font-sans text-[#525252] leading-relaxed whitespace-normal break-words select-text m-0">
                            {part.title}
                          </p>
                        )}
                      </div>

                      {/* Tier 2: Progress Toggles Strip */}
                      <div className="border-t border-[#F0F0F0] px-2.5 py-1.5 bg-[#FAFAFA]/60 rounded-b-2xl flex items-center gap-1.5">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={part.watched}
                          onClick={() => handleToggleWatched(part.id, !part.watched)}
                          className={`flex-1 sm:flex-initial inline-flex items-center justify-center sm:justify-start gap-2 min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-sans transition-colors cursor-pointer select-none whitespace-nowrap ${
                            part.watched
                              ? 'text-[#111111] font-semibold hover:bg-[#F0F0F0]'
                              : 'text-[#6E6E6E] font-medium hover:bg-[#F0F0F0] hover:text-[#111111]'
                          }`}
                        >
                          <span
                            className={`w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 transition-colors border ${
                              part.watched
                                ? 'bg-[#16A34A] border-[#16A34A] text-[#FFFFFF]'
                                : 'bg-[#FFFFFF] border-[#D4D4D4] text-transparent'
                            }`}
                          >
                            <Check size={11} strokeWidth={3} />
                          </span>
                          <span>Watched</span>
                        </button>

                        <span className="h-4 w-px bg-[#E5E5E5] flex-shrink-0" aria-hidden="true" />

                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={part.pastPaper}
                          onClick={() => handleTogglePastPaper(part.id, !part.pastPaper)}
                          className={`flex-1 sm:flex-initial inline-flex items-center justify-center sm:justify-start gap-2 min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-sans transition-colors cursor-pointer select-none whitespace-nowrap ${
                            part.pastPaper
                              ? 'text-[#111111] font-semibold hover:bg-[#F0F0F0]'
                              : 'text-[#6E6E6E] font-medium hover:bg-[#F0F0F0] hover:text-[#111111]'
                          }`}
                        >
                          <span
                            className={`w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0 transition-colors border ${
                              part.pastPaper
                                ? 'bg-[#16A34A] border-[#16A34A] text-[#FFFFFF]'
                                : 'bg-[#FFFFFF] border-[#D4D4D4] text-transparent'
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
              <div className="mb-3 px-3.5 py-2.5 rounded-2xl border border-[#E0E0E0] bg-[#FFFFFF] flex items-center justify-between gap-2 text-xs font-sans text-[#111111] shadow-2xs animate-in fade-in duration-150">
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
                  className="p-1.5 text-[#8A8A8A] hover:text-[#111111] rounded-lg transition-colors cursor-pointer flex-shrink-0"
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
                  className="flex-1 min-w-0 font-sans text-xs px-3 py-2 rounded-xl border border-[#E0E0E0] bg-[#FFFFFF] hover:border-[#BDBDBD] focus:outline-none focus:border-[#111111] shadow-2xs text-[#111111] transition-all placeholder:text-[#8A8A8A]"
                />
                <button
                  type="submit"
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-[#111111] text-[#FFFFFF] hover:bg-[#262626] text-xs font-sans font-semibold shadow-2xs inline-flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all whitespace-nowrap flex-shrink-0"
                >
                  <Plus size={14} strokeWidth={2.4} />
                  <span>Add Part</span>
                </button>
              </form>

              <div className="grid grid-cols-2 gap-2">
                {/* Add multiple toggle button */}
                <button
                  type="button"
                  onClick={() => setShowBulkAdd((prev) => !prev)}
                  className={`min-h-[40px] px-3 py-2 text-xs font-sans font-semibold rounded-xl border transition-all inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95 ${
                    showBulkAdd
                      ? 'bg-[#111111] text-[#FFFFFF] border-[#111111] shadow-2xs'
                      : 'bg-[#FFFFFF] text-[#111111] border-[#E0E0E0] hover:bg-[#F0F0F0] shadow-2xs'
                  }`}
                  title="Generate multiple numbered parts at once"
                >
                  <ListPlus size={14} />
                  <span>{showBulkAdd ? 'Hide multiple' : 'Add multiple'}</span>
                </button>

                {/* Import from Telegram modal trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setImportFeedback(null);
                    openOverlay('curriculum-telegram-import', { lessonId: lesson.id });
                  }}
                  className="min-h-[40px] px-3 py-2 text-xs font-sans font-semibold rounded-xl border bg-[#FFFFFF] text-[#111111] border-[#E0E0E0] hover:bg-[#F0F0F0] shadow-2xs transition-all inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer active:scale-95"
                  title="Paste a Telegram post to create parts at once"
                >
                  <Send size={13} />
                  <span>Import from Telegram</span>
                </button>
              </div>

              {/* Bulk Add Generator Form Panel */}
              {showBulkAdd && (
                <div className="p-3.5 bg-[#FFFFFF] rounded-xl border border-[#E0E0E0] flex flex-col gap-2.5 shadow-2xs animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-sans font-bold text-[#111111] flex items-center gap-1.5 uppercase tracking-wider">
                      <ListPlus size={13} />
                      <span>Bulk Generate Parts</span>
                    </span>
                    <span className="text-[10px] font-sans text-[#8A8A8A] font-medium">
                      {isValidRange && bulkCount > 0
                        ? `${bulkCount} ${bulkCount === 1 ? 'part' : 'parts'} will be created`
                        : 'Please specify a valid range'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                        From
                      </label>
                      <input
                        type="number"
                        value={bulkFrom}
                        onChange={(e) => setBulkFrom(e.target.value)}
                        min="1"
                        placeholder="1"
                        className="w-full font-sans text-xs px-2.5 py-1.5 rounded-lg border border-[#E0E0E0] bg-[#F5F5F5] text-[#111111] focus:outline-none focus:border-[#111111]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                        To
                      </label>
                      <input
                        type="number"
                        value={bulkTo}
                        onChange={(e) => setBulkTo(e.target.value)}
                        min="1"
                        placeholder="12"
                        className="w-full font-sans text-xs px-2.5 py-1.5 rounded-lg border border-[#E0E0E0] bg-[#F5F5F5] text-[#111111] focus:outline-none focus:border-[#111111]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1">
                        Pattern <span className="font-normal text-[9px] text-[#8A8A8A]">({'{n}'} = number)</span>
                      </label>
                      <input
                        type="text"
                        value={bulkPattern}
                        onChange={(e) => setBulkPattern(e.target.value)}
                        placeholder="Day {n}"
                        className="w-full font-sans text-xs px-2.5 py-1.5 rounded-lg border border-[#E0E0E0] bg-[#F5F5F5] text-[#111111] focus:outline-none focus:border-[#111111]"
                      />
                    </div>
                  </div>

                  {/* Live Preview + Generate Button Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E0E0E0]">
                    <div className="text-[10px] font-sans text-[#111111] flex items-center gap-1.5 min-w-0">
                      <span className="font-bold text-[#8A8A8A] flex-shrink-0">Preview:</span>
                      <span className="font-medium bg-[#F5F5F5] px-2 py-0.5 rounded border border-[#E0E0E0] text-[#111111] truncate">
                        {previewText}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
                      <button
                        type="button"
                        onClick={() => setShowBulkAdd(false)}
                        className="text-xs font-sans font-medium text-[#8A8A8A] hover:text-[#111111] px-2.5 py-1 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleBulkGenerate}
                        disabled={!isValidRange || bulkCount <= 0}
                        className="px-3.5 py-1.5 rounded-xl bg-[#111111] text-[#FFFFFF] hover:bg-[#262626] text-xs font-sans font-semibold shadow-2xs flex items-center gap-1 disabled:opacity-40 cursor-pointer active:scale-95 transition-all"
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

      {/* Long-Press Action Sheet Modal */}
      {showActionMenu && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#000000]/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation();
            setShowActionMenu(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 border border-[#E0E0E0] shadow-2xl bg-[#FFFFFF] animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-[#E0E0E0]">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-xl bg-[#F5F5F5] text-[#111111] border border-[#E0E0E0] flex items-center justify-center font-bold text-xs flex-shrink-0">
                  <BookOpen size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-sans text-base font-bold text-[#111111] truncate m-0">
                    {lesson.name}
                  </h3>
                  <p className="text-xs font-sans text-[#8A8A8A] m-0">
                    Lesson options
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowActionMenu(false)}
                className="p-1.5 text-[#8A8A8A] hover:text-[#111111] rounded-full transition-colors cursor-pointer"
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
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#E0E0E0] bg-[#FFFFFF] hover:bg-[#F5F5F5] hover:border-[#111111] text-left transition-colors cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-[#F5F5F5] border border-[#E0E0E0] text-[#111111] flex items-center justify-center flex-shrink-0 group-hover:bg-[#111111] group-hover:text-[#FFFFFF] transition-colors">
                  <Pencil size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans font-bold text-sm text-[#111111] transition-colors">
                    Edit Title
                  </div>
                  <div className="text-xs font-sans text-[#8A8A8A]">
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
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#E0E0E0] bg-[#FFFFFF] hover:bg-[#F5F5F5] hover:border-[#111111] text-left transition-colors cursor-pointer group"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    lesson.done
                      ? 'bg-[#F5F5F5] border border-[#E0E0E0] text-[#8A8A8A]'
                      : 'bg-[#111111] text-[#FFFFFF]'
                  }`}
                >
                  {lesson.done ? <Circle size={18} /> : <Check size={18} strokeWidth={2.8} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans font-bold text-sm text-[#111111] transition-colors">
                    {lesson.done ? 'Mark Incomplete' : 'Mark Done'}
                  </div>
                  <div className="text-xs font-sans text-[#8A8A8A]">
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
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-200 bg-[#FFFFFF] hover:bg-red-50/50 hover:border-red-400 text-left transition-colors cursor-pointer group"
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
            <div className="mt-4 pt-2 border-t border-[#E0E0E0]">
              <button
                type="button"
                onClick={() => setShowActionMenu(false)}
                className="w-full py-2.5 text-center text-xs font-sans font-semibold text-[#8A8A8A] hover:text-[#111111] transition-colors cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation();
            setShowEditTitleModal(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 border border-[#E0E0E0] shadow-2xl bg-[#FFFFFF] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Pencil size={18} className="text-[#111111]" />
                <h3 className="font-sans text-xl font-extrabold text-[#111111] m-0">Edit Lesson Title</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEditTitleModal(false)}
                className="p-1.5 text-[#8A8A8A] hover:text-[#111111] rounded-full transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTitle} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1.5">
                  Lesson Name
                </label>
                <input
                  type="text"
                  value={editTitleValue}
                  onChange={(e) => setEditTitleValue(e.target.value)}
                  className="w-full font-sans text-sm p-2.5 rounded-xl border border-[#E0E0E0] bg-[#F5F5F5] text-[#111111] focus:border-[#111111] focus:outline-none"
                  placeholder="e.g. Chemical Bonding"
                  autoFocus
                  required
                />
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowEditTitleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#111111] hover:bg-[#F0F0F0] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!editTitleValue.trim()}
                  className="px-5 py-2 text-xs font-bold bg-[#111111] text-[#FFFFFF] rounded-xl disabled:opacity-40 hover:bg-[#262626] transition-colors cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteConfirmModal(false);
          }}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-6 border border-[#E0E0E0] shadow-2xl bg-[#FFFFFF] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2.5 rounded-full bg-red-100 text-red-600 flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-sans text-base font-bold text-[#111111] m-0">
                  Delete Lesson?
                </h3>
                <p className="text-xs font-sans text-[#8A8A8A] mt-1.5 leading-relaxed">
                  Delete <strong className="text-[#111111] font-semibold">{lesson.name}</strong> and all its parts? This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#111111] hover:bg-[#F0F0F0] rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-sans font-bold text-xs py-2 px-5 rounded-xl shadow-2xs transition-colors cursor-pointer"
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
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#000000]/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation();
            closeOverlay();
          }}
        >
          <div
            className="w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[88dvh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-[#E0E0E0] shadow-2xl bg-[#FFFFFF] overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Consistent Monochrome Header */}
            <div className="px-5 pt-5 pb-3.5 border-b border-[#F0F0F0] flex items-start justify-between gap-3 flex-shrink-0">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#F5F5F5] border border-[#E0E0E0] flex items-center justify-center text-[#111111] flex-shrink-0 mt-0.5">
                  <Send size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-sans text-base sm:text-lg font-extrabold text-[#111111] m-0 leading-snug">
                    Import from Telegram
                  </h3>
                  <p className="text-xs font-sans text-[#8A8A8A] truncate m-0">
                    {lesson.name}
                  </p>
                  <p className="text-[11px] font-sans font-semibold text-[#525252] tabular-nums mt-1 m-0">
                    {importStep === 'paste'
                      ? 'Step 1 of 2 · Paste post'
                      : 'Step 2 of 2 · Review & links'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeOverlay}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#8A8A8A] hover:text-[#111111] hover:bg-[#F5F5F5] transition-colors cursor-pointer flex-shrink-0 -mr-1"
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
                        className="text-[11px] font-sans font-bold text-[#8A8A8A] uppercase tracking-wider"
                      >
                        Paste the Telegram post here
                      </span>
                      {telegramText.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearRichPasteBox}
                          className="min-h-[28px] px-2 text-xs font-sans font-semibold text-[#525252] hover:text-[#111111] hover:bg-[#F5F5F5] rounded-lg transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="relative flex-1 min-h-[190px] flex flex-col">
                      {telegramText.length === 0 && (
                        <div className="pointer-events-none absolute inset-0 p-3.5 font-sans text-[13px] leading-relaxed text-[#8A8A8A]/70 whitespace-pre-wrap select-none overflow-hidden">
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
                        className="w-full flex-1 min-h-[190px] max-h-[42dvh] overflow-y-auto font-sans text-[13px] leading-relaxed p-3.5 rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none whitespace-pre-wrap break-words transition-colors"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <p className="text-[11.5px] font-sans text-[#8A8A8A] m-0 leading-snug">
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
                              <span className="text-xs font-sans text-[#8A8A8A]">
                                All {rawParsedTelegramParts.length} parsed entries were removed.
                              </span>
                              <button
                                type="button"
                                onClick={() => setRemovedPreviewIds({})}
                                className="text-xs font-sans font-semibold text-[#111111] underline underline-offset-2 cursor-pointer"
                              >
                                Restore all
                              </button>
                            </div>
                          ) : (
                            <p className="text-xs font-sans font-semibold text-[#111111] tabular-nums m-0">
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
                  <div className="px-5 py-3.5 border-t border-[#F0F0F0] bg-[#FFFFFF] flex items-center justify-between gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={closeOverlay}
                      className="min-h-[40px] px-4 text-xs font-sans font-semibold text-[#525252] hover:text-[#111111] hover:bg-[#F5F5F5] rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportStep('review')}
                      disabled={previewTelegramParts.length === 0}
                      className="min-h-[40px] px-5 text-xs font-sans font-bold bg-[#111111] text-[#FFFFFF] rounded-xl disabled:opacity-40 hover:bg-[#262626] transition-colors cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap"
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
                  <div className="px-5 py-2.5 border-b border-[#F0F0F0] bg-[#FAFAFA] flex items-center justify-between gap-2 flex-wrap flex-shrink-0">
                    <span className="text-xs font-sans font-semibold text-[#111111] tabular-nums">
                      {previewTelegramParts.length}{' '}
                      {previewTelegramParts.length === 1 ? 'part' : 'parts'} found ·{' '}
                      {previewLinksCount} with{' '}
                      {previewLinksCount === 1 ? 'video link' : 'video links'}
                    </span>
                    {previewTelegramParts.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowBulkLinks((prev) => !prev)}
                        className="text-xs font-sans font-semibold text-[#111111] hover:text-[#525252] underline underline-offset-2 cursor-pointer whitespace-nowrap"
                      >
                        {showBulkLinks ? 'Hide bulk links' : 'Paste links in bulk'}
                      </button>
                    )}
                  </div>

                  {/* Step 2 Scrollable Review Body */}
                  <div className="px-5 py-3.5 flex flex-col gap-2.5 flex-1 min-h-0 overflow-y-auto bg-[#FAFAFA]">
                    {previewTelegramParts.length > 0 && previewLinksCount === 0 && (
                      <div className="rounded-2xl border border-[#E0E0E0] bg-[#FFFFFF] px-3.5 py-2.5 text-xs font-sans text-[#525252] leading-relaxed flex flex-col gap-1.5 flex-shrink-0">
                        <span>
                          No video links found in this paste. Try copying the whole post again, or add links by hand below.
                        </span>
                        {!showBulkLinks && (
                          <button
                            type="button"
                            onClick={() => setShowBulkLinks(true)}
                            className="self-start text-xs font-sans font-bold text-[#111111] underline underline-offset-2 hover:text-[#262626] cursor-pointer"
                          >
                            Paste links in bulk →
                          </button>
                        )}
                      </div>
                    )}

                    {/* Collapsible Bulk Link Pasting Panel */}
                    {showBulkLinks && previewTelegramParts.length > 0 && (
                      <div className="p-3.5 rounded-2xl border border-[#E0E0E0] bg-[#FFFFFF] flex-shrink-0 flex flex-col gap-2 shadow-2xs animate-in fade-in duration-150">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[11px] font-sans font-bold text-[#111111] uppercase tracking-wider">
                            Paste video links (one per line)
                          </span>
                          <div className="flex items-center gap-2.5">
                            {bulkLinksList.length > 0 && (
                              <span className="text-[11px] font-sans font-medium text-[#525252] tabular-nums">
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
                                className="text-[11px] font-sans font-semibold text-[#8A8A8A] hover:text-[#111111] cursor-pointer"
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
                          className="w-full font-sans text-xs p-2.5 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none resize-y min-h-[72px] max-h-[120px]"
                        />
                      </div>
                    )}

                    {previewTelegramParts.length === 0 ? (
                      <div className="flex-1 min-h-[140px] flex flex-col items-center justify-center text-center px-4 gap-2">
                        <span className="text-xs font-sans text-[#8A8A8A]">
                          All parsed entries were removed from the preview.
                        </span>
                        {rawParsedTelegramParts.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setRemovedPreviewIds({})}
                            className="text-xs font-sans font-semibold text-[#111111] underline underline-offset-2 cursor-pointer"
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
                              className="rounded-2xl border border-[#E0E0E0] bg-[#FFFFFF] p-3 flex flex-col gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-sans font-bold text-xs text-[#111111]">
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
                                      <span className="text-[11px] font-sans font-medium text-[#8A8A8A]">
                                        · Already exists (will skip)
                                      </span>
                                    )}
                                  </div>

                                  {item.title && (
                                    <p className="text-xs font-sans text-[#525252] leading-relaxed whitespace-normal break-words mt-1 m-0">
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
                                  className="w-8 h-8 -mt-1 -mr-1 rounded-lg flex items-center justify-center text-[#8A8A8A] hover:text-[#EF4444] hover:bg-red-50/70 transition-colors cursor-pointer flex-shrink-0"
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
                                      ? 'text-[#111111] flex-shrink-0'
                                      : 'text-[#A3A3A3] flex-shrink-0'
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
                                  className="w-full font-sans text-xs px-2.5 py-2 rounded-xl border border-[#E0E0E0] bg-[#FAFAFA] text-[#111111] placeholder:text-[#A3A3A3] focus:border-[#111111] focus:bg-[#FFFFFF] focus:outline-none transition-colors"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Step 2 Sticky Footer */}
                  <div className="px-5 py-3.5 border-t border-[#F0F0F0] bg-[#FFFFFF] flex items-center justify-between gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setImportStep('paste')}
                        className="min-h-[40px] px-3 text-xs font-sans font-semibold text-[#111111] hover:bg-[#F5F5F5] rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <ArrowLeft size={14} />
                        <span>Back</span>
                      </button>
                      <button
                        type="button"
                        onClick={closeOverlay}
                        className="min-h-[40px] px-3 text-xs font-sans font-semibold text-[#525252] hover:text-[#111111] hover:bg-[#F5F5F5] rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                      >
                        Cancel
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={previewTelegramParts.length === 0}
                      className="min-h-[40px] px-5 text-xs font-sans font-bold bg-[#111111] text-[#FFFFFF] rounded-xl disabled:opacity-40 hover:bg-[#262626] transition-colors cursor-pointer whitespace-nowrap"
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
