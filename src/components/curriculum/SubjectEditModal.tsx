import React, { useState, useEffect } from 'react';
import { Subject } from '../../types';
import { Pencil, X, Trash2, AlertTriangle } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
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
            onClick={onClose}
            className="p-1 text-[var(--ink-soft)] hover:text-[var(--ink)] rounded-full hover:bg-black/5 transition-colors"
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
              Target Lesson Count <span className="text-[var(--ink-soft)] font-normal">(optional)</span>
            </label>
            <input 
              type="number" 
              value={targetCount} 
              onChange={(e) => setTargetCount(e.target.value)}
              className="w-full font-sans text-sm p-2 rounded-xl border border-[var(--line)] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[var(--accent-line)]"
              placeholder="Leave blank for raw count"
              min="1"
            />
            <p className="text-[0.7rem] text-[var(--ink-soft)] mt-1 font-sans">
              If left blank, progress displays as a raw lesson count instead of a percentage.
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm rounded-2xl p-5 border border-red-200 shadow-[0_12px_36px_rgba(120,100,70,0.18)] paper-card bg-[#FAF7F0] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2 rounded-full bg-red-100 text-red-600 mt-0.5">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-sans text-base font-bold text-[var(--ink)] m-0">Delete "{subject.name}"?</h3>
            <p className="text-xs font-sans text-[var(--ink-soft)] mt-1 leading-relaxed">
              This will permanently remove <strong>{subject.name}</strong> along with all of its <strong>{lessonCount} lessons</strong> and any revisit reminders tied to them.
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
