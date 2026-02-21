"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Types ─────────────────────────────────────────── */
interface HealthData {
  status: "active" | "inactive";
  raw: string;
  uptime?: string;
  error?: string;
}

interface NetworkData {
  listening: boolean;
  port: number;
  protocol?: string;
  connections?: number;
  details?: string;
  error?: string;
}

interface LogData {
  lines: string[];
  totalLines: number;
  error?: string;
}

interface ConfigData {
  models?: { primary: string };
  channels?: Record<string, { enabled: boolean; mode?: string }>;
  gateway?: { port: number | null; mode: string | null; bind: string | null };
  plugins?: Record<string, boolean>;
  meta?: { lastTouchedVersion?: string; lastTouchedAt?: string };
  error?: string;
}

/* ─── Hook: polling fetcher ─────────────────────────── */
function usePolling<T>(url: string, interval: number) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date());
    } catch {
      // keep previous data on error
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, interval);
    return () => clearInterval(id);
  }, [fetchData, interval]);

  return { data, loading, lastUpdate };
}

/* ─── Helpers ───────────────────────────────────────── */
function timeAgo(date: Date | null): string {
  if (!date) return "—";
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

function formatUptime(timestamp: string | undefined): string {
  if (!timestamp) return "unknown";
  const start = new Date(timestamp);
  if (isNaN(start.getTime())) return "unknown";
  const diff = Date.now() - start.getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }
  return `${h}h ${m}m`;
}

/* ─── Components ────────────────────────────────────── */

function Header() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--green)] to-[var(--cyan)] flex items-center justify-center">
          <span className="text-[#07070d] text-sm font-bold">⌘</span>
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-wide text-[var(--text-primary)]">
            OPENCLAW MISSION CONTROL
          </h1>
          <p className="text-[10px] text-[var(--text-dim)] tracking-widest">
            DAEMON MONITORING • v2026.2
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-[var(--text-secondary)] tabular-nums">
          {now.toLocaleTimeString("en-US", { hour12: false })}
        </p>
        <p className="text-[10px] text-[var(--text-dim)]">
          {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        </p>
      </div>
    </header>
  );
}

function GatewayHealthPanel() {
  const { data, loading, lastUpdate } = usePolling<HealthData>("/api/health", 5000);
  const isActive = data?.status === "active";

  return (
    <div className="panel animate-in" style={{ animationDelay: "0ms" }}>
      <div className="panel-header">
        <h2>⬡ Gateway Health</h2>
        <span className="text-[10px] text-[var(--text-dim)]">{timeAgo(lastUpdate)}</span>
      </div>
      <div className="panel-body">
        {loading ? (
          <div className="flex items-center gap-3">
            <span className="status-dot loading" />
            <span className="text-xs text-[var(--text-dim)]">Checking service...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-4">
              <span className={`status-dot ${isActive ? "active" : "inactive"}`} />
              <div>
                <p className={`text-lg font-bold ${isActive ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                  {isActive ? "ONLINE" : "OFFLINE"}
                </p>
                <p className="text-[10px] text-[var(--text-dim)]">
                  openclaw-gateway.service
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[var(--text-dim)] text-[10px] uppercase tracking-wider mb-1">Status</p>
                <span className={`badge ${isActive ? "badge-active" : "badge-inactive"}`}>
                  {data?.raw || "unknown"}
                </span>
              </div>
              <div>
                <p className="text-[var(--text-dim)] text-[10px] uppercase tracking-wider mb-1">Uptime</p>
                <p className="text-[var(--text-secondary)]">{formatUptime(data?.uptime)}</p>
              </div>
            </div>
            {data?.error && (
              <p className="text-[10px] text-[var(--red)] mt-3 break-all">⚠ {data.error}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function NetworkActivityPanel() {
  const { data, loading, lastUpdate } = usePolling<NetworkData>("/api/network", 5000);

  return (
    <div className="panel animate-in" style={{ animationDelay: "80ms" }}>
      <div className="panel-header">
        <h2>◈ Network Activity</h2>
        <span className="text-[10px] text-[var(--text-dim)]">{timeAgo(lastUpdate)}</span>
      </div>
      <div className="panel-body">
        {loading ? (
          <div className="flex items-center gap-3">
            <span className="status-dot loading" />
            <span className="text-xs text-[var(--text-dim)]">Scanning port...</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-4">
              <span className={`status-dot ${data?.listening ? "active" : "inactive"}`} />
              <div>
                <p className={`text-lg font-bold ${data?.listening ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                  {data?.listening ? "LISTENING" : "CLOSED"}
                </p>
                <p className="text-[10px] text-[var(--text-dim)]">
                  Port {data?.port || 18789} • {data?.protocol || "TCP"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[var(--text-dim)] text-[10px] uppercase tracking-wider mb-1">Connections</p>
                <p className="text-xl font-bold text-[var(--cyan)]">{data?.connections ?? 0}</p>
              </div>
              <div>
                <p className="text-[var(--text-dim)] text-[10px] uppercase tracking-wider mb-1">Bind</p>
                <p className="text-[var(--text-secondary)]">127.0.0.1</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LiveDaemonLogPanel() {
  const { data, loading, lastUpdate } = usePolling<LogData>("/api/logs", 3000);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [data]);

  return (
    <div className="panel animate-in" style={{ animationDelay: "160ms" }}>
      <div className="panel-header">
        <h2>▣ Live Daemon Log</h2>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[var(--text-dim)]">
            {data?.totalLines ?? 0} lines
          </span>
          <span className="text-[10px] text-[var(--text-dim)]">{timeAgo(lastUpdate)}</span>
        </div>
      </div>
      <div className="panel-body p-0">
        {loading ? (
          <div className="p-4 flex items-center gap-3">
            <span className="status-dot loading" />
            <span className="text-xs text-[var(--text-dim)]">Loading logs...</span>
          </div>
        ) : data?.lines && data.lines.length > 0 ? (
          <div ref={logRef} className="log-window">
            {data.lines.map((line, i) => (
              <div key={i} className="log-line">
                <span className="log-line-number">{(data.totalLines - data.lines.length) + i + 1}</span>
                <span className="log-line-content">{line}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4">
            <p className="text-xs text-[var(--text-dim)]">
              {data?.error ? `⚠ ${data.error}` : "No log entries found"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ActiveConfigPanel() {
  const { data, loading } = usePolling<ConfigData>("/api/config", 30000);

  return (
    <div className="panel animate-in" style={{ animationDelay: "240ms" }}>
      <div className="panel-header">
        <h2>◉ Active Configuration</h2>
        <span className="text-[10px] text-[var(--text-dim)]">
          {data?.meta?.lastTouchedVersion ? `v${data.meta.lastTouchedVersion}` : ""}
        </span>
      </div>
      <div className="panel-body">
        {loading ? (
          <div className="flex items-center gap-3">
            <span className="status-dot loading" />
            <span className="text-xs text-[var(--text-dim)]">Reading config...</span>
          </div>
        ) : data?.error ? (
          <p className="text-xs text-[var(--red)]">⚠ {data.error}</p>
        ) : (
          <div className="space-y-4">
            {/* Models */}
            <div>
              <p className="text-[var(--text-dim)] text-[10px] uppercase tracking-wider mb-2">Primary Model</p>
              <div className="tag tag-purple">
                <span>🧠</span>
                <span>{data?.models?.primary || "unknown"}</span>
              </div>
            </div>

            {/* Channels */}
            <div>
              <p className="text-[var(--text-dim)] text-[10px] uppercase tracking-wider mb-2">Channels</p>
              <div className="flex flex-wrap gap-2">
                {data?.channels && Object.entries(data.channels).map(([name, ch]) => (
                  <div key={name} className={`tag ${ch.enabled ? "tag-green" : ""}`}>
                    <span>{name === "telegram" ? "✈" : "◉"}</span>
                    <span className="capitalize">{name}</span>
                    {ch.enabled && <span className="text-[8px] opacity-60">ON</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Gateway */}
            <div>
              <p className="text-[var(--text-dim)] text-[10px] uppercase tracking-wider mb-2">Gateway</p>
              <div className="flex flex-wrap gap-2">
                <div className="tag tag-cyan">
                  <span>:{data?.gateway?.port}</span>
                </div>
                <div className="tag tag-amber">
                  <span>{data?.gateway?.mode}</span>
                </div>
                <div className="tag">
                  <span className="text-[var(--text-secondary)]">{data?.gateway?.bind}</span>
                </div>
              </div>
            </div>

            {/* Plugins */}
            {data?.plugins && Object.keys(data.plugins).length > 0 && (
              <div>
                <p className="text-[var(--text-dim)] text-[10px] uppercase tracking-wider mb-2">Plugins</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(data.plugins).map(([name, enabled]) => (
                    <div key={name} className={`tag ${enabled ? "tag-green" : ""}`}>
                      <span className="capitalize">{name}</span>
                      <span className="text-[8px] opacity-60">{enabled ? "ON" : "OFF"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Dashboard ─────────────────────────────────────── */
export default function MissionControl() {
  return (
    <div className="scanlines min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
          <GatewayHealthPanel />
          <NetworkActivityPanel />
          <LiveDaemonLogPanel />
          <ActiveConfigPanel />
        </div>
      </main>
      <footer className="text-center py-3 border-t border-[var(--border)]">
        <p className="text-[10px] text-[var(--text-dim)] tracking-widest">
          OPENCLAW MISSION CONTROL • {new Date().getFullYear()} • LOOPBACK ONLY
        </p>
      </footer>
    </div>
  );
}
