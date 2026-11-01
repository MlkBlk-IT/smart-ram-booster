import React from 'react';
import { 
  Flame, 
  Gamepad2, 
  Cpu, 
  ShieldCheck, 
  Sliders, 
  Check, 
  ToggleLeft, 
  ToggleRight, 
  Layers, 
  Sparkles,
  Zap
} from 'lucide-react';
import { BoostProfile, OptimizerSettings } from '../types';

interface SoftwareBoostViewProps {
  settings: OptimizerSettings;
  onUpdateSettings: (newSettings: Partial<OptimizerSettings>) => void;
  onApplyBoostProfile: (profile: BoostProfile) => void;
  theme: 'dark' | 'light';
}

export const SoftwareBoostView: React.FC<SoftwareBoostViewProps> = ({
  settings,
  onUpdateSettings,
  onApplyBoostProfile,
  theme
}) => {
  const profiles: { 
    id: BoostProfile; 
    name: string; 
    badge: string; 
    desc: string; 
    icon: React.ReactNode; 
    color: string 
  }[] = [
    {
      id: 'balanced',
      name: 'Mode Polyvalent (Équilibré)',
      badge: 'Recommandé Quotidien',
      desc: 'Idéal pour la bureautique, la navigation intensive et le multitâche régulier. Purge le cache lorsque la mémoire est sous tension.',
      icon: <Layers className="w-5 h-5 text-sky-500" />,
      color: 'border-sky-500/40 bg-sky-500/5'
    },
    {
      id: 'gaming',
      name: 'Mode Gamer & Créateur 3D',
      badge: 'Zéro Stuttering',
      desc: 'Nettoyage agressif du Standby List pour supprimer les micro-saccades en jeu. Priorité CPU/RAM accordée à la fenêtre active.',
      icon: <Gamepad2 className="w-5 h-5 text-amber-500" />,
      color: 'border-amber-500/40 bg-amber-500/5'
    },
    {
      id: 'eco_8gb',
      name: 'Mode PC Modeste (4 Go / 8 Go)',
      badge: 'Optimisation Agressive',
      desc: 'Maintient en permanence au moins 1.5 Go de RAM libre. Réduit continuellement le working set des onglets en arrière-plan.',
      icon: <Cpu className="w-5 h-5 text-emerald-500" />,
      color: 'border-emerald-500/40 bg-emerald-500/5'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-500" />
          <h1 className="text-xl font-bold tracking-tight">Boost Logiciel & Profils de Performance</h1>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Augmentez la réactivité de Windows 11 par optimisation logicielle de l'ordonnanceur, compression MMAgent et purge proactive du cache.
        </p>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profiles.map((p) => {
          const isSelected = settings.profile === p.id;
          return (
            <div
              key={p.id}
              onClick={() => onApplyBoostProfile(p.id)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? `${p.color} ring-2 ring-sky-500/50 shadow-md`
                  : theme === 'dark'
                    ? 'bg-neutral-800/40 border-neutral-700/60 hover:bg-neutral-800/70'
                    : 'bg-white border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800">
                  {p.icon}
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded font-mono bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                  {p.badge}
                </span>
              </div>

              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {p.name}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                {p.desc}
              </p>

              <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold">
                <span className={isSelected ? 'text-sky-500' : 'text-neutral-400'}>
                  {isSelected ? 'Profil Actif' : 'Activer'}
                </span>
                {isSelected && <Check className="w-4 h-4 text-sky-500" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Windows 11 Software Boost Toggles */}
      <div className={`p-6 rounded-2xl border transition-colors ${
        theme === 'dark' ? 'bg-neutral-800/40 border-neutral-700/60' : 'bg-white border-neutral-200'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="w-4 h-4 text-sky-500" />
          <h2 className="text-base font-bold">Fonctionnalités de Boost Logiciel Windows 11</h2>
        </div>

        <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
          {/* Toggle 1: Memory Compression */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>Compression Mémoire Native Windows 11 (MMAgent)</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-purple-500/20 text-purple-400">
                  Recommandé
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 max-w-xl">
                Compresse les pages mémoires inactives directement dans la RAM avec un ratio moyen de 40%, évitant les accès lents au SSD/disque lors du rappel de données.
              </p>
            </div>
            <button
              onClick={() => onUpdateSettings({ enableMemoryCompression: !settings.enableMemoryCompression })}
              className="text-sky-500 hover:text-sky-400 transition-colors"
            >
              {settings.enableMemoryCompression ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-neutral-400" />
              )}
            </button>
          </div>

          {/* Toggle 2: Auto-Clean Threshold */}
          <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                Purge Automatique Programmée du Cache Standby
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xl">
                Déclenche automatiquement un cycle de nettoyage doux en arrière-plan lorsque la RAM physique atteint un seuil critique sans que vous ayez à intervenir.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="70"
                  max="95"
                  step="5"
                  disabled={!settings.autoCleanEnabled}
                  value={settings.autoCleanThresholdPercent}
                  onChange={(e) => onUpdateSettings({ autoCleanThresholdPercent: Number(e.target.value) })}
                  className="w-28 accent-sky-500 disabled:opacity-40"
                />
                <span className="text-xs font-mono font-bold tabular-nums w-10 text-right">
                  {settings.autoCleanThresholdPercent}%
                </span>
              </div>

              <button
                onClick={() => onUpdateSettings({ autoCleanEnabled: !settings.autoCleanEnabled })}
                className="text-sky-500 hover:text-sky-400 transition-colors"
              >
                {settings.autoCleanEnabled ? (
                  <ToggleRight className="w-8 h-8" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-neutral-400" />
                )}
              </button>
            </div>
          </div>

          {/* Toggle 3: Protect Foreground App */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>Sanctuarisation de l'Application Active (Priorité Haute)</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 max-w-xl">
                Empêche toute réduction de mémoire vive sur le jeu ou logiciel actuellement au premier plan pour garantir une fluidité et des FPS constants.
              </p>
            </div>
            <button
              onClick={() => onUpdateSettings({ protectForegroundApp: !settings.protectForegroundApp })}
              className="text-sky-500 hover:text-sky-400 transition-colors"
            >
              {settings.protectForegroundApp ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-neutral-400" />
              )}
            </button>
          </div>

          {/* Toggle 4: Safe Mode Guard */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Garde-fou Système Absolu (Safe Mode Guard)</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 max-w-xl">
                Verrouille les processus critiques du noyau Windows 11 (explorer.exe, dwm.exe, lsass.exe, csrss.exe, services.exe) contre toute tentative d'altération ou de terminaison.
              </p>
            </div>
            <button
              onClick={() => onUpdateSettings({ safeModeGuard: !settings.safeModeGuard })}
              className="text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              {settings.safeModeGuard ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-neutral-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
