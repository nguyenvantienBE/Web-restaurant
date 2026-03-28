"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, parseResponse } from "@/lib/api";

export function useReservationCheckIn() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { code: string; tableId?: string }) => {
            const res = await api.post("/reservations/check-in", {
                code: payload.code.trim().toUpperCase(),
                ...(payload.tableId ? { tableId: payload.tableId } : {}),
            });
            return parseResponse<{
                message: string;
                tableCode?: string;
                reservation?: unknown;
            }>(res);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["reservations"] });
            qc.invalidateQueries({ queryKey: ["tables"] });
            qc.invalidateQueries({ queryKey: ["orders"] });
        },
    });
}
