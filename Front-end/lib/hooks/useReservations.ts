"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, parseResponse } from "@/lib/api";
import type { Reservation, ReservationStatus } from "@/lib/types";

export function useReservations(status?: ReservationStatus | "all") {
    return useQuery<Reservation[]>({
        queryKey: ["reservations", status || "all"],
        queryFn: async () => {
            const params =
                status && status !== "all"
                    ? `?status=${status}`
                    : "";
            const res = await api.get(`/reservations${params}`);
            const parsed = await parseResponse<{ data: Reservation[] } | Reservation[]>(res);
            if (Array.isArray(parsed)) return parsed;
            return (parsed as { data: Reservation[] }).data ?? [];
        },
        staleTime: 15_000,
    });
}

export function useUpdateReservationStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { id: string; status: ReservationStatus }) => {
            const res = await api.patch(`/reservations/${payload.id}/status`, { status: payload.status });
            return parseResponse(res);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["reservations"] });
        },
    });
}

