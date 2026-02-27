"use client";

import { cn } from "@/lib/utils";
import type { TableStatus, OrderStatus, ItemStatus, PaymentStatus, ReservationStatus } from "@/lib/types";

// ---- TABLE STATUS ------------------------------------------
const tableStatusConfig: Record<TableStatus, { label: string; labelVi: string; className: string; dot: string }> = {
    EMPTY: { label: "Empty", labelVi: "Trống", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
    SEATED: { label: "Seated", labelVi: "Khách vào", className: "bg-blue-500/20 text-blue-400 border-blue-500/30", dot: "bg-blue-400" },
    ORDERING: { label: "Ordering", labelVi: "Đang gọi", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", dot: "bg-yellow-400" },
    SERVING: { label: "Serving", labelVi: "Đang phục vụ", className: "bg-orange-500/20 text-orange-400 border-orange-500/30", dot: "bg-orange-400" },
    NEED_PAYMENT: { label: "Need Payment", labelVi: "Cần thanh toán", className: "bg-red-500/20 text-red-400 border-red-500/30", dot: "bg-red-400" },
    NEED_CLEAN: { label: "Need Clean", labelVi: "Cần dọn", className: "bg-slate-500/20 text-slate-400 border-slate-500/30", dot: "bg-slate-400" },
};

// ---- ORDER STATUS ------------------------------------------
const orderStatusConfig: Record<OrderStatus, { label: string; labelVi: string; className: string }> = {
    NEW: { label: "New", labelVi: "Mới", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    CONFIRMED: { label: "Confirmed", labelVi: "Đã xác nhận", className: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
    IN_PROGRESS: { label: "In Progress", labelVi: "Đang làm", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    READY: { label: "Ready", labelVi: "Sẵn sàng", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    SERVED: { label: "Served", labelVi: "Đã phục vụ", className: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
    COMPLETED: { label: "Completed", labelVi: "Hoàn tất", className: "bg-green-500/20 text-green-400 border-green-500/30" },
    CANCELLED: { label: "Cancelled", labelVi: "Đã huỷ", className: "bg-red-500/20 text-red-400 border-red-500/30" },
};

// ---- ITEM STATUS -------------------------------------------
const itemStatusConfig: Record<ItemStatus, { label: string; labelVi: string; className: string }> = {
    NEW: { label: "New", labelVi: "Mới", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    COOKING: { label: "Cooking", labelVi: "Đang làm", className: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    READY: { label: "Ready", labelVi: "Sẵn sàng", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    SERVED: { label: "Served", labelVi: "Đã mang", className: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
    CANCELLED: { label: "Cancelled", labelVi: "Huỷ", className: "bg-red-500/20 text-red-400 border-red-500/30" },
};

// ---- PAYMENT STATUS ----------------------------------------
const paymentStatusConfig: Record<PaymentStatus, { label: string; labelVi: string; className: string }> = {
    UNPAID: { label: "Unpaid", labelVi: "Chưa TT", className: "bg-red-500/20 text-red-400 border-red-500/30" },
    PENDING: { label: "Pending", labelVi: "Đang xử lý", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    PAID: { label: "Paid", labelVi: "Đã TT", className: "bg-green-500/20 text-green-400 border-green-500/30" },
    FAILED: { label: "Failed", labelVi: "Thất bại", className: "bg-red-500/20 text-red-400 border-red-500/30" },
    REFUNDED: { label: "Refunded", labelVi: "Hoàn tiền", className: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
};

// ---- RESERVATION STATUS ------------------------------------
const reservationStatusConfig: Record<ReservationStatus, { label: string; labelVi: string; className: string }> = {
    PENDING: { label: "Pending", labelVi: "Chờ duyệt", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    CONFIRMED: { label: "Confirmed", labelVi: "Đã duyệt", className: "bg-green-500/20 text-green-400 border-green-500/30" },
    CANCELLED: { label: "Cancelled", labelVi: "Đã huỷ", className: "bg-red-500/20 text-red-400 border-red-500/30" },
    NO_SHOW: { label: "No Show", labelVi: "Vắng mặt", className: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
    COMPLETED: { label: "Completed", labelVi: "Hoàn tất", className: "bg-teal-500/20 text-teal-400 border-teal-500/30" },
};

// ---- COMPONENT PROPS ---------------------------------------
type StatusBadgeProps = {
    size?: "sm" | "md";
    showDot?: boolean;
    lang?: "en" | "vi";
} & (
        | { type: "table"; status: TableStatus }
        | { type: "order"; status: OrderStatus }
        | { type: "item"; status: ItemStatus }
        | { type: "payment"; status: PaymentStatus }
        | { type: "reservation"; status: ReservationStatus }
    );

export function StatusBadge({ size = "sm", showDot = false, lang = "en", ...props }: StatusBadgeProps) {
    let config;
    if (props.type === "table") config = tableStatusConfig[props.status];
    else if (props.type === "order") config = orderStatusConfig[props.status];
    else if (props.type === "item") config = itemStatusConfig[props.status];
    else if (props.type === "payment") config = paymentStatusConfig[props.status];
    else config = reservationStatusConfig[props.status];

    const label = lang === "vi" ? config.labelVi : config.label;

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full border font-medium uppercase tracking-wider",
                size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-3 py-1",
                config.className
            )}
        >
            {showDot && (
                <span className={cn("rounded-full animate-pulse", size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2", (config as { dot?: string }).dot)} />
            )}
            {label}
        </span>
    );
}

// ---- Helper to get table status color for bg ---------------
export function getTableBgColor(status: TableStatus): string {
    const map: Record<TableStatus, string> = {
        EMPTY: "bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20",
        SEATED: "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20",
        ORDERING: "bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20",
        SERVING: "bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20",
        NEED_PAYMENT: "bg-red-500/10 border-red-500/30 hover:bg-red-500/20",
        NEED_CLEAN: "bg-slate-500/10 border-slate-500/30 hover:bg-slate-500/20",
    };
    return map[status];
}
