"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { mockMenuItems, mockCategories } from "@/lib/mock/data";
import { CartItem, MenuItem } from "@/lib/types";
import { ShoppingCart, Minus, Plus, Trash2, Send, Clock, Phone, User, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const schema = z.object({
    customerName: z.string().min(2, "Nhập tên"),
    customerPhone: z.string().regex(/^0\d{9}$/, "SĐT không hợp lệ"),
    pickupTime: z.string().min(1, "Chọn giờ nhận"),
    note: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const PICKUP_TIMES = ["30 phút", "45 phút", "1 giờ", "1.5 giờ", "2 giờ"];

export default function MangVePage() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedCat, setSelectedCat] = useState("all");
    const [submitted, setSubmitted] = useState(false);
    const [orderRef, setOrderRef] = useState("");

    const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });
    const selectedPickup = watch("pickupTime");

    const categories = mockCategories.filter((c) => c.isActive);
    const filteredItems = selectedCat === "all"
        ? mockMenuItems.filter((m) => m.isAvailable)
        : mockMenuItems.filter((m) => m.categoryId === selectedCat && m.isAvailable);

    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
    const totalPrice = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const formatPrice = (p: number) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);

    const addToCart = (item: MenuItem) => {
        setCart((prev) => {
            const exists = prev.find((c) => c.menuItemId === item.id);
            if (exists) return prev.map((c) => c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c);
            return [...prev, { menuItemId: item.id, menuItemName: item.name, menuItemNameVi: item.nameVi, quantity: 1, unitPrice: item.price, imageUrl: item.imageUrl }];
        });
    };
    const updateQty = (id: string, delta: number) =>
        setCart((prev) => prev.map((c) => c.menuItemId === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter((c) => c.quantity > 0));

    const onSubmit = async (data: FormData) => {
        if (cart.length === 0) { toast.error("Chưa có món nào trong giỏ"); return; }
        await new Promise((r) => setTimeout(r, 800));
        const ref = `TWY-${Date.now().toString().slice(-6)}`;
        setOrderRef(ref);
        setSubmitted(true);
        toast.success("Đặt món mang về thành công!");
        console.log("Takeaway order:", { ...data, cart });
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-emerald-400 text-3xl">✓</span>
                    </div>
                    <p className="text-gold text-xs tracking-widest uppercase mb-2">Đơn mang về</p>
                    <h1 className="font-serif text-cream text-3xl mb-4">Đặt thành công!</h1>
                    <div className="border border-gold/30 bg-gold/10 px-6 py-4 mb-6">
                        <p className="font-mono text-gold text-2xl tracking-widest">{orderRef}</p>
                    </div>
                    <p className="text-cream/50 text-sm mb-8">Vui lòng đến nhận đúng giờ đã chọn. Liên hệ: <span className="text-gold">0901 379 129</span></p>
                    <Link href="/mang-ve" onClick={() => { setSubmitted(false); setCart([]); }}
                        className="btn-gold text-xs tracking-widest">Đặt thêm</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-charcoal text-cream">
            {/* Header */}
            <div className="relative h-40 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&q=70" alt="" className="w-full h-full object-cover opacity-40" />
                <div className="absolute inset-0 bg-gradient-to-b from-charcoal/50 to-charcoal" />
                <div className="absolute bottom-4 left-4">
                    <Link href="/" className="text-cream/50 hover:text-cream flex items-center gap-1 text-sm mb-1">
                        <ChevronLeft size={14} /> Về trang chủ
                    </Link>
                    <h1 className="font-serif text-cream text-2xl">🥡 Đặt Món Mang Về</h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Category filter */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
                    <button onClick={() => setSelectedCat("all")}
                        className={cn("shrink-0 px-3 py-1.5 text-xs border transition-colors",
                            selectedCat === "all" ? "border-gold bg-gold/20 text-gold" : "border-white/10 text-cream/50")}>
                        Tất cả
                    </button>
                    {categories.map((cat) => (
                        <button key={cat.id} onClick={() => setSelectedCat(cat.id)}
                            className={cn("shrink-0 px-3 py-1.5 text-xs border transition-colors",
                                selectedCat === cat.id ? "border-gold bg-gold/20 text-gold" : "border-white/10 text-cream/50")}>
                            {cat.nameVi}
                        </button>
                    ))}
                </div>

                {/* Menu */}
                <div className="space-y-2 mb-6">
                    {filteredItems.map((item) => {
                        const inCart = cart.find((c) => c.menuItemId === item.id);
                        return (
                            <div key={item.id} className="flex items-center gap-3 bg-white/5 border border-white/10 p-3">
                                {item.imageUrl && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.imageUrl} alt="" className="w-14 h-14 object-cover rounded shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-cream text-sm">{item.nameVi}</p>
                                    <p className="text-gold text-xs">{formatPrice(item.price)}</p>
                                    {item.preparationTime && (
                                        <p className="text-cream/30 text-[10px] flex items-center gap-1">
                                            <Clock size={9} /> {item.preparationTime} phút
                                        </p>
                                    )}
                                </div>
                                {inCart ? (
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 bg-white/10 flex items-center justify-center"><Minus size={11} /></button>
                                        <span className="text-cream w-5 text-center text-sm">{inCart.quantity}</span>
                                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 bg-gold/20 text-gold flex items-center justify-center"><Plus size={11} /></button>
                                    </div>
                                ) : (
                                    <button onClick={() => addToCart(item)}
                                        className="border border-gold/40 text-gold hover:bg-gold hover:text-charcoal p-1.5 transition-colors shrink-0">
                                        <Plus size={14} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Cart summary */}
                {cart.length > 0 && (
                    <div className="glass-card p-4 mb-6">
                        <p className="text-cream/60 text-xs tracking-widest uppercase mb-3">Giỏ hàng ({totalItems} món)</p>
                        <div className="space-y-2 mb-3">
                            {cart.map((item) => (
                                <div key={item.menuItemId} className="flex items-center justify-between text-sm">
                                    <span className="text-cream">{item.menuItemNameVi} ×{item.quantity}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gold">{formatPrice(item.quantity * item.unitPrice)}</span>
                                        <button onClick={() => setCart((p) => p.filter((c) => c.menuItemId !== item.menuItemId))} className="text-red-400/50 hover:text-red-400"><Trash2 size={12} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-white/10 pt-2 flex justify-between">
                            <span className="text-cream/60 text-sm">Tổng</span>
                            <span className="text-gold font-semibold">{formatPrice(totalPrice)}</span>
                        </div>
                    </div>
                )}

                {/* Checkout form */}
                <form onSubmit={handleSubmit(onSubmit)} className="glass-card p-6 space-y-4">
                    <h2 className="font-serif text-cream text-xl">Thông tin nhận hàng</h2>
                    <div>
                        <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1">Tên *</label>
                        <div className="relative">
                            <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30" />
                            <input {...register("customerName")} placeholder="Nguyễn Văn A"
                                className="w-full bg-white/5 border border-white/10 text-cream placeholder-cream/20 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-gold/50" />
                        </div>
                        {errors.customerName && <p className="text-red-400 text-xs mt-1">{errors.customerName.message}</p>}
                    </div>
                    <div>
                        <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1">SĐT *</label>
                        <div className="relative">
                            <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30" />
                            <input {...register("customerPhone")} placeholder="0901 234 567"
                                className="w-full bg-white/5 border border-white/10 text-cream placeholder-cream/20 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-gold/50" />
                        </div>
                        {errors.customerPhone && <p className="text-red-400 text-xs mt-1">{errors.customerPhone.message}</p>}
                    </div>
                    <div>
                        <label className="block text-cream/50 text-xs uppercase tracking-widest mb-2">Thời gian lấy hàng *</label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {PICKUP_TIMES.map((t) => (
                                <button key={t} type="button" onClick={() => setValue("pickupTime", t)}
                                    className={cn("py-2 text-xs border transition-colors",
                                        selectedPickup === t ? "border-gold bg-gold/20 text-gold" : "border-white/10 text-cream/50 hover:text-cream")}>
                                    <Clock size={10} className="inline mr-1" />{t}
                                </button>
                            ))}
                        </div>
                        {errors.pickupTime && <p className="text-red-400 text-xs mt-1">{errors.pickupTime.message}</p>}
                    </div>
                    <div>
                        <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1">Ghi chú</label>
                        <textarea {...register("note")} rows={2} placeholder="Yêu cầu đặc biệt..."
                            className="w-full bg-white/5 border border-white/10 text-cream placeholder-cream/20 px-3 py-2.5 text-sm focus:outline-none focus:border-gold/50 resize-none" />
                    </div>
                    <button type="submit" disabled={isSubmitting || cart.length === 0}
                        className="w-full bg-gold text-charcoal py-3.5 font-semibold tracking-widest uppercase text-sm flex items-center justify-center gap-2 hover:bg-gold-light transition-colors disabled:opacity-50">
                        <Send size={15} /> {isSubmitting ? "Đang gửi..." : `Đặt ${cart.length > 0 ? formatPrice(totalPrice) : ""}`}
                    </button>
                </form>
            </div>
        </div>
    );
}
