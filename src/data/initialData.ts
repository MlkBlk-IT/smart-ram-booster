import { ProcessItem, MemoryBreakdown } from '../types';

export const INITIAL_PROCESSES: ProcessItem[] = [
  {
    id: 'proc-1',
    pid: 4892,
    name: 'chrome.exe',
    displayName: 'Google Chrome (16 onglets + GPU)',
    category: 'browser',
    memoryMb: 2420,
    initialMemoryMb: 2420,
    workingSetPrivateMb: 1980,
    standbyCacheMb: 440,
    cpuPercent: 3.2,
    isSystemProtected: false,
    isIdle: true,
    status: 'idle',
    leakRisk: 'moderate',
    iconName: 'Globe',
    description: '12 onglets inactifs en arrière-plan depuis plus de 45 minutes.'
  },
  {
    id: 'proc-2',
    pid: 7812,
    name: 'Discord.exe',
    displayName: 'Discord Client (Electron)',
    category: 'background',
    memoryMb: 890,
    initialMemoryMb: 890,
    workingSetPrivateMb: 680,
    standbyCacheMb: 210,
    cpuPercent: 0.8,
    isSystemProtected: false,
    isIdle: true,
    status: 'idle',
    leakRisk: 'none',
    iconName: 'MessageSquare',
    description: 'Cache média et flux vidéo inactifs conservés en mémoire vive.'
  },
  {
    id: 'proc-3',
    pid: 10452,
    name: 'steamwebhelper.exe',
    displayName: 'Steam WebHelper Renderer',
    category: 'game',
    memoryMb: 760,
    initialMemoryMb: 760,
    workingSetPrivateMb: 590,
    standbyCacheMb: 170,
    cpuPercent: 0.4,
    isSystemProtected: false,
    isIdle: true,
    status: 'idle',
    leakRisk: 'none',
    iconName: 'Gamepad2',
    description: 'Boutique et bibliothèque Web Chromium de Steam en veille.'
  },
  {
    id: 'proc-4',
    pid: 3120,
    name: 'Spotify.exe',
    displayName: 'Spotify Music Player',
    category: 'background',
    memoryMb: 540,
    initialMemoryMb: 540,
    workingSetPrivateMb: 420,
    standbyCacheMb: 120,
    cpuPercent: 0.2,
    isSystemProtected: false,
    isIdle: true,
    status: 'idle',
    leakRisk: 'none',
    iconName: 'Music',
    description: 'Lecteur en pause, cache des morceaux précédents en RAM.'
  },
  {
    id: 'proc-5',
    pid: 9240,
    name: 'msedge.exe',
    displayName: 'Microsoft Edge (Boost démarrage)',
    category: 'browser',
    memoryMb: 480,
    initialMemoryMb: 480,
    workingSetPrivateMb: 360,
    standbyCacheMb: 120,
    cpuPercent: 0.1,
    isSystemProtected: false,
    isIdle: true,
    status: 'idle',
    leakRisk: 'none',
    iconName: 'Compass',
    description: 'Processus préchargé par Windows 11 pour démarrage rapide.'
  },
  {
    id: 'proc-6',
    pid: 1284,
    name: 'SearchHost.exe',
    displayName: 'Windows Search & Indexer',
    category: 'system',
    memoryMb: 390,
    initialMemoryMb: 390,
    workingSetPrivateMb: 290,
    standbyCacheMb: 100,
    cpuPercent: 1.5,
    isSystemProtected: false,
    isIdle: false,
    status: 'running',
    leakRisk: 'none',
    iconName: 'Search',
    description: 'Indexation continue des fichiers en arrière-plan.'
  },
  {
    id: 'proc-7',
    pid: 884,
    name: 'explorer.exe',
    displayName: 'Explorateur de fichiers Windows 11',
    category: 'system',
    memoryMb: 430,
    initialMemoryMb: 430,
    workingSetPrivateMb: 340,
    standbyCacheMb: 90,
    cpuPercent: 0.3,
    isSystemProtected: true,
    isIdle: false,
    status: 'running',
    leakRisk: 'none',
    iconName: 'Folder',
    description: 'Composant système essentiel (Bureau, Barre des tâches).'
  },
  {
    id: 'proc-8',
    pid: 612,
    name: 'dwm.exe',
    displayName: 'Gestionnaire de fenêtres du Bureau (DWM)',
    category: 'system',
    memoryMb: 380,
    initialMemoryMb: 380,
    workingSetPrivateMb: 320,
    standbyCacheMb: 60,
    cpuPercent: 1.8,
    isSystemProtected: true,
    isIdle: false,
    status: 'running',
    leakRisk: 'none',
    iconName: 'Monitor',
    description: 'Moteur de rendu d\'affichage Fluent et accélération GPU.'
  },
  {
    id: 'proc-9',
    pid: 6200,
    name: 'OneDrive.exe',
    displayName: 'Microsoft OneDrive Sync',
    category: 'background',
    memoryMb: 290,
    initialMemoryMb: 290,
    workingSetPrivateMb: 230,
    standbyCacheMb: 60,
    cpuPercent: 0.1,
    isSystemProtected: false,
    isIdle: true,
    status: 'idle',
    leakRisk: 'none',
    iconName: 'Cloud',
    description: 'Agent de synchronisation cloud en attente de modifications.'
  },
  {
    id: 'proc-10',
    pid: 11204,
    name: 'AdobeIPCBroker.exe',
    displayName: 'Adobe Creative Cloud Background Helper',
    category: 'creative',
    memoryMb: 340,
    initialMemoryMb: 340,
    workingSetPrivateMb: 270,
    standbyCacheMb: 70,
    cpuPercent: 0.1,
    isSystemProtected: false,
    isIdle: true,
    status: 'idle',
    leakRisk: 'moderate',
    iconName: 'Layers',
    description: 'Processus reliquat actif alors que Photoshop est fermé.'
  },
  {
    id: 'proc-11',
    pid: 2450,
    name: 'MsMpEng.exe',
    displayName: 'Antivirus Microsoft Defender',
    category: 'system',
    memoryMb: 310,
    initialMemoryMb: 310,
    workingSetPrivateMb: 260,
    standbyCacheMb: 50,
    cpuPercent: 0.5,
    isSystemProtected: true,
    isIdle: false,
    status: 'running',
    leakRisk: 'none',
    iconName: 'Shield',
    description: 'Protection en temps réel intégrée de Windows 11.'
  },
  {
    id: 'proc-12',
    pid: 14120,
    name: 'NVIDIA Share.exe',
    displayName: 'NVIDIA GeForce Experience Overlay',
    category: 'game',
    memoryMb: 370,
    initialMemoryMb: 370,
    workingSetPrivateMb: 290,
    standbyCacheMb: 80,
    cpuPercent: 0.2,
    isSystemProtected: false,
    isIdle: true,
    status: 'idle',
    leakRisk: 'none',
    iconName: 'Cpu',
    description: 'Overlay de capture et replay instantané en attente de jeu.'
  }
];

export function calculateMemoryBreakdown(
  totalGb: number,
  processes: ProcessItem[],
  standbyOffsetMb: number = 0,
  compressionRatio: number = 0.8
): MemoryBreakdown {
  const totalMb = totalGb * 1024;
  
  // Sum of active process working sets + OS core reserved (~1400 MB)
  const processWorkingSets = processes.reduce((acc, p) => acc + (p.status === 'trimmed' ? p.workingSetPrivateMb * 0.35 : p.workingSetPrivateMb), 0);
  const osKernelCoreMb = 1350;
  
  const inUseMb = Math.round(processWorkingSets + osKernelCoreMb);
  const compressedMb = Math.round(inUseMb * 0.14 * compressionRatio);
  
  // Standby cache starts around 2800-4200 MB on a 16GB system
  const defaultStandbyRatio = totalGb <= 8 ? 0.22 : 0.26;
  let standbyMb = Math.max(350, Math.round(totalMb * defaultStandbyRatio + standbyOffsetMb));
  
  // Free RAM is the remainder
  let freeMb = totalMb - (inUseMb + standbyMb);
  if (freeMb < 400) {
    freeMb = 400;
    standbyMb = Math.max(350, totalMb - inUseMb - freeMb);
  }

  const pagefileTotalMb = Math.round(totalMb * 1.25);
  const pagefileUsedMb = Math.round(inUseMb * 0.38);

  return {
    totalMb,
    inUseMb,
    compressedMb,
    standbyMb,
    freeMb,
    pagefileTotalMb,
    pagefileUsedMb
  };
}
