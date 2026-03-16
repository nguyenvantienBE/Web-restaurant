import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, parseResponse } from "@/lib/api";
import type { ApiOrder } from "./useOrders";

interface KitchenResponse {
    data: ApiOrder[];
    meta: { page: number; limit: number; total: number; totalPages: number };
}

export function useKitchenTickets() {
    return useQuery<ApiOrder[]>({
        queryKey: ["kitchen", "tickets"],
        queryFn: async () => {
            const res = await api.get("/kitchen/tickets?limit=50");
            const parsed = await parseResponse<KitchenResponse | ApiOrder[]>(res);
            if (Array.isArray(parsed)) return parsed;
            return (parsed as KitchenResponse).data ?? [];
        },
        refetchInterval: 15_000,
        staleTime: 5_000,
    });
}

export function useMarkItemCooking() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (itemId: string) => {
            const res = await api.patch(`/kitchen/order-items/${itemId}/cooking`);
            return parseResponse(res);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["kitchen"] }),
    });
}

export function useMarkItemReady() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (itemId: string) => {
            const res = await api.patch(`/kitchen/order-items/${itemId}/ready`);
            return parseResponse(res);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["kitchen"] }),
    });
}
