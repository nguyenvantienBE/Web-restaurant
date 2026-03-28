"use client";

import { useState, useMemo, useEffect } from "react";
import { X, Loader2, Plus, Minus, UtensilsCrossed } from "lucide-react";
import { useCategories, useMenuItems, type ApiMenuItem } from "@/lib/hooks/useMenu";
import { useStaffPlaceOrder } from "@/lib/hooks/useOrders";
import { OrderServiceTypeModal, type OrderServiceKind } from "@/components/order/OrderServiceTypeModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type CartLine = { item: ApiMenuItem; quantity: number };

export function CashierStaffOrderModal({
    open,
    onClose,
    tableCode,
}: {
    open: boolean;
    onClose: () => void;
    tableCode: string;
}) {
    const { data: categories = [] } = useCategories();
    const { data: menuItems = [], isLoading: menuLoading } = useMenuItems();
    const placeOrder = useStaffPlaceOrder();

    const [catId, setCatId] = useState<string>("all");
    const [cart, setCart] = useState<Map<string, CartLine>>(new Map());
    const [serviceTypeOpen, setServiceTypeOpen] = useState(false);

    useEffect(() => {
        if (!open) {
            setCart(new Map());
            setCatId("all");
            setServiceTypeOpen(false);
        }
    }, [open]);

    const filtered = useMemo(() => {
        if (catId === "all") return menuItems.filter((m) => m.isAvailable);
        return menuItems.filter((m) => m.isAvailable && m.categoryId === catId);
    }, [menuItems, catId]);

    const add = (item: ApiMenuItem) => {
        setCart((prev) => {
            const next = new Map(prev);
            const cur = next.get(item.id);
            if (cur) next.set(item.id, { ...cur, quantity: cur.quantity + 1 });
            else next.set(item.id, { item, quantity: 1 });
            return next;
        });
    };

    const sub = (itemId: string) => {
        setCart((prev) => {
            const next = new Map(prev);
            const cur = next.get(itemId);
            if (!cur) return prev;
            if (cur.quantity <= 1) next.delete(itemId);
            else next.set(itemId, { ...cur, quantity: cur.quantity - 1 });
            return next;
        });
    };

    const totalQty = [...cart.values()].reduce((s, l) => s + l.quantity, 0);
    const totalPrice = [...cart.values()].reduce((s, l) => s + l.quantity * Number(l.item.price), 0);

    const openSubmitChoice = () => {
        if (totalQty === 0) {
            toast.error("Chọn ít nhất một món");
            return;
        }
        setServiceTypeOpen(true);
    };

    const submit = async (kind: OrderServiceKind) => {
        setServiceTypeOpen(false);
        if (totalQty === 0) return;
        try {
            const items = [...cart.values()].map((l) => ({
                menuItemId: l.item.id,
                quantity: l.quantity,
            }));
            await placeOrder.mutateAsync({
                kind,
                tableCode,
                items,
                notes: kind === "dine_in" ? "NV đặt món — tại chỗ" : undefined,
            });
            toast.success(
                kind === "dine_in"
                    ? "Đã gửi đơn tại chỗ — bếp nhận ticket"
                    : "Đã gửi đơn mang về — bếp nhận ticket",
            );
            setCart(new Map());
            onClose();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Gửi đơn thất bại");
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-black/75 backdrop-blur-sm"
                aria-label="Đóng"
                onClick={onClose}
            />
            <div
                className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-white/10 bg-[#141414] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <UtensilsCrossed size={18} className="text-gold" />
                        <div>
                            <p className="text-sm font-semibold text-cream">Đặt món cho khách</p>
                            <p className="text-[11px] text-cream/45">Bàn {tableCode}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="text-cream/40 hover:text-cream p-1">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex gap-1.5 overflow-x-auto border-b border-white/5 px-3 py-2">
                    <button
                        type="button"
                        onClick={() => setCatId("all")}
                        className={cn(
                            "shrink-0 rounded-full px-3 py-1 text-[10px] font-medium transition-colors",
                            catId === "all"
                                ? "bg-gold/20 text-gold border border-gold/40"
                                : "border border-white/10 text-cream/45",
                        )}
                    >
                        Tất cả
                    </button>
                    {categories
                        .filter((c) => c.isActive)
                        .map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => setCatId(c.id)}
                                className={cn(
                                    "shrink-0 rounded-full px-3 py-1 text-[10px] font-medium transition-colors",
                                    catId === c.id
                                        ? "bg-gold/20 text-gold border border-gold/40"
                                        : "border border-white/10 text-cream/45",
                                )}
                            >
                                {c.name}
                            </button>
                        ))}
                </div>

                <div className="min-h-[200px] flex-1 overflow-y-auto px-3 py-2">
                    {menuLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="animate-spin text-gold" size={28} />
                        </div>
                    ) : (
                        <div className="space-y-1.5">
                            {filtered.map((m) => {
                                const line = cart.get(m.id);
                                const qty = line?.quantity ?? 0;
                                return (
                                    <div
                                        key={m.id}
                                        className="flex items-center justify-between gap-2 rounded-lg border border-white/6 bg-white/[0.03] px-3 py-2.5"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm text-cream/90">{m.name}</p>
                                            <p className="text-[11px] text-gold/90">
                                                {new Intl.NumberFormat("vi-VN").format(Number(m.price))}đ
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => sub(m.id)}
                                                disabled={qty === 0}
                                                className="rounded border border-white/10 p-1 text-cream/50 hover:bg-white/5 disabled:opacity-30"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-6 text-center text-sm font-medium text-cream">{qty}</span>
                                            <button
                                                type="button"
                                                onClick={() => add(m)}
                                                className="rounded border border-gold/30 bg-gold/10 p-1 text-gold hover:bg-gold/20"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="border-t border-white/10 bg-black/30 px-4 py-3">
                    <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-cream/50">{totalQty} món</span>
                        <span className="font-semibold text-gold">
                            {new Intl.NumberFormat("vi-VN").format(totalPrice)}đ
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={openSubmitChoice}
                        disabled={placeOrder.isPending || totalQty === 0}
                        className="btn-gold w-full justify-center py-2.5 text-sm font-semibold disabled:opacity-60"
                    >
                        {placeOrder.isPending ? (
                            <>
                                <Loader2 size={16} className="mr-2 inline animate-spin" />
                                Đang gửi…
                            </>
                        ) : (
                            "Gửi đơn xuống bếp"
                        )}
                    </button>
                </div>
            </div>

            <OrderServiceTypeModal
                open={serviceTypeOpen}
                onClose={() => setServiceTypeOpen(false)}
                onChoose={(kind) => {
                    void submit(kind);
                }}
                lang="vi"
            />
        </div>
    );
}
