import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, parseResponse } from "@/lib/api";

// ---- CATEGORY ----
export interface ApiCategory {
    id: string;
    name: string;
    nameVi?: string | null;
    description?: string | null;
    isActive: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export function useCategories() {
    return useQuery<ApiCategory[]>({
        queryKey: ["categories"],
        queryFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/categories`);
            const json = await res.json();
            if (!res.ok) {
                const msg = (json as { message?: string })?.message ?? res.statusText;
                throw new Error(typeof msg === "string" ? msg : "Không tải được danh mục");
            }
            const data = json.data ?? json;
            return Array.isArray(data) ? data : [];
        },
        staleTime: 60_000,
    });
}

// ---- MENU ITEM ----
export interface ApiMenuItem {
    id: string;
    name: string;
    nameVi?: string | null;
    description?: string | null;
    descriptionVi?: string | null;
    price: string;
    imageUrl?: string | null;
    tags?: string[];
    isAvailable: boolean;
    preparationTime?: number | null;
    sortOrder: number;
    categoryId: string;
    category?: ApiCategory;
    createdAt: string;
    updatedAt: string;
}

interface MenuItemsResponse {
    data: ApiMenuItem[];
    meta: { page: number; limit: number; total: number; totalPages: number };
}

export function useMenuItems(categoryId?: string) {
    const params = categoryId
        ? `?limit=200&categoryId=${categoryId}`
        : "?limit=200";
    return useQuery<ApiMenuItem[]>({
        queryKey: ["menu-items", categoryId],
        queryFn: async () => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/menu-items${params}`);
            const json = await res.json();
            if (!res.ok) {
                const msg = (json as { message?: string })?.message ?? res.statusText;
                throw new Error(typeof msg === "string" ? msg : "Không tải được thực đơn");
            }
            const parsed: MenuItemsResponse | ApiMenuItem[] = json.data !== undefined ? json : json;
            if (Array.isArray(parsed)) return parsed;
            const obj = parsed as MenuItemsResponse;
            return obj.data ?? [];
        },
        staleTime: 30_000,
    });
}

// ---- CREATE MENU ITEM ----
export function useCreateMenuItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            name: string;
            description?: string;
            price: number;
            imageUrl?: string;
            preparationTime?: number;
            categoryId: string;
            tags?: string[];
        }) => {
            const res = await api.post("/menu-items", payload);
            return parseResponse<ApiMenuItem>(res);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
    });
}

// ---- UPDATE MENU ITEM ----
export function useUpdateMenuItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...payload }: { id: string;[key: string]: unknown }) => {
            const res = await api.patch(`/menu-items/${id}`, payload);
            return parseResponse<ApiMenuItem>(res);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
    });
}

// ---- DELETE MENU ITEM ----
export function useDeleteMenuItem() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await api.delete(`/menu-items/${id}`);
            return parseResponse(res);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["menu-items"] }),
    });
}
