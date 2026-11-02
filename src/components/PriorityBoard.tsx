import type { PriorityAction } from "@/lib/seo/proTypes";

const levelStyle: Record<string, string> = {
  P0: "border-rose-400/40 bg-rose-500/10 text-rose-200",
  P1: "border-amber-400/40 bg-amber-500/10 text-amber-100",
  P2: "border-violet-400/40 bg-[var(--purple-soft)] text-violet-100",
};

export function PriorityBoard({ actions }: { actions: PriorityAction[] }) {
  const groups = {
    P0: actions.filter((a) => a.level === "P0"),
    P1: actions.filter((a) => a.level === "P1"),
    P2: actions.filter((a) => a.level === "P2"),
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {(["P0", "P1", "P2"] as const).map((level) => (
        <div key={level} className="rounded-xl bg-[var(--bg)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold tracking-wide">
              {level === "P0" ? "Fix now" : level === "P1" ? "This week" : "Backlog"}
            </h3>
            <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${levelStyle[level]}`}>
              {level} · {groups[level].length}
            </span>
          </div>
          <ul className="space-y-2">
            {groups[level].length === 0 && (
              <li className="text-sm text-[var(--muted)]">Nothing here — nice.</li>
            )}
            {groups[level].map((a) => (
              <li key={a.id} className="rounded-lg border border-[var(--line)] p-3">
                <div className="text-sm font-medium">{a.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{a.detail}</p>
                <div className="mt-2 text-[10px] uppercase tracking-wider text-[var(--accent)]">
                  {a.category} · {a.impact} impact
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
