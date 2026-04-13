type PagePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
  audience?: string;
};

export function PagePlaceholder({
  eyebrow,
  title,
  description,
  audience,
}: PagePlaceholderProps) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-[0_18px_55px_rgba(15,23,42,0.08)] backdrop-blur md:p-10">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        {eyebrow}
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
        {title}
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
        {description}
      </p>
      {audience ? (
        <p className="mt-6 text-sm font-medium text-slate-700">
          Available to: {audience}
        </p>
      ) : null}
    </section>
  );
}
