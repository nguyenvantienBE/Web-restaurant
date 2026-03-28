import type { ApiTable } from "@/lib/hooks/useTables";
import type { ApiOrder } from "@/lib/hooks/useOrders";

export type TableActivityKind =
    | "empty"
    | "need_clean"
    | "need_payment"
    | "seated_no_order"
    | "kitchen"
    | "partial"
    | "all_ready"
    | "idle";

export function getTableActivitySummary(
    table: ApiTable,
    orders: ApiOrder[],
): { tag: string; detail: string; kind: TableActivityKind } {
    const list = orders.filter(
        (o) => o.session?.table?.id === table.id && !["COMPLETED", "CANCELLED"].includes(o.status),
    );

    if (table.status === "EMPTY") {
        return { tag: "Trống", detail: "Nhận khách / đặt món", kind: "empty" };
    }
    if (table.status === "NEED_CLEAN") {
        return { tag: "Cần dọn", detail: "Dọn xong → trống", kind: "need_clean" };
    }
    if (table.status === "NEED_PAYMENT") {
        return { tag: "Chờ thanh toán", detail: "Thu ngân xác nhận", kind: "need_payment" };
    }

    if (list.length === 0) {
        if (table.status === "SEATED") {
            return { tag: "Đã mở bàn", detail: "Chưa có đơn", kind: "seated_no_order" };
        }
        return { tag: "Hoạt động", detail: "—", kind: "idle" };
    }

    let pending = 0;
    let served = 0;
    let readyCount = 0;
    let total = 0;
    for (const o of list) {
        for (const it of o.orderItems) {
            if (it.status === "CANCELLED") continue;
            total++;
            if (it.status === "SERVED") served++;
            else {
                pending++;
                if (it.status === "READY") readyCount++;
            }
        }
    }
    if (total === 0) {
        return { tag: "Đơn trống", detail: "—", kind: "idle" };
    }
    if (pending === 0) {
        return { tag: "Đã mang đủ món", detail: "Thu ngân xác nhận thanh toán", kind: "all_ready" };
    }
    if (served > 0 && pending > 0) {
        return { tag: "Đang phục vụ", detail: `${served}/${total} món đã lên`, kind: "partial" };
    }
    if (readyCount === pending && readyCount > 0) {
        return { tag: "Chờ mang ra", detail: `${readyCount} món sẵn sàng`, kind: "all_ready" };
    }
    return { tag: "Thiếu món", detail: `${pending} món đang bếp`, kind: "kitchen" };
}

export function itemStatusLabelVi(status: string): string {
    const m: Record<string, string> = {
        NEW: "Chờ bếp",
        COOKING: "Đang làm",
        READY: "Sẵn sàng",
        SERVED: "Đã lên bàn",
        CANCELLED: "Huỷ",
    };
    return m[status] ?? status;
}

/** Cho phép NV đặt thêm món (không khi chờ thanh toán / cần dọn) */
export function canStaffPlaceOrder(table: ApiTable): boolean {
    return table.status !== "NEED_CLEAN" && table.status !== "NEED_PAYMENT";
}
