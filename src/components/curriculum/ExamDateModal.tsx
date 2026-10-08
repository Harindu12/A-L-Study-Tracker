import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (isOpen) {
      setDate(currentDate || '');
    }
  }, [currentDate, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (date) {
      onSave(date);
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000000]/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-sm rounded-3xl p-6 border border-[#E0E0E0] shadow-2xl bg-[#FFFFFF] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[#111111]" />
            <h3 className="font-sans text-xl font-extrabold text-[#111111] m-0">Target Exam Date</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-[#8A8A8A] hover:text-[#111111] rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs font-sans text-[#8A8A8A] mb-4">
          Set your upcoming exam or target deadline to track days remaining on your Curriculum dashboard.
        </p>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-sans font-bold text-[#8A8A8A] uppercase tracking-wider mb-1.5">
              Exam Date
            </label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="w-full font-sans text-sm p-2.5 rounded-xl border border-[#E0E0E0] bg-[#F5F5F5] text-[#111111] focus:border-[#111111] focus:outline-none"
              required
            />
          </div>

          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#111111] hover:bg-[#F0F0F0] rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!date}
              className="px-5 py-2 text-xs font-bold bg-[#111111] text-[#FFFFFF] rounded-xl disabled:opacity-40 hover:bg-[#262626] transition-colors cursor-pointer"
            >
              Save Exam Date
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
