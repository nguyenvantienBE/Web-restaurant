"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useKitchenTickets, useMarkItemCooking, useMarkItemReady } from "@/lib/hooks/useKitchen";
import { CLAIMS } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { playSound } from "@/lib/sound";
import { cn } from "@/lib/utils";
import { ChefHat, Clock, Utensils, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function KitchenPage() {
    const { hasClaim } = useAuth();
    const { data: orders = [], isLoading, refetch } = useKitchenTickets();
    const markCooking = useMarkItemCooking();
    const markReady = useMarkItemReady();
    const [now, setNow] = useState(Date.now());
    const [prevOrderCount, setPrevOrderCount] = useState(0);

    // Cập nhật bộ đếm thời gian mỗi 10s
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 10_000);
        return () => clearInterval(t);
    }, []);

    // Phát âm thanh khi có ticket mới vào bếp
    useEffect(() => {
        if (orders.length > prevOrderCount && prevOrderCount > 0) {
            playSound("kitchenTicket");
            toast.info("🍽 Ticket mới!", { description: "Có đơn hàng mới cần làm" });
        }
        setPrevOrderCount(orders.length);
    }, [orders.length, prevOrderCount]);

    const getMinutesWaiting = (iso: string) =>
        Math.floor((now - new Date(iso).getTime()) / 60000);

    const handleUpdateItem = async (
        itemId: string,
        currentStatus: string
    ) => {
        try {
            if (currentStatus === "NEW") {
                await markCooking.mutateAsync(itemId);
                toast.info("Bắt đầu làm món");
            } else if (currentStatus === "COOKING") {
                await markReady.mutateAsync(itemId);
                playSound("itemReady");
                toast.success("Món đã sẵn sàng!");
            }
        } catch {
            toast.error("Cập nhật thất bại");
        }
    };

    // Sort: đơn cũ nhất lên trước (ưu tiên cao nhất)
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
                        <p className="text-cream/40 text-sm">
                            {isLoading ? "Đang tải..." : `${orders.length} ticket đang làm`}
                        </p>
                    </div>
                    <button
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="btn-ghost text-xs flex items-center gap-1"
                    >
                        {isLoading
                            ? <Loader2 size={12} className="animate-spin" />
                            : <Clock size={12} />
                        }
                        Làm mới
                    </button>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={36} className="animate-spin text-gold" />
                        <span className="ml-3 text-cream/40">Đang tải tickets bếp...</span>
                    </div>
                )}

                {/* Empty */}
                {!isLoading && orders.length === 0 && (
                    <div className="text-center py-20">
                        <ChefHat size={48} className="mx-auto text-cream/20 mb-4" />
                        <p className="text-cream/30">Không có ticket nào đang làm</p>
                        <p className="text-cream/20 text-xs mt-1">Dữ liệu tự động cập nhật mỗi 15 giây</p>
                    </div>
                )}

                {/* Ticket grid */}
                {!isLoading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {sortedOrders.map((order) => {
                            const waiting = getMinutesWaiting(order.createdAt);
                            const isUrgent = waiting >= 15;
                            const tableCode = order.session?.table?.tableCode;

                            return (
                                <div
                                    key={order.id}
                                    className={cn(
                                        "border p-4 space-y-3 transition-all",
                                        isUrgent
                                            ? "border-red-500/50 bg-red-500/10 ring-1 ring-red-500/30"
                                            : "border-white/10 bg-white/5"
                                    )}
                                >
                                    {/* Header */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {isUrgent && (
                                                <AlertTriangle size={14} className="text-red-400 animate-pulse" />
                                            )}
                                            <span className="text-cream font-bold text-base">
                                                {order.type === "DINE_IN"
                                                    ? `🍽 Bàn ${tableCode ?? "?"}`
                                                    : "🥡 Mang về"
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StatusBadge type="order" status={order.status as "NEW" | "CONFIRMED" | "IN_PROGRESS" | "READY" | "SERVED" | "COMPLETED" | "CANCELLED"} lang="vi" />
                                            <span
                                                className={cn(
                                                    "text-xs font-mono font-bold",
                                                    isUrgent
                                                        ? "text-red-400"
                                                        : waiting >= 10
                                                            ? "text-amber-400"
                                                            : "text-cream/40"
                                                )}
                                            >
                                                {waiting}m
                                            </span>
                                        </div>
                                    </div>

                                    {/* Order number + time */}
                                    <div className="text-cream/40 text-xs flex items-center gap-2">
                                        <Clock size={11} />
                                        <span>
                                            {new Date(order.createdAt).toLocaleTimeString("vi-VN", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                        <span className="font-mono opacity-60">#{order.orderNumber}</span>
                                        {order.notes && (
                                            <span className="ml-1 text-yellow-400">📝 {order.notes}</span>
                                        )}
                                    </div>

                                    {/* Items */}
                                    <div className="space-y-2">
                                        {order.orderItems.map((item) => {
                                            const canUpdate = hasClaim(CLAIMS.ITEM_COOK_UPDATE)
                                                && (item.status === "NEW" || item.status === "COOKING");
                                            const nextLabel =
                                                item.status === "NEW" ? "Bắt đầu làm" :
                                                    item.status === "COOKING" ? "Sẵn sàng" : null;

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={cn(
                                                        "p-3 border flex items-center justify-between gap-2",
                                                        item.status === "READY"
                                                            ? "border-emerald-500/30 bg-emerald-500/10"
                                                            : item.status === "COOKING"
                                                                ? "border-orange-500/30 bg-orange-500/10"
                                                                : "border-white/10 bg-white/5"
                                                    )}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <Utensils size={12} className="text-cream/40 shrink-0" />
                                                            <span className="text-cream text-sm font-medium truncate">
                                                                {item.menuItem?.name ?? "—"}
                                                            </span>
                                                            <span className="text-cream/40 text-xs">×{item.quantity}</span>
                                                        </div>
                                                        {item.notes && (
                                                            <p className="text-yellow-400 text-xs ml-5">{item.notes}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <StatusBadge type="item" status={item.status as "NEW" | "COOKING" | "READY" | "SERVED" | "CANCELLED"} lang="vi" size="sm" />
                                                        {item.status === "READY" ? (
                                                            <CheckCircle2 size={16} className="text-emerald-400" />
                                                        ) : canUpdate && nextLabel ? (
                                                            <button
                                                                onClick={() => handleUpdateItem(item.id, item.status)}
                                                                disabled={markCooking.isPending || markReady.isPending}
                                                                className={cn(
                                                                    "text-[11px] px-2 py-1 border font-medium transition-colors",
                                                                    item.status === "NEW"
                                                                        ? "border-orange-500/50 text-orange-400 hover:bg-orange-500/20"
                                                                        : "border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20"
                                                                )}
                                                            >
                                                                {nextLabel}
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
                                            <span>
                                                {order.orderItems.filter((i) => ["READY", "SERVED"].includes(i.status)).length}
                                                /{order.orderItems.length}
                                            </span>
                                        </div>
                                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all"
                                                style={{
                                                    width: `${(order.orderItems.filter((i) => ["READY", "SERVED"].includes(i.status)).length / order.orderItems.length) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
