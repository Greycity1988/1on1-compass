import React from 'react';
import { useLang } from '../i18n/lang';

interface CompassLogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const CompassLogo: React.FC<CompassLogoProps> = ({
  size = 36,
  className = '',
  showText = false,
}) => {
  const { t } = useLang();
  return (
    <div className={`inline-flex items-center space-x-2.5 select-none ${className}`}>
      <div
        className="relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-2 shadow-md border border-slate-700/40 dark:border-emerald-500/30 dark:shadow-[0_0_15px_rgba(168,255,26,0.15)]"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full transform transition-transform duration-300 hover:rotate-45"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Ring */}
          <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="3" className="text-slate-600 dark:text-slate-600" />
          <circle cx="50" cy="50" r="36" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" className="text-emerald-500/50 dark:text-[#A8FF1A]/50" />
          
          {/* Cardinal Ticks */}
          <line x1="50" y1="12" x2="50" y2="18" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
          <line x1="50" y1="82" x2="50" y2="88" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
          <line x1="12" y1="50" x2="18" y2="50" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
          <line x1="82" y1="50" x2="88" y2="50" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
          
          {/* North Needle (Emerald / Lime) */}
          <polygon points="50,18 58,50 50,42 42,50" fill="#10b981" className="dark:fill-[#A8FF1A]" />
          
          {/* South Needle (Slate) */}
          <polygon points="50,82 58,50 50,58 42,50" fill="#94a3b8" className="dark:fill-slate-500" />
          
          {/* Center Pivot */}
          <circle cx="50" cy="50" r="5" fill="#ffffff" />
          <circle cx="50" cy="50" r="2.5" fill="#0f172a" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center space-x-1.5">
            <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
              1on1 <span className="text-emerald-600 dark:text-[#A8FF1A]">Compass</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-[#A8FF1A] border border-emerald-300/40 dark:border-emerald-500/30">
              AI Copilot
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {t.meta.tagline}
          </span>
        </div>
      )}
    </div>
  );
};
