import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, parseResponse } from "@/lib/api";

// Shape trả về từ backend (Prisma Table model)
export interface ApiTable {
    id: string;
    tableCode: string;
    tableName: string;
    capacity: number;
    status: string;
    floor?: string | null;
    qrCode?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export function useTables() {
    return useQuery<ApiTable[]>({
        queryKey: ["tables"],
        queryFn: async () => {
            const res = await api.get("/tables");
            const data = await parseResponse<{ data: ApiTable[] } | ApiTable[]>(res);
            // Có thể là array thẳng hoặc { data: [...] }
            return Array.isArray(data) ? data : (data as { data: ApiTable[] }).data ?? [];
        },
        refetchInterval: 30_000,
        staleTime: 10_000,
    });
}

export function useUpdateTableStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: string; status: string }) => {
            const res = await api.patch(`/tables/${id}`, { status });
            return parseResponse(res);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
    });
}
