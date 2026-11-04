import Link from "next/link";

type LogoSize = "sm" | "md" | "lg";

const sizeMap: Record<
  LogoSize,
  { mark: string; brand: string; tag: string; gap: string }
> = {
  sm: { mark: "h-8 w-8", brand: "text-[15px]", tag: "text-[9px]", gap: "gap-2" },
  md: { mark: "h-9 w-9", brand: "text-base", tag: "text-[10px]", gap: "gap-2.5" },
  lg: { mark: "h-11 w-11 sm:h-12 sm:w-12", brand: "text-xl sm:text-2xl", tag: "text-[10px]", gap: "gap-3" },
};

/** Modern geometric mark — rising signal bars */
export function BrandLogo({
  href = "/",
  size = "md",
  showTagline = true,
  external = false,
}: {
  href?: string;
  size?: LogoSize;
  showTagline?: boolean;
  external?: boolean;
}) {
  const s = sizeMap[size];

  const inner = (
    <div className={`group flex items-center ${s.gap}`}>
      <span
        className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(145deg,#0a84ff_0%,#0077ea_50%,#00b39a_120%)] shadow-[0_10px_24px_rgba(10,132,255,0.28)] ${s.mark}`}
        aria-hidden
      >
        <svg viewBox="0 0 40 40" className="h-[58%] w-[58%]" fill="none">
          <rect x="7" y="22" width="6" height="11" rx="2" fill="white" opacity="0.55" />
          <rect x="17" y="15" width="6" height="18" rx="2" fill="white" opacity="0.8" />
          <rect x="27" y="8" width="6" height="25" rx="2" fill="white" />
        </svg>
      </span>
      <div className="flex min-w-0 flex-col leading-none">
        <span className={`font-display font-bold tracking-[-0.03em] text-[var(--text)] ${s.brand}`}>
          CodAbhi
          <span className="ml-1.5 font-semibold text-[var(--accent)]">SEO</span>
        </span>
        {showTagline ? (
          <span
            className={`mt-1 hidden font-medium tracking-[0.16em] text-[var(--muted)] uppercase sm:block ${s.tag}`}
          >
            audit · rank · report
          </span>
        ) : null}
      </div>
    </div>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="inline-flex">
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className="inline-flex">
      {inner}
    </Link>
  );
}
