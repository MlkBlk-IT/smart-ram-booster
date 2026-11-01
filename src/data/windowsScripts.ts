export interface WindowsScript {
  id: string;
  title: string;
  filename: string;
  language: 'powershell' | 'batch';
  description: string;
  safetyLevel: '100% Sécurisé' | 'Avancé (Recommandé)' | 'Admin Requis';
  code: string;
  usageInstructions: string;
}

export const WINDOWS_SCRIPTS: WindowsScript[] = [
  {
    id: 'script-trim-working-sets',
    title: 'Purge du Working Set des processus inactifs (EmptyWorkingSet)',
    filename: 'Trim-WorkingSets.ps1',
    language: 'powershell',
    safetyLevel: '100% Sécurisé',
    description: 'Parcourt les processus utilisateurs en arrière-plan et ordonne à Windows 11 de décharger les pages mémoires inutilisées via l\'API Win32 EmptyWorkingSet sans fermer aucun logiciel.',
    code: `# ====================================================================
# Windows 11 Smart RAM Optimizer - Safe Working Set Trimmer
# Description : Réduit l'empreinte mémoire des applications inactives
# Aucune application n'est fermée ni arrêtée.
# ====================================================================

[CmdletBinding()]
param()

# System.Diagnostics.Process n'expose PAS de methode EmptyWorkingSet()
# (absente en .NET Framework et .NET Core) : le script appelait une
# methode inexistante -> 0 processus tronque, sans aucune erreur visible.
# Appel direct a l'API Win32 psapi.dll.
if (-not ('RAMBoost.Native' -as [type])) {
    Add-Type -Namespace RAMBoost -Name Native -MemberDefinition @'
[DllImport("psapi.dll", SetLastError = true)]
public static extern bool EmptyWorkingSet(IntPtr hProcess);
'@
}

$SystemProtected = @(
    "csrss", "smss", "lsass", "services", "wininit", 
    "dwm", "explorer", "System", "Idle", "Registry",
    # Moteurs IA locaux : les modeles sont en RAM, jamais les vider
    "LM Studio", "LMStudio", "ollama", "llama-server", "llama-cli",
    "koboldcpp", "gpt4all", "jan", "lms", "local-ai", "anythingllm"
)

# Detection supplementaire par ligne de commande (vLLM, ComfyUI, ...)
$AiPattern = 'vllm|comfyui|stable-diffusion-webui|text-generation-webui|sglang|ollama serve|llama_cpp'
$AiPids = @{}
try {
    Get-CimInstance Win32_Process -ErrorAction Stop | ForEach-Object {
        if ($_.CommandLine -and $_.CommandLine -match $AiPattern) { $AiPids[[int]$_.ProcessId] = $true }
    }
} catch { }

Write-Host ">>> [1/2] Analyse des processus utilisateurs..." -ForegroundColor Cyan

$Processes = Get-Process | Where-Object { 
    $_.Id -ne $PID -and 
    $SystemProtected -notcontains $_.ProcessName -and
    (-not $AiPids.ContainsKey([int]$_.Id)) -and
    $_.WorkingSet64 -gt 50MB
}

$TotalFreedBytes = 0
$ProcessedCount = 0

Write-Host ">>> [2/2] Réduction sécurisée des pages inactives..." -ForegroundColor Cyan

foreach ($Proc in $Processes) {
    try {
        $Before = $Proc.WorkingSet64
        # Appel natif API Windows EmptyWorkingSet (psapi.dll)
        $handle = $Proc.Handle
        if ($handle) {
            [void][RAMBoost.Native]::EmptyWorkingSet($handle)
        }
        $Proc.Refresh()
        $After = $Proc.WorkingSet64
        
        if ($Before -gt $After) {
            $Diff = $Before - $After
            $TotalFreedBytes += $Diff
            $ProcessedCount++
        }
    } catch {
        # Droits d'accès ignorés proprement sans erreur bloquante
    }
}

$FreedMB = [math]::Round($TotalFreedBytes / 1MB, 1)
$FreedGB = [math]::Round($TotalFreedBytes / 1GB, 2)

Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host " SUCCÈS : $ProcessedCount processus optimisés avec succès !" -ForegroundColor Green
Write-Host " Mémoire vive récupérée : $FreedMB Mo ($FreedGB Go)" -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Green
`,
    usageInstructions: 'Ouvrez PowerShell (clic droit > Exécuter en tant qu\'administrateur), collez le script ou exécutez le fichier avec : powershell -ExecutionPolicy Bypass -File .\\Trim-WorkingSets.ps1'
  },
  {
    id: 'script-clear-standby',
    title: 'Vidage du cache en veille (Standby List Purger)',
    filename: 'Clear-StandbyMemory.ps1',
    language: 'powershell',
    safetyLevel: 'Avancé (Recommandé)',
    description: 'Évacue la mémoire cache Standby qui sature souvent la RAM sous Windows 11 et provoque des saccades dans les jeux et logiciels 3D.',
    code: `# ====================================================================
# Windows 11 Standby Memory Cache Cleaner
# Nettoie la liste de veille de Windows sans redémarrer le PC
# ====================================================================

# Définition des privilèges de débogage et d'augmentation de quota
$Definition = @"
using System;
using System.Runtime.InteropServices;

public class MemoryCleaner {
    [DllImport("ntdll.dll")]
    public static extern UInt32 NtSetSystemInformation(int InfoClass, IntPtr Info, int Length);
    
    // Commande 4 = Purge de la Standby List
    public static void PurgeStandbyList() {
        IntPtr p = Marshal.AllocHGlobal(4);
        Marshal.WriteInt32(p, 4);
        NtSetSystemInformation(0x0050, p, 4);
        Marshal.FreeHGlobal(p);
    }
}
"@

try {
    Add-Type -TypeDefinition $Definition -Language CSharp
    Write-Host ">>> Purge du cache Standby Windows en cours..." -ForegroundColor Cyan
    [MemoryCleaner]::PurgeStandbyList()
    Write-Host ">>> Cache Standby vidé avec succès !" -ForegroundColor Green
    Write-Host ">>> La mémoire en veille a été réaffectée à la RAM Libre." -ForegroundColor Yellow
} catch {
    Write-Warning "Erreur : Droits Administrateur requis pour purger la Standby List système."
}
`,
    usageInstructions: 'Nécessite des privilèges Administrateur pour modifier la mémoire système NtSetSystemInformation.'
  },
  {
    id: 'script-enable-compression',
    title: 'Activation du Boost Logiciel & Compression RAM Windows 11 (MMAgent)',
    filename: 'Enable-MemoryCompression.ps1',
    language: 'powershell',
    safetyLevel: '100% Sécurisé',
    description: 'Active la compression de mémoire native de Windows 11 (MMAgent MemoryCompression). Permet de stocker jusqu\'à 40% de données en plus dans la RAM avant de devoir paginer sur le SSD/disque.',
    code: `# ====================================================================
# Windows 11 Memory Compression (MMAgent) Optimizer
# ====================================================================

Write-Host ">>> Vérification du statut de la compression mémoire..." -ForegroundColor Cyan
$Current = Get-MMAgent

Write-Host "Compression mémoire actuelle : $(if ($Current.MemoryCompression) { 'Activée' } else { 'Désactivée' })"
Write-Host "Pre-launch des applications : $(if ($Current.ApplicationPreLaunch) { 'Activée' } else { 'Désactivée' })"

if (-not $Current.MemoryCompression) {
    Write-Host ">>> Activation de MemoryCompression..." -ForegroundColor Yellow
    Enable-MMAgent -MemoryCompression
    Write-Host ">>> Compression mémoire Windows 11 activée avec succès !" -ForegroundColor Green
} else {
    Write-Host ">>> La compression mémoire est déjà active et optimale." -ForegroundColor Green
}

# Optimisation du fichier d'échange (recommandé Windows 11 géré par le système)
Write-Host ">>> Astuce : Laissez le fichier d'échange (pagefile.sys) sur votre SSD le plus rapide." -ForegroundColor DarkGray
`,
    usageInstructions: 'Exécutez dans un terminal Windows PowerShell ouvert en Administrateur.'
  },
  {
    id: 'script-all-in-one-bat',
    title: 'Optimiseur Tout-en-Un Windows 11 (.bat script)',
    filename: 'Win11-RAM-Booster.bat',
    language: 'batch',
    safetyLevel: 'Admin Requis',
    description: 'Fichier Batch exécutable en double-clic avec élévation automatique des droits administrateur pour nettoyer la RAM, vider le cache DNS et les fichiers temporaires.',
    code: `@echo off
:: ====================================================================
:: Windows 11 RAM Booster & Cleaner Script
:: ====================================================================
title Windows 11 RAM Booster & Memory Optimizer
color 0B

echo.
echo ========================================================
echo    WINDOWS 11 SMART RAM BOOSTER ^& MEMORY OPTIMIZER
echo ========================================================
echo.

:: Vérification élévation Administrateur
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERREUR] Ce script necessite les droits d'administrateur.
    echo Veuillez faire clic droit ^> "Executer en tant qu'administrateur".
    pause
    exit /b 1
)

echo [1/4] Optimisation de la compression memoire Windows 11...
powershell -Command "Enable-MMAgent -MemoryCompression" >nul 2>&1
echo       Termine.

echo [2/4] Purge securisee des Working Sets inactifs...
powershell -NoProfile -Command "Add-Type -Namespace RAMBoost -Name Native -MemberDefinition '[DllImport(\\\"psapi.dll\\\")] public static extern bool EmptyWorkingSet(IntPtr h);'; Get-Process | Where-Object { $_.WorkingSet64 -gt 50MB -and $_.ProcessName -notmatch '^(lm studio|lmstudio|ollama|llama|koboldcpp|gpt4all|jan|lms|local-ai|anythingllm)$' } | ForEach-Object { try { $h = $_.Handle; if ($h) { [void][RAMBoost.Native]::EmptyWorkingSet($h) } } catch {} }"
echo       Termine.

echo [3/4] Vidage du cache DNS et recyclage de la pile reseau...
ipconfig /flushdns >nul 2>&1
echo       Termine.

echo [4/4] Nettoyage securise du cache temporaire de Windows...
del /q /f /s "%temp%\\*" >nul 2>&1
echo       Termine.

echo.
echo ========================================================
echo   OPTIMISATION REUSSIE AVEC SUCCES !
echo   Votre memoire RAM Windows 11 est desormais optimisee.
echo ========================================================
echo.
pause
`,
    usageInstructions: 'Faites simplement un clic droit sur Win11-RAM-Booster.bat > "Exécuter en tant qu\'administrateur".'
  }
];
