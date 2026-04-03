import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import Iconify from '@/components/Icon/Iconify';
import { useHostListWithMetrics } from '@/hooks/use-host-list';

import type { HostInfo } from '@/api/services/host';

/* ── Formatters ── */

function formatUptime(seconds: string | number): string {
  const s = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
  if (!s || isNaN(s)) return '-';
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatRate(bps: number): string {
  if (!bps || bps < 0) return '0 B/s';
  if (bps < 1024) return `${bps.toFixed(0)} B/s`;
  if (bps < 1048576) return `${(bps / 1024).toFixed(1)} K/s`;
  if (bps < 1073741824) return `${(bps / 1048576).toFixed(1)} M/s`;
  return `${(bps / 1073741824).toFixed(1)} G/s`;
}

/* ── Color ── */

function usageColor(p: number): string {
  // Smooth HSL: teal-blue → amber → red
  if (p <= 50) return `hsl(${185 - p * 2.8}, 65%, 48%)`;
  return `hsl(${45 - ((p - 50) / 50) * 45}, 75%, ${52 - ((p - 50) / 50) * 8}%)`;
}

/* ── Gauge Ring ── */

function Ring({ value, size = 64 }: { value: number; size?: number }) {
  const r = (size - 7) / 2;
  const C = 2 * Math.PI * r;
  const color = usageColor(value);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth="3.5"
          stroke="var(--ring-track, rgba(0,0,0,0.06))"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C - (value / 100) * C}
          stroke={color}
          style={{ transition: 'stroke-dashoffset .6s ease, stroke .6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold leading-none" style={{ color }}>
          {value.toFixed(0)}
        </span>
        <span className="text-[10px] leading-none" style={{ color, opacity: 0.7 }}>%</span>
      </div>
    </div>
  );
}

/* ── Stat Pill ── */

function StatPill({ icon, value, label, accent }: {
  icon: string; value: string | number; label: string; accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-neutral-0 px-5 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:bg-neutral-800 dark:shadow-none">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ background: accent ?? 'rgba(255,152,0,0.08)' }}
      >
        <Iconify icon={icon} size={18} className="text-primary-main" />
      </div>
      <div>
        <div className="text-lg font-semibold leading-tight text-neutral-900 dark:text-neutral-0">{value}</div>
        <div className="text-xs text-neutral-500">{label}</div>
      </div>
    </div>
  );
}

/* ── IO Row ── */

function IoDetail({ label, icon, down, up }: {
  label: string; icon: string; down: number; up: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <Iconify icon={icon} size={14} className="flex-shrink-0 text-neutral-400" />
      <span className="w-7 text-xs text-neutral-500">{label}</span>
      <div className="flex gap-2.5 text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
        <span>
          <span className="mr-0.5 font-medium text-functional-info">↓</span>
          {formatRate(down)}
        </span>
        <span>
          <span className="mr-0.5 font-medium text-functional-success">↑</span>
          {formatRate(up)}
        </span>
      </div>
    </div>
  );
}

/* ── Host Card ── */

function HostCard({ host, onClick }: { host: HostInfo; onClick: () => void }) {
  const m = host.metrics;
  const on = !!m?.collectedAt;
  const cpu = m?.cpu?.usagePercent ?? 0;
  const mem = m?.memory?.usagePercent ?? 0;
  const disk = parseFloat(m?.disk?.usagePercent || '0');

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-neutral-200 bg-neutral-0 p-4 transition-all duration-200 hover:border-primary-main/30 hover:shadow-[0_4px_20px_rgba(255,152,0,0.08)] dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-primary-main/20"
      style={{ '--ring-track': 'rgba(0,0,0,0.05)' } as React.CSSProperties}
    >
      {/* Header */}
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className={`h-2 w-2 flex-shrink-0 rounded-full ${on ? 'bg-functional-success' : 'bg-neutral-300'}`} />
          <span className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-0">
            {host.name}
          </span>
        </div>
      </div>

      {/* IP + Uptime */}
      <div className="mb-4 text-xs text-neutral-400">
        <span className="font-mono">{host.hostServerUrl}</span>
      </div>

      {on && m ? (
        <>
          {/* Gauges */}
          <div className="mb-4 flex items-end justify-around">
            {[
              { v: cpu, l: 'CPU' },
              { v: mem, l: 'MEM' },
              { v: disk, l: 'DISK' },
            ].map(({ v, l }) => (
              <div key={l} className="flex flex-col items-center gap-1.5">
                <Ring value={v} />
                <span className="text-xs font-medium tracking-wider text-neutral-400">{l}</span>
              </div>
            ))}
          </div>

          {/* IO footer */}
          <div className="space-y-1 border-t border-neutral-100 pt-2.5 dark:border-neutral-700">
            <IoDetail label="I/O" icon="solar:server-path-line-duotone" down={m.disk?.readRate ?? 0} up={m.disk?.writeRate ?? 0} />
            <IoDetail label="NET" icon="solar:global-line-duotone" down={m.network?.recvRate ?? 0} up={m.network?.sendRate ?? 0} />
          </div>
        </>
      ) : (
        <div className="flex h-[140px] flex-col items-center justify-center gap-1.5">
          <Iconify icon="solar:cloud-cross-line-duotone" size={28} className="text-neutral-200 dark:text-neutral-600" />
          <span className="text-xs text-neutral-300 dark:text-neutral-600">离线</span>
        </div>
      )}
    </div>
  );
}

/* ── Dashboard ── */

export default function Dashboard() {
  const navigate = useNavigate();
  const { list: hosts, isLoading } = useHostListWithMetrics();

  const stats = useMemo(() => {
    const online = hosts.filter((h) => !!h.metrics?.collectedAt);
    const avgCpu = online.reduce((s, h) => s + (h.metrics?.cpu?.usagePercent || 0), 0) / (online.length || 1);
    const avgMem = online.reduce((s, h) => s + (h.metrics?.memory?.usagePercent || 0), 0) / (online.length || 1);
    const alerts = online.filter(
      (h) => (h.metrics?.cpu?.usagePercent ?? 0) > 80 || (h.metrics?.memory?.usagePercent ?? 0) > 80,
    ).length;
    return { total: hosts.length, online: online.length, avgCpu, avgMem, alerts };
  }, [hosts]);

  return (
    <div className="flex h-full flex-col p-5">
      {/* Summary bar */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatPill icon="solar:server-square-line-duotone" value={stats.total} label="主机总数" />
        <StatPill icon="solar:check-circle-line-duotone" value={stats.online} label="在线" accent="rgba(76,175,80,0.1)" />
        <StatPill icon="solar:cpu-bolt-line-duotone" value={`${stats.avgCpu.toFixed(0)}%`} label="平均 CPU" accent="rgba(33,150,243,0.08)" />
        <StatPill icon="solar:sd-card-line-duotone" value={`${stats.avgMem.toFixed(0)}%`} label="平均内存" accent="rgba(156,39,176,0.08)" />
      </div>

      {/* Section header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">主机监控</h2>
        {stats.alerts > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-functional-error/10 px-2.5 py-0.5 text-xs font-medium text-functional-error">
            <Iconify icon="solar:danger-triangle-line-duotone" size={13} />
            {stats.alerts} 项告警
          </span>
        )}
      </div>

      {/* Host grid */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-sm text-neutral-400">加载中...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {hosts.map((host, i) => (
            <div key={host.id} className="animate-fadeIn" style={{ animationDelay: `${i * 30}ms` }}>
              <HostCard host={host} onClick={() => navigate(`/terminal/${host.id}`)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
