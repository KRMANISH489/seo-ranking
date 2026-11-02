import type { CategoryScore, SeoIssue, SeoAnalysisResult } from "./types";

function gradeFromScore(score: number): SeoAnalysisResult["grade"] {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 40) return "D";
  return "F";
}

export function computeScores(issues: SeoIssue[]): {
  overallScore: number;
  grade: SeoAnalysisResult["grade"];
  categoryScores: CategoryScore[];
  summary: string;
} {
  const categories = [
    { category: "Meta", weight: 1.2 },
    { category: "Content", weight: 1.3 },
    { category: "Technical", weight: 1.2 },
    { category: "Media", weight: 0.7 },
    { category: "Links", weight: 0.7 },
    { category: "Social", weight: 0.6 },
    { category: "Performance", weight: 0.6 },
  ];

  const categoryScores: CategoryScore[] = categories.map(({ category, weight }) => {
    const related = issues.filter((i) => i.category === category);
    if (related.length === 0) {
      return { category, score: 70, maxScore: 100, weight };
    }

    let score = 100;
    for (const issue of related) {
      if (issue.severity === "critical") score -= 28;
      else if (issue.severity === "warning") score -= 12;
      else if (issue.severity === "info") score -= 4;
      else if (issue.severity === "pass") score += 0;
    }
    score = Math.max(0, Math.min(100, score));
    return { category, score, maxScore: 100, weight };
  });

  const totalWeight = categoryScores.reduce((s, c) => s + c.weight, 0);
  const overallScore = Math.round(
    categoryScores.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight
  );

  const critical = issues.filter((i) => i.severity === "critical").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;
  const grade = gradeFromScore(overallScore);

  let summary = "";
  if (overallScore >= 85) {
    summary = `Strong SEO foundation (grade ${grade}). Fix remaining warnings to push toward elite SERP competitiveness.`;
  } else if (overallScore >= 70) {
    summary = `Decent baseline (grade ${grade}) with ${warnings} warning(s). Prioritize title/meta/content keyword alignment next.`;
  } else if (overallScore >= 50) {
    summary = `Needs work (grade ${grade}). ${critical} critical issue(s) and ${warnings} warning(s) are holding rankings back.`;
  } else {
    summary = `Poor SEO health (grade ${grade}). Fix critical technical + meta issues first, then rebuild keyword targeting.`;
  }

  return { overallScore, grade, categoryScores, summary };
}
