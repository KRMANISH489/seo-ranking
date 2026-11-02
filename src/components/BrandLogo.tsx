import Link from "next/link";

type LogoSize = "sm" | "md" | "lg";

const sizeMap: Record<
  LogoSize,
  { box: string; text: string; brand: string; tag: string }
> = {
  sm: {
    box: "h-8 w-8 rounded-lg text-[10px]",
    text: "text-[9px]",
    brand: "text-base",
    tag: "text-[9px] tracking-[0.18em]",
  },
  md: {
    box: "h-10 w-10 rounded-xl text-[11px]",
    text: "text-[10px]",
    brand: "text-lg",
    tag: "text-[10px] tracking-[0.2em]",
  },
  lg: {
    box: "h-12 w-12 rounded-xl text-sm",
    text: "text-xs",
    brand: "text-xl",
    tag: "text-[10px] tracking-[0.22em]",
  },
};

/**
 * CodAbhi logo — same markup/style as https://codabhi-dev.vercel.app/
 * (HTML/CSS mark, not a screenshot image)
 */
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
    <div className="group flex items-center gap-2.5">
      <div
        className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-gradient-to-br from-[#111118] to-[#0a0a0f] font-mono font-bold shadow-lg shadow-black/40 ${s.box}`}
      >
        <span className="absolute left-0 top-0 h-3 w-3 rounded-tl-lg border-l-2 border-t-2 border-cyan-400/70" />
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-br-lg border-b-2 border-r-2 border-violet-500/70" />
        <span className={`relative z-10 tracking-tight ${s.text}`}>
          <span className="text-cyan-400">C</span>
          <span className="text-violet-400">A</span>
        </span>
        <span className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>
      <div className="flex flex-col leading-tight">
        <span className={`font-mono font-semibold tracking-tight ${s.brand}`}>
          <span className="text-cyan-400">Cod</span>
          <span className="text-white">Abhi</span>
        </span>
        {showTagline ? (
          <span
            className={`mt-0.5 hidden font-medium uppercase text-slate-500 sm:block ${s.tag}`}
          >
            code · create · deliver
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
