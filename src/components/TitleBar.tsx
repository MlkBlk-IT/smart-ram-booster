import React from 'react';
import { Sun, Moon, Laptop, ShieldCheck } from 'lucide-react';
import { Logo } from './Logo';

interface TitleBarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  hardwareRamTotalGb: number;
  totalRecoveredMb: number;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  theme,
  onToggleTheme,
  hardwareRamTotalGb,
  totalRecoveredMb
}) => {
  return (
    <div className={`h-11 border-b flex items-center justify-between px-3 select-none transition-colors ${
      theme === 'dark'
        ? 'bg-neutral-900/90 border-neutral-800 text-neutral-200'
        : 'bg-neutral-100/90 border-neutral-200 text-neutral-800'
    } backdrop-blur-md sticky top-0 z-50`}>
      {/* Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Logo className="w-5 h-5" />
          <span className="text-xs font-semibold tracking-tight">
            Smart RAM Booster
          </span>
          <span className="hidden md:inline text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
            Windows 11
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1">
            <Laptop className="w-3.5 h-3.5 text-sky-500" />
            <span className="font-mono tabular-nums">{hardwareRamTotalGb} Go</span> DDR4/DDR5
          </span>
          {totalRecoveredMb > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-500 dark:text-emerald-400 font-medium font-mono tabular-nums">
                +{(totalRecoveredMb / 1024).toFixed(2)} Go libérés
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: Controls & Window Actions */}
      <div className="flex items-center gap-2">
        {/* Safe Mode Guard indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 text-xs rounded text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-medium text-[11px]">Protection Système Active</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          className={`p-1.5 rounded-md text-xs transition-colors ${
            theme === 'dark'
              ? 'hover:bg-neutral-800 text-neutral-300'
              : 'hover:bg-neutral-200 text-neutral-700'
          }`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Windows 11 Window Controls */}
        <div className="flex items-center -mr-1">
          <button
            type="button"
            title="Réduire"
            className={`w-9 h-8 flex items-center justify-center text-xs transition-colors ${
              theme === 'dark' ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-200 text-neutral-600'
            }`}
          >
            ─
          </button>
          <button
            type="button"
            title="Agrandir"
            className={`w-9 h-8 flex items-center justify-center text-xs transition-colors ${
              theme === 'dark' ? 'hover:bg-neutral-800 text-neutral-400' : 'hover:bg-neutral-200 text-neutral-600'
            }`}
          >
            □
          </button>
          <button
            type="button"
            title="Fermer"
            className="w-9 h-8 flex items-center justify-center text-xs text-neutral-400 hover:bg-red-600 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};
