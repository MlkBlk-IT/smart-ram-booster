import React from 'react';
import { 
  Zap, 
  RotateCcw, 
  Layers, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';
import { MemoryBreakdown, ProcessItem } from '../types';

interface DashboardViewProps {
  memory: MemoryBreakdown;
  processes: ProcessItem[];
  isOptimizing: boolean;
  onRunSmartClean: () => void;
  totalRecoveredMb: number;
  lastDeltaFreedMb: number | null;
  onSimulateLoad: (type: 'chrome_tabs' | 'gaming' | 'leak') => void;
  onResetSimulation: () => void;
  hardwareRamTotalGb: number;
  onChangeHardwareRam: (gb: 8 | 16 | 32 | 64) => void;
  theme: 'dark' | 'light';
  realMode?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  memory,
  processes,
  isOptimizing,
  onRunSmartClean,
  totalRecoveredMb,
  lastDeltaFreedMb,
  onSimulateLoad,
  onResetSimulation,
  hardwareRamTotalGb,
  onChangeHardwareRam,
  theme,
  realMode = false
}) => {
  const percentUsed = Math.round((memory.inUseMb / memory.totalMb) * 100);
  const percentStandby = Math.round((memory.standbyMb / memory.totalMb) * 100);
  const percentFree = Math.max(0, 100 - percentUsed - percentStandby);

  // Calculate waste candidates: idle background apps
  const idleProcesses = processes.filter(p => p.status === 'idle' && !p.isSystemProtected);
  const wasteMemoryMb = idleProcesses.reduce((acc, p) => acc + p.workingSetPrivateMb, 0) + memory.standbyMb;

  // Circular gauge calculations
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentUsed / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Top Banner: Real Hardware Selector & Quick Summary */}
      <div className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors ${
        theme === 'dark' ? 'bg-neutral-800/40 border-neutral-700/60' : 'bg-white border-neutral-200'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight">Moniteur de Mémoire Windows 11</h1>
            <span className="text-xs px-2 py-0.5 rounded-md font-medium text-sky-600 dark:text-sky-400 bg-sky-500/10">
              Moteur Temps Réel
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Analyse intelligente de la mémoire vive active, du cache de secours (Standby) et des pages compressées.
          </p>
        </div>

        {/* Hardware RAM selector pills */}
        <div className="flex items-center gap-1.5 self-end md:self-center">
          <span className="text-xs text-neutral-400 mr-1">Taille RAM :</span>
          {([8, 16, 32, 64] as const).map((gb) => (
            <button
              key={gb}
              onClick={() => onChangeHardwareRam(gb)}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-all ${
                hardwareRamTotalGb === gb
                  ? 'bg-sky-500 text-white shadow-sm'
                  : theme === 'dark'
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              }`}
            >
              {gb} Go
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Circular Gauge & Quick Optimize Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Circular Gauge (5 cols) */}
        <div className={`lg:col-span-5 p-6 rounded-2xl border flex flex-col items-center justify-center transition-colors ${
          theme === 'dark' ? 'bg-neutral-800/40 border-neutral-700/60' : 'bg-white border-neutral-200'
        }`}>
          <div className="relative flex items-center justify-center">
            {/* SVG Circular Gauge */}
            <svg className="w-52 h-52 -rotate-90">
              {/* Background Track */}
              <circle
                cx="104"
                cy="104"
                r={radius}
                className={theme === 'dark' ? 'stroke-neutral-700/50' : 'stroke-neutral-200'}
                strokeWidth="14"
                fill="transparent"
              />
              {/* Standby Track */}
              <circle
                cx="104"
                cy="104"
                r={radius}
                className="stroke-amber-500/30 transition-all duration-700"
                strokeWidth="14"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - ((percentUsed + percentStandby) / 100) * circumference}
                fill="transparent"
                strokeLinecap="round"
              />
              {/* In-Use Active Track */}
              <circle
                cx="104"
                cy="104"
                r={radius}
                className={`transition-all duration-700 ${
                  percentUsed > 85 ? 'stroke-amber-500' : 'stroke-sky-500'
                }`}
                strokeWidth="14"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                fill="transparent"
                strokeLinecap="round"
              />
            </svg>

            {/* Gauge Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold font-mono tracking-tight tabular-nums">
                {percentUsed}%
              </span>
              <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mt-0.5">
                Utilisée
              </span>
              <span className="text-[11px] font-mono tabular-nums text-neutral-400 mt-1">
                {(memory.freeMb / 1024).toFixed(1)} Go libres
              </span>
            </div>
          </div>

          {/* Quick Status Legend */}
          <div className="grid grid-cols-2 gap-3 w-full mt-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-xs bg-sky-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-neutral-400 text-[11px]">En cours</span>
                <span className="font-mono font-semibold tabular-nums">{(memory.inUseMb / 1024).toFixed(2)} Go</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-xs bg-amber-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-neutral-400 text-[11px]">Standby (Cache)</span>
                <span className="font-mono font-semibold tabular-nums">{(memory.standbyMb / 1024).toFixed(2)} Go</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-xs bg-purple-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-neutral-400 text-[11px]">Compressée</span>
                <span className="font-mono font-semibold tabular-nums">{(memory.compressedMb / 1024).toFixed(2)} Go</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-xs bg-emerald-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-neutral-400 text-[11px]">Libre</span>
                <span className="font-mono font-semibold tabular-nums">{(memory.freeMb / 1024).toFixed(2)} Go</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Optimization Action & Health Delta (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          {/* Main Optimizer Card */}
          <div className={`p-6 rounded-2xl border transition-colors ${
            theme === 'dark' 
              ? 'bg-gradient-to-br from-neutral-800/80 to-neutral-900 border-neutral-700/60' 
              : 'bg-gradient-to-br from-white to-sky-50/40 border-neutral-200'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-500">
                  Optimisation Intelligente Non Destructive
                </span>
                <h2 className="text-xl font-bold tracking-tight mt-1">
                  Libérer la RAM Inutile
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-md">
                  Purge sécurisée du cache Standby Windows et déchargement des pages inactives (Working Set Trim). Vos logiciels et onglets restent 100% ouverts sans perte de données.
                </p>
              </div>

              {lastDeltaFreedMb !== null && (
                <div className="shrink-0 text-right">
                  <div className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400 font-bold font-mono text-sm">
                    <TrendingDown className="w-4 h-4" />
                    <span>+{(lastDeltaFreedMb / 1024).toFixed(2)} Go</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">Dernier gain libéré</span>
                </div>
              )}
            </div>

            {/* Diagnostic callout */}
            <div className={`mt-4 p-3 rounded-xl border flex items-center gap-3 text-xs ${
              theme === 'dark' ? 'bg-neutral-800/60 border-neutral-700/50' : 'bg-neutral-50 border-neutral-200'
            }`}>
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="text-neutral-600 dark:text-neutral-300">
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {(wasteMemoryMb / 1024).toFixed(1)} Go de RAM
                </span> sont actuellement récupérables sans impacter votre travail (cache de préchargement + {idleProcesses.length} processus en veille).
              </div>
            </div>

            {/* 1-Click Action Button */}
            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={onRunSmartClean}
                disabled={isOptimizing}
                className="flex-1 py-3 px-5 rounded-xl font-semibold text-sm text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 transition-all shadow-md shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isOptimizing ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Optimisation en cours (Working Set & Standby)...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Optimiser Intelligemment Maintenant</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Metrics 3-Card Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-3.5 rounded-xl border transition-colors ${
              theme === 'dark' ? 'bg-neutral-800/40 border-neutral-700/60' : 'bg-white border-neutral-200'
            }`}>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                Applications Inactives
              </div>
              <div className="text-lg font-bold font-mono tabular-nums mt-0.5">
                {idleProcesses.length} processus
              </div>
              <div className="text-[10px] text-neutral-400 mt-1">
                {idleProcesses.length > 0
                  ? idleProcesses.slice(0, 3).map(p => p.displayName).join(', ') + (idleProcesses.length > 3 ? '...' : '')
                  : 'Aucun processus inactif detecte'}
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border transition-colors ${
              theme === 'dark' ? 'bg-neutral-800/40 border-neutral-700/60' : 'bg-white border-neutral-200'
            }`}>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                Total Libéré (Session)
              </div>
              <div className="text-lg font-bold font-mono text-emerald-500 dark:text-emerald-400 tabular-nums mt-0.5">
                +{(totalRecoveredMb / 1024).toFixed(2)} Go
              </div>
              <div className="text-[10px] text-neutral-400 mt-1">
                Gain cumulé en direct
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border transition-colors ${
              theme === 'dark' ? 'bg-neutral-800/40 border-neutral-700/60' : 'bg-white border-neutral-200'
            }`}>
              <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                Compression MMAgent
              </div>
              <div className="text-lg font-bold font-mono tabular-nums mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
                <span>{memory.compressionEnabled === false ? 'Desactivee' : 'Active'}</span>
              </div>
              <div className="text-[10px] text-neutral-400 mt-1">
                {(memory.compressedMb / 1024).toFixed(1)} Go compactés
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stacked Memory Distribution Bar */}
      <div className={`p-5 rounded-2xl border transition-colors ${
        theme === 'dark' ? 'bg-neutral-800/40 border-neutral-700/60' : 'bg-white border-neutral-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-500" />
            <h3 className="text-sm font-semibold">Répartition Détaillée de la Mémoire Vive</h3>
          </div>
          <span className="text-xs text-neutral-400 font-mono tabular-nums">
            {(memory.totalMb / 1024).toFixed(0)} Go Totaux ({memory.totalMb} Mo)
          </span>
        </div>

        {/* Multi-segment stacked bar */}
        <div className="w-full h-4 rounded-lg overflow-hidden flex bg-neutral-200 dark:bg-neutral-700">
          <div 
            style={{ width: `${percentUsed}%` }} 
            className="bg-sky-500 hover:opacity-90 transition-all"
            title={`Mémoire active utilisée : ${(memory.inUseMb / 1024).toFixed(2)} Go`}
          />
          <div 
            style={{ width: `${percentStandby}%` }} 
            className="bg-amber-500 hover:opacity-90 transition-all"
            title={`Cache en veille Standby : ${(memory.standbyMb / 1024).toFixed(2)} Go`}
          />
          <div 
            style={{ width: `${percentFree}%` }} 
            className="bg-emerald-500 hover:opacity-90 transition-all"
            title={`Mémoire Libre : ${(memory.freeMb / 1024).toFixed(2)} Go`}
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-3 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>Active : <strong className="font-mono text-neutral-800 dark:text-neutral-200">{(memory.inUseMb / 1024).toFixed(2)} Go</strong> ({percentUsed}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Standby (Cache purgeable) : <strong className="font-mono text-neutral-800 dark:text-neutral-200">{(memory.standbyMb / 1024).toFixed(2)} Go</strong> ({percentStandby}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Libre disponible : <strong className="font-mono text-neutral-800 dark:text-neutral-200">{(memory.freeMb / 1024).toFixed(2)} Go</strong> ({percentFree}%)</span>
          </div>
        </div>
      </div>

      {/* Simulation & Stress-Test Sandbox (mode demo uniquement) */}
      {!realMode && (
      <div className={`p-4 rounded-xl border transition-colors ${
        theme === 'dark' ? 'bg-neutral-800/30 border-neutral-700/50' : 'bg-neutral-50 border-neutral-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <Play className="w-3.5 h-3.5 text-sky-500" />
              <span>Simulateur de Charge & Scénarios Windows 11</span>
            </div>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
              Injectez des scénarios réels d'engorgement pour observer l'analyseur détecter la RAM inutile et la libérer.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onSimulateLoad('chrome_tabs')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-200/80 dark:bg-neutral-700/70 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 transition-colors"
            >
              + 15 Onglets Chrome
            </button>
            <button
              onClick={() => onSimulateLoad('gaming')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-200/80 dark:bg-neutral-700/70 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200 transition-colors"
            >
              + Jeu AAA (Charge lourde)
            </button>
            <button
              onClick={() => onSimulateLoad('leak')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-700 dark:text-amber-400 hover:bg-amber-500/30 transition-colors"
            >
              + Fuite Mémoire (Fuite test)
            </button>
            <button
              onClick={onResetSimulation}
              title="Réinitialiser l'état initial"
              className="p-1.5 rounded-lg text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
