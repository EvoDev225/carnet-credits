import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { DashboardResponse } from "../lib/types";

export function useDashboard(enabled: boolean) {
    return useQuery({
        queryKey: ["dashboard"],
        queryFn: () => api.get<DashboardResponse>("/api/dashboard"),
        enabled,
    });
}