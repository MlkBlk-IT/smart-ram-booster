import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Activity,
  Flame,
  Terminal,
  Settings,
  HardDrive
} from 'lucide-react';
import { MemoryBreakdown, BoostProfile } from '../types';
import { Logo } from './Logo';

export type NavTab = 'dashboard' | 'smart_clean' | 'processes' | 'boost' | 'scripts' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  memory: MemoryBreakdown;
  boostProfile: BoostProfile;
  theme: 'dark' | 'light';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  memory,
  boostProfile,
  theme
}) => {
  const percentUsed = Math.round((memory.inUseMb / memory.totalMb) * 100);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: <LayoutDashboard className="w-4 h-4" />
    },
    {
      id: 'smart_clean',
      label: 'Nettoyeur Intelligent',
      icon: <Sparkles className="w-4 h-4 text-sky-500" />,
      badge: '1-Clic'
    },
    {
      id: 'processes',
      label: 'Inspecteur Processus',
      icon: <Activity className="w-4 h-4" />
    },
    {
      id: 'boost',
      label: 'Boost Logiciel',
      icon: <Flame className="w-4 h-4 text-amber-500" />,
      badge: boostProfile === 'gaming' ? 'Jeu' : undefined
    },
    {
      id: 'scripts',
      label: 'Scripts Windows 11',
      icon: <Terminal className="w-4 h-4 text-emerald-500" />,
      badge: 'PS1 / BAT'
    },
    {
      id: 'settings',
      label: 'Paramètres & Matériel',
      icon: <Settings className="w-4 h-4" />
    }
  ];

  return (
    <aside className={`w-64 shrink-0 flex flex-col justify-between border-r select-none transition-colors ${
      theme === 'dark'
        ? 'bg-neutral-900/60 border-neutral-800'
        : 'bg-neutral-50/80 border-neutral-200'
    } backdrop-blur-xl p-3`}>
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 pt-1 pb-3">
        <Logo className="w-7 h-7" />
        <div className="leading-tight">
          <div className="text-xs font-bold tracking-tight">Smart RAM Booster</div>
          <div className="text-[10px] text-neutral-500 dark:text-neutral-400">Windows 11 · temps réel</div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
          Gestionnaire Mémoire
        </div>

        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? theme === 'dark'
                    ? 'bg-neutral-800 text-sky-400 font-semibold shadow-sm'
                    : 'bg-white text-sky-600 font-semibold shadow-sm border border-neutral-200'
                  : theme === 'dark'
                    ? 'text-neutral-300 hover:bg-neutral-800/50 hover:text-white'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-sky-500' : 'text-neutral-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-400'
                    : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Area: Hardware Memory Widget */}
      <div className="space-y-3">
        {/* Mini Hardware Memory Widget in Sidebar */}
        <div className={`p-3 rounded-xl border transition-colors ${
          theme === 'dark'
            ? 'bg-neutral-800/50 border-neutral-700/60'
            : 'bg-white/80 border-neutral-200'
        }`}>
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-1.5 font-medium text-neutral-700 dark:text-neutral-300">
              <HardDrive className="w-3.5 h-3.5 text-sky-500" />
              <span>RAM Physique</span>
            </div>
            <span className="font-mono tabular-nums text-xs font-semibold text-neutral-900 dark:text-neutral-100">
              {percentUsed}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full overflow-hidden bg-neutral-200 dark:bg-neutral-700 mb-2">
            <div
              className={`h-full transition-all duration-500 ${
                percentUsed > 92 ? 'bg-red-500' : percentUsed > 85 ? 'bg-amber-500' : 'bg-sky-500'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-neutral-500 dark:text-neutral-400 font-mono tabular-nums">
            <span>{(memory.inUseMb / 1024).toFixed(1)} Go utilisés</span>
            <span>{(memory.totalMb / 1024).toFixed(0)} Go total</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
