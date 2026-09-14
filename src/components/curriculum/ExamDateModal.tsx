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
            <Calendar size={18} className="text-[#1A1A1A]" />
            <h3 className="font-sans text-xl font-extrabold text-[#1A1A1A] m-0">Target Exam Date</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-[#8A8A8A] hover:text-[#1A1A1A] rounded-full transition-colors cursor-pointer"
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
              className="w-full font-sans text-sm p-2.5 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
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
              disabled={!date}
              className="px-5 py-2 text-xs font-bold bg-[#1A1A1A] text-white rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity cursor-pointer"
            >
              Save Exam Date
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
