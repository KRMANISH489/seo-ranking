import Image from "next/image";
import Link from "next/link";

type LogoSize = "sm" | "md" | "lg";

const sizeMap: Record<
  LogoSize,
  { mark: number; brand: string; tag: string; gap: string }
> = {
  sm: { mark: 32, brand: "text-[15px]", tag: "text-[9px]", gap: "gap-2" },
  md: { mark: 36, brand: "text-base", tag: "text-[10px]", gap: "gap-2.5" },
  lg: { mark: 48, brand: "text-xl sm:text-2xl", tag: "text-[10px]", gap: "gap-3" },
};

/** CodAbhi SEO mark — rising bars on azure→teal */
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
      <Image
        src="/codabhi-mark.png"
        alt="CodAbhi SEO"
        width={s.mark}
        height={s.mark}
        className="shrink-0 rounded-[28%] shadow-[0_10px_24px_rgba(10,132,255,0.28)]"
        priority={size === "lg"}
      />
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
