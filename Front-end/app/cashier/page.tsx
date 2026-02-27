"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { mockTables, mockOrders } from "@/lib/mock/data";
import { Table, TableStatus, Order } from "@/lib/types";
import { CLAIMS } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { playSound } from "@/lib/sound";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Bell, Users, Clock, AlertCircle, CheckCircle2, RefreshCw } from "lucide-react";

const AREA_LABELS: Record<string, string> = {
    all: "Tất cả", indoor: "Trong nhà", outdoor: "Ngoài trời", rooftop: "Sân thượng", bar: "Khu bar",
};

export default function CashierPage() {
    const { hasClaim } = useAuth();
    const [tables, setTables] = useState<Table[]>(mockTables);
    const [orders] = useState<Order[]>(mockOrders);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [areaFilter, setAreaFilter] = useState<string>("all");
    const [alertCount, setAlertCount] = useState(0);

    // Simulate incoming alerts
    useEffect(() => {
        const t = setInterval(() => {
            const hasNew = orders.some(o => o.status === "NEW");
            if (hasNew) {
                setAlertCount(c => c + 1);
                playSound("newOrder");
                toast.warning("🔔 Đơn mới cần xác nhận!", { duration: 3000 });
            }
        }, 30000);
        return () => clearInterval(t);
    }, [orders]);

    const filteredTables = areaFilter === "all" ? tables : tables.filter(t => t.area === areaFilter);

    const updateStatus = useCallback((tableId: string, status: TableStatus) => {
        setTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));
        toast.success("Đã cập nhật trạng thái bàn");
        setSelectedTable(null);
    }, []);

    const tableOrders = selectedTable
        ? orders.filter(o => o.tableId === selectedTable.id)
        : [];

    const stats = {
        empty: tables.filter(t => t.status === "EMPTY").length,
        occupied: tables.filter(t => !["EMPTY", "NEED_CLEAN"].includes(t.status)).length,
        needPayment: tables.filter(t => t.status === "NEED_PAYMENT").length,
        needClean: tables.filter(t => t.status === "NEED_CLEAN").length,
    };

    return (
        <DashboardLayout>
            <div className="space-y-4 animate-fade-up">

                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="section-title">Sơ đồ bàn</h1>
                        <p className="section-sub">{tables.length} bàn · {stats.occupied} đang phục vụ</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {alertCount > 0 && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded animate-fade-in"
                                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                                <Bell size={13} style={{ color: "#f87171" }} />
                                <span className="text-xs font-medium" style={{ color: "#f87171" }}>{alertCount} đơn mới</span>
                            </div>
                        )}
                        <button onClick={() => setAlertCount(0)} className="btn-ghost text-[11px]">
                            <RefreshCw size={12} /> Làm mới
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
                    ].map(s => (
                        <div key={s.label} className="px-4 py-3 rounded text-center"
                            style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Area filter */}
                <div className="flex gap-2 flex-wrap">
                    {Object.entries(AREA_LABELS).map(([k, v]) => (
                        <button key={k} onClick={() => setAreaFilter(k)}
                            className="px-4 py-1.5 text-[11px] font-medium rounded-full border transition-all"
                            style={{
                                border: areaFilter === k ? "1px solid rgba(201,169,110,0.5)" : "1px solid rgba(255,255,255,0.07)",
                                background: areaFilter === k ? "rgba(201,169,110,0.12)" : "transparent",
                                color: areaFilter === k ? "#C9A96E" : "rgba(245,240,232,0.4)",
                            }}>
                            {v}
                        </button>
                    ))}
                </div>

                {/* Table grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {filteredTables.map(table => {
                        const tableOrder = orders.find(o => o.tableId === table.id && !["COMPLETED", "CANCELLED"].includes(o.status));
                        const hasNewOrder = tableOrder?.status === "NEW";
                        return (
                            <div key={table.id}
                                onClick={() => setSelectedTable(table)}
                                className={cn("table-cell cursor-pointer", hasNewOrder && "ticket-urgent")}
                                style={{
                                    background: table.status === "EMPTY"
                                        ? "rgba(52,211,153,0.05)"
                                        : table.status === "NEED_PAYMENT"
                                            ? "rgba(248,113,113,0.07)"
                                            : table.status === "NEED_CLEAN"
                                                ? "rgba(148,163,184,0.06)"
                                                : "rgba(251,146,60,0.06)",
                                    border: `1px solid ${table.status === "EMPTY" ? "rgba(52,211,153,0.2)" :
                                        table.status === "NEED_PAYMENT" ? "rgba(248,113,113,0.3)" :
                                            table.status === "NEED_CLEAN" ? "rgba(148,163,184,0.2)" :
                                                "rgba(251,146,60,0.25)"
                                        }`,
                                }}>
                                <div className="flex items-start justify-between mb-2">
                                    <span className="text-base font-bold" style={{ color: "#F5F0E8" }}>{table.tableCode}</span>
                                    {hasNewOrder && (
                                        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                                    )}
                                </div>
                                <StatusBadge type="table" status={table.status} size="sm" lang="vi" />
                                <div className="flex items-center gap-1 mt-2">
                                    <Users size={9} style={{ color: "rgba(245,240,232,0.3)" }} />
                                    <span className="text-[10px]" style={{ color: "rgba(245,240,232,0.3)" }}>{table.capacity} chỗ</span>
                                </div>
                                {tableOrder && (
                                    <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                        <p className="text-[10px]" style={{ color: "rgba(245,240,232,0.4)" }}>
                                            {new Intl.NumberFormat("vi-VN").format(tableOrder.totalAmount)}đ
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Table Detail Modal */}
            <Modal open={!!selectedTable} onClose={() => setSelectedTable(null)}
                title={`Bàn ${selectedTable?.tableCode} — ${AREA_LABELS[selectedTable?.area ?? ""]}`}
                footer={
                    hasClaim(CLAIMS.TABLE_UPDATE) ? (
                        <div className="flex gap-2 flex-wrap">
                            {(["EMPTY", "SEATED", "NEED_CLEAN"] as TableStatus[]).map(s => (
                                <button key={s} onClick={() => selectedTable && updateStatus(selectedTable.id, s)}
                                    className="btn-ghost flex-1 text-[11px] justify-center">
                                    → {s === "EMPTY" ? "Trống" : s === "SEATED" ? "Khách vào" : "Cần dọn"}
                                </button>
                            ))}
                        </div>
                    ) : undefined
                }>
                <div className="space-y-3">
                    {selectedTable && (
                        <div className="flex items-center justify-between p-3 rounded"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                            <div>
                                <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>Trạng thái</p>
                                <StatusBadge type="table" status={selectedTable.status} size="md" lang="vi" />
                            </div>
                            <div className="text-right">
                                <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>Sức chứa</p>
                                <p className="text-sm font-medium" style={{ color: "#F5F0E8" }}>{selectedTable.capacity} người</p>
                            </div>
                        </div>
                    )}
                    {tableOrders.length === 0 ? (
                        <div className="py-8 text-center">
                            <CheckCircle2 size={28} className="mx-auto mb-2 opacity-20" style={{ color: "#34d399" }} />
                            <p className="text-sm" style={{ color: "rgba(245,240,232,0.3)" }}>Bàn trống – Chưa có đơn</p>
                        </div>
                    ) : tableOrders.map(order => (
                        <div key={order.id} className="dash-card p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-mono" style={{ color: "rgba(245,240,232,0.5)" }}>#{order.id}</span>
                                <StatusBadge type="order" status={order.status} size="sm" lang="vi" />
                            </div>
                            <div className="space-y-1.5">
                                {order.items.map(item => (
                                    <div key={item.id} className="flex items-center justify-between text-xs">
                                        <span style={{ color: "rgba(245,240,232,0.65)" }}>{item.menuItemNameVi} × {item.quantity}</span>
                                        <span style={{ color: "rgba(245,240,232,0.4)" }}>
                                            {new Intl.NumberFormat("vi-VN").format(item.unitPrice * item.quantity)}đ
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between items-center mt-3 pt-3"
                                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                <span className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>Tổng</span>
                                <span className="font-bold" style={{ color: "#C9A96E" }}>
                                    {new Intl.NumberFormat("vi-VN").format(order.totalAmount)}đ
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </Modal>
        </DashboardLayout>
    );
}
