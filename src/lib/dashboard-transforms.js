/**
 * Dashboard data transforms.
 * Centralized, reusable – used by useDashboardData and card components.
 */

/** Normalize pipeline stage breakdown (API may use stats sub-object). */
function normalizePipelineBreakdown(stage) {
  if (!stage?.breakdown) return stage;
  const b = stage.breakdown;
  if (b.stats && typeof b.stats === "object") {
    return { ...stage, breakdown: b.stats };
  }
  return stage;
}

/** Transform raw pipeline_stages from API. */
export function transformPipelineStages(raw) {
  if (!raw || !Array.isArray(raw) || raw.length === 0) {
    return [
      { name: "Leads", count: 0, rate: null },
      { name: "Surveys", count: 0, rate: null },
      { name: "Desains", count: 0, rate: null },
      { name: "Execution", count: 0, rate: null },
    ];
  }
  return raw.map(normalizePipelineBreakdown);
}

/** Transform raw townhall_data from API. */
export function transformTownhallData(raw) {
  return Array.isArray(raw) ? raw : [];
}

/** Transform raw upcoming_surveys from API. */
export function transformUpcomingSurveys(raw) {
  return Array.isArray(raw) ? raw : [];
}

/** Transform raw design_active from API. */
export function transformDesignActive(raw) {
  if (!raw) return { total: 0, stages: [] };
  const stages = [];
  if (raw.stages && Array.isArray(raw.stages)) {
    raw.stages.forEach((s) => {
      const breakdown = (s.breakdown || []).map((item) => ({
        name: item.name,
        count: item.count ?? 0,
        pct: item.pct ?? 0,
        color: item.color ?? s.color,
      }));
      stages.push({
        name: (s.name || "").toLowerCase(),
        count: s.total_count ?? s.count ?? 0,
        pct: s.total_pct ?? s.pct ?? 0,
        color: s.color,
        breakdown,
      });
    });
  }
  return {
    total: raw.total ?? 0,
    stages,
  };
}

/** Transform raw active_projects from API. */
export function transformActiveProjects(raw) {
  return Array.isArray(raw) ? raw : [];
}

/** Transform leads_comparison from API. */
export function transformLeadsComparison(comparison) {
  if (!comparison) return { data: [], percentageChange: 0 };
  let data = [];
  let percentageChange = comparison.percentage_change ?? 0;
  if (comparison.data && Array.isArray(comparison.data)) {
    data = comparison.data;
  } else if (Array.isArray(comparison)) {
    data = comparison.filter((i) => i && i.name);
  } else if (typeof comparison === "object") {
    data = Object.keys(comparison)
      .filter((k) => k !== "percentage_change" && !isNaN(k))
      .map((k) => comparison[k])
      .filter((i) => i && i.name);
  }
  const defaultData = [
    { name: "2 Bln Lalu", value: 0, terbalas: 0, tidak_terbalas: 0 },
    { name: "Bulan Lalu", value: 0, terbalas: 0, tidak_terbalas: 0 },
    { name: "Bulan Ini", value: 0, terbalas: 0, tidak_terbalas: 0 },
  ];
  return {
    data: data.length > 0 ? data : defaultData,
    percentageChange,
  };
}
