
import React from 'react';

interface ProgressBarProps {
  percentage: number; // 0 to 100
  label?: string;
  showPercentageText?: boolean;
  color?: string; // Tailwind color class e.g., 'bg-sky-600'
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  percentage, 
  label, 
  showPercentageText = true, 
  color = 'bg-sky-600' 
}) => {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div>
      {label && <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>}
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div 
          className={`${color} h-2.5 rounded-full transition-all duration-500 ease-out`} 
          style={{ width: `${clampedPercentage}%` }}
        ></div>
      </div>
      {showPercentageText && (
        <div className="text-xs text-gray-600 mt-1 text-right">
          {clampedPercentage.toFixed(0)}%
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
