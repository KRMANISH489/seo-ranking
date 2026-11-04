"use client";

export function ScoreRing({
  score,
  grade,
}: {
  score: number;
  grade: string;
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference;
  const color =
    score >= 80 ? "#0a84ff" : score >= 60 ? "#00c2a8" : score >= 40 ? "#d97706" : "#e11d48";

  return (
    <div className="score-ring-pulse relative mx-auto flex h-40 w-40 items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.18)"
          strokeWidth="10"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-display text-4xl font-bold tracking-tight" style={{ color }}>
          {score}
        </div>
        <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Grade {grade}</div>
      </div>
    </div>
  );
}
