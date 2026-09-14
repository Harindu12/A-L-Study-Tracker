import React, { useState, useEffect } from 'react';
import { Subject } from '../../types';
import { Pencil, X, Trash2, AlertTriangle, Plus } from 'lucide-react';

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
      onAdd({
        name: name.trim(),
      });
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm rounded-3xl p-6 border border-[#EBEBEB] shadow-2xl bg-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Plus size={20} className="text-[#1A1A1A]" />
            <h3 className="font-sans text-xl font-extrabold text-[#1A1A1A] m-0">Add Subject</h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8A8A8A] hover:text-[#1A1A1A] rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1.5">
              Subject Name
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full font-sans text-sm p-2.5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
              placeholder="e.g. Chemistry"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#1A1A1A] hover:bg-[#F2F2F2] rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 text-xs font-bold bg-[#1A1A1A] text-white rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity cursor-pointer"
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 border border-[#EBEBEB] shadow-2xl bg-white animate-in slide-in-from-bottom-5 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 mb-4 border-b border-[#EBEBEB]">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-9 h-9 rounded-xl bg-[#F0F0F0] text-[#1A1A1A] flex items-center justify-center font-bold text-xs flex-shrink-0">
              {subject.name.trim().slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h3 className="font-sans text-base font-bold text-[#1A1A1A] truncate m-0">
                {subject.name}
              </h3>
              <p className="text-xs font-sans text-[#8A8A8A] m-0">
                Subject options
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8A8A8A] hover:text-[#1A1A1A] rounded-full transition-colors cursor-pointer"
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
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#EBEBEB] bg-white hover:bg-[#F8F8F8] hover:border-[#1A1A1A] text-left transition-colors cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#F0F0F0] text-[#1A1A1A] flex items-center justify-center flex-shrink-0 group-hover:bg-[#1A1A1A] group-hover:text-white transition-colors">
              <Pencil size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-sans font-bold text-sm text-[#1A1A1A] transition-colors">
                Edit Subject
              </div>
              <div className="text-xs font-sans text-[#8A8A8A]">
                Update subject name
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
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-200 bg-white hover:bg-red-50/50 hover:border-red-400 text-left transition-colors cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 group-hover:bg-red-600 group-hover:text-white transition-colors">
              <Trash2 size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-sans font-bold text-sm text-red-600 transition-colors">
                Delete Subject
              </div>
              <div className="text-xs font-sans text-red-500">
                Remove subject, lessons, and revisits
              </div>
            </div>
          </button>
        </div>

        <div className="mt-4 pt-2 border-t border-[#EBEBEB]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-center text-xs font-sans font-semibold text-[#8A8A8A] hover:text-[#1A1A1A] transition-colors cursor-pointer"
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm rounded-3xl p-6 border border-[#EBEBEB] shadow-2xl bg-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Pencil size={18} className="text-[#1A1A1A]" />
            <h3 className="font-sans text-xl font-extrabold text-[#1A1A1A] m-0">Edit Subject</h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8A8A8A] hover:text-[#1A1A1A] rounded-full transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1.5">
              Subject Name
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full font-sans text-sm p-2.5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
              placeholder="e.g. Physics"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#1A1A1A] hover:bg-[#F2F2F2] rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2 text-xs font-bold bg-[#1A1A1A] text-white rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity cursor-pointer"
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm rounded-3xl p-6 border border-[#EBEBEB] shadow-2xl bg-white animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-3">
          <div className="p-2.5 rounded-full bg-red-100 text-red-600 flex-shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h3 className="font-sans text-base font-bold text-[#1A1A1A] m-0">
              Delete {subject.name}?
            </h3>
            <p className="text-xs font-sans text-[#8A8A8A] mt-1.5 leading-relaxed">
              Delete {subject.name} and all its lessons? This cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#1A1A1A] hover:bg-[#F2F2F2] rounded-xl cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(subject.id);
              onClose();
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-sans font-bold text-xs py-2 px-5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Delete Subject
          </button>
        </div>
      </div>
    </div>
  );
};
