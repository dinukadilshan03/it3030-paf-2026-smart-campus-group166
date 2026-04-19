import Link from "next/link";
import type { AnalyticsSeriesPoint } from "@/lib/admin-analytics/types";

export type TrendPoint = {
  id: string;
  label: string;
  bookings: number;
  tickets: number;
  href: string;
};

export type IntensityPoint = {
  id: string;
  label: string;
  value: number;
  intensity: number;
  href: string;
};

export type ShareSlice = {
  id: string;
  label: string;
  value: number;
  href: string;
};

type SurfaceCardProps = {
  title: string;
  eyebrow?: string;
  description?: string;
  href?: string;
  actionLabel?: string;
  children: React.ReactNode;
  headerAside?: React.ReactNode;
  className?: string;
};

type DualLineTrendChartProps = {
  title: string;
  description: string;
  data: TrendPoint[];
  href: string;
};

type IntensityStripProps = {
  title: string;
  description: string;
  data: IntensityPoint[];
  href: string;
};

type RankedBarChartProps = {
  title: string;
  description: string;
  data: AnalyticsSeriesPoint[];
  href: string;
  supportingLabels?: string[];
};

type ShareBreakdownProps = {
  title: string;
  description: string;
  data: ShareSlice[];
  href: string;
};

function SurfaceCard({
  title,
  eyebrow,
  description,
  href,
  actionLabel = "Open",
  children,
  headerAside,
  className,
}: SurfaceCardProps) {
  return (
    <section
      className={`rounded-[1.6rem] border border-white/70 bg-white/92 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-2 text-[1.28rem] font-semibold tracking-[-0.03em] text-slate-950">
            {title}
          </h2>
          {description ? <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p> : null}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {headerAside}
          {href ? (
            <Link
              href={href}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
            >
              {actionLabel}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}

function getPolylinePoints(values: number[], width: number, height: number, padding: number) {
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const maxValue = Math.max(...values, 1);

  return values
    .map((value, index) => {
      const x = padding + (values.length <= 1 ? innerWidth / 2 : (index / (values.length - 1)) * innerWidth);
      const y = height - padding - (value / maxValue) * innerHeight;
      return `${x},${y}`;
    })
    .join(" ");
}

function getPointCoordinate(
  values: number[],
  index: number,
  width: number,
  height: number,
  padding: number,
) {
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const maxValue = Math.max(...values, 1);
  const x = padding + (values.length <= 1 ? innerWidth / 2 : (index / (values.length - 1)) * innerWidth);
  const y = height - padding - (values[index] / maxValue) * innerHeight;
  return { x, y };
}

export function DualLineTrendChart({
  title,
  description,
  data,
  href,
}: DualLineTrendChartProps) {
  const width = 720;
  const height = 280;
  const padding = 24;
  const bookings = data.map((point) => point.bookings);
  const tickets = data.map((point) => point.tickets);
  const bookingPoints = getPolylinePoints(bookings, width, height, padding);
  const ticketPoints = getPolylinePoints(tickets, width, height, padding);
  const latest = data[data.length - 1];

  return (
    <SurfaceCard
      eyebrow="Demand trend"
      title={title}
      description={description}
      href={href}
      headerAside={
        latest ? (
          <div className="hidden rounded-[1rem] border border-slate-200 bg-slate-50 px-3 py-2 text-right md:block">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Latest
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {latest.bookings} bookings / {latest.tickets} tickets
            </p>
          </div>
        ) : null
      }
      className="overflow-hidden"
    >
      <div className="rounded-[1.35rem] border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.85),rgba(255,255,255,0.98))] p-4">
        <div className="mb-4 flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
            Bookings
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-orange-400" />
            Tickets
          </span>
        </div>

        <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full" role="img" aria-label={title}>
          <defs>
            <linearGradient id="bookings-line" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#0891b2" />
              <stop offset="100%" stopColor="#14b8a6" />
            </linearGradient>
            <linearGradient id="tickets-line" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fb7185" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map((ratio) => {
            const y = padding + (height - padding * 2) * ratio;
            return <line key={ratio} x1={padding} x2={width - padding} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="6 10" />;
          })}

          <polyline
            fill="none"
            stroke="url(#bookings-line)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={bookingPoints}
          />
          <polyline
            fill="none"
            stroke="url(#tickets-line)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={ticketPoints}
          />

          {data.map((point, index) => {
            const bookingCoordinate = getPointCoordinate(bookings, index, width, height, padding);
            const ticketCoordinate = getPointCoordinate(tickets, index, width, height, padding);
            return (
              <g key={point.id}>
                <circle cx={bookingCoordinate.x} cy={bookingCoordinate.y} fill="#0f172a" r="4" />
                <circle cx={ticketCoordinate.x} cy={ticketCoordinate.y} fill="#7c2d12" r="4" />
              </g>
            );
          })}
        </svg>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:grid-cols-4 lg:grid-cols-6">
          {data.map((point) => (
            <Link
              key={point.id}
              href={point.href}
              className="rounded-[0.95rem] border border-transparent px-2 py-2 text-center transition hover:border-slate-200 hover:bg-white"
            >
              <p>{point.label}</p>
              <p className="mt-1 text-[0.78rem] font-semibold tracking-normal text-slate-800">
                {point.bookings}/{point.tickets}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </SurfaceCard>
  );
}

export function IntensityStrip({ title, description, data, href }: IntensityStripProps) {
  const busiest = data.reduce<IntensityPoint | null>(
    (current, point) => (current === null || point.value > current.value ? point : current),
    null,
  );

  return (
    <SurfaceCard
      eyebrow="Booking rhythm"
      title={title}
      description={description}
      href={href}
      headerAside={
        busiest ? (
          <div className="hidden rounded-[1rem] border border-emerald-200 bg-emerald-50 px-3 py-2 md:block">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Peak hour
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-950">
              {busiest.label} • {busiest.value}
            </p>
          </div>
        ) : null
      }
    >
      <div className="space-y-4">
        <div className="overflow-x-auto rounded-[1.3rem] border border-slate-200 bg-slate-50/70 p-3">
          <div className="flex min-w-max gap-2">
          {data.map((point) => (
            <Link
              key={point.id}
              href={point.href}
              className="group w-[4.75rem] shrink-0 rounded-[1rem] p-2 transition hover:bg-white"
            >
              <div
                className="flex h-20 items-end rounded-[0.9rem] border border-white/70 px-2 pb-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                style={{
                  background: `linear-gradient(180deg, rgba(15,23,42,${0.14 + point.intensity * 0.24}), rgba(20,184,166,${0.2 + point.intensity * 0.52}))`,
                }}
              >
                <div className="w-full rounded-full bg-white/80 px-1 py-0.5 text-center text-[0.7rem] font-semibold text-slate-800">
                  {point.value}
                </div>
              </div>
              <p className="mt-2 text-center text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-slate-500">
                {point.label}
              </p>
            </Link>
          ))}
          </div>
        </div>

        <div className="rounded-[1.3rem] border border-slate-200 bg-[linear-gradient(135deg,#ecfeff,#ffffff)] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                Reading guide
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Darker cells indicate heavier booking concentration. This shows when scheduling pressure
                clusters, without stretching into another full bar chart.
              </p>
            </div>

            {busiest ? (
              <div className="rounded-[1rem] border border-slate-200 bg-white/90 px-4 py-3 lg:min-w-[15rem]">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Peak slot
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{busiest.label}</p>
                <p className="mt-1 text-sm leading-7 text-slate-600">
                  {busiest.value} bookings routed into this slot.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}

export function RankedBarChart({
  title,
  description,
  data,
  href,
  supportingLabels,
}: RankedBarChartProps) {
  const maxValue = Math.max(...data.map((point) => point.value), 1);

  return (
    <SurfaceCard eyebrow="Resource pressure" title={title} description={description} href={href}>
      <div className="space-y-4">
        <div className="space-y-3">
          {data.map((point, index) => (
            <Link
              key={point.id}
              href={point.href}
              className="block rounded-[1.15rem] border border-slate-200 bg-slate-50/70 px-4 py-4 transition hover:border-slate-300 hover:bg-white"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {index + 1}. {point.label}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-slate-700">{point.value}</p>
              </div>
              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-slate-900 via-cyan-600 to-emerald-400"
                  style={{ width: `${Math.max(8, (point.value / maxValue) * 100)}%` }}
                />
              </div>
            </Link>
          ))}
        </div>

        {supportingLabels && supportingLabels.length > 0 ? (
          <div className="rounded-[1.2rem] border border-slate-200 bg-[linear-gradient(135deg,#f8fafc,#eef2ff)] p-4">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Top locations
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {supportingLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </SurfaceCard>
  );
}

export function ShareBreakdown({ title, description, data, href }: ShareBreakdownProps) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <SurfaceCard eyebrow="Operational mix" title={title} description={description} href={href}>
      <div className="space-y-5">
        <div className="flex h-4 overflow-hidden rounded-full bg-slate-100">
          {data.length > 0 ? (
            data.map((slice, index) => {
              const width = total === 0 ? 100 / data.length : (slice.value / total) * 100;
              const gradients = [
                "from-cyan-500 to-teal-400",
                "from-orange-400 to-rose-400",
                "from-slate-900 to-slate-600",
                "from-emerald-500 to-lime-400",
                "from-violet-500 to-indigo-400",
                "from-amber-400 to-orange-500",
              ];
              return (
                <div
                  key={slice.id}
                  className={`h-full bg-gradient-to-r ${gradients[index % gradients.length]}`}
                  style={{ width: `${width}%` }}
                />
              );
            })
          ) : (
            <div className="h-full w-full bg-slate-200" />
          )}
        </div>

        <div className="space-y-3">
          {data.map((slice, index) => {
            const share = total === 0 ? 0 : Math.round((slice.value / total) * 100);
            return (
              <Link
                key={slice.id}
                href={slice.href}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-[1rem] border border-slate-200 bg-slate-50/70 px-4 py-3 transition hover:border-slate-300 hover:bg-white"
              >
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-slate-900" style={{ opacity: 0.4 + index * 0.08 }} />
                <p className="truncate text-sm font-semibold text-slate-900">{slice.label}</p>
                <p className="text-sm text-slate-600">{slice.value}</p>
                <p className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">{share}%</p>
              </Link>
            );
          })}
        </div>
      </div>
    </SurfaceCard>
  );
}
