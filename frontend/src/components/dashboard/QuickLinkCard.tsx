import Link from "next/link";

type QuickLinkCardProps = {
  title: string;
  href: string;
  description: string;
};

export function QuickLinkCard({
  title,
  href,
  description,
}: QuickLinkCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-[1.75rem] border border-slate-200 bg-white/90 p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_24px_70px_rgba(15,23,42,0.12)]"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        Quick link
      </p>
      <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
      <span className="mt-5 inline-flex text-sm font-medium text-accent transition group-hover:text-accent-strong">
        Open page
      </span>
    </Link>
  );
}
