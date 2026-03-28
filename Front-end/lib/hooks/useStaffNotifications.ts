"use client";

import { useQuery } from "@tanstack/react-query";
import { api, parseResponse } from "@/lib/api";

export type StaffNotificationRow = {
    id: string;
    type: string;
    title: string;
    body: string;
    metadata?: unknown;
    createdAt: string;
};

export function useStaffNotifications(enabled = true) {
    return useQuery<StaffNotificationRow[]>({
        queryKey: ["staff-notifications"],
        queryFn: async () => {
            const res = await api.get("/staff/notifications");
            const parsed = await parseResponse<StaffNotificationRow[] | { data: StaffNotificationRow[] }>(res);
            if (Array.isArray(parsed)) return parsed;
            return (parsed as { data: StaffNotificationRow[] }).data ?? [];
        },
        staleTime: 20_000,
        enabled,
    });
}
