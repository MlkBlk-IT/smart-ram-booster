import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Search, 
  ShieldCheck, 
  Zap, 
  RotateCcw, 
  AlertTriangle, 
  Check, 
  Lock, 
  Globe, 
  MessageSquare, 
  Gamepad2, 
  Music, 
  Compass, 
  Folder, 
  Monitor, 
  Cloud, 
  Layers, 
  Cpu, 
  Shield,
  ArrowUpDown
} from 'lucide-react';
import { ProcessItem, ProcessCategory } from '../types';

interface ProcessInspectorViewProps {
  processes: ProcessItem[];
  onTrimSingleProcess: (id: string) => void;
  onTrimAllIdleProcesses: () => void;
  theme: 'dark' | 'light';
}

export const ProcessInspectorView: React.FC<ProcessInspectorViewProps> = ({
  processes,
  onTrimSingleProcess,
  onTrimAllIdleProcesses,
  theme
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'memory' | 'cpu' | 'name'>('memory');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Category map
  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'Tous les processus' },
    { id: 'idle', label: 'Inactifs / En veille' },
    { id: 'browser', label: 'Navigateurs' },
    { id: 'background', label: 'Arrière-plan' },
    { id: 'creative', label: 'Applications Créatives' },
    { id: 'system', label: 'Système Windows 11' }
  ];

  // Helper icon renderer
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Globe': return <Globe className="w-4 h-4 text-sky-500" />;
      case 'MessageSquare': return <MessageSquare className="w-4 h-4 text-indigo-400" />;
      case 'Gamepad2': return <Gamepad2 className="w-4 h-4 text-emerald-400" />;
      case 'Music': return <Music className="w-4 h-4 text-green-500" />;
      case 'Compass': return <Compass className="w-4 h-4 text-blue-400" />;
      case 'Search': return <Search className="w-4 h-4 text-neutral-400" />;
      case 'Folder': return <Folder className="w-4 h-4 text-amber-500" />;
      case 'Monitor': return <Monitor className="w-4 h-4 text-cyan-400" />;
      case 'Cloud': return <Cloud className="w-4 h-4 text-sky-400" />;
      case 'Layers': return <Layers className="w-4 h-4 text-rose-400" />;
      case 'Cpu': return <Cpu className="w-4 h-4 text-green-400" />;
      case 'Shield': return <Shield className="w-4 h-4 text-emerald-500" />;
      default: return <Activity className="w-4 h-4 text-neutral-400" />;
    }
  };

  // Filtered and sorted processes
  const filteredProcesses = useMemo(() => {
    return processes
      .filter((p) => {
        const matchesSearch = 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.pid.toString().includes(searchTerm);

        if (!matchesSearch) return false;

        if (selectedCategory === 'all') return true;
        if (selectedCategory === 'idle') return p.status === 'idle' || p.status === 'trimmed';
        return p.category === selectedCategory;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'memory') diff = b.memoryMb - a.memoryMb;
        else if (sortBy === 'cpu') diff = b.cpuPercent - a.cpuPercent;
        else diff = a.name.localeCompare(b.name);

        return sortOrder === 'desc' ? diff : -diff;
      });
  }, [processes, searchTerm, selectedCategory, sortBy, sortOrder]);

  const totalIdleMemoryMb = processes
    .filter(p => (p.status === 'idle') && !p.isSystemProtected)
    .reduce((acc, p) => acc + p.workingSetPrivateMb, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-500" />
            <h1 className="text-xl font-bold tracking-tight">Inspecteur de Processus & Gaspillage RAM</h1>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Détecte les applications qui occupent de la mémoire inutilement et permet de décharger leur Working Set en un clic.
          </p>
        </div>

        {totalIdleMemoryMb > 0 && (
          <button
            onClick={onTrimAllIdleProcesses}
            className="self-start sm:self-auto px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-sky-600 hover:bg-sky-500 transition-all shadow-sm flex items-center gap-2"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Réduire tous les inactifs (+{(totalIdleMemoryMb / 1024).toFixed(1)} Go récupérables)</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-xl border transition-colors ${
        theme === 'dark' ? 'bg-neutral-800/40 border-neutral-700/60' : 'bg-white border-neutral-200'
      }`}>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom (ex. chrome, discord) ou PID..."
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border transition-colors outline-none focus:ring-1 focus:ring-sky-500 ${
                theme === 'dark' 
                  ? 'bg-neutral-900 border-neutral-700 text-neutral-100 placeholder-neutral-500' 
                  : 'bg-neutral-50 border-neutral-200 text-neutral-900 placeholder-neutral-400'
              }`}
            />
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-400">Trier par :</span>
            <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-lg border border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => { setSortBy('memory'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                  sortBy === 'memory' 
                    ? 'bg-white dark:bg-neutral-800 text-sky-500 font-semibold shadow-xs' 
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <span>RAM</span>
                <ArrowUpDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => { setSortBy('cpu'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                  sortBy === 'cpu' 
                    ? 'bg-white dark:bg-neutral-800 text-sky-500 font-semibold shadow-xs' 
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <span>CPU</span>
                <ArrowUpDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => { setSortBy('name'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                  sortBy === 'name' 
                    ? 'bg-white dark:bg-neutral-800 text-sky-500 font-semibold shadow-xs' 
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <span>Nom</span>
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800 text-xs">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedCategory === c.id
                  ? 'bg-sky-500 text-white font-semibold shadow-xs'
                  : theme === 'dark'
                    ? 'bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Process Table */}
      <div className={`rounded-xl border overflow-hidden transition-colors ${
        theme === 'dark' ? 'bg-neutral-800/40 border-neutral-700/60' : 'bg-white border-neutral-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b select-none ${
                theme === 'dark' ? 'bg-neutral-900/70 border-neutral-700/70 text-neutral-400' : 'bg-neutral-50 border-neutral-200 text-neutral-500'
              }`}>
                <th className="py-3 px-4 font-semibold">Nom du Processus / App</th>
                <th className="py-3 px-4 font-semibold text-right">PID</th>
                <th className="py-3 px-4 font-semibold text-right">RAM (Privée)</th>
                <th className="py-3 px-4 font-semibold text-right">CPU</th>
                <th className="py-3 px-4 font-semibold">Statut & Diagnostic</th>
                <th className="py-3 px-4 font-semibold text-right">Action Sécurisée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/80">
              {filteredProcesses.map((proc) => {
                const isTrimmed = proc.status === 'trimmed';
                const isIdle = proc.status === 'idle';

                return (
                  <tr 
                    key={proc.id} 
                    className={`transition-colors ${
                      theme === 'dark' ? 'hover:bg-neutral-700/30' : 'hover:bg-neutral-50'
                    } ${isTrimmed ? 'opacity-85' : ''}`}
                  >
                    {/* Process Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          theme === 'dark' ? 'bg-neutral-700/50' : 'bg-neutral-100'
                        }`}>
                          {renderIcon(proc.iconName)}
                        </div>
                        <div>
                          <div className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                            <span>{proc.name}</span>
                            {proc.isSystemProtected && (
                              <span title="Composant système protégé">
                                <Lock className="w-3 h-3 text-neutral-400" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            {proc.displayName}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* PID */}
                    <td className="py-3 px-4 text-right font-mono text-neutral-400 tabular-nums">
                      {proc.pid}
                    </td>

                    {/* Memory */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-mono font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                        {proc.memoryMb} Mo
                      </div>
                      {isTrimmed && (
                        <div className="text-[10px] text-emerald-500 font-mono">
                          -{(proc.initialMemoryMb - proc.memoryMb)} Mo libérés
                        </div>
                      )}
                    </td>

                    {/* CPU */}
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-500 dark:text-neutral-400">
                      {proc.cpuPercent}%
                    </td>

                    {/* Status & Diagnostics */}
                    <td className="py-3 px-4">
                      {proc.isSystemProtected ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span className="font-medium text-[11px]">Système Protégé</span>
                        </div>
                      ) : isTrimmed ? (
                        <div className="flex items-center gap-1.5 text-emerald-500">
                          <Check className="w-3.5 h-3.5" />
                          <span className="font-medium text-[11px]">Working Set optimisé</span>
                        </div>
                      ) : isIdle ? (
                        <div className="flex items-center gap-1.5 text-amber-500">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span className="font-medium text-[11px]">En veille (Gaspillage RAM)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-neutral-500">
                          <span className="w-2 h-2 rounded-full bg-sky-500" />
                          <span className="font-medium text-[11px]">Actif</span>
                        </div>
                      )}
                      <div className="text-[10px] text-neutral-400 truncate max-w-xs mt-0.5">
                        {proc.description}
                      </div>
                    </td>

                    {/* Safe Action */}
                    <td className="py-3 px-4 text-right">
                      {proc.isSystemProtected ? (
                        <span className="text-[11px] text-neutral-400 italic">
                          Non modifiable
                        </span>
                      ) : isTrimmed ? (
                        <span className="text-[11px] text-emerald-500 font-medium">
                          Optimisé ✓
                        </span>
                      ) : (
                        <button
                          onClick={() => onTrimSingleProcess(proc.id)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1.5 ml-auto ${
                            theme === 'dark' 
                              ? 'bg-neutral-700/80 hover:bg-sky-600 text-neutral-200 hover:text-white' 
                              : 'bg-neutral-100 hover:bg-sky-500 text-neutral-700 hover:text-white'
                          }`}
                          title="Purge les pages inutilisées via Win32 EmptyWorkingSet"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Réduire RAM</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
