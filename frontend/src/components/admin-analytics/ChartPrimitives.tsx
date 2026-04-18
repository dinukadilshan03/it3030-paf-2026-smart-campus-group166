import Link from "next/link";
import type { AnalyticsSeriesPoint } from "@/lib/admin-analytics/types";

type SeriesChartProps = {
  title: string;
  description: string;
  data: AnalyticsSeriesPoint[];
  href: string;
};

export function TimelineBars({ title, description, data, href }: SeriesChartProps) {
  const maxValue = Math.max(...data.map((point) => point.value), 1);

  return (
    <section className="rounded-[1.55rem] border border-white/70 bg-white/90 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
        </div>
        <Link
          href={href}
          className="text-sm font-semibold text-accent transition hover:text-accent-strong"
        >
          Open
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] items-end gap-2">
        {data.map((point) => (
          <Link
            key={point.id}
            href={point.href}
            className="group flex min-w-0 flex-col items-center gap-2 rounded-[1rem] px-2 py-3 transition hover:bg-slate-50"
          >
            <div className="flex h-36 w-full items-end">
              <div
                className="w-full rounded-t-[0.9rem] bg-gradient-to-t from-teal-600 to-emerald-300 transition group-hover:from-teal-700 group-hover:to-emerald-400"
                style={{ height: `${Math.max(8, (point.value / maxValue) * 100)}%` }}
              />
            </div>
            <div className="w-full text-center">
              <p className="truncate text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {point.label}
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {Number.isInteger(point.value) ? point.value : point.value.toFixed(1)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function HorizontalBarList({ title, description, data, href }: SeriesChartProps) {
  const maxValue = Math.max(...data.map((point) => point.value), 1);

  return (
    <section className="rounded-[1.55rem] border border-white/70 bg-white/90 p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
        </div>
        <Link
          href={href}
          className="text-sm font-semibold text-accent transition hover:text-accent-strong"
        >
          Open
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {data.map((point) => (
          <Link
            key={point.id}
            href={point.href}
            className="block rounded-[1rem] border border-slate-200 bg-slate-50/70 p-3 transition hover:border-slate-300 hover:bg-slate-50"
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-slate-900">{point.label}</p>
              <p className="text-sm font-medium text-slate-600">
                {Number.isInteger(point.value) ? point.value : point.value.toFixed(1)}
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-slate-900 via-teal-600 to-emerald-400"
                style={{ width: `${Math.max(6, (point.value / maxValue) * 100)}%` }}
              />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
