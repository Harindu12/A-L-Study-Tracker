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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#000000]/55 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-[#E5E5E0] shadow-2xl bg-[#FFFFFF] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Calendar size={17} className="text-[#111111]" />
            <h3 className="font-sans text-lg font-extrabold text-[#111111] m-0">
              Target Exam Date
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#787873] hover:text-[#111111] hover:bg-[#F2F2EE] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        <p className="text-xs font-sans text-[#787873] mb-4 leading-relaxed">
          Set your upcoming exam date to calculate days remaining and weekly pace targets.
        </p>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-sans font-semibold text-[#525252] mb-1.5">
              Exam Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full font-sans text-sm px-3.5 py-2.5 rounded-xl border border-[#E5E5E0] bg-[#F7F7F5] text-[#111111] focus:border-[#111111] focus:bg-[#FFFFFF]"
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 text-xs font-semibold text-[#525252] hover:text-[#111111] hover:bg-[#F2F2EE] rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!date}
              className="min-h-[40px] px-5 py-2 text-xs font-bold bg-[#111111] text-[#FFFFFF] rounded-xl disabled:opacity-40 hover:bg-[#262626] transition-colors cursor-pointer"
            >
              Save Exam Date
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
