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
export interface ApiPayment {
    id: string;
    amount: string;
    paymentMethod?: string | null;
    status: string;
    paidAt?: string | null;
    orderId: string;
}

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
    payment?: ApiPayment | null;
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
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["tables"] });
            qc.invalidateQueries({ queryKey: ["kitchen"] });
        },
    });
}

/**
 * Hoàn tất thanh toán đơn: tạo Payment (PENDING) → xác nhận (PAID + paidAt).
 * Dữ liệu PAID đi vào báo cáo doanh thu / kết ca (theo paidAt).
 * Nếu đã có PENDING (lỗi giữa chừng) thì chỉ gọi confirm.
 */
/** Đặt món (NV) — tại chỗ (QR/bàn) hoặc mang về */
export function useStaffPlaceOrder() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (payload: {
            kind: "dine_in" | "takeaway";
            tableCode: string;
            items: { menuItemId: string; quantity: number; notes?: string }[];
            notes?: string;
        }) => {
            const { kind, tableCode, items, notes } = payload;
            if (kind === "dine_in") {
                const res = await api.publicPost(`/public/tables/${encodeURIComponent(tableCode)}/orders`, {
                    items,
                    notes: notes ?? "NV đặt món",
                });
                return parseResponse(res);
            }
            const res = await api.publicPost(`/public/takeaway/orders`, {
                items,
                notes: notes ?? `NV đặt món — mang về — bàn ${tableCode}`,
            });
            return parseResponse(res);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["tables"] });
        },
    });
}

export type InvoiceConfirmOptions = {
    /** none | email_plain | email_pdf — không gửi mail khi none */
    invoiceMode?: "none" | "email_plain" | "email_pdf";
    customerEmail?: string;
    customerName?: string;
};

export function useCompleteOrderPayment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (args: {
            order: ApiOrder;
            paymentMethod: string;
            invoice?: InvoiceConfirmOptions;
        }) => {
            const { order, paymentMethod, invoice } = args;
            if (order.payment?.status === "PAID" || order.status === "COMPLETED") {
                throw new Error("Đơn đã thanh toán");
            }
            const confirmBody: Record<string, unknown> = {};
            if (invoice?.invoiceMode === "email_plain" || invoice?.invoiceMode === "email_pdf") {
                confirmBody.invoiceMode = invoice.invoiceMode;
                if (invoice.customerEmail?.trim()) confirmBody.customerEmail = invoice.customerEmail.trim();
                if (invoice.customerName?.trim()) confirmBody.customerName = invoice.customerName.trim();
            } else if (invoice?.invoiceMode === "none") {
                confirmBody.invoiceMode = "none";
            } else if (invoice?.customerEmail?.trim()) {
                // tương thích API cũ: chỉ gửi email → backend gửi mail kèm PDF
                confirmBody.customerEmail = invoice.customerEmail.trim();
            }
            if (order.payment?.status === "PENDING" && order.payment.id) {
                const res = await api.patch(`/payments/${order.payment.id}/confirm`, confirmBody);
                return parseResponse(res);
            }
            const amount = Number(order.total);
            const createRes = await api.post(`/payments/${order.id}/create`, { amount, paymentMethod });
            const created = (await parseResponse<{ id: string }>(createRes)) as { id: string };
            const confirmRes = await api.patch(`/payments/${created.id}/confirm`, confirmBody);
            return parseResponse(confirmRes);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["tables"] });
            qc.invalidateQueries({ queryKey: ["kitchen"] });
        },
    });
}
