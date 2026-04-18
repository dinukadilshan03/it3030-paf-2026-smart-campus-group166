import { getBackendOAuthUrl } from "@/lib/config/env";

type GoogleSignInButtonProps = {
  className?: string;
};

export function GoogleSignInButton({ className = "" }: GoogleSignInButtonProps) {
  return (
    <a
      href={getBackendOAuthUrl()}
      className={`inline-flex items-center gap-3 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,118,110,0.22)] transition hover:bg-accent-strong hover:shadow-[0_16px_36px_rgba(15,118,110,0.28)] ${className}`.trim()}
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-950">
        G
      </span>
      Continue with Google
    </a>
  );
}
