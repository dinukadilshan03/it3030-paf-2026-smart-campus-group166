"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { getResources } from "@/lib/resources/api";
import ResourceDemands from "@/components/resources/ResourceDemands";

export default function ResourceAnalysisPage() {
  const router = useRouter();
  const [totalResources, setTotalResources] = useState<number | null>(null);
  const [activeToday, setActiveToday] = useState<number | null>(null);
  const [avgUtil, setAvgUtil] = useState<number | null>(null);
  const [utilData, setUtilData] = useState<number[] | null>(null);
  const [statusBreakdown, setStatusBreakdown] = useState<{ label: string; value: number; color: string }[]>([]);
  const [topUsed, setTopUsed] = useState<{ resourceId: string; name: string; location: string; count: number }[]>([]);
  const [resourcesList, setResourcesList] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const resources = await getResources();
        const resArr = Array.isArray(resources) ? resources : [];
        setResourcesList(resArr);
        setTotalResources(resArr.length);

        // status counts
        const counts: Record<string, number> = {};
        resArr.forEach((r: any) => {
          const s = (r.status || "UNKNOWN").toString();
          counts[s] = (counts[s] || 0) + 1;
        });

        const breakdown = Object.entries(counts).map(([k, v]) => ({ label: k, value: v, color: k === 'ACTIVE' ? '#10b981' : k === 'OUT_OF_SERVICE' ? '#ef4444' : '#f59e0b' }));
        setStatusBreakdown(breakdown);

        // bookings -> utilization trend
        const resp = await fetch('/api/v1/bookings');
        let bookings: any[] = [];
        if (resp.ok) bookings = (await resp.json()) || [];
        setBookings(bookings);

        // compute bookings per day for last 14 days
        const days = 14;
        const today = new Date();
        const byDay: number[] = [];
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const key = d.toISOString().slice(0, 10);
          const count = bookings.filter((b: any) => (b.bookingDate || b.date || '').startsWith(key)).length;
          byDay.push(count);
        }
        setUtilData(byDay);

        // active today: distinct resources with bookings today
        const todayKey = today.toISOString().slice(0, 10);
        const resourcesToday = new Set(bookings.filter((b: any) => (b.bookingDate || b.date || '').startsWith(todayKey)).map((b: any) => b.resourceId || b.resource?.id));
        setActiveToday(resourcesToday.size);

        // avg utilization: simple average of byDay values / total resources *100
        const avgBookings = byDay.reduce((s, n) => s + n, 0) / (byDay.length || 1);
        const avgU = resArr.length ? Math.round((avgBookings / resArr.length) * 100) : 0;
        setAvgUtil(avgU);

        // Top used resources (last 7 days)
        try {
          const days7 = 7;
          const keys = new Set<string>();
          for (let i = 0; i < days7; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            keys.add(d.toISOString().slice(0, 10));
          }

          const bookings7 = bookings.filter((b: any) => keys.has(((b.bookingDate || b.date || '') + '').slice(0, 10)));

          const counts: Record<string, number> = {};
          bookings7.forEach((b: any) => {
            const rid = b.resourceId || b.resource?.id || (b.resource && (b.resource.id || b.resource._id)) || 'unknown';
            counts[rid] = (counts[rid] || 0) + 1;
          });

          const resourceById = new Map<string, any>(resArr.map((r: any) => [String(r.id || r.resourceId || r._id), r]));

          const top = Object.entries(counts)
            .map(([rid, cnt]) => {
              const res = resourceById.get(rid) || {};
              const name = res.name || res.title || res.label || `Resource ${rid}`;
              const location = res.location || res.facility || res.building || '';
              return { resourceId: rid, name, location, count: cnt };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

          setTopUsed(top);
        } catch (e) {
          console.warn('Failed to compute top used resources', e);
          setTopUsed([]);
        }
      } catch (err) {
        console.error('Failed to load metrics', err);
      }
    }

    loadMetrics();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.headerCard}>
        <div>
          <div style={styles.headerLabel}>ANALYSIS</div>
          <h1 style={styles.headerTitle}>Resource Analysis</h1>
          <p style={styles.headerDesc}>
            Overview metrics and trends for campus resources. Use this view to
            identify high-utilization rooms, maintenance hotspots, and
            availability trends.
          </p>
        </div>

        <div style={styles.headerActions}>
          <button style={styles.backBtn} onClick={() => router.push('/resources')}>
            Back to Resources
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.metricCard}>
          <div style={styles.metricTitle}>Total Resources</div>
          <div style={styles.metricValue}>{totalResources ?? '—'}</div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricTitle}>Active Today</div>
          <div style={styles.metricValue}>{activeToday ?? '—'}</div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricTitle}>Avg Utilization</div>
          <div style={styles.metricValue}>{avgUtil != null ? `${avgUtil}%` : '—'}</div>
        </div>
      </div>

      {/* Utilization Trend removed per request */}

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Status Breakdown</h3>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {(() => {
            const display = statusBreakdown.length
              ? statusBreakdown.map((s) => ({
                  label: s.label.replace(/[_-]+/g, " ")
                    .toLowerCase()
                    .replace(/(^|\s)\w/g, (c: string) => c.toUpperCase()),
                  value: s.value,
                  color: s.color,
                }))
              : [];

            if (display.length === 0) {
              return <div style={{ color: "#6b7280" }}>No status data available</div>;
            }

            return (
              <>
                <PieChart data={display} size={220} innerRadius={60} />

                <div>
                  <div style={{ marginBottom: 8, color: "#6b7280" }}>Current status distribution</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {display.map((d, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ width: 12, height: 12, background: d.color, borderRadius: 3 }} />
                        <div>{`${d.label} — ${d.value}`}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      <div style={{ marginTop: 22 }}>
        {bookings.length > 0 || resourcesList.length > 0 ? (
          <ResourceDemands bookings={bookings} resources={resourcesList} />
        ) : (
          <div style={styles.chartPlaceholder}>No booking or resource data available</div>
        )}
      </div>

    </div>
  );
}

const styles: any = {
  container: { padding: 30 },
  headerCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 20,
    padding: 22,
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 6px 20px rgba(15,23,42,0.04)',
    marginBottom: 18,
  },
  headerLabel: { fontSize: 12, letterSpacing: 2, color: '#6b7280', fontWeight: 700, marginBottom: 8 },
  headerTitle: { margin: 0, fontSize: 28, fontWeight: 700, color: '#0f172a' },
  headerDesc: { marginTop: 8, color: '#6b7280', maxWidth: 680 },
  headerActions: { display: 'flex', gap: 12 },
  backBtn: { background: '#111827', color: '#fff', padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 },
  metricCard: { background: '#fff', padding: 18, borderRadius: 10, boxShadow: '0 6px 18px rgba(15,23,42,0.03)' },
  metricTitle: { color: '#6b7280', fontSize: 13, marginBottom: 8 },
  metricValue: { fontSize: 22, fontWeight: 700 },
  section: { marginTop: 18 },
  sectionTitle: { marginBottom: 8 },
  chartPlaceholder: { height: 220, borderRadius: 10, border: '2px dashed #e6e9ee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' },
  tablePlaceholder: { marginTop: 12, background: '#fff', padding: 12, borderRadius: 8, boxShadow: '0 6px 18px rgba(15,23,42,0.03)' },
};

function UtilizationChart({ data }: { data: number[] }) {
  // simple SVG line chart
  const width = 900;
  const height = 220;
  const padding = 20;
  const max = Math.max(...data, 100);
  const min = Math.min(...data, 0);
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = padding + ((max - d) / (max - min || 1)) * (height - padding * 2);
    return [x, y];
  });

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  const areaPath = `${path} L ${padding + (width - padding * 2)} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 220 }}>
        <defs>
          <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* area */}
        <path d={areaPath} fill="url(#g1)" stroke="none" />

        {/* line */}
        <path d={path} fill="none" stroke="#7c3aed" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />

        {/* dots */}
        {points.map((p, i) => (
          <circle key={i} cx={p[0]} cy={p[1]} r={3.5} fill="#fff" stroke="#7c3aed" strokeWidth={2} />
        ))}

        {/* x-axis labels (every 3rd) */}
        {data.map((_, i) => {
          if (i % Math.ceil(data.length / 6) !== 0) return null;
          const x = padding + (i / (data.length - 1)) * (width - padding * 2);
          return (
            <text key={i} x={x} y={height - 2} fontSize={11} fill="#6b7280" textAnchor="middle">
              {`D-${data.length - i}`}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function PieChart({ data, size = 200, innerRadius = 40 }: { data: { label: string; value: number; color: string }[]; size?: number; innerRadius?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = Math.min(cx, cy) - 4;

  let angle = -90; // start at top

  const slices = data.map((d) => {
    const valueAngle = (d.value / total) * 360;
    const start = angle;
    const end = angle + valueAngle;
    angle = end;
    return { label: d.label, color: d.color, start, end };
  });

  const arcPath = (startDeg: number, endDeg: number) => {
    const start = polarToCartesian(cx, cy, r, endDeg);
    const end = polarToCartesian(cx, cy, r, startDeg);
    const largeArcFlag = endDeg - startDeg <= 180 ? '0' : '1';
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => (
        <path key={i} d={arcPath(s.start, s.end)} fill={s.color} stroke="#fff" strokeWidth={1} />
      ))}
      {/* inner cutout */}
      <circle cx={cx} cy={cy} r={innerRadius} fill="#fff" />
    </svg>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180.0;
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}
