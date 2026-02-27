"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { mockOrders } from "@/lib/mock/data";
import { Order, OrderItem, ItemStatus, CLAIMS } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { ChefHat, Clock, Utensils, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function KitchenPage() {
    const { hasClaim } = useAuth();
    const [orders, setOrders] = useState<Order[]>(
        mockOrders.filter((o) => ["CONFIRMED", "IN_PROGRESS"].includes(o.status))
    );
    const [now, setNow] = useState(Date.now());

    // Update timer every 10s
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 10000);
        return () => clearInterval(t);
    }, []);

    // Simulate incoming kitchen ticket
    useEffect(() => {
        const t = setTimeout(() => {
            const newOrder: Order = {
                id: "ord_demo",
                tableId: "t5", tableCode: "A5", sessionId: "sess_demo",
                type: "DINE_IN", status: "CONFIRMED",
                items: [
                    { id: "oi_d1", orderId: "ord_demo", menuItemId: "m3", menuItemName: "Langoustine Platter", menuItemNameVi: "Tôm Hùm Nhỏ", quantity: 2, unitPrice: 520000, status: "NEW", updatedAt: new Date().toISOString() },
                ],
                totalAmount: 1040000,
                createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                confirmedAt: new Date().toISOString(),
            };
            setOrders((prev) => [newOrder, ...prev]);
            playSound("kitchenTicket");
            toast.info("🍽 Ticket mới từ bàn A5!", { description: "Langoustine × 2" });
        }, 15000);
        return () => clearTimeout(t);
    }, []);

    const updateItemStatus = (orderId: string, itemId: string, status: ItemStatus) => {
        setOrders((prev) =>
            prev.map((o) => {
                if (o.id !== orderId) return o;
                const updatedItems = o.items.map((i) =>
                    i.id === itemId ? { ...i, status, updatedAt: new Date().toISOString() } : i
                );
                // Check if all items cooked → order IN_PROGRESS
                const allReady = updatedItems.every((i) => i.status === "READY" || i.status === "SERVED");
                return { ...o, items: updatedItems, status: allReady ? "READY" : "IN_PROGRESS" };
            })
        );
        if (status === "READY") {
            playSound("itemReady");
            toast.success("Món đã sẵn sàng!");
        }
    };

    const getMinutesWaiting = (iso: string) =>
        Math.floor((now - new Date(iso).getTime()) / 60000);

    const getNextStatus = (current: ItemStatus): { next: ItemStatus; label: string } | null => {
        if (current === "NEW") return { next: "COOKING", label: "Bắt đầu làm" };
        if (current === "COOKING") return { next: "READY", label: "Sẵn sàng" };
        return null;
    };

    // Sort: oldest first (highest urgency)
    const sortedOrders = [...orders].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return (
        <DashboardLayout>
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-serif text-cream text-2xl flex items-center gap-2">
                            <ChefHat size={24} className="text-gold" /> Kitchen Display
                        </h1>
                        <p className="text-cream/40 text-sm">{orders.length} ticket đang làm</p>
                    </div>
                    {/* Filter */}
                    <div className="flex gap-2">
                        {(["new", "cooking", "all"] as const).map((f) => (
                            <span key={f} className="text-cream/40 text-xs">{/* filtered views */}</span>
                        ))}
                    </div>
                </div>

                {orders.length === 0 && (
                    <div className="text-center py-20">
                        <ChefHat size={48} className="mx-auto text-cream/20 mb-4" />
                        <p className="text-cream/30">Không có ticket nào đang làm</p>
                    </div>
                )}

                {/* Ticket grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {sortedOrders.map((order) => {
                        const waiting = getMinutesWaiting(order.confirmedAt || order.createdAt);
                        const isUrgent = waiting >= 15;
                        return (
                            <div key={order.id}
                                className={cn(
                                    "border p-4 space-y-3 transition-all",
                                    isUrgent
                                        ? "border-red-500/50 bg-red-500/10 ring-1 ring-red-500/30"
                                        : "border-white/10 bg-white/5"
                                )}>
                                {/* Ticket header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {isUrgent && <AlertTriangle size={14} className="text-red-400 animate-pulse" />}
                                        <span className="text-cream font-bold text-base">
                                            {order.type === "DINE_IN" ? `🍽 Bàn ${order.tableCode}` : "🥡 Mang về"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <StatusBadge type="order" status={order.status} lang="vi" />
                                        <span className={cn("text-xs font-mono font-bold",
                                            isUrgent ? "text-red-400" : waiting >= 10 ? "text-amber-400" : "text-cream/40")}>
                                            {waiting}m
                                        </span>
                                    </div>
                                </div>

                                <div className="text-cream/40 text-xs flex items-center gap-1">
                                    <Clock size={11} />
                                    {new Date(order.confirmedAt || order.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                    {order.note && <span className="ml-2 text-yellow-400">📝 {order.note}</span>}
                                </div>

                                {/* Items */}
                                <div className="space-y-2">
                                    {order.items.map((item: OrderItem) => {
                                        const nextAction = getNextStatus(item.status);
                                        return (
                                            <div key={item.id}
                                                className={cn("p-3 border flex items-center justify-between gap-2",
                                                    item.status === "READY" ? "border-emerald-500/30 bg-emerald-500/10"
                                                        : item.status === "COOKING" ? "border-orange-500/30 bg-orange-500/10"
                                                            : "border-white/10 bg-white/5")}>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <Utensils size={12} className="text-cream/40 shrink-0" />
                                                        <span className="text-cream text-sm font-medium truncate">{item.menuItemNameVi}</span>
                                                        <span className="text-cream/40 text-xs">×{item.quantity}</span>
                                                    </div>
                                                    {item.note && <p className="text-yellow-400 text-xs ml-5">{item.note}</p>}
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <StatusBadge type="item" status={item.status} lang="vi" size="sm" />
                                                    {item.status === "READY" ? (
                                                        <CheckCircle2 size={16} className="text-emerald-400" />
                                                    ) : nextAction && hasClaim(CLAIMS.ITEM_COOK_UPDATE) ? (
                                                        <button
                                                            onClick={() => updateItemStatus(order.id, item.id, nextAction.next)}
                                                            className={cn("text-[11px] px-2 py-1 border font-medium transition-colors",
                                                                nextAction.next === "COOKING"
                                                                    ? "border-orange-500/50 text-orange-400 hover:bg-orange-500/20"
                                                                    : "border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20")}>
                                                            {nextAction.label}
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Progress bar */}
                                <div>
                                    <div className="flex justify-between text-[10px] text-cream/30 mb-1">
                                        <span>Tiến độ</span>
                                        <span>{order.items.filter((i) => ["READY", "SERVED"].includes(i.status)).length}/{order.items.length}</span>
                                    </div>
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-500 rounded-full transition-all"
                                            style={{ width: `${(order.items.filter((i) => ["READY", "SERVED"].includes(i.status)).length / order.items.length) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
}
