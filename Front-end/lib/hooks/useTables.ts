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

// ---- READ TABLES ---------------------------------------------
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

// ---- CREATE TABLE -------------------------------------------
export function useCreateTable() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { tableCode: string; tableName: string; capacity: number; floor?: string }) => {
            const res = await api.post("/tables", payload);
            return parseResponse<ApiTable>(res);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
    });
}

// ---- UPDATE TABLE -------------------------------------------
export function useUpdateTable() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...payload }: { id: string; [key: string]: unknown }) => {
            const res = await api.patch(`/tables/${id}`, payload);
            return parseResponse<ApiTable>(res);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
    });
}

// ---- DELETE TABLE -------------------------------------------
export function useDeleteTable() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await api.delete(`/tables/${id}`);
            return parseResponse(res);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
    });
}

// ---- UPDATE STATUS (QUẦY) ----------------------------------
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

// ---- GENERATE QR --------------------------------------------
export function useGenerateTableQR() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await api.post(`/tables/${id}/qr`, {});
            return parseResponse(res);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
    });
}
