# Smart RAM Booster

Optimiseur de mémoire vive pour **Windows 11** — moteur natif C# + interface Fluent.
Aucune donnée fictive : tout ce qui est affiché est mesuré sur la machine.

![Logo](docs/logo.png)

**Auteur** : Malik Belkacemi — [@MlkBlk-IT](https://github.com/MlkBlk-IT)
**Licence** : Tous droits réservés — voir [LICENSE](LICENSE).
## Nouveautés — 2026-11-01

| Changement | Ce que ça change |
|---|---|
| **v1.0.0 — moteur natif** | Moteur Windows en C# (psapi/ntdll) + interface Fluent, **mesures réelles**. |
| **Composant de téléchargement retiré** | L'application est déjà installée : le dépôt ne distribue plus d'installeur. |
| **Aucune donnée fictive** | Tout ce qui est affiché est mesuré sur la machine — voir « Mesures : d'où viennent les chiffres ». |

---

## Ce que fait l'application

| Écran | Rôle |
|---|---|
| Tableau de bord | RAM totale / utilisée / Standby / libre mesurés en continu, jauge circulaire, répartition détaillée |
| Nettoyeur intelligent | Cycle complet en un clic : working sets inactifs + purge du cache Standby |
| Inspecteur processus | 80 processus réels (working set, commit privé, CPU), vidage unitaire ou global |
| Boost logiciel | Profils Balanced / Gaming / Eco 8 Go appliqués au moteur |
| Scripts Windows 11 | Scripts PowerShell et batch prêts à l'emploi |

## Mesures : d'où viennent les chiffres

| Donnée | Source |
|---|---|
| RAM totale / disponible | `GlobalMemoryStatusEx` (kernel32) |
| Cache Standby / Modified | WMI `Win32_PerfFormattedData_PerfOS_Memory` |
| Compression MMAgent | `Get-MMAgent` (PowerShell, cache 60 s) |
| Processus, working set, CPU | `System.Diagnostics.Process` |
| RAM libérée | **mesurée avant / après**, jamais calculée |

Le vidage utilise `psapi.dll!EmptyWorkingSet` puis la purge du cache Standby via
`ntdll!NtSetSystemInformation(0x50, cmd 4)`.

## Protection des applications importantes

`protege.ini` (à côté de l'exécutable) liste les applications à **ne jamais vider** :
une ligne par application, `*` en joker, relu toutes les 10 secondes — pas besoin de
recompiler pour en ajouter une.

Sont déjà protégés : LM Studio, Ollama, llama.cpp, KoboldCpp, GPT4All, Jan, LocalAI,
AnythingLLM, vLLM, SGLang, ComfyUI, InvokeAI, SD WebUI, **AdGuard**.

La détection se fait par **nom de processus ET par ligne de commande** (les runtimes
Python type vLLM ou ComfyUI ne sont repérables que comme ça). Toute application
disposant d'une fenêtre visible est également ignorée : un travail en cours n'est
pas vidé.

> Un modèle d'IA local vit en RAM : le vider force son rechargement complet.

## Architecture

```
src/                     interface React (Vite + Tailwind v4 + lucide)
  components/Logo.tsx    logo SVG
  services/api.ts        couche d'appel vers le moteur natif
build/
  RAMBoosterBackend.cs   moteur natif : serveur HTTP local + API Windows
  Generer_RAMBooster_EXE.bat   compile le moteur avec csc.exe (Windows 11)
  logo.ps1               génère logo.png / logo.ico
```

Le moteur natif sert l'interface sur `http://127.0.0.1:8731` et expose :

| Route | Effet |
|---|---|
| `GET /api/state` | RAM + processus réels |
| `POST /api/optimize` | vidage des working sets + purge Standby |
| `POST /api/trim?pid=N` | vidage d'un processus |

Sans moteur lancé, l'interface bascule en **MODE DÉMO** avec bandeau d'avertissement.

## Installation

1. `build\Generer_RAMBooster_EXE.bat` → produit `RAMBooster.exe`
2. Copier `RAMBooster.exe` + `ui\index.html` dans un dossier
3. Lancer l'exécutable et **accepter l'invite UAC** (indispensable pour le cache Standby)

## Reconstruire l'interface

```bash
npm install
npm run build      # -> dist/index.html (build single-file)
```

## Licence

© 2026 Malik Belkacemi — **tous droits réservés**.
Aucune redistribution ni modification sans autorisation écrite préalable.
