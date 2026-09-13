import React, { useState } from 'react';
import { Calendar, X } from 'lucide-react';

interface ExamDateModalProps {
  currentDate?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (date: string) => void;
}

export const ExamDateModal: React.FC<ExamDateModalProps> = ({
  currentDate,
  isOpen,
  onClose,
  onSave,
}) => {
  const [date, setDate] = useState(currentDate || '');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (date) {
      onSave(date);
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
            <Calendar size={20} className="text-[var(--accent)]" />
            <h3 className="font-caveat text-2xl font-bold text-[var(--accent)] m-0">Target Exam Date</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-[var(--ink-soft)] hover:text-[var(--ink)] rounded-full hover:bg-black/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-xs font-sans text-[var(--ink-soft)] mb-4">
          Set your upcoming exam or target deadline to track days remaining on your Curriculum dashboard.
        </p>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-sans font-bold text-[var(--ink)] mb-1">Exam Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="w-full font-sans text-sm p-2 rounded-xl border border-[var(--line)] bg-[#FFFDF9] focus:outline-none focus:ring-2 focus:ring-[var(--accent-line)]"
              required
            />
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
              disabled={!date}
              className="btn !py-1.5 !px-4 !text-xs disabled:opacity-50"
            >
              Save Exam Date
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
