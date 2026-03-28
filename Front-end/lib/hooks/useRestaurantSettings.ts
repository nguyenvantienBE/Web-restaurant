import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, parseResponse } from "@/lib/api";
import type { RestaurantSettingsDto } from "@/lib/types";

export function useRestaurantSettingsQuery(enabled: boolean) {
    return useQuery({
        queryKey: ["settings", "restaurant"],
        queryFn: async () => {
            const res = await api.get("/settings/restaurant");
            return parseResponse<RestaurantSettingsDto>(res);
        },
        enabled,
        staleTime: 60_000,
    });
}

export function useUpdateRestaurantSettings() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (body: Partial<RestaurantSettingsDto>) => {
            const res = await api.patch("/settings/restaurant", body);
            return parseResponse<RestaurantSettingsDto>(res);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["settings", "restaurant"] });
        },
    });
}
