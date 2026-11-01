import React from 'react';
import { 
  Sparkles, 
  Check, 
  RotateCcw, 
  ShieldCheck, 
  CheckCircle2, 
  Zap, 
  Layers, 
  Trash2, 
  ArrowRight,
  TrendingDown
} from 'lucide-react';
import { MemoryBreakdown, OptimizationLog, ProcessItem } from '../types';

interface SmartCleanViewProps {
  memory: MemoryBreakdown;
  processes: ProcessItem[];
  isOptimizing: boolean;
  cleanStep: number; // 0: idle, 1: scanning, 2: trimming, 3: purging standby, 4: complete
  onRunSmartClean: () => void;
  logs: OptimizationLog[];
  onClearLogs: () => void;
  lastDeltaFreedMb: number | null;
  theme: 'dark' | 'light';
}

export const SmartCleanView: React.FC<SmartCleanViewProps> = ({
  memory,
  processes,
  isOptimizing,
  cleanStep,
  onRunSmartClean,
  logs,
  onClearLogs,
  lastDeltaFreedMb,
  theme
}) => {
  const idleCount = processes.filter(p => p.status === 'idle' && !p.isSystemProtected).length;
  const trimmedCount = processes.filter(p => p.status === 'trimmed').length;

  const steps = [
    {
      num: 1,
      title: 'Scan des applications inactives',
      desc: 'Identification des onglets de navigateur et programmes en arrière-plan.'
    },
    {
      num: 2,
      title: 'Réduction des Working Sets (EmptyWorkingSet)',
      desc: 'Déchargement des pages mémoires non sollicitées sans fermer les fenêtres.'
    },
    {
      num: 3,
      title: 'Purge sécurisée du cache Standby Windows',
      desc: 'Libération immédiate des mémoires en veille non utilisées.'
    },
    {
      num: 4,
      title: 'Boost et réaffectation en RAM Libre',
      desc: 'Optimisation de la compression mémoire MMAgent et calcul du gain.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-sky-500" />
          <h1 className="text-xl font-bold tracking-tight">Nettoyeur Intelligent de RAM</h1>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Libération intelligente et non destructive de la mémoire vive pour Windows 11. Ne ferme aucune application ouverte et préserve l'intégrité de vos documents.
        </p>
      </div>

      {/* Main Execution Card */}
      <div className={`p-6 rounded-2xl border transition-colors ${
        theme === 'dark' ? 'bg-neutral-800/40 border-neutral-700/60' : 'bg-white border-neutral-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded text-sky-600 dark:text-sky-400 bg-sky-500/10">
                Protocole Win32 & MMAgent
              </span>
              <span className="text-xs text-neutral-400">·</span>
              <span className="text-xs text-emerald-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Garantie sans crash
              </span>
            </div>
            <h2 className="text-lg font-bold">Lancer le cycle d'optimisation intelligente</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xl">
              Ce cycle analyse en profondeur l'état des processus actifs, purge les caches fantômes de Windows 11 et compacte la mémoire de travail des processus inactifs sans interrompre vos sessions.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={onRunSmartClean}
              disabled={isOptimizing}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-sm text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 transition-all shadow-lg shadow-sky-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isOptimizing ? (
                <>
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>Cycle en cours...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Démarrer le Nettoyage Intelligent</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4 Steps Visualizer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800">
          {steps.map((st) => {
            const isFinished = cleanStep > st.num || (!isOptimizing && cleanStep === 4);
            const isCurrent = isOptimizing && cleanStep === st.num;

            return (
              <div 
                key={st.num}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCurrent 
                    ? 'border-sky-500 bg-sky-500/10' 
                    : isFinished
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : theme === 'dark' ? 'border-neutral-700/60 bg-neutral-800/20' : 'border-neutral-200 bg-neutral-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                    isCurrent 
                      ? 'bg-sky-500 text-white animate-pulse' 
                      : isFinished 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-neutral-300 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                  }`}>
                    {isFinished ? <Check className="w-3.5 h-3.5" /> : st.num}
                  </span>

                  <span className="text-[10px] font-medium text-neutral-400">
                    {isCurrent ? 'En cours' : isFinished ? 'Validé' : 'En attente'}
                  </span>
                </div>

                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                  {st.title}
                </div>
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-snug">
                  {st.desc}
                </div>
              </div>
            );
          })}
        </div>

        {/* Last Gain Result Notification */}
        {lastDeltaFreedMb !== null && (
          <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  Optimisation terminée avec succès !
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                  <strong className="font-mono tabular-nums font-bold text-emerald-500">
                    +{(lastDeltaFreedMb / 1024).toFixed(2)} Go ({lastDeltaFreedMb} Mo)
                  </strong> de mémoire vive ont été réaffectés à la RAM Libre.
                </div>
              </div>
            </div>
            <div className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/20 px-3 py-1 rounded-lg">
              Delta : +{(lastDeltaFreedMb / 1024).toFixed(2)} Go
            </div>
          </div>
        )}
      </div>

      {/* Comparative Cards: How it Works vs Brute-Force killers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-5 rounded-2xl border transition-colors ${
          theme === 'dark' ? 'bg-neutral-800/40 border-neutral-700/60' : 'bg-white border-neutral-200'
        }`}>
          <div className="flex items-center gap-2 text-sky-500 font-bold text-sm mb-3">
            <Check className="w-4 h-4 text-emerald-500" />
            <span>Notre Approche : Vidage Intelligent (EmptyWorkingSet & Standby)</span>
          </div>
          <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold font-mono">✓</span>
              <span><strong>Zéro crash applicatif :</strong> Windows 11 conserve les descripteurs de processus et ne ferme rien.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold font-mono">✓</span>
              <span><strong>Purge du Standby cache :</strong> Résout instantanément les micro-saccades en jeu sans redémarrer le PC.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold font-mono">✓</span>
              <span><strong>Protection système :</strong> Impossible d'endommager Explorer, DWM ou les processus Windows critiques.</span>
            </li>
          </ul>
        </div>

        <div className={`p-5 rounded-2xl border transition-colors ${
          theme === 'dark' ? 'bg-neutral-800/40 border-neutral-700/60' : 'bg-white border-neutral-200'
        }`}>
          <div className="flex items-center gap-2 text-red-500 font-bold text-sm mb-3">
            <span className="font-mono text-sm font-bold">✕</span>
            <span>Les Optimiseurs Agressifs Classiques (À Éviter)</span>
          </div>
          <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold font-mono">✗</span>
              <span><strong>Fermeture brutale :</strong> Force-kill les processus sans enregistrer votre travail ou vos onglets.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold font-mono">✗</span>
              <span><strong>Boucle de rechargement :</strong> Les applications tuées redémarrent aussitôt et saturent le processeur.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 font-bold font-mono">✗</span>
              <span><strong>Instabilité du système :</strong> Risque d'écran bleu (BSOD) en coupant des services de sécurité.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* History Log of Operations */}
      <div className={`p-5 rounded-2xl border transition-colors ${
        theme === 'dark' ? 'bg-neutral-800/40 border-neutral-700/60' : 'bg-white border-neutral-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-500" />
            <h3 className="text-sm font-semibold">Historique des Optimisations de Session</h3>
          </div>
          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="text-xs text-neutral-400 hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Effacer l'historique</span>
            </button>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 text-xs">
            Aucune opération effectuée pour le moment. Cliquez sur « Démarrer le Nettoyage Intelligent » pour lancer le premier cycle.
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {logs.map((lg) => (
              <div key={lg.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-neutral-400 text-[11px] tabular-nums">
                    {lg.timestamp}
                  </span>
                  <div>
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">
                      {lg.action}
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {lg.details}
                    </div>
                  </div>
                </div>

                <div className="font-mono font-bold text-emerald-500 dark:text-emerald-400 text-xs tabular-nums shrink-0">
                  +{(lg.freedMb / 1024).toFixed(2)} Go ({lg.freedMb} Mo)
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
