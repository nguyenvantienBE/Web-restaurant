"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { useTables, useUpdateTableStatus, ApiTable } from "@/lib/hooks/useTables";
import { useOrders, useConfirmOrder, useCancelOrder } from "@/lib/hooks/useOrders";
import { CLAIMS } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { playSound } from "@/lib/sound";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Bell, Users, RefreshCw, Loader2 } from "lucide-react";

const AREA_LABELS: Record<string, string> = {
    all: "Tất cả",
};

// Map trạng thái sang màu nền/viền
const TABLE_STYLE: Record<string, { bg: string; border: string }> = {
    EMPTY: { bg: "rgba(52,211,153,0.05)", border: "rgba(52,211,153,0.2)" },
    SEATED: { bg: "rgba(251,146,60,0.06)", border: "rgba(251,146,60,0.25)" },
    ORDERING: { bg: "rgba(251,146,60,0.06)", border: "rgba(251,146,60,0.25)" },
    SERVING: { bg: "rgba(251,146,60,0.06)", border: "rgba(251,146,60,0.25)" },
    NEED_PAYMENT: { bg: "rgba(248,113,113,0.07)", border: "rgba(248,113,113,0.3)" },
    NEED_CLEAN: { bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.2)" },
};

export default function CashierPage() {
    const { hasClaim } = useAuth();
    const { data: tables = [], isLoading: tablesLoading, refetch: refetchTables } = useTables();
    const { data: orders = [], isLoading: ordersLoading } = useOrders();
    const updateStatus = useUpdateTableStatus();
    const confirmOrder = useConfirmOrder();
    const cancelOrder = useCancelOrder();

    const [selectedTable, setSelectedTable] = useState<ApiTable | null>(null);
    const [floorFilter, setFloorFilter] = useState<string>("all");
    const [alertCount, setAlertCount] = useState(0);
    const [prevNewCount, setPrevNewCount] = useState(0);

    // Phát âm thanh khi có đơn mới
    useEffect(() => {
        const newCount = orders.filter((o) => o.status === "NEW").length;
        if (newCount > prevNewCount) {
            setAlertCount((c) => c + (newCount - prevNewCount));
            playSound("newOrder");
            toast.warning("🔔 Có đơn mới cần xác nhận!", { duration: 3000 });
        }
        setPrevNewCount(newCount);
    }, [orders, prevNewCount]);

    // Lấy danh sách floors duy nhất để filter
    const floors = ["all", ...Array.from(new Set(tables.map((t) => t.floor || "—").filter(Boolean)))];
    const filteredTables = floorFilter === "all" ? tables : tables.filter((t) => (t.floor || "—") === floorFilter);

    const handleUpdateStatus = useCallback(
        async (tableId: string, status: string) => {
            try {
                await updateStatus.mutateAsync({ id: tableId, status });
                toast.success("Đã cập nhật trạng thái bàn");
                setSelectedTable(null);
            } catch {
                toast.error("Cập nhật thất bại");
            }
        },
        [updateStatus]
    );

    const handleConfirmOrder = async (orderId: string) => {
        try {
            await confirmOrder.mutateAsync(orderId);
            toast.success("Đã xác nhận đơn hàng");
        } catch {
            toast.error("Xác nhận thất bại");
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        try {
            await cancelOrder.mutateAsync(orderId);
            toast.success("Đã hủy đơn hàng");
        } catch {
            toast.error("Hủy đơn thất bại");
        }
    };

    const stats = {
        empty: tables.filter((t) => t.status === "EMPTY").length,
        occupied: tables.filter((t) => !["EMPTY", "NEED_CLEAN"].includes(t.status)).length,
        needPayment: tables.filter((t) => t.status === "NEED_PAYMENT").length,
        needClean: tables.filter((t) => t.status === "NEED_CLEAN").length,
    };

    // Tìm orders cho bàn đang được chọn (qua session)
    const tableOrders = selectedTable
        ? orders.filter((o) => o.session?.table?.id === selectedTable.id && !["COMPLETED", "CANCELLED"].includes(o.status))
        : [];

    const isLoading = tablesLoading || ordersLoading;

    return (
        <DashboardLayout>
            <div className="space-y-4 animate-fade-up">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="section-title">Sơ đồ bàn</h1>
                        <p className="section-sub">
                            {isLoading ? "Đang tải..." : `${tables.length} bàn · ${stats.occupied} đang phục vụ`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {alertCount > 0 && (
                            <div
                                className="flex items-center gap-2 px-3 py-2 rounded animate-fade-in"
                                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}
                            >
                                <Bell size={13} style={{ color: "#f87171" }} />
                                <span className="text-xs font-medium" style={{ color: "#f87171" }}>
                                    {alertCount} đơn mới
                                </span>
                            </div>
                        )}
                        <button
                            onClick={() => { setAlertCount(0); refetchTables(); }}
                            className="btn-ghost text-[11px]"
                        >
                            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Làm mới
                        </button>
                    </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { label: "Trống", value: stats.empty, color: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.2)" },
                        { label: "Đang dùng", value: stats.occupied, color: "#fb923c", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.2)" },
                        { label: "Cần thanh toán", value: stats.needPayment, color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" },
                        { label: "Cần dọn", value: stats.needClean, color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)" },
                    ].map((s) => (
                        <div
                            key={s.label}
                            className="px-4 py-3 rounded text-center"
                            style={{ background: s.bg, border: `1px solid ${s.border}` }}
                        >
                            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Floor filter */}
                {floors.length > 1 && (
                    <div className="flex gap-2 flex-wrap">
                        {floors.map((f) => (
                            <button
                                key={f}
                                onClick={() => setFloorFilter(f)}
                                className="px-4 py-1.5 text-[11px] font-medium rounded-full border transition-all"
                                style={{
                                    border: floorFilter === f ? "1px solid rgba(201,169,110,0.5)" : "1px solid rgba(255,255,255,0.07)",
                                    background: floorFilter === f ? "rgba(201,169,110,0.12)" : "transparent",
                                    color: floorFilter === f ? "#C9A96E" : "rgba(245,240,232,0.4)",
                                }}
                            >
                                {f === "all" ? "Tất cả" : `Tầng ${f}`}
                            </button>
                        ))}
                    </div>
                )}

                {/* Loading state */}
                {isLoading && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={32} className="animate-spin" style={{ color: "#C9A96E" }} />
                        <span className="ml-3 text-sm" style={{ color: "rgba(245,240,232,0.4)" }}>Đang tải dữ liệu...</span>
                    </div>
                )}

                {/* Table grid */}
                {!isLoading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                        {filteredTables.map((table) => {
                            const tableOrder = orders.find(
                                (o) => o.session?.table?.id === table.id && !["COMPLETED", "CANCELLED"].includes(o.status)
                            );
                            const hasNewOrder = tableOrder?.status === "NEW";
                            const style = TABLE_STYLE[table.status] ?? TABLE_STYLE.EMPTY;
                            return (
                                <div
                                    key={table.id}
                                    onClick={() => setSelectedTable(table)}
                                    className={cn("table-cell cursor-pointer", hasNewOrder && "ticket-urgent")}
                                    style={{ background: style.bg, border: `1px solid ${style.border}` }}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="text-base font-bold" style={{ color: "#F5F0E8" }}>
                                            {table.tableCode}
                                        </span>
                                        {hasNewOrder && <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />}
                                    </div>
                                    <StatusBadge type="table" status={table.status as "EMPTY" | "SEATED" | "ORDERING" | "SERVING" | "NEED_PAYMENT" | "NEED_CLEAN"} size="sm" lang="vi" />
                                    <div className="flex items-center gap-1 mt-2">
                                        <Users size={9} style={{ color: "rgba(245,240,232,0.3)" }} />
                                        <span className="text-[10px]" style={{ color: "rgba(245,240,232,0.3)" }}>
                                            {table.capacity} chỗ
                                        </span>
                                    </div>
                                    {tableOrder && (
                                        <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                            <p className="text-[10px]" style={{ color: "rgba(245,240,232,0.4)" }}>
                                                {new Intl.NumberFormat("vi-VN").format(Number(tableOrder.total))}đ
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Table Detail Modal */}
            <Modal
                open={!!selectedTable}
                onClose={() => setSelectedTable(null)}
                title={`Bàn ${selectedTable?.tableCode}${selectedTable?.tableName ? ` — ${selectedTable.tableName}` : ""}`}
                footer={
                    hasClaim(CLAIMS.TABLE_UPDATE) ? (
                        <div className="flex gap-2 flex-wrap">
                            {(["EMPTY", "SEATED", "NEED_CLEAN"] as string[]).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => selectedTable && handleUpdateStatus(selectedTable.id, s)}
                                    disabled={updateStatus.isPending}
                                    className="btn-ghost flex-1 text-[11px] justify-center"
                                >
                                    → {s === "EMPTY" ? "Trống" : s === "SEATED" ? "Khách vào" : "Cần dọn"}
                                </button>
                            ))}
                        </div>
                    ) : undefined
                }
            >
                <div className="space-y-3">
                    {selectedTable && (
                        <div
                            className="flex items-center justify-between p-3 rounded"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                            <div>
                                <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>Trạng thái</p>
                                <StatusBadge type="table" status={selectedTable.status as "EMPTY" | "SEATED" | "ORDERING" | "SERVING" | "NEED_PAYMENT" | "NEED_CLEAN"} size="md" lang="vi" />
                            </div>
                            <div className="text-right">
                                <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>Sức chứa</p>
                                <p className="text-sm font-medium" style={{ color: "#F5F0E8" }}>{selectedTable.capacity} người</p>
                            </div>
                        </div>
                    )}

                    {tableOrders.length === 0 ? (
                        <div className="py-8 text-center">
                            <p className="text-sm" style={{ color: "rgba(245,240,232,0.3)" }}>Bàn trống – Chưa có đơn</p>
                        </div>
                    ) : (
                        tableOrders.map((order) => (
                            <div key={order.id} className="dash-card p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-mono" style={{ color: "rgba(245,240,232,0.5)" }}>
                                        #{order.orderNumber}
                                    </span>
                                    <StatusBadge type="order" status={order.status as "NEW" | "CONFIRMED" | "IN_PROGRESS" | "READY" | "SERVED" | "COMPLETED" | "CANCELLED"} size="sm" lang="vi" />
                                </div>
                                <div className="space-y-1.5">
                                    {order.orderItems.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between text-xs">
                                            <span style={{ color: "rgba(245,240,232,0.65)" }}>
                                                {item.menuItem?.name ?? "—"} × {item.quantity}
                                            </span>
                                            <span style={{ color: "rgba(245,240,232,0.4)" }}>
                                                {new Intl.NumberFormat("vi-VN").format(Number(item.subtotal))}đ
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div
                                    className="flex justify-between items-center mt-3 pt-3"
                                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                                >
                                    <span className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>Tổng</span>
                                    <span className="font-bold" style={{ color: "#C9A96E" }}>
                                        {new Intl.NumberFormat("vi-VN").format(Number(order.total))}đ
                                    </span>
                                </div>
                                {/* Action buttons */}
                                {hasClaim(CLAIMS.ORDER_CONFIRM) && order.status === "NEW" && (
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => handleConfirmOrder(order.id)}
                                            disabled={confirmOrder.isPending}
                                            className="btn-gold flex-1 text-[11px] justify-center"
                                            style={{ padding: "0.5rem" }}
                                        >
                                            ✓ Xác nhận
                                        </button>
                                        {hasClaim(CLAIMS.ORDER_CANCEL) && (
                                            <button
                                                onClick={() => handleCancelOrder(order.id)}
                                                disabled={cancelOrder.isPending}
                                                className="btn-ghost flex-1 text-[11px] justify-center"
                                                style={{ padding: "0.5rem", color: "#f87171" }}
                                            >
                                                ✗ Hủy
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </Modal>
        </DashboardLayout>
    );
}
