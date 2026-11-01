import React from 'react';
import { 
  Settings, 
  ShieldCheck, 
  RotateCcw, 
  HardDrive, 
  Sliders, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { OptimizerSettings } from '../types';

interface SettingsViewProps {
  settings: OptimizerSettings;
  onUpdateSettings: (newSettings: Partial<OptimizerSettings>) => void;
  onResetAll: () => void;
  theme: 'dark' | 'light';
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetAll,
  theme
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-neutral-400" />
          <h1 className="text-xl font-bold tracking-tight">Paramètres & Spécifications Matérielles</h1>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Ajustez les paramètres de fonctionnement du moteur de gestion de RAM pour correspondre à votre PC Windows 11.
        </p>
      </div>

      {/* Hardware Settings Card */}
      <div className={`p-6 rounded-2xl border transition-colors ${
        theme === 'dark' ? 'bg-neutral-800/40 border-neutral-700/60' : 'bg-white border-neutral-200'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <HardDrive className="w-4 h-4 text-sky-500" />
          <h2 className="text-sm font-bold">Configuration Matérielle Détectée</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
              Mémoire Vive Physique Installée (RAM)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {([8, 16, 32, 64] as const).map((gb) => (
                <button
                  key={gb}
                  onClick={() => onUpdateSettings({ hardwareRamTotalGb: gb })}
                  className={`py-2 px-3 rounded-lg text-xs font-mono font-bold transition-all ${
                    settings.hardwareRamTotalGb === gb
                      ? 'bg-sky-500 text-white shadow-xs'
                      : theme === 'dark'
                        ? 'bg-neutral-700/50 hover:bg-neutral-700 text-neutral-300'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                  }`}
                >
                  {gb} Go
                </button>
              ))}
            </div>
            <p className="text-[11px] text-neutral-400 mt-1.5">
              Adapte les seuils de purge Standby et la réserve minimale de RAM libre.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">
              Thème Visuel de l'Interface
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdateSettings({ theme: 'dark' })}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  settings.theme === 'dark'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : theme === 'dark'
                      ? 'bg-neutral-700/50 text-neutral-300'
                      : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                Windows 11 Sombre (Mica)
              </button>
              <button
                onClick={() => onUpdateSettings({ theme: 'light' })}
                className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  settings.theme === 'light'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : theme === 'dark'
                      ? 'bg-neutral-700/50 text-neutral-300'
                      : 'bg-neutral-100 text-neutral-700'
                }`}
              >
                Windows 11 Clair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture & Glossary Explanations */}
      <div className={`p-6 rounded-2xl border transition-colors ${
        theme === 'dark' ? 'bg-neutral-800/40 border-neutral-700/60' : 'bg-white border-neutral-200'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-sky-500" />
          <h2 className="text-sm font-bold">Comprendre la Gestion de RAM sous Windows 11</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
            <div className="font-bold text-neutral-900 dark:text-neutral-100 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Qu'est-ce que le cache Standby (En veille) ?</span>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-[11px]">
              Windows 11 précharge en RAM les fichiers et logiciels récemment consultés. En théorie, Windows libère ce cache quand vous avez besoin de RAM, mais en pratique, cette réallocation prend quelques millisecondes et cause des micro-saccades en jeu. Notre nettoyeur le purge de manière préventive.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800">
            <div className="font-bold text-neutral-900 dark:text-neutral-100 mb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>Comment fonctionne EmptyWorkingSet ?</span>
            </div>
            <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed text-[11px]">
              C'est une fonction officielle du noyau Windows (psapi.dll). Elle demande gentiment à une application de libérer les pages mémoires qu'elle n'a pas touchées depuis longtemps. L'application reste ouverte sans crash ni perte de données.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone / Reset */}
      <div className={`p-5 rounded-2xl border border-red-500/20 bg-red-500/5 flex items-center justify-between gap-4`}>
        <div>
          <div className="text-xs font-bold text-red-600 dark:text-red-400">
            Réinitialiser l'état de la simulation
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            Restaure tous les processus, la mémoire initiale et efface les historiques d'optimisation.
          </div>
        </div>

        <button
          onClick={onResetAll}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors flex items-center gap-1.5 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Réinitialiser tout</span>
        </button>
      </div>
    </div>
  );
};
