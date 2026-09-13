import React, { useState, useEffect } from 'react';
import { Subject } from '../../types';
import { Pencil, X, Trash2, AlertTriangle, Plus, BookOpen } from 'lucide-react';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string; targetCount?: number }) => void;
}

export const AddSubjectModal: React.FC<AddSubjectModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');
  const [targetCount, setTargetCount] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
      setTargetCount('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd({
        name: name.trim(),
        targetCount: targetCount ? parseInt(targetCount, 10) : undefined,
      });
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm rounded-2xl p-5 border border-[var(--line)] shadow-[0_12px_36px_rgba(120,100,70,0.18)] paper-card bg-[#FAF7F0] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Plus size={20} className="text-[var(--accent)]" />
            <h3 className="font-caveat text-2xl font-bold text-[var(--accent)] m-0">Add Subject</h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-[var(--ink-soft)] hover:text-[var(--ink)] rounded-full hover:bg-black/5 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-sans font-bold text-[var(--ink)] mb-1">
              Subject Name
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full font-sans text-sm p-2.5 rounded-xl border border-[var(--line)] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[var(--accent-line)]"
              placeholder="e.g. Chemistry"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-xs font-sans font-bold text-[var(--ink)] mb-1">
              Target Videos/Parts <span className="text-[var(--ink-soft)] font-normal">(optional)</span>
            </label>
            <input 
              type="number" 
              value={targetCount} 
              onChange={(e) => setTargetCount(e.target.value)}
              className="w-full font-sans text-sm p-2.5 rounded-xl border border-[var(--line)] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[var(--accent-line)]"
              placeholder="e.g. 50 (optional)"
              min="1"
            />
            <p className="text-[0.7rem] text-[var(--ink-soft)] mt-1 font-sans">
              Optionally set the total videos/parts planned for this subject to track your completion percentage.
            </p>
          </div>

          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn ghost !py-2 !px-3 !text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="btn !py-2 !px-4 !text-xs disabled:opacity-50"
            >
              Add Subject
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface SubjectActionSheetModalProps {
  subject: Subject | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (subject: Subject) => void;
  onDelete: (subject: Subject) => void;
}

export const SubjectActionSheetModal: React.FC<SubjectActionSheetModalProps> = ({
  subject,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !subject) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm rounded-t-3xl sm:rounded-2xl p-5 border border-[var(--line)] shadow-[0_16px_40px_rgba(120,100,70,0.2)] paper-card bg-[#FAF7F0] animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 mb-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center font-bold text-xs flex-shrink-0">
              {subject.name.trim().slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-sans text-base font-bold text-[var(--ink)] truncate m-0">
                {subject.name}
              </h3>
              <p className="text-[0.7rem] font-sans text-[var(--ink-soft)] m-0">
                Subject options
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-[var(--ink-soft)] hover:text-[var(--ink)] rounded-full hover:bg-black/5 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-2 my-2">
          {/* Edit Option */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(subject);
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--line)] bg-[#FFFDF9] hover:bg-[#FAF7F0] hover:border-[var(--accent)] text-left transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--accent)] group-hover:text-white transition-colors">
              <Pencil size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-sans font-bold text-sm text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                Edit Subject
              </div>
              <div className="text-xs font-sans text-[var(--ink-soft)]">
                Update subject name or target lessons
              </div>
            </div>
          </button>

          {/* Delete Option */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(subject);
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-200/80 bg-[#FFFDF9] hover:bg-red-50/50 hover:border-red-300 text-left transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <Trash2 size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-sans font-bold text-sm text-red-700 group-hover:text-red-800 transition-colors">
                Delete Subject
              </div>
              <div className="text-xs font-sans text-red-600/80">
                Remove subject, lessons, and revisits
              </div>
            </div>
          </button>
        </div>

        <div className="mt-3 pt-2 border-t border-[var(--line)]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-center text-xs font-sans font-semibold text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

interface SubjectEditModalProps {
  subject: Subject | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<Subject>) => void;
}

export const SubjectEditModal: React.FC<SubjectEditModalProps> = ({
  subject,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [targetCount, setTargetCount] = useState('');

  useEffect(() => {
    if (subject) {
      setName(subject.name || '');
      setTargetCount(subject.targetCount ? String(subject.targetCount) : '');
    }
  }, [subject]);

  if (!isOpen || !subject) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(subject.id, {
        name: name.trim(),
        targetCount: targetCount ? parseInt(targetCount, 10) : undefined,
      });
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm rounded-2xl p-5 border border-[var(--line)] shadow-[0_12px_36px_rgba(120,100,70,0.18)] paper-card bg-[#FAF7F0] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Pencil size={18} className="text-[var(--accent)]" />
            <h3 className="font-caveat text-2xl font-bold text-[var(--accent)] m-0">Edit Subject</h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1 text-[var(--ink-soft)] hover:text-[var(--ink)] rounded-full hover:bg-black/5 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-sans font-bold text-[var(--ink)] mb-1">Subject Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full font-sans text-sm p-2 rounded-xl border border-[var(--line)] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[var(--accent-line)]"
              placeholder="e.g. Physics"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-sans font-bold text-[var(--ink)] mb-1">
              Target Videos/Parts <span className="text-[var(--ink-soft)] font-normal">(optional)</span>
            </label>
            <input 
              type="number" 
              value={targetCount} 
              onChange={(e) => setTargetCount(e.target.value)}
              className="w-full font-sans text-sm p-2 rounded-xl border border-[var(--line)] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[var(--accent-line)]"
              placeholder="e.g. 50 (or leave blank)"
              min="1"
            />
            <p className="text-[0.7rem] text-[var(--ink-soft)] mt-1 font-sans">
              Set the total videos/parts planned for this subject to track your completion percentage.
            </p>
          </div>

          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn ghost !py-1.5 !px-3 !text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="btn !py-1.5 !px-4 !text-xs disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteConfirmModalProps {
  subject: Subject | null;
  lessonCount: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  subject,
  lessonCount,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !subject) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm rounded-2xl p-5 border border-red-200 shadow-[0_12px_36px_rgba(120,100,70,0.18)] paper-card bg-[#FAF7F0] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-full bg-red-100 text-red-600 mt-0.5">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-sans text-base font-bold text-[var(--ink)] m-0">
              Delete {subject.name}?
            </h3>
            <p className="text-xs font-sans text-[var(--ink-soft)] mt-1.5 leading-relaxed">
              Delete {subject.name} and all its lessons? This cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-5">
          <button
            type="button"
            onClick={onClose}
            className="btn ghost !py-1.5 !px-3 !text-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="bg-[#C2410C] hover:bg-[#9A3412] text-white font-sans font-bold text-xs py-1.5 px-4 rounded-xl shadow-sm transition-colors"
          >
            Delete Subject
          </button>
        </div>
      </div>
    </div>
  );
};

