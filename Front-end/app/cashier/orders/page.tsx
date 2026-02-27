"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { mockOrders } from "@/lib/mock/data";
import { Order, OrderStatus, CLAIMS } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Utensils, Clock, Package, User } from "lucide-react";
import { toast } from "sonner";

const STATUS_TABS: { status: OrderStatus | "all"; label: string }[] = [
    { status: "all", label: "Tất cả" },
    { status: "NEW", label: "🔵 Mới" },
    { status: "CONFIRMED", label: "🟣 Xác nhận" },
    { status: "IN_PROGRESS", label: "🟡 Đang làm" },
    { status: "READY", label: "🟢 Sẵn sàng" },
    { status: "SERVED", label: "📦 Đã phục vụ" },
    { status: "COMPLETED", label: "✓ Hoàn tất" },
];

export default function CashierOrdersPage() {
    const { hasClaim } = useAuth();
    const [orders, setOrders] = useState<Order[]>(mockOrders);
    const [tab, setTab] = useState<OrderStatus | "all">("all");
    const [selected, setSelected] = useState<Order | null>(null);

    const filtered = tab === "all" ? orders : orders.filter((o) => o.status === tab);
    const getCount = (s: OrderStatus | "all") => s === "all" ? orders.length : orders.filter((o) => o.status === s).length;

    const confirm = (orderId: string) => {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "CONFIRMED" } : o));
        toast.success("Đơn đã xác nhận → Bếp nhận!");
        setSelected(null);
    };

    const formatPrice = (p: number) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    return (
        <DashboardLayout>
            <div className="space-y-5">
                <div>
                    <h1 className="font-serif text-cream text-2xl">Danh sách đơn hàng</h1>
                    <p className="text-cream/40 text-sm">{orders.length} đơn hôm nay</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {STATUS_TABS.map(({ status, label }) => (
                        <button key={status} onClick={() => setTab(status)}
                            className={cn("shrink-0 px-3 py-1.5 text-xs border transition-colors whitespace-nowrap",
                                tab === status ? "border-gold bg-gold/20 text-gold" : "border-white/10 text-cream/50 hover:text-cream")}>
                            {label} ({getCount(status)})
                        </button>
                    ))}
                </div>

                {/* Order list */}
                <div className="space-y-2">
                    {filtered.length === 0 && (
                        <div className="text-center py-10 text-cream/30 text-sm">Không có đơn nào</div>
                    )}
                    {filtered.map((order) => (
                        <button key={order.id} onClick={() => setSelected(order)}
                            className="w-full text-left bg-white/5 border border-white/10 hover:border-white/20 p-4 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className="text-cream font-medium text-sm">
                                            {order.type === "DINE_IN" ? `🍽 Bàn ${order.tableCode}` : `🥡 Mang về`}
                                        </span>
                                        <StatusBadge type="order" status={order.status} lang="vi" />
                                        {order.type === "TAKEAWAY" && (
                                            <span className="text-xs border border-orange-500/30 text-orange-400 px-2 py-0.5">Takeaway</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-cream/40 text-xs">
                                        <span className="flex items-center gap-1"><Utensils size={11} /> {order.items.length} món</span>
                                        <span className="flex items-center gap-1"><Clock size={11} /> {formatTime(order.createdAt)}</span>
                                        {order.customerName && <span className="flex items-center gap-1"><User size={11} /> {order.customerName}</span>}
                                    </div>
                                    {/* Item summary */}
                                    <p className="text-cream/30 text-xs mt-1 truncate">
                                        {order.items.map((i) => `${i.menuItemNameVi}(×${i.quantity})`).join(", ")}
                                    </p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-gold font-semibold text-sm">{formatPrice(order.totalAmount)}</p>
                                    {order.status === "NEW" && (
                                        <span className="text-blue-400 text-[10px] animate-pulse">• Mới!</span>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Order Detail Modal */}
            <Modal
                open={!!selected}
                onClose={() => setSelected(null)}
                title={selected?.type === "DINE_IN" ? `Đơn bàn ${selected?.tableCode}` : "Đơn mang về"}
                size="md"
                footer={
                    selected?.status === "NEW" && hasClaim(CLAIMS.ORDER_CONFIRM) ? (
                        <button onClick={() => confirm(selected.id)}
                            className="bg-gold text-charcoal px-5 py-2 text-sm font-semibold hover:bg-gold-light transition-colors">
                            ✓ Xác nhận đơn
                        </button>
                    ) : null
                }
            >
                {selected && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <StatusBadge type="order" status={selected.status} lang="vi" size="md" showDot />
                            <span className="text-cream/50 text-xs flex items-center gap-1">
                                <Clock size={12} /> {formatTime(selected.createdAt)}
                            </span>
                            {selected.customerName && (
                                <span className="text-cream/50 text-xs flex items-center gap-1">
                                    <User size={12} /> {selected.customerName} · {selected.customerPhone}
                                </span>
                            )}
                            {selected.type === "TAKEAWAY" && selected.pickupTime && (
                                <span className="text-orange-400 text-xs flex items-center gap-1">
                                    <Package size={12} /> Nhận: {formatTime(selected.pickupTime)}
                                </span>
                            )}
                        </div>

                        {selected.note && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 text-yellow-300 text-sm">
                                📝 {selected.note}
                            </div>
                        )}

                        <div className="space-y-2">
                            {selected.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/5">
                                    <div>
                                        <p className="text-cream text-sm">{item.menuItemNameVi} <span className="text-cream/40">×{item.quantity}</span></p>
                                        {item.note && <p className="text-cream/30 text-xs">{item.note}</p>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <StatusBadge type="item" status={item.status} lang="vi" size="sm" />
                                        <span className="text-cream/60 text-sm">
                                            {formatPrice(item.unitPrice * item.quantity)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between pt-2">
                            <span className="text-cream/60">Tổng cộng</span>
                            <span className="text-gold font-semibold">{formatPrice(selected.totalAmount)}</span>
                        </div>
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    );
}
