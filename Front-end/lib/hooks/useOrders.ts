import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, parseResponse } from "@/lib/api";

// Prisma OrderItem shape từ backend
export interface ApiOrderItem {
    id: string;
    quantity: number;
    price: string;
    subtotal: string;
    status: string;
    notes?: string | null;
    menuItemId: string;
    menuItem?: { id: string; name: string; description?: string };
    orderId: string;
    createdAt: string;
    updatedAt: string;
}

// Prisma Order shape từ backend
export interface ApiOrder {
    id: string;
    orderNumber: string;
    type: string;
    status: string;
    subtotal: string;
    tax: string;
    total: string;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
    sessionId?: string | null;
    session?: {
        id: string;
        tableId: string;
        table?: { id: string; tableCode: string; tableName: string };
    } | null;
    confirmedById?: string | null;
    orderItems: ApiOrderItem[];
}

interface OrdersResponse {
    data: ApiOrder[];
    meta: { page: number; limit: number; total: number; totalPages: number };
}

export function useOrders(status?: string) {
    const params = status ? `?status=${status}&limit=50` : "?limit=50";
    return useQuery<ApiOrder[]>({
        queryKey: ["orders", status],
        queryFn: async () => {
            const res = await api.get(`/orders${params}`);
            const parsed = await parseResponse<OrdersResponse | ApiOrder[]>(res);
            if (Array.isArray(parsed)) return parsed;
            return (parsed as OrdersResponse).data ?? [];
        },
        refetchInterval: 20_000,
        staleTime: 10_000,
    });
}

export function useConfirmOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await api.patch(`/orders/${id}/confirm`);
            return parseResponse(res);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["tables"] });
        },
    });
}

export function useCancelOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const res = await api.patch(`/orders/${id}/cancel`);
            return parseResponse(res);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
    });
}

export function useMarkItemServed() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (itemId: string) => {
            const res = await api.patch(`/order-items/${itemId}/served`);
            return parseResponse(res);
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
    });
}
