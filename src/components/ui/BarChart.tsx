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
    <div className="flex items-end justify-between h-36 mt-4 gap-2 border-b border-[#E0E0E0] pb-2 px-1">
      {data.map((d, i) => {
        const heightPct = Math.max((d.value / max) * 100, 2);
        const isActive = d.value > 0;
        
        return (
          <div key={i} className="flex flex-col items-center gap-2 flex-1 h-full">
            <div className="w-full flex-1 flex items-end justify-center relative group">
              {/* Background track */}
              <div className="absolute bottom-0 w-3/4 max-w-[20px] bg-[#E5E5E5] rounded-md h-full"></div>
              {/* Active bar */}
              <div 
                className={`w-3/4 max-w-[20px] rounded-md z-10 transition-all duration-300 ease-out ${
                  isActive ? 'bg-[#111111]' : 'bg-transparent'
                }`}
                style={{ height: `${heightPct}%`, minHeight: isActive ? '6px' : '0' }}
              ></div>
              
              {/* Tooltip on hover */}
              {isActive && (
                <div className="absolute -top-7 bg-[#111111] text-[#FFFFFF] text-[10px] font-sans px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                  {d.value}
                </div>
              )}
            </div>
            <span className={`text-[0.68rem] font-sans font-semibold uppercase tracking-wider ${
              isActive ? 'text-[#111111]' : 'text-[#8A8A8A]'
            }`}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
