using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Management;
using System.Net;
using System.Runtime.InteropServices;
using System.Security.Principal;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;

public class RAMBoosterBackend {

    [StructLayout(LayoutKind.Sequential)]
    struct MEMORYSTATUSEX {
        public uint dwLength;
        public uint dwMemoryLoad;
        public ulong ullTotalPhys;
        public ulong ullAvailPhys;
        public ulong ullTotalPageFile;
        public ulong ullAvailPageFile;
        public ulong ullTotalVirtual;
        public ulong ullAvailVirtual;
        public ulong ullAvailExtendedVirtual;
    }

    [DllImport("kernel32.dll", SetLastError = true)]
    static extern bool GlobalMemoryStatusEx(ref MEMORYSTATUSEX lpBuffer);

    [DllImport("psapi.dll", SetLastError = true)]
    static extern bool EmptyWorkingSet(IntPtr hProcess);

    [DllImport("ntdll.dll")]
    static extern int NtSetSystemInformation(int infoClass, IntPtr info, int length);

    static readonly string[] CRITICAL = {
        "system", "idle", "registry", "smss", "csrss", "wininit", "winlogon",
        "services", "lsass", "svchost", "dwm", "explorer", "memcompression",
        "fontdrvhost", "sihost", "spoolsv", "wmiprvse", "runtimebroker", "clfs"
    };

    // Moteurs IA locaux : les modeles sont en RAM, vider leur working set
    // provoque un rechargement complet du modele. INTERDIT de les toucher.
    static readonly string[] AI_PROTECTED = {
        "lm studio", "lmstudio", "ollama", "llama-server", "llama-cli", "llamafile",
        "koboldcpp", "gpt4all", "local-ai", "localai", "anythingllm", "sillytavern",
        "comfyui", "invokeai", "stable-diffusion-webui", "text-generation-webui",
        "vllm", "sglang", "mlx", "jan.exe"
    };

    static readonly string[] AI_EXACT = { "jan", "lms", "jan.exe", "lms.exe" };

    static readonly object CmdLock = new object();
    static Dictionary<int, string> CmdCache = new Dictionary<int, string>();
    static DateTime CmdCacheTime = DateTime.MinValue;

    static bool IsAiProtected(string name, string commandLine) {
        string n = (name == null ? "" : name).ToLowerInvariant();
        for (int i = 0; i < AI_EXACT.Length; i++) {
            if (n == AI_EXACT[i]) return true;
        }
        for (int i = 0; i < AI_PROTECTED.Length; i++) {
            if (n.IndexOf(AI_PROTECTED[i], StringComparison.OrdinalIgnoreCase) >= 0) return true;
        }
        string cl = (commandLine == null ? "" : commandLine).ToLowerInvariant();
        for (int i = 0; i < AI_PROTECTED.Length; i++) {
            if (cl.IndexOf(AI_PROTECTED[i], StringComparison.OrdinalIgnoreCase) >= 0) return true;
        }
        return false;
    }

    static Dictionary<int, string> GetCommandLines() {
        lock (CmdLock) {
            if (CmdCache.Count > 0 && (DateTime.Now - CmdCacheTime).TotalSeconds < 8) return CmdCache;
        }
        Dictionary<int, string> map = new Dictionary<int, string>();
        try {
            ManagementObjectSearcher searcher = new ManagementObjectSearcher(
                "root\\CIMV2", "SELECT ProcessId, CommandLine FROM Win32_Process");
            foreach (ManagementObject obj in searcher.Get()) {
                try {
                    uint pid = Convert.ToUInt32(obj["ProcessId"]);
                    string cl = obj["CommandLine"] == null ? "" : obj["CommandLine"].ToString();
                    map[(int)pid] = cl;
                } catch { }
            }
        } catch (Exception ex) {
            Log("WMI Win32_Process: " + ex.Message);
        }
        lock (CmdLock) {
            CmdCache = map;
            CmdCacheTime = DateTime.Now;
        }
        return map;
    }

    static bool? CompressionCache = null;
    static DateTime CompressionCacheTime = DateTime.MinValue;

    static bool GetCompressionEnabled() {
        if (CompressionCache.HasValue && (DateTime.Now - CompressionCacheTime).TotalSeconds < 60) {
            return CompressionCache.Value;
        }
        bool enabled = false;
        try {
            ProcessStartInfo psi = new ProcessStartInfo();
            psi.FileName = "powershell.exe";
            psi.Arguments = "-NoProfile -NonInteractive -Command \"(Get-MMAgent).MemoryCompression\"";
            psi.RedirectStandardOutput = true;
            psi.UseShellExecute = false;
            psi.CreateNoWindow = true;
            Process pr = Process.Start(psi);
            string output = pr.StandardOutput.ReadToEnd();
            pr.WaitForExit(10000);
            enabled = output.IndexOf("True", StringComparison.OrdinalIgnoreCase) >= 0;
        } catch { }
        CompressionCache = enabled;
        CompressionCacheTime = DateTime.Now;
        return enabled;
    }

    // Applications importantes declarees par l'utilisateur : jamais touchees.
    static readonly string[] IMPORTANT_PROTECTED = {
        "adguard", "adguardhome", "adguard desktop", "adguard service"
    };

    // Liste utilisateur editable : protege.ini a cote de l'exe.
    // Une ligne par application, " * " autorise les jokers. Commentaires startswith # ou ;
    static readonly object ProtLock = new object();
    static List<string> UserProtected = null;
    static DateTime UserProtectedTime = DateTime.MinValue;

    static string ProtegePath() {
        return Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "protege.ini");
    }

    static void CreateProtegeFileIfMissing() {
        try {
            string path = ProtegePath();
            if (File.Exists(path)) return;
            StringBuilder sb = new StringBuilder();
            sb.AppendLine("# ============================================================");
            sb.AppendLine("#  APPLICATIONS A NE JAMAIS VIDER");
            sb.AppendLine("#  Une ligne par application (nom de processus). * = joker.");
            sb.AppendLine("#  Ce fichier est relu toutes les 10 secondes : pas besoin");
            sb.AppendLine("#  de recompiler pour ajouter une application.");
            sb.AppendLine("# ============================================================");
            sb.AppendLine();
            sb.AppendLine("# Moteurs IA locaux (modeles charges en RAM)");
            sb.AppendLine("lm studio");
            sb.AppendLine("lmstudio");
            sb.AppendLine("ollama");
            sb.AppendLine("llama-server");
            sb.AppendLine("llama-cli");
            sb.AppendLine("koboldcpp");
            sb.AppendLine("gpt4all");
            sb.AppendLine("jan");
            sb.AppendLine("lms");
            sb.AppendLine("local-ai");
            sb.AppendLine("anythingllm");
            sb.AppendLine("vllm");
            sb.AppendLine("comfyui");
            sb.AppendLine();
            sb.AppendLine("# Filtres, antivirus, reseau");
            sb.AppendLine("adguard");
            sb.AppendLine();
            sb.AppendLine("# Exemple :");
            sb.AppendLine("# *antivirus*");
            sb.AppendLine("# mon-outil-metier");
            File.WriteAllText(path, sb.ToString(), Encoding.UTF8);
        } catch { }
    }

    static List<string> GetUserProtected() {
        lock (ProtLock) {
            if (UserProtected != null && (DateTime.Now - UserProtectedTime).TotalSeconds < 10) return UserProtected;
        }
        List<string> list = new List<string>();
        try {
            string path = ProtegePath();
            if (File.Exists(path)) {
                foreach (string raw in File.ReadAllLines(path)) {
                    string s = raw.Trim();
                    if (s.Length == 0) continue;
                    if (s.StartsWith("#") || s.StartsWith(";")) continue;
                    list.Add(s.ToLowerInvariant());
                }
            }
        } catch { }
        lock (ProtLock) {
            UserProtected = list;
            UserProtectedTime = DateTime.Now;
        }
        return list;
    }

    static bool IsUserProtected(string name, string commandLine) {
        List<string> list = GetUserProtected();
        if (list.Count == 0) return false;
        string n = (name == null ? "" : name).ToLowerInvariant();
        string cl = (commandLine == null ? "" : commandLine).ToLowerInvariant();
        for (int i = 0; i < list.Count; i++) {
            string pat = list[i];
            if (pat.IndexOf('*') >= 0) {
                string rx = "^" + pat.Replace(".", "\\.").Replace("*", ".*") + "$";
                try {
                    if (System.Text.RegularExpressions.Regex.IsMatch(n, rx)) return true;
                    if (System.Text.RegularExpressions.Regex.IsMatch(cl, rx)) return true;
                } catch { }
            } else {
                if (n.IndexOf(pat, StringComparison.OrdinalIgnoreCase) >= 0) return true;
                if (cl.IndexOf(pat, StringComparison.OrdinalIgnoreCase) >= 0) return true;
            }
        }
        return false;
    }

    static bool IsImportant(string name, string commandLine) {
        string n = (name == null ? "" : name).ToLowerInvariant();
        for (int i = 0; i < IMPORTANT_PROTECTED.Length; i++) {
            if (n.IndexOf(IMPORTANT_PROTECTED[i], StringComparison.OrdinalIgnoreCase) >= 0) return true;
        }
        return IsUserProtected(name, commandLine);
    }

    const long MB = 1024L * 1024L;
    const long MIN_WS = 50L * MB;
    const int PORT = 8731;

    static readonly JavaScriptSerializer JSON = new JavaScriptSerializer();
    static readonly object MemLock = new object();
    static readonly Dictionary<int, long> TrimmedPids = new Dictionary<int, long>();
    static Dictionary<string, object> MemCache = null;
    static DateTime MemCacheTime = DateTime.MinValue;
    static Dictionary<int, double> CpuPrev = new Dictionary<int, double>();
    static DateTime CpuPrevTime = DateTime.UtcNow;
    static string LogPath = null;

    public static void Main(string[] args) {
        string baseDir = AppDomain.CurrentDomain.BaseDirectory;
        LogPath = Path.Combine(baseDir, "RAMBooster.log");
        Log("Demarrage RAMBooster backend");
        CreateProtegeFileIfMissing();

        bool testMode = args != null && args.Length > 0 && args[0] == "--test";
        int port = PORT;
        for (int i = 0; i < (args == null ? 0 : args.Length); i++) {
            if (args[i] == "--port" && i + 1 < args.Length) {
                int parsed;
                if (int.TryParse(args[i + 1], out parsed)) port = parsed;
            }
        }
        if (!testMode && !IsAdmin() && RelaunchElevated()) return;
        Log("Admin: " + IsAdmin());

        string uiPath = Path.Combine(baseDir, "ui", "index.html");
        if (!File.Exists(uiPath)) {
            Log("ERREUR ui/index.html introuvable dans " + baseDir);
        }

        HttpListener listener = new HttpListener();
        listener.Prefixes.Add("http://127.0.0.1:" + port + "/");
        try {
            listener.Start();
        } catch (Exception ex) {
            Log("Port " + port + " occupe, arret des instances precedentes: " + ex.Message);
            KillOtherInstances();
            Thread.Sleep(1500);
            try {
                listener.Start();
            } catch (Exception ex2) {
                Log("ERREUR HttpListener: " + ex2.Message);
                return;
            }
        }
        Log("Serveur demarre sur http://127.0.0.1:" + port + "/");

        if (!testMode) OpenAppWindow("http://127.0.0.1:" + port + "/");

        while (true) {
            HttpListenerContext ctx;
            try {
                ctx = listener.GetContext();
            } catch (Exception ex) {
                Log("Listener arrete: " + ex.Message);
                break;
            }
            ThreadPool.QueueUserWorkItem(delegate(object state) {
                Handle((HttpListenerContext)state);
            }, ctx);
        }
    }

    static void Handle(HttpListenerContext ctx) {
        try {
            string path = ctx.Request.Url.AbsolutePath;
            string method = ctx.Request.HttpMethod;

            if (path == "/api/state") {
                WriteJson(ctx, BuildState());
                return;
            }
            if (path == "/api/optimize") {
                bool idleOnly = ctx.Request.QueryString["idle"] == "1";
                WriteJson(ctx, Optimize(idleOnly));
                return;
            }
            if (path == "/api/trim") {
                int pid;
                if (!int.TryParse(ctx.Request.QueryString["pid"], out pid)) {
                    WriteJson(ctx, Error("pid manquant"));
                    return;
                }
                WriteJson(ctx, TrimOne(pid));
                return;
            }
            if (path == "/api/ping") {
                WriteJson(ctx, new Dictionary<string, object> { { "ok", true }, { "admin", IsAdmin() } });
                return;
            }

            string uiPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "ui", "index.html");
            if (path == "/" || path == "/index.html") {
                if (!File.Exists(uiPath)) {
                    byte[] miss = Encoding.UTF8.GetBytes("ui/index.html introuvable");
                    ctx.Response.StatusCode = 404;
                    ctx.Response.ContentType = "text/plain; charset=utf-8";
                    ctx.Response.ContentLength64 = miss.Length;
                    ctx.Response.OutputStream.Write(miss, 0, miss.Length);
                    ctx.Response.Close();
                    return;
                }
                byte[] body = File.ReadAllBytes(uiPath);
                ctx.Response.StatusCode = 200;
                ctx.Response.ContentType = "text/html; charset=utf-8";
                ctx.Response.ContentLength64 = body.Length;
                ctx.Response.OutputStream.Write(body, 0, body.Length);
                ctx.Response.Close();
                return;
            }

            ctx.Response.StatusCode = 404;
            ctx.Response.Close();
        } catch (Exception ex) {
            Log("Erreur handler: " + ex.Message);
            try { ctx.Response.StatusCode = 500; ctx.Response.Close(); } catch { }
        }
    }

    static void WriteJson(HttpListenerContext ctx, object payload) {
        string json = JSON.Serialize(payload);
        byte[] data = Encoding.UTF8.GetBytes(json);
        ctx.Response.StatusCode = 200;
        ctx.Response.ContentType = "application/json; charset=utf-8";
        ctx.Response.ContentLength64 = data.Length;
        ctx.Response.OutputStream.Write(data, 0, data.Length);
        ctx.Response.Close();
    }

    static Dictionary<string, object> Error(string message) {
        Dictionary<string, object> d = new Dictionary<string, object>();
        d["ok"] = false;
        d["message"] = message;
        return d;
    }

    // ------------------------------------------------------------- ETAT REEL
    static Dictionary<string, object> BuildState() {
        Dictionary<string, object> state = new Dictionary<string, object>();
        state["ok"] = true;
        state["admin"] = IsAdmin();
        state["memory"] = GetMemory();
        state["processes"] = GetProcesses();
        state["timestamp"] = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
        return state;
    }

    static Dictionary<string, object> GetMemory() {
        lock (MemLock) {
            if (MemCache != null && (DateTime.Now - MemCacheTime).TotalSeconds < 8) {
                return MemCache;
            }
        }

        MEMORYSTATUSEX m = new MEMORYSTATUSEX();
        m.dwLength = (uint)Marshal.SizeOf(typeof(MEMORYSTATUSEX));
        GlobalMemoryStatusEx(ref m);

        long total = (long)m.ullTotalPhys;
        long avail = (long)m.ullAvailPhys;

        Dictionary<string, object> perf = QueryPerfMemory();
        long standby = SumProps(perf, "standbycache", true);
        long compressed = GetCompressed(perf);

        long inUse = total - avail;
        if (inUse < 0) inUse = 0;
        long free = avail - standby;
        if (free < 0) free = 0;

        Dictionary<string, object> d = new Dictionary<string, object>();
        d["totalMb"] = total / MB;
        d["inUseMb"] = inUse / MB;
        d["compressedMb"] = compressed / MB;
        d["standbyMb"] = standby / MB;
        d["freeMb"] = free / MB;
        d["pagefileTotalMb"] = (long)m.ullTotalPageFile / MB;
        d["pagefileUsedMb"] = ((long)m.ullTotalPageFile - (long)m.ullAvailPageFile) / MB;
        d["loadPercent"] = (long)m.dwMemoryLoad;
        d["compressionEnabled"] = GetCompressionEnabled();

        lock (MemLock) {
            MemCache = d;
            MemCacheTime = DateTime.Now;
        }
        return d;
    }

    static Dictionary<string, object> QueryPerfMemory() {
        Dictionary<string, object> res = new Dictionary<string, object>();
        try {
            ManagementObjectSearcher searcher = new ManagementObjectSearcher(
                "root\\CIMV2", "SELECT * FROM Win32_PerfFormattedData_PerfOS_Memory");
            foreach (ManagementObject obj in searcher.Get()) {
                foreach (PropertyData pd in obj.Properties) {
                    try {
                        if (pd.Value != null) res[pd.Name] = pd.Value;
                    } catch { }
                }
                break;
            }
        } catch (Exception ex) {
            Log("WMI PerfOS_Memory: " + ex.Message);
        }
        return res;
    }

    static long SumProps(Dictionary<string, object> props, string needle, bool bytesOnly) {
        long sum = 0;
        foreach (KeyValuePair<string, object> kv in props) {
            string n = kv.Key.ToLowerInvariant();
            if (n.IndexOf(needle, StringComparison.OrdinalIgnoreCase) < 0) continue;
            if (bytesOnly && !n.EndsWith("bytes")) continue;
            try { sum += Convert.ToInt64(kv.Value, CultureInfo.InvariantCulture); } catch { }
        }
        return sum;
    }

    static long GetCompressed(Dictionary<string, object> props) {
        long bytes = 0;
        long pages = 0;
        foreach (KeyValuePair<string, object> kv in props) {
            string n = kv.Key.ToLowerInvariant();
            if (n.IndexOf("compress", StringComparison.OrdinalIgnoreCase) < 0) continue;
            long v;
            try { v = Convert.ToInt64(kv.Value, CultureInfo.InvariantCulture); } catch { continue; }
            if (n.EndsWith("count")) pages += v;
            else bytes += v;
        }
        long wmi = bytes + pages * 4096L;
        if (wmi > 0) return wmi;
        // Windows impute le store de compression memoire au processus System (PID 4)
        try {
            Process sysProc = Process.GetProcessById(4);
            long v = sysProc.PrivateMemorySize64;
            sysProc.Dispose();
            return v;
        } catch {
            return 0;
        }
    }

    static List<Dictionary<string, object>> GetProcesses() {
        Dictionary<int, double> cpuNow = new Dictionary<int, double>();
        Process[] all = Process.GetProcesses();
        DateTime now = DateTime.UtcNow;
        double elapsed = Math.Max(1.0, (now - CpuPrevTime).TotalMilliseconds);

        List<Dictionary<string, object>> list = new List<Dictionary<string, object>>();
        Dictionary<int, string> cmdlines = GetCommandLines();
        foreach (Process p in all) {
            try {
                int pid = p.Id;
                string name = p.ProcessName == null ? "" : p.ProcessName;
                string cmdLine;
                cmdlines.TryGetValue(pid, out cmdLine);
                bool aiProc = IsAiProtected(name, cmdLine);
                bool importantProc = aiProc || IsImportant(name, cmdLine);
                long ws = p.WorkingSet64;
                long priv = p.PrivateMemorySize64;
                double cpuMs = 0;
                try { cpuMs = p.TotalProcessorTime.TotalMilliseconds; } catch { }
                cpuNow[pid] = cpuMs;

                double cpuPct = 0;
                double prev;
                if (CpuPrev.TryGetValue(pid, out prev)) {
                    cpuPct = (cpuMs - prev) / elapsed / Environment.ProcessorCount * 100.0;
                    if (cpuPct < 0) cpuPct = 0;
                    if (cpuPct > 100) cpuPct = 100;
                }

                bool protectedProc = IsCritical(name) || importantProc;
                bool hasWindow = false;
                try { hasWindow = p.MainWindowHandle != IntPtr.Zero; } catch { }

                string status = "running";
                if (TrimmedPids.ContainsKey(pid)) status = "trimmed";
                else if (!hasWindow && ws >= MIN_WS && cpuPct < 2.0) status = "idle";

                Dictionary<string, object> item = new Dictionary<string, object>();
                item["id"] = "proc-" + pid;
                item["pid"] = pid;
                item["name"] = name + ".exe";
                item["displayName"] = name;
                item["category"] = Categorize(name, protectedProc);
                item["memoryMb"] = ws / MB;
                item["initialMemoryMb"] = ws / MB;
                item["workingSetPrivateMb"] = priv / MB;
                item["standbyCacheMb"] = 0;
                item["cpuPercent"] = Math.Round(cpuPct, 1);
                item["isSystemProtected"] = protectedProc;
                item["isIdle"] = status == "idle";
                item["status"] = status;
                item["leakRisk"] = "none";
                item["iconName"] = IconFor(Categorize(name, protectedProc));
                item["description"] = aiProc
                    ? "Moteur IA local - protege, jamais vide."
                    : (importantProc
                        ? "Application importante - protegee (liste protege.ini)."
                        : (protectedProc
                            ? "Processus systeme protege - non modifiable."
                            : "Working set " + (ws / MB) + " Mo - " + status + "."));
                list.Add(item);
            } catch { }
            finally {
                try { p.Dispose(); } catch { }
            }
        }

        CpuPrev = cpuNow;
        CpuPrevTime = now;

        list.Sort(delegate(Dictionary<string, object> a, Dictionary<string, object> b) {
            return Convert.ToInt64(b["memoryMb"]).CompareTo(Convert.ToInt64(a["memoryMb"]));
        });

        if (list.Count > 80) list.RemoveRange(80, list.Count - 80);
        return list;
    }

    static bool IsCritical(string name) {
        string n = name.ToLowerInvariant();
        for (int i = 0; i < CRITICAL.Length; i++) {
            if (n == CRITICAL[i]) return true;
        }
        return false;
    }

    static string Categorize(string name, bool isSystem) {
        if (isSystem) return "system";
        string n = name.ToLowerInvariant();
        if (n.IndexOf("chrome", StringComparison.OrdinalIgnoreCase) >= 0 ||
            n.IndexOf("msedge", StringComparison.OrdinalIgnoreCase) >= 0 ||
            n.IndexOf("firefox", StringComparison.OrdinalIgnoreCase) >= 0 ||
            n.IndexOf("brave", StringComparison.OrdinalIgnoreCase) >= 0 ||
            n.IndexOf("opera", StringComparison.OrdinalIgnoreCase) >= 0 ||
            n.IndexOf("vivaldi", StringComparison.OrdinalIgnoreCase) >= 0 ||
            n.IndexOf("browser", StringComparison.OrdinalIgnoreCase) >= 0) return "browser";
        if (n.IndexOf("steam", StringComparison.OrdinalIgnoreCase) >= 0 ||
            n.IndexOf("game", StringComparison.OrdinalIgnoreCase) >= 0 ||
            n.IndexOf("riot", StringComparison.OrdinalIgnoreCase) >= 0 ||
            n.IndexOf("epic", StringComparison.OrdinalIgnoreCase) >= 0 ||
            n.IndexOf("launcher", StringComparison.OrdinalIgnoreCase) >= 0 ||
            n.IndexOf("valorant", StringComparison.OrdinalIgnoreCase) >= 0 ||
            n.IndexOf("warframe", StringComparison.OrdinalIgnoreCase) >= 0) return "game";
        if (n.IndexOf("adobe", StringComparison.OrdinalIgnoreCase) >= 0 ||
            n.IndexOf("figma", StringComparison.OrdinalIgnoreCase) >= 0 ||
            n.IndexOf("blender", StringComparison.OrdinalIgnoreCase) >= 0 ||
            n.IndexOf("premiere", StringComparison.OrdinalIgnoreCase) >= 0 ||
            n.IndexOf("photoshop", StringComparison.OrdinalIgnoreCase) >= 0 ||
            n.IndexOf("obs", StringComparison.OrdinalIgnoreCase) >= 0 ||
            n.IndexOf("audacity", StringComparison.OrdinalIgnoreCase) >= 0 ||
            n.IndexOf("davinci", StringComparison.OrdinalIgnoreCase) >= 0) return "creative";
        return "background";
    }

    static string IconFor(string category) {
        if (category == "browser") return "Globe";
        if (category == "game") return "Gamepad2";
        if (category == "creative") return "Layers";
        if (category == "system") return "Shield";
        return "Cpu";
    }

    // ------------------------------------------------------------ OPTIMISATION
    static Dictionary<string, object> Optimize(bool idleOnly) {
        Stopwatch sw = Stopwatch.StartNew();
        MEMORYSTATUSEX before = new MEMORYSTATUSEX();
        before.dwLength = (uint)Marshal.SizeOf(typeof(MEMORYSTATUSEX));
        GlobalMemoryStatusEx(ref before);

        int trimmed = 0;
        int failed = 0;
        int skipped = 0;
        long wsFreed = 0;

        Process[] all = Process.GetProcesses();
        Dictionary<int, string> cmdlines = GetCommandLines();
        foreach (Process p in all) {
            try {
                string name = p.ProcessName == null ? "" : p.ProcessName;
                string cmdLine;
                cmdlines.TryGetValue(p.Id, out cmdLine);
                if (IsCritical(name)) { skipped++; continue; }
                if (IsAiProtected(name, cmdLine)) { skipped++; continue; }
                if (IsImportant(name, cmdLine)) { skipped++; continue; }
                long ws = p.WorkingSet64;
                if (ws < MIN_WS) { skipped++; continue; }

                // Application avec fenetre visible = travail en cours : jamais touchee.
                bool hasWindow = false;
                try { hasWindow = p.MainWindowHandle != IntPtr.Zero; } catch { }
                if (hasWindow) { skipped++; continue; }

                long prev = ws;
                bool ok;
                try { ok = EmptyWorkingSet(p.Handle); } catch { failed++; continue; }
                if (!ok) { failed++; continue; }

                try { p.Refresh(); } catch { }
                long afterWs = p.WorkingSet64;
                if (afterWs < prev) {
                    wsFreed += prev - afterWs;
                    trimmed++;
                    TrimmedPids[p.Id] = DateTime.Now.Ticks;
                }
            } catch {
                failed++;
            } finally {
                try { p.Dispose(); } catch { }
            }
        }

        bool standbyPurged = PurgeStandbyList();

        MEMORYSTATUSEX after = new MEMORYSTATUSEX();
        after.dwLength = (uint)Marshal.SizeOf(typeof(MEMORYSTATUSEX));
        GlobalMemoryStatusEx(ref after);

        long freedAvail = (long)after.ullAvailPhys - (long)before.ullAvailPhys;
        long freedMb = freedAvail > 0 ? freedAvail / MB : wsFreed / MB;

        lock (MemLock) { MemCache = null; }

        Dictionary<string, object> d = new Dictionary<string, object>();
        d["ok"] = true;
        d["freedMb"] = freedMb;
        d["trimmedCount"] = trimmed;
        d["skippedCount"] = skipped;
        d["failedCount"] = failed;
        d["standbyPurged"] = standbyPurged;
        d["durationMs"] = sw.ElapsedMilliseconds;
        d["message"] = trimmed + " processus liberes, " + freedMb + " Mo reellement disponibles"
            + (standbyPurged ? ", cache Standby purge." : ", cache Standby non purge (privileges).");
        Log(d["message"].ToString());
        return d;
    }

    static Dictionary<string, object> TrimOne(int pid) {
        Stopwatch sw = Stopwatch.StartNew();
        long freed = 0;
        bool ok = false;
        string name = "";
        Process target = null;
        try {
            target = Process.GetProcessById(pid);
            name = target.ProcessName == null ? "" : target.ProcessName;
            if (IsCritical(name)) {
                return Error("Processus systeme protege : refuse.");
            }
            Dictionary<int, string> oneCmd = GetCommandLines();
            string procCmd;
            oneCmd.TryGetValue(pid, out procCmd);
            if (IsAiProtected(name, procCmd)) {
                return Error("Moteur IA local : refuse (le modele doit rester charge en RAM).");
            }
            if (IsImportant(name, procCmd)) {
                return Error("Application importante (liste protege.ini) : refuse.");
            }
            long before = target.WorkingSet64;
            ok = EmptyWorkingSet(target.Handle);
            target.Refresh();
            long after = target.WorkingSet64;
            if (after < before) {
                freed = (before - after) / MB;
                TrimmedPids[pid] = DateTime.Now.Ticks;
            }
        } catch (Exception ex) {
            return Error(ex.Message);
        } finally {
            if (target != null) { try { target.Dispose(); } catch { } }
        }

        lock (MemLock) { MemCache = null; }

        Dictionary<string, object> d = new Dictionary<string, object>();
        d["ok"] = ok;
        d["freedMb"] = freed;
        d["trimmedCount"] = ok ? 1 : 0;
        d["skippedCount"] = 0;
        d["failedCount"] = ok ? 0 : 1;
        d["standbyPurged"] = false;
        d["durationMs"] = sw.ElapsedMilliseconds;
        d["message"] = ok
            ? "Working set de " + name + " reduit de " + freed + " Mo."
            : "Working set de " + name + " inchange (acces refuse ou pages verrouillees).";
        return d;
    }

    static bool PurgeStandbyList() {
        IntPtr buf = IntPtr.Zero;
        try {
            buf = Marshal.AllocHGlobal(4);
            Marshal.WriteInt32(buf, 4);
            return NtSetSystemInformation(0x0050, buf, 4) == 0;
        } catch {
            return false;
        } finally {
            if (buf != IntPtr.Zero) Marshal.FreeHGlobal(buf);
        }
    }

    // ---------------------------------------------------------------- OUTILS
    static void KillOtherInstances() {
        try {
            int self = Process.GetCurrentProcess().Id;
            Process[] all = Process.GetProcessesByName("RAMBooster");
            foreach (Process p in all) {
                try {
                    if (p.Id != self) { p.Kill(); p.WaitForExit(3000); }
                } catch { }
                try { p.Dispose(); } catch { }
            }
            Log("Instances precedentes arretees");
        } catch (Exception ex) {
            Log("KillOtherInstances: " + ex.Message);
        }
    }

    static bool IsAdmin() {
        try {
            WindowsIdentity id = WindowsIdentity.GetCurrent();
            WindowsPrincipal pr = new WindowsPrincipal(id);
            return pr.IsInRole(WindowsBuiltInRole.Administrator);
        } catch {
            return false;
        }
    }

    static bool RelaunchElevated() {
        try {
            ProcessStartInfo psi = new ProcessStartInfo();
            psi.FileName = Process.GetCurrentProcess().MainModule.FileName;
            psi.Verb = "runas";
            psi.UseShellExecute = true;
            psi.WorkingDirectory = AppDomain.CurrentDomain.BaseDirectory;
            Process p = Process.Start(psi);
            return p != null;
        } catch {
            return false;
        }
    }

    static void OpenAppWindow(string url) {
        string[] candidates = {
            Environment.GetEnvironmentVariable("ProgramFiles") + "\\Google\\Chrome\\Application\\chrome.exe",
            Environment.GetEnvironmentVariable("ProgramFiles(x86)") + "\\Google\\Chrome\\Application\\chrome.exe",
            Environment.GetEnvironmentVariable("ProgramFiles(x86)") + "\\Microsoft\\Edge\\Application\\msedge.exe",
            Environment.GetEnvironmentVariable("ProgramFiles") + "\\Microsoft\\Edge\\Application\\msedge.exe"
        };
        foreach (string c in candidates) {
            if (!string.IsNullOrEmpty(c) && File.Exists(c)) {
                try {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = c;
                    psi.Arguments = "--app=\"" + url + "\" --window-size=1440,900";
                    psi.UseShellExecute = false;
                    Process.Start(psi);
                    Log("Navigateur ouvert: " + c);
                    return;
                } catch (Exception ex) {
                    Log("Echec ouverture navigateur: " + ex.Message);
                }
            }
        }
        Log("Aucun navigateur trouve - ouvrez manuellement " + url);
    }

    static void Log(string message) {
        try {
            if (LogPath == null) return;
            File.AppendAllText(LogPath,
                DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "  " + message + Environment.NewLine);
        } catch { }
    }
}