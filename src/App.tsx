import React, { useState, useEffect, useCallback } from 'react';
import { TitleBar } from './components/TitleBar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { SmartCleanView } from './components/SmartCleanView';
import { ProcessInspectorView } from './components/ProcessInspectorView';
import { SoftwareBoostView } from './components/SoftwareBoostView';
import { WindowsScriptsView } from './components/WindowsScriptsView';
import { SettingsView } from './components/SettingsView';
import { INITIAL_PROCESSES, calculateMemoryBreakdown } from './data/initialData';
import { ProcessItem, MemoryBreakdown, OptimizerSettings, OptimizationLog, BoostProfile } from './types';
import { api, nearestRamBucket } from './services/api';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [processes, setProcesses] = useState<ProcessItem[]>(INITIAL_PROCESSES);
  const [memory, setMemory] = useState<MemoryBreakdown>(
    calculateMemoryBreakdown(16, INITIAL_PROCESSES, 0, 1.0)
  );
  const [standbyOffsetMb, setStandbyOffsetMb] = useState<number>(0);

  // true = donnees reelles du moteur natif, false = repli demo (backend injoignable)
  const [liveMode, setLiveMode] = useState<boolean>(false);
  const [engineError, setEngineError] = useState<string | null>(null);

  const [settings, setSettings] = useState<OptimizerSettings>({
    autoCleanEnabled: true,
    autoCleanThresholdPercent: 85,
    cleanStandbyList: true,
    trimWorkingSets: true,
    enableMemoryCompression: true,
    profile: 'balanced',
    protectForegroundApp: true,
    safeModeGuard: true,
    theme: 'dark',
    hardwareRamTotalGb: 16
  });

  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [cleanStep, setCleanStep] = useState<number>(0);
  const [lastDeltaFreedMb, setLastDeltaFreedMb] = useState<number | null>(null);
  const [totalRecoveredMb, setTotalRecoveredMb] = useState<number>(0);
  const [logs, setLogs] = useState<OptimizationLog[]>([]);

  // Interroge le moteur natif (RAM + processus reels) toutes les 2,5 s.
  const refresh = useCallback(async () => {
    const st = await api.state();
    setLiveMode(true);
    setEngineError(null);
    setProcesses(st.processes);
    setMemory(st.memory);
    setStandbyOffsetMb(0);
    const bucket = nearestRamBucket(st.memory.totalMb);
    setSettings(prev => (prev.hardwareRamTotalGb === bucket ? prev : { ...prev, hardwareRamTotalGb: bucket }));
    return st;
  }, []);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        if (!alive) return;
        await refresh();
      } catch (e) {
        if (!alive) return;
        setLiveMode(false);
        setEngineError(e instanceof Error ? e.message : 'Moteur natif injoignable');
      }
    };
    poll();
    const timer = window.setInterval(poll, 2500);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
  }, [refresh]);

  // Sync theme with HTML root class
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  const pushLog = (action: string, freedMb: number, details: string, type: OptimizationLog['type']) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ id: 'log-' + Date.now(), timestamp: timeStr, action, freedMb, details, type }, ...prev]);
  };

  // Cycle de nettoyage intelligent : appel REEL au moteur natif (psapi + ntdll).
  const handleRunSmartClean = async () => {
    if (isOptimizing) return;
    setIsOptimizing(true);
    setCleanStep(1);

    try {
      setCleanStep(2);
      const res = await api.optimize();
      setCleanStep(3);
      await refresh();
      setCleanStep(4);
      setLastDeltaFreedMb(res.freedMb);
      setTotalRecoveredMb(prev => prev + res.freedMb);
      pushLog(
        'Optimisation Intelligente (Working Set + Standby)',
        res.freedMb,
        `${res.trimmedCount} processus liberes en ${res.durationMs} ms. ${res.message}`,
        'smart_clean'
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      pushLog('Optimisation echouee', 0, msg, 'smart_clean');
    } finally {
      setIsOptimizing(false);
      setCleanStep(0);
    }
  };

  // Reduction du working set d'un processus reel.
  const handleTrimSingleProcess = async (procId: string) => {
    const target = processes.find(p => p.id === procId);
    if (!target || target.isSystemProtected) return;

    try {
      const res = await api.trim(target.pid);
      await refresh();
      setTotalRecoveredMb(prev => prev + res.freedMb);
      setLastDeltaFreedMb(res.freedMb);
      pushLog(
        `Reduction Working Set (${target.name})`,
        res.freedMb,
        `Win32 EmptyWorkingSet sur le PID ${target.pid}. ${res.message}`,
        'trim_working_set'
      );
    } catch (e) {
      pushLog(
        `Reduction Working Set (${target.name})`,
        0,
        e instanceof Error ? e.message : String(e),
        'trim_working_set'
      );
    }
  };

  // Reduction globale : uniquement les processus sans fenetre (arriere-plan).
  const handleTrimAllIdleProcesses = async () => {
    try {
      const res = await api.optimizeIdle();
      await refresh();
      setTotalRecoveredMb(prev => prev + res.freedMb);
      setLastDeltaFreedMb(res.freedMb);
      pushLog(
        'Reduction globale des applications inactives',
        res.freedMb,
        `${res.trimmedCount} processus d'arriere-plan decharges. ${res.message}`,
        'trim_working_set'
      );
    } catch (e) {
      pushLog(
        'Reduction globale des applications inactives',
        0,
        e instanceof Error ? e.message : String(e),
        'trim_working_set'
      );
    }
  };

  // Profils de boost : en mode reel ils s'appliquent au moteur natif.
  const handleApplyBoostProfile = async (profile: BoostProfile) => {
    setSettings(prev => ({ ...prev, profile }));
    if (!liveMode) return;

    if (profile === 'gaming') {
      try {
        const res = await api.optimizeIdle();
        await refresh();
        setTotalRecoveredMb(prev => prev + res.freedMb);
        setLastDeltaFreedMb(res.freedMb);
        pushLog('Profil Gaming applique', res.freedMb, res.message, 'boost_mode');
      } catch (e) {
        pushLog('Profil Gaming applique', 0, e instanceof Error ? e.message : String(e), 'boost_mode');
      }
    } else if (profile === 'eco_8gb') {
      try {
        const res = await api.optimize();
        await refresh();
        setTotalRecoveredMb(prev => prev + res.freedMb);
        setLastDeltaFreedMb(res.freedMb);
        pushLog('Profil Eco 8 Go applique', res.freedMb, res.message, 'boost_mode');
      } catch (e) {
        pushLog('Profil Eco 8 Go applique', 0, e instanceof Error ? e.message : String(e), 'boost_mode');
      }
    }
  };

  // Simulateur : reserve au mode demo (backend injoignable).
  const handleSimulateLoad = (type: 'chrome_tabs' | 'gaming' | 'leak') => {
    if (liveMode) return;

    if (type === 'chrome_tabs') {
      setProcesses(prev => prev.map(p => {
        if (p.name === 'chrome.exe') {
          return {
            ...p,
            memoryMb: p.memoryMb + 1600,
            workingSetPrivateMb: p.workingSetPrivateMb + 1400,
            status: 'idle'
          };
        }
        return p;
      }));
    } else if (type === 'gaming') {
      const gameExists = processes.some(p => p.name === 'Cyberpunk2077.exe');
      if (!gameExists) {
        const newGameProc: ProcessItem = {
          id: 'proc-game-' + Date.now(),
          pid: 18450,
          name: 'Cyberpunk2077.exe',
          displayName: 'Cyberpunk 2077 (Jeu AAA au premier plan)',
          category: 'game',
          memoryMb: 4800,
          initialMemoryMb: 4800,
          workingSetPrivateMb: 4200,
          standbyCacheMb: 600,
          cpuPercent: 32.5,
          isSystemProtected: false,
          isIdle: false,
          status: 'running',
          leakRisk: 'none',
          iconName: 'Gamepad2',
          description: 'Application de jeu exigeante au premier plan.'
        };
        setProcesses(prev => [newGameProc, ...prev]);
      }
    } else if (type === 'leak') {
      setProcesses(prev => prev.map(p => {
        if (p.name === 'AdobeIPCBroker.exe') {
          return {
            ...p,
            memoryMb: p.memoryMb + 1150,
            workingSetPrivateMb: p.workingSetPrivateMb + 1050,
            leakRisk: 'high',
            status: 'idle',
            description: 'ALERTE : Fuite memoire detectee. Allocation non liberee.'
          };
        }
        return p;
      }));
    }
  };

  const handleResetSimulation = () => {
    if (liveMode) {
      refresh().catch(() => undefined);
      return;
    }
    setProcesses(INITIAL_PROCESSES);
    setStandbyOffsetMb(0);
    setLastDeltaFreedMb(null);
  };

  const handleResetAll = () => {
    handleResetSimulation();
    setTotalRecoveredMb(0);
    setLogs([]);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors ${
      settings.theme === 'dark' ? 'bg-neutral-900 text-neutral-100 mica-bg-dark' : 'bg-neutral-100 text-neutral-900 mica-bg-light'
    }`}>
      {/* Windows 11 TitleBar */}
      <TitleBar
        theme={settings.theme}
        onToggleTheme={() => setSettings(prev => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }))}
        hardwareRamTotalGb={settings.hardwareRamTotalGb}
        totalRecoveredMb={totalRecoveredMb}
      />

      {/* Main Workspace: Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          memory={memory}
          boostProfile={settings.profile}
          theme={settings.theme}
          />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {!liveMode && (
            <div className="mb-4 px-4 py-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs">
              MODE DEMO : moteur natif injoignable ({engineError || 'serveur local absent'}). Lancez RAMBooster.exe pour les donnees reelles.
            </div>
          )}

          {currentTab === 'dashboard' && (
            <DashboardView
              memory={memory}
              processes={processes}
              isOptimizing={isOptimizing}
              onRunSmartClean={handleRunSmartClean}
              totalRecoveredMb={totalRecoveredMb}
              lastDeltaFreedMb={lastDeltaFreedMb}
              onSimulateLoad={handleSimulateLoad}
              onResetSimulation={handleResetSimulation}
              hardwareRamTotalGb={settings.hardwareRamTotalGb}
              onChangeHardwareRam={(gb) => {
                if (!liveMode) setSettings(prev => ({ ...prev, hardwareRamTotalGb: gb }));
              }}
              theme={settings.theme}
              realMode={liveMode}
            />
          )}

          {currentTab === 'smart_clean' && (
            <SmartCleanView
              memory={memory}
              processes={processes}
              isOptimizing={isOptimizing}
              cleanStep={cleanStep}
              onRunSmartClean={handleRunSmartClean}
              logs={logs}
              onClearLogs={() => setLogs([])}
              lastDeltaFreedMb={lastDeltaFreedMb}
              theme={settings.theme}
            />
          )}

          {currentTab === 'processes' && (
            <ProcessInspectorView
              processes={processes}
              onTrimSingleProcess={handleTrimSingleProcess}
              onTrimAllIdleProcesses={handleTrimAllIdleProcesses}
              theme={settings.theme}
            />
          )}

          {currentTab === 'boost' && (
            <SoftwareBoostView
              settings={settings}
              onUpdateSettings={(newVals) => setSettings(prev => ({ ...prev, ...newVals }))}
              onApplyBoostProfile={handleApplyBoostProfile}
              theme={settings.theme}
            />
          )}

          {currentTab === 'scripts' && (
            <WindowsScriptsView theme={settings.theme} />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={(newVals) => setSettings(prev => ({ ...prev, ...newVals }))}
              onResetAll={handleResetAll}
              theme={settings.theme}
            />
          )}
        </main>
      </div>
    </div>
  );
}
