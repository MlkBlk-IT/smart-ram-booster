import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  ShieldAlert, 
  FileCode2,
  HelpCircle
} from 'lucide-react';
import { WINDOWS_SCRIPTS, WindowsScript } from '../data/windowsScripts';

interface WindowsScriptsViewProps {
  theme: 'dark' | 'light';
}

export const WindowsScriptsView: React.FC<WindowsScriptsViewProps> = ({ theme }) => {
  const [selectedScriptId, setSelectedScriptId] = useState<string>(WINDOWS_SCRIPTS[0].id);
  const [copied, setCopied] = useState<boolean>(false);

  const selectedScript = WINDOWS_SCRIPTS.find(s => s.id === selectedScriptId) || WINDOWS_SCRIPTS[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedScript.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([selectedScript.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedScript.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-500" />
          <h1 className="text-xl font-bold tracking-tight">Scripts Windows 11 Natifs & Export</h1>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Scripts PowerShell et Batch prêts à l'emploi. Copiez-les ou téléchargez-les pour exécuter ces optimisations natives directement sur votre ordinateur Windows 11.
        </p>
      </div>

      {/* Script Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {WINDOWS_SCRIPTS.map((script) => {
          const isSelected = script.id === selectedScriptId;
          return (
            <button
              key={script.id}
              onClick={() => setSelectedScriptId(script.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
                  : theme === 'dark'
                    ? 'bg-neutral-800/40 border-neutral-700/60 hover:bg-neutral-800/70 text-neutral-300'
                    : 'bg-white border-neutral-200 hover:bg-neutral-50 text-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileCode2 className={`w-4 h-4 ${isSelected ? 'text-emerald-500' : 'text-neutral-400'}`} />
                  <span className="font-mono text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {script.filename}
                  </span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  script.language === 'powershell' 
                    ? 'bg-sky-500/20 text-sky-400' 
                    : 'bg-amber-500/20 text-amber-500'
                }`}>
                  {script.language.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                {script.title}
              </p>
            </button>
          );
        })}
      </div>

      {/* Code Viewer Card */}
      <div className={`p-6 rounded-2xl border transition-colors ${
        theme === 'dark' ? 'bg-neutral-900 border-neutral-700/60' : 'bg-white border-neutral-200'
      }`}>
        {/* Top actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                {selectedScript.title}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                {selectedScript.safetyLevel}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xl">
              {selectedScript.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : theme === 'dark'
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Code Copié !' : 'Copier'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger ({selectedScript.filename})</span>
            </button>
          </div>
        </div>

        {/* Code Block Container */}
        <div className="mt-4 relative">
          <pre className="font-mono text-xs p-4 rounded-xl overflow-x-auto bg-neutral-950 text-neutral-200 border border-neutral-800 leading-relaxed max-h-96">
            <code>{selectedScript.code}</code>
          </pre>
        </div>

        {/* Instructions footer */}
        <div className="mt-4 p-3 rounded-xl bg-neutral-800/40 border border-neutral-700/50 flex items-start gap-3 text-xs">
          <HelpCircle className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
          <div className="text-neutral-300">
            <strong className="text-neutral-100">Mode d'emploi sur votre PC Windows 11 :</strong> {selectedScript.usageInstructions}
          </div>
        </div>
      </div>
    </div>
  );
};
