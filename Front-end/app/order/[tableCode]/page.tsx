"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useSocket } from "@/hooks/useSocket";
import { mockMenuItems, mockCategories } from "@/lib/mock/data";
import { CartItem, MenuItem } from "@/lib/types";
import { ShoppingCart, Bell, Minus, Plus, Trash2, Send, ChevronDown, Globe } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function OrderPage() {
    const params = useParams();
    const tableCode = (params.tableCode as string) || "A1";
    const { t, i18n } = useTranslation();
    const { data: liveData } = useSocket();
    const lang = i18n.language === "vi" ? "vi" : "en";

    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [selectedCat, setSelectedCat] = useState<string>("all");
    const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
    const [orderSent, setOrderSent] = useState(false);
    const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY">("DINE_IN");

    const categories = mockCategories.filter((c) => c.isActive);
    const filteredItems = selectedCat === "all"
        ? mockMenuItems.filter((m) => m.isAvailable)
        : mockMenuItems.filter((m) => m.categoryId === selectedCat && m.isAvailable);

    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
    const totalPrice = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

    const addToCart = useCallback((item: MenuItem) => {
        setCart((prev) => {
            const exists = prev.find((c) => c.menuItemId === item.id);
            if (exists) return prev.map((c) => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
            return [...prev, {
                menuItemId: item.id,
                menuItemName: item.name,
                menuItemNameVi: item.nameVi,
                quantity: 1,
                unitPrice: item.price,
                imageUrl: item.imageUrl,
            }];
        });
    }, []);

    const updateQty = (id: string, delta: number) => {
        setCart((prev) =>
            prev.map((c) => c.menuItemId === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)
                .filter((c) => c.quantity > 0)
        );
    };

    const callStaff = () => {
        toast.success("Đã gọi nhân viên! Chúng tôi sẽ đến ngay.", {
            description: `Bàn ${tableCode} · ${new Date().toLocaleTimeString("vi-VN")}`,
        });
    };

    const sendOrder = () => {
        if (cart.length === 0) return;
        // In real: emit socket order:new
        setOrderSent(true);
        setCart([]);
        setCartOpen(false);
        toast.success("Đơn hàng đã được gửi!", {
            description: "Quầy sẽ xác nhận trong giây lát.",
        });
        setTimeout(() => setOrderSent(false), 5000);
    };

    const formatPrice = (p: number) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);

    return (
        <div className="min-h-screen bg-charcoal text-cream">
            {/* Top bar */}
            <header className="sticky top-0 z-40 bg-charcoal/95 backdrop-blur-md border-b border-white/10">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div>
                        <p className="font-serif text-gold text-base font-semibold">The Albion</p>
                        <p className="text-cream/50 text-xs">Bàn <span className="text-gold font-bold">{tableCode}</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Language */}
                        <button onClick={() => i18n.changeLanguage(lang === "vi" ? "en" : "vi")}
                            className="text-cream/50 hover:text-gold transition-colors flex items-center gap-1 text-xs">
                            <Globe size={14} />
                            {lang === "vi" ? "EN" : "VI"}
                        </button>
                        {/* Call staff */}
                        <button onClick={callStaff}
                            className="flex items-center gap-1.5 border border-cream/20 text-cream/70 hover:border-gold hover:text-gold px-3 py-1.5 text-xs transition-colors">
                            <Bell size={13} />
                            Gọi nhân viên
                        </button>
                        {/* Cart */}
                        <button onClick={() => setCartOpen(true)}
                            className="relative bg-gold text-charcoal px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold">
                            <ShoppingCart size={14} />
                            {totalItems > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                                    {totalItems}
                                </span>
                            )}
                            Giỏ hàng
                        </button>
                    </div>
                </div>

                {/* Order type toggle */}
                <div className="max-w-2xl mx-auto px-4 pb-2 flex gap-2">
                    {(["DINE_IN", "TAKEAWAY"] as const).map((type) => (
                        <button key={type}
                            onClick={() => setOrderType(type)}
                            className={cn("text-xs px-3 py-1 border transition-colors",
                                orderType === type ? "border-gold bg-gold/20 text-gold" : "border-white/10 text-cream/40 hover:text-cream")}>
                            {type === "DINE_IN" ? "🍽 Ăn tại quán" : "🥡 Mang về"}
                        </button>
                    ))}
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-4">
                {/* Live status */}
                <div className="flex items-center gap-2 mb-4 py-2 px-3 bg-white/5 border border-white/10 rounded text-xs">
                    <span className={cn("w-2 h-2 rounded-full animate-pulse",
                        liveData.status === "open" ? "bg-emerald-400" : "bg-amber-400")} />
                    <span className="text-cream/60">
                        {liveData.status === "open" ? "Nhận đơn · " : "Bếp đang bận · "}
                        {liveData.tablesAvailable} bàn trống
                    </span>
                </div>

                {/* Category filter */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                    <button onClick={() => setSelectedCat("all")}
                        className={cn("shrink-0 px-4 py-1.5 text-xs border transition-colors",
                            selectedCat === "all" ? "border-gold bg-gold/20 text-gold" : "border-white/10 text-cream/50 hover:text-cream")}>
                        {lang === "vi" ? "Tất cả" : "All"}
                    </button>
                    {categories.map((cat) => (
                        <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
                            className={cn("shrink-0 px-4 py-1.5 text-xs border transition-colors",
                                selectedCat === cat.id ? "border-gold bg-gold/20 text-gold" : "border-white/10 text-cream/50 hover:text-cream")}>
                            {lang === "vi" ? cat.nameVi : cat.name}
                        </button>
                    ))}
                </div>

                {/* Menu grid */}
                <div className="grid grid-cols-2 gap-3">
                    {filteredItems.map((item) => {
                        const inCart = cart.find((c) => c.menuItemId === item.id);
                        return (
                            <div key={item.id} className="bg-white/5 border border-white/10 overflow-hidden">
                                <div className="relative h-36 img-zoom">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={item.imageUrl || "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=60"}
                                        alt={item.name} className="w-full h-full object-cover" />
                                    {item.tags?.includes("signature") && (
                                        <span className="absolute top-2 left-2 bg-gold text-charcoal text-[9px] px-1.5 py-0.5 font-bold uppercase">Signature</span>
                                    )}
                                </div>
                                <div className="p-3">
                                    <p className="text-cream text-sm font-medium leading-snug">
                                        {lang === "vi" ? item.nameVi : item.name}
                                    </p>
                                    {item.description && (
                                        <p className="text-cream/40 text-xs mt-0.5 line-clamp-2">
                                            {lang === "vi" ? (item.descriptionVi || item.description) : item.description}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-gold text-sm font-semibold">{formatPrice(item.price)}</p>
                                        {inCart ? (
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => updateQty(item.id, -1)}
                                                    className="w-6 h-6 bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                                                    <Minus size={11} />
                                                </button>
                                                <span className="text-cream text-sm w-5 text-center">{inCart.quantity}</span>
                                                <button onClick={() => updateQty(item.id, 1)}
                                                    className="w-6 h-6 bg-gold/20 hover:bg-gold/40 text-gold flex items-center justify-center transition-colors">
                                                    <Plus size={11} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => addToCart(item)}
                                                className="text-gold border border-gold/40 hover:bg-gold hover:text-charcoal text-xs px-2 py-1 transition-colors">
                                                <Plus size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Order Sent Banner */}
            {orderSent && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 shadow-2xl">
                    ✓ Đơn đã gửi thành công!
                </div>
            )}

            {/* Cart Drawer */}
            {cartOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setCartOpen(false)} />
                    <div className="relative w-full max-w-sm bg-charcoal-light border-l border-white/10 h-full overflow-y-auto flex flex-col">
                        <div className="sticky top-0 bg-charcoal-light border-b border-white/10 px-5 py-4 flex items-center justify-between">
                            <h2 className="font-serif text-cream text-lg">Giỏ hàng</h2>
                            <button onClick={() => setCartOpen(false)} className="text-cream/50 hover:text-cream">
                                <ChevronDown size={20} />
                            </button>
                        </div>
                        <div className="flex-1 px-5 py-4 space-y-3">
                            {cart.length === 0 ? (
                                <p className="text-cream/40 text-sm text-center py-10">Chưa có món nào</p>
                            ) : cart.map((item) => (
                                <div key={item.menuItemId} className="glass-card p-3">
                                    <div className="flex items-start gap-3">
                                        {item.imageUrl && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={item.imageUrl} alt="" className="w-12 h-12 object-cover rounded" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-cream text-sm">{lang === "vi" ? item.menuItemNameVi : item.menuItemName}</p>
                                            <p className="text-gold text-xs">{formatPrice(item.unitPrice)}</p>
                                            <input
                                                placeholder="Ghi chú..."
                                                value={itemNotes[item.menuItemId] || ""}
                                                onChange={(e) => setItemNotes((p) => ({ ...p, [item.menuItemId]: e.target.value }))}
                                                className="mt-1 w-full text-xs bg-transparent border-b border-white/10 text-cream/60 placeholder-cream/20 focus:outline-none focus:border-gold/40 py-0.5"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={() => updateQty(item.menuItemId, -1)} className="w-5 h-5 bg-white/10 flex items-center justify-center">
                                                <Minus size={10} />
                                            </button>
                                            <span className="text-cream text-sm w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQty(item.menuItemId, 1)} className="w-5 h-5 bg-gold/20 text-gold flex items-center justify-center">
                                                <Plus size={10} />
                                            </button>
                                            <button onClick={() => setCart((p) => p.filter((c) => c.menuItemId !== item.menuItemId))}
                                                className="ml-1 text-red-400/60 hover:text-red-400">
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {cart.length > 0 && (
                            <div className="sticky bottom-0 bg-charcoal-light border-t border-white/10 px-5 py-4">
                                <div className="flex justify-between mb-3">
                                    <span className="text-cream/60 text-sm">Tổng cộng</span>
                                    <span className="text-gold font-semibold">{formatPrice(totalPrice)}</span>
                                </div>
                                <button onClick={sendOrder}
                                    className="w-full bg-gold text-charcoal font-semibold py-3 flex items-center justify-center gap-2 hover:bg-gold-light transition-colors text-sm tracking-widest uppercase">
                                    <Send size={15} />
                                    Gửi đơn
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
