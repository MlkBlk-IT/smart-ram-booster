export type ProcessCategory = 'browser' | 'background' | 'game' | 'system' | 'creative';

export type ProcessStatus = 'running' | 'idle' | 'trimmed' | 'suspended';

export type LeakRisk = 'none' | 'moderate' | 'high';

export interface ProcessItem {
  id: string;
  pid: number;
  name: string;
  displayName: string;
  category: ProcessCategory;
  memoryMb: number;
  initialMemoryMb: number;
  workingSetPrivateMb: number;
  standbyCacheMb: number;
  cpuPercent: number;
  isSystemProtected: boolean;
  isIdle: boolean;
  status: ProcessStatus;
  leakRisk: LeakRisk;
  iconName: string;
  description: string;
}

export interface MemoryBreakdown {
  totalMb: number;
  inUseMb: number;
  compressedMb: number;
  standbyMb: number;
  freeMb: number;
  pagefileTotalMb: number;
  pagefileUsedMb: number;
  compressionEnabled?: boolean;
}

export interface OptimizationLog {
  id: string;
  timestamp: string;
  action: string;
  freedMb: number;
  details: string;
  type: 'smart_clean' | 'trim_working_set' | 'purge_standby' | 'boost_mode';
}

export type BoostProfile = 'balanced' | 'gaming' | 'eco_8gb' | 'custom';

export interface OptimizerSettings {
  autoCleanEnabled: boolean;
  autoCleanThresholdPercent: number;
  cleanStandbyList: boolean;
  trimWorkingSets: boolean;
  enableMemoryCompression: boolean;
  profile: BoostProfile;
  protectForegroundApp: boolean;
  safeModeGuard: boolean;
  theme: 'dark' | 'light';
  hardwareRamTotalGb: 8 | 16 | 32 | 64;
}
