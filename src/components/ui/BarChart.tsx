import React from 'react';

export interface BarChartData {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartData[];
}

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const max = Math.max(...data.map(d => d.value), 1); // Avoid division by zero
  
  return (
    <div className="flex items-end justify-between h-40 mt-4 gap-2 border-b-2 border-[var(--line)] pb-2 px-1">
      {data.map((d, i) => {
        const heightPct = Math.max((d.value / max) * 100, 2);
        const isActive = d.value > 0;
        
        return (
          <div key={i} className="flex flex-col items-center gap-2 flex-1 h-full">
            <div className="w-full flex-1 flex items-end justify-center relative group">
              {/* Background track */}
              <div className="absolute bottom-0 w-3/4 max-w-[24px] bg-[var(--accent-soft)] rounded-md h-full opacity-40"></div>
              {/* Active bar */}
              <div 
                className={`w-3/4 max-w-[24px] rounded-md z-10 transition-all duration-500 ease-out ${isActive ? 'bg-[var(--accent)] shadow-sm' : 'bg-transparent'}`}
                style={{ height: `${heightPct}%`, minHeight: isActive ? '6px' : '0' }}
              ></div>
              
              {/* Tooltip on hover/active (optional enhancement) */}
              {isActive && (
                <div className="absolute -top-8 bg-[var(--ink)] text-white text-[10px] font-sans px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {d.value}
                </div>
              )}
            </div>
            <span className={`text-[0.7rem] font-sans font-medium uppercase tracking-wider ${isActive ? 'text-[var(--ink)]' : 'text-[var(--ink-soft)]'}`}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
