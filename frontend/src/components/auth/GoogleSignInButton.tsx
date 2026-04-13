import { getBackendOAuthUrl } from "@/lib/config/env";

type GoogleSignInButtonProps = {
  className?: string;
};

export function GoogleSignInButton({ className = "" }: GoogleSignInButtonProps) {
  return (
    <a
      href={getBackendOAuthUrl()}
      className={`inline-flex items-center gap-3 rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong ${className}`.trim()}
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-950">
        G
      </span>
      Sign in with Google
    </a>
  );
}
