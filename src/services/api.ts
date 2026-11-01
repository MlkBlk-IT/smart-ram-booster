import { ProcessItem, MemoryBreakdown } from '../types';

/** Etat reel expose par le backend natif RAMBooster.exe (localhost). */
export interface ServerState {
  ok: boolean;
  admin: boolean;
  memory: MemoryBreakdown;
  processes: ProcessItem[];
  timestamp: string;
}

export interface OptimizeResult {
  ok: boolean;
  freedMb: number;
  trimmedCount: number;
  skippedCount: number;
  failedCount: number;
  standbyPurged: boolean;
  durationMs: number;
  message: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...(init || {}),
    headers: { 'Content-Type': 'application/json', ...((init && init.headers) || {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data && data.ok === false) throw new Error(data.message || 'Erreur du moteur natif');
  return data as T;
}

export const api = {
  state: () => request<ServerState>('/api/state'),
  optimize: () => request<OptimizeResult>('/api/optimize', { method: 'POST' }),
  optimizeIdle: () => request<OptimizeResult>('/api/optimize?idle=1', { method: 'POST' }),
  trim: (pid: number) => request<OptimizeResult>(`/api/trim?pid=${pid}`, { method: 'POST' }),
};

/** RAM totale detectee, ramenee a la valeur affichee (8/16/32/64 Go). */
export function nearestRamBucket(totalMb: number): 8 | 16 | 32 | 64 {
  const gb = totalMb / 1024;
  const buckets: Array<8 | 16 | 32 | 64> = [8, 16, 32, 64];
  let best: 8 | 16 | 32 | 64 = 8;
  for (const b of buckets) {
    if (Math.abs(b - gb) < Math.abs(best - gb)) best = b;
  }
  return best;
}
