import React, { useState, useEffect } from 'react';
import { Subject } from '../../types';
import { Pencil, X, Trash2, AlertTriangle } from 'lucide-react';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { name: string }) => void;
}

export const AddSubjectModal: React.FC<AddSubjectModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd({ name: name.trim() });
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#181715]/45 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-[#E4E0D8] shadow-2xl bg-[#FFFDF9] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-sans text-lg font-extrabold text-[#181715] m-0">Add Subject</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#78716C] hover:text-[#181715] hover:bg-[#EDEAE2] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-sans font-semibold text-[#57534E] mb-1.5">
              Subject Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full font-sans text-sm px-3.5 py-2.5 rounded-xl border border-[#E4E0D8] bg-[#F6F4EF] text-[#181715] focus:border-[#181715] focus:bg-[#FFFDF9]"
              placeholder="e.g. Chemistry"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 text-xs font-semibold text-[#57534E] hover:text-[#181715] hover:bg-[#EDEAE2] rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="min-h-[40px] px-5 py-2 text-xs font-bold bg-[#181715] text-[#FFFDF9] rounded-xl disabled:opacity-40 hover:bg-[#2E2C28] transition-colors cursor-pointer"
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#181715]/45 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-[#E4E0D8] shadow-2xl bg-[#FFFDF9] animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 mb-3 border-b border-[#EFECE6]">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-[#F6F4EF] border border-[#E4E0D8] text-[#181715] flex items-center justify-center font-bold text-xs flex-shrink-0">
              {subject.name.trim().slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-sans text-base font-bold text-[#181715] truncate m-0">
                {subject.name}
              </h3>
              <p className="text-xs font-sans text-[#78716C] m-0">Subject options</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#78716C] hover:text-[#181715] hover:bg-[#EDEAE2] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex flex-col gap-2 my-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(subject);
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#E4E0D8] bg-[#FFFDF9] hover:bg-[#F6F4EF] text-left transition-colors cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#F6F4EF] border border-[#E4E0D8] text-[#181715] flex items-center justify-center flex-shrink-0 group-hover:bg-[#181715] group-hover:text-[#FFFDF9] transition-colors">
              <Pencil size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-sans font-bold text-sm text-[#181715]">Edit Subject</div>
              <div className="text-xs font-sans text-[#78716C]">Update subject name</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(subject);
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-200 bg-[#FFFDF9] hover:bg-red-50/60 text-left transition-colors cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-red-50 text-[#DC2626] flex items-center justify-center flex-shrink-0 group-hover:bg-[#DC2626] group-hover:text-white transition-colors">
              <Trash2 size={17} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-sans font-bold text-sm text-[#DC2626]">Delete Subject</div>
              <div className="text-xs font-sans text-[#DC2626]/80">
                Remove subject, lessons, and revisits
              </div>
            </div>
          </button>
        </div>

        <div className="mt-3 pt-2 border-t border-[#EFECE6]">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[40px] py-2 text-center text-xs font-sans font-semibold text-[#78716C] hover:text-[#181715] transition-colors cursor-pointer"
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
  onSave: (id: string, newName: string) => void;
}

export const SubjectEditModal: React.FC<SubjectEditModalProps> = ({
  subject,
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (subject) {
      setName(subject.name || '');
    }
  }, [subject]);

  if (!isOpen || !subject) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(subject.id, name.trim());
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#181715]/45 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-[#E4E0D8] shadow-2xl bg-[#FFFDF9] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-sans text-lg font-extrabold text-[#181715] m-0">Edit Subject</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#78716C] hover:text-[#181715] hover:bg-[#EDEAE2] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-sans font-semibold text-[#57534E] mb-1.5">
              Subject Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full font-sans text-sm px-3.5 py-2.5 rounded-xl border border-[#E4E0D8] bg-[#F6F4EF] text-[#181715] focus:border-[#181715] focus:bg-[#FFFDF9]"
              placeholder="e.g. Physics"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 text-xs font-semibold text-[#57534E] hover:text-[#181715] hover:bg-[#EDEAE2] rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="min-h-[40px] px-5 py-2 text-xs font-bold bg-[#181715] text-[#FFFDF9] rounded-xl disabled:opacity-40 hover:bg-[#2E2C28] transition-colors cursor-pointer"
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
  lessonCount?: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (subjId: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  subject,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !subject) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#181715]/45 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-[#E4E0D8] shadow-2xl bg-[#FFFDF9] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2.5 rounded-full bg-red-100 text-[#DC2626] flex-shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-sans text-base font-bold text-[#181715] m-0">
              Delete {subject.name}?
            </h3>
            <p className="text-xs font-sans text-[#78716C] mt-1.5 leading-relaxed">
              Delete {subject.name} and all its lessons? This cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-4 py-2 text-xs font-semibold text-[#57534E] hover:text-[#181715] hover:bg-[#EDEAE2] rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(subject.id);
              onClose();
            }}
            className="min-h-[40px] bg-[#DC2626] hover:bg-red-700 text-white font-sans font-bold text-xs py-2 px-5 rounded-xl transition-colors cursor-pointer"
          >
            Delete Subject
          </button>
        </div>
      </div>
    </div>
  );
};
