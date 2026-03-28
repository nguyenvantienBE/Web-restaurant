import { useQuery } from "@tanstack/react-query";
import { api, parseResponse } from "@/lib/api";

export interface ApiPublicOrderItem {
    id: string;
    quantity: number;
    price: string;
    subtotal: string;
    status: string;
    notes?: string | null;
    menuItemId: string;
    menuItem?: { id: string; name: string; nameVi?: string | null };
}

export interface ApiPublicPayment {
    id: string;
    amount: string;
    status: string;
    paymentMethod?: string | null;
    orderId: string;
}

export interface ApiPublicOrder {
    id: string;
    orderNumber: string;
    status: string;
    subtotal: string;
    tax: string;
    total: string;
    orderItems: ApiPublicOrderItem[];
    payment?: ApiPublicPayment | null;
}

export interface PublicTableSnapshot {
    table: {
        id: string;
        tableCode: string;
        tableName: string;
        floor: string | null;
        status: string;
        capacity: number;
    };
    session: { id: string; orders: ApiPublicOrder[] } | null;
}

export function usePublicTableSnapshot(tableCode: string | undefined) {
    return useQuery({
        queryKey: ["public-table", tableCode],
        queryFn: async () => {
            if (!tableCode) throw new Error("No table");
            const res = await api.publicGet(`/public/tables/${encodeURIComponent(tableCode)}/snapshot`);
            return parseResponse<PublicTableSnapshot>(res);
        },
        enabled: !!tableCode,
        refetchInterval: 8000,
    });
}
