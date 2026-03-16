import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, parseResponse } from "@/lib/api";

export interface ApiRole {
    id: string;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface ApiUser {
    id: string;
    email: string;
    fullName: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    roleId: string;
    role: ApiRole;
}

interface UsersResponse {
    data: ApiUser[];
    meta: { page: number; limit: number; total: number; totalPages: number };
}

// ---- GET ALL USERS ----
export function useUsers() {
    return useQuery<ApiUser[]>({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await api.get("/users?limit=100");
            const parsed = await parseResponse<UsersResponse | ApiUser[]>(res);
            if (Array.isArray(parsed)) return parsed;
            return (parsed as UsersResponse).data ?? [];
        },
        staleTime: 30_000,
    });
}

// ---- GET ALL ROLES ----
export function useRoles() {
    return useQuery<ApiRole[]>({
        queryKey: ["roles"],
        queryFn: async () => {
            // NestJS chưa có GET /roles riêng nên lấy từ users và deduplicate
            const res = await api.get("/users?limit=100");
            const parsed = await parseResponse<UsersResponse | ApiUser[]>(res);
            const users = Array.isArray(parsed) ? parsed : (parsed as UsersResponse).data ?? [];
            const roleMap = new Map<string, ApiRole>();
            users.forEach((u) => roleMap.set(u.role.id, u.role));
            return Array.from(roleMap.values());
        },
        staleTime: 60_000,
    });
}

// ---- CREATE USER ----
export function useCreateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            email: string;
            password: string;
            fullName: string;
            roleId: string;
        }) => {
            const res = await api.post("/users", payload);
            return parseResponse<ApiUser>(res);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
    });
}

// ---- DISABLE USER ----
export function useDisableUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await api.patch(`/users/${id}/disable`);
            return parseResponse(res);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
    });
}

// ---- ENABLE USER (update isActive = true) ----
export function useEnableUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await api.patch(`/users/${id}`, { isActive: true });
            return parseResponse(res);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
    });
}

// ---- UPDATE USER (e.g. change role) ----
export function useUpdateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: { id: string; roleId?: string; fullName?: string; email?: string }) => {
            const { id, ...body } = payload;
            const res = await api.patch(`/users/${id}`, body);
            return parseResponse<ApiUser>(res);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["users"] });
            qc.invalidateQueries({ queryKey: ["roles"] });
        },
    });
}
