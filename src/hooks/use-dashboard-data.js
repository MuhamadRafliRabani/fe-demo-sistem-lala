import { useMemo } from "react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import {
  transformPipelineStages,
  transformTownhallData,
  transformUpcomingSurveys,
  transformDesignActive,
  transformActiveProjects,
  transformLeadsComparison,
} from "@/lib/dashboard-transforms";

const DEFAULT_FILTERS = {};

/**
 * Single source of dashboard data. Fetches /dashboard once;
 * all cards use this hook and get their slice (deduped via React Query).
 * Each card owns its data usage – easy to maintain and swap.
 */
export function useDashboardData(filters = DEFAULT_FILTERS) {
  const params = useMemo(() => (filters && Object.keys(filters).length ? filters : {}), [filters]);
  const { data: apiResponse, isLoading, error } = useApiFetch(
    ["dashboard", params],
    "/dashboard",
    params,
    true
  );

  const slices = useMemo(() => {
    const d = apiResponse?.data;
    if (!d) {
      return {
        pipelineStages: transformPipelineStages(null),
        townhallData: transformTownhallData(null),
        upcomingSurveys: transformUpcomingSurveys(null),
        designActive: transformDesignActive(null),
        activeProjects: transformActiveProjects(null),
        leadsComparison: transformLeadsComparison(null),
      };
    }
    return {
      pipelineStages: transformPipelineStages(d.pipeline_stages),
      townhallData: transformTownhallData(d.townhall_data),
      upcomingSurveys: transformUpcomingSurveys(d.upcoming_surveys),
      designActive: transformDesignActive(d.design_active),
      activeProjects: transformActiveProjects(d.active_projects),
      leadsComparison: transformLeadsComparison(d.leads_comparison),
    };
  }, [apiResponse]);

  return {
    ...slices,
    isLoading,
    error,
    raw: apiResponse?.data,
  };
}
