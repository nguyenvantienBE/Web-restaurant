"use client";

import { useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useCategories, useMenuItems, type ApiMenuItem } from "@/lib/hooks/useMenu";
import {
    usePublicTableSnapshot,
    type ApiPublicOrder,
} from "@/lib/hooks/usePublicTableSnapshot";
import { CartItem } from "@/lib/types";
import { OrderServiceTypeModal, type OrderServiceKind } from "@/components/order/OrderServiceTypeModal";
import { api, parseResponse } from "@/lib/api";
import { downloadPublicOrderInvoicePdf } from "@/lib/invoice-download";
import { ShoppingCart, Bell, Minus, Plus, Trash2, Send, ChevronDown, Globe, Loader2, CreditCard, FileText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PLACEHOLDER_IMG =
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=60";

const ITEM_STATUS_VI: Record<string, string> = {
    NEW: "Chờ bếp",
    COOKING: "Đang làm",
    READY: "Sẵn sàng",
    SERVED: "Đã lên bàn",
    CANCELLED: "Đã hủy",
};

const ORDER_STATUS_VI: Record<string, string> = {
    NEW: "Mới",
    CONFIRMED: "Đã nhận",
    IN_PROGRESS: "Đang phục vụ",
    READY: "Sẵn sàng",
    SERVED: "Chờ thanh toán",
    COMPLETED: "Đã thanh toán",
    CANCELLED: "Đã hủy",
};

function itemStatusLabel(s: string) {
    return ITEM_STATUS_VI[s] ?? s;
}

type CustomerInvoiceMode = "none" | "email_plain" | "email_pdf" | "direct";

const DEFAULT_INV = { mode: "none" as CustomerInvoiceMode, email: "", customerName: "" };

export default function OrderPage() {
    const params = useParams();
    const tableCode = (params.tableCode as string) || "";
    const { i18n } = useTranslation();
    const qc = useQueryClient();
    const lang = i18n.language === "vi" ? "vi" : "en";

    const { data: categories = [], isLoading: catLoading } = useCategories();
    const { data: menuItems = [], isLoading: menuLoading } = useMenuItems();
    const { data: snapshot, isLoading: snapLoading, error: snapError, refetch } = usePublicTableSnapshot(tableCode);

    const [cart, setCart] = useState<CartItem[]>([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [selectedCat, setSelectedCat] = useState<string>("all");
    const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);
    const [serviceTypeModalOpen, setServiceTypeModalOpen] = useState(false);
    const [payingId, setPayingId] = useState<string | null>(null);
    const [payMethod, setPayMethod] = useState("cash");
    const [invPrefByOrder, setInvPrefByOrder] = useState<
        Record<string, { mode: CustomerInvoiceMode; email: string; customerName: string }>
    >({});

    const getInvPref = (orderId: string) => invPrefByOrder[orderId] ?? DEFAULT_INV;
    const setInvPref = (orderId: string, patch: Partial<typeof DEFAULT_INV>) => {
        setInvPrefByOrder((prev) => ({
            ...prev,
            [orderId]: { ...(prev[orderId] ?? DEFAULT_INV), ...patch },
        }));
    };

    /** Gộp các bản ghi Category trùng tên (khác id trong DB) thành một tab; lọc món theo mọi id trong nhóm. */
    const categoryTabs = useMemo(() => {
        type Tab = { representativeId: string; label: string; categoryIds: string[]; sortOrder: number };
        const active = categories.filter((c) => c.isActive);
        const uniqueById = active.filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i);
        const groups = new Map<string, Tab>();
        for (const c of uniqueById) {
            const label = (lang === "vi" ? (c.nameVi?.trim() || c.name) : c.name).trim();
            const key = label.toLowerCase();
            const existing = groups.get(key);
            if (existing) {
                existing.categoryIds.push(c.id);
                existing.sortOrder = Math.min(existing.sortOrder, c.sortOrder);
            } else {
                groups.set(key, {
                    representativeId: c.id,
                    label,
                    categoryIds: [c.id],
                    sortOrder: c.sortOrder,
                });
            }
        }
        return Array.from(groups.values()).sort(
            (a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, lang === "vi" ? "vi" : "en"),
        );
    }, [categories, lang]);

    const filteredItems = useMemo(() => {
        const available = menuItems.filter((m) => m.isAvailable);
        if (selectedCat === "all") return available;
        const tab =
            categoryTabs.find((t) => t.representativeId === selectedCat) ??
            categoryTabs.find((t) => t.categoryIds.includes(selectedCat));
        const ids = tab ? new Set(tab.categoryIds) : new Set([selectedCat]);
        return available.filter((m) => ids.has(m.categoryId));
    }, [menuItems, selectedCat, categoryTabs]);

    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
    const totalPrice = cart.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

    const addToCart = useCallback((item: ApiMenuItem) => {
        const unit = Number(item.price);
        setCart((prev) => {
            const exists = prev.find((c) => c.menuItemId === item.id);
            if (exists) return prev.map((c) => (c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c));
            return [
                ...prev,
                {
                    menuItemId: item.id,
                    menuItemName: item.name,
                    menuItemNameVi: item.nameVi || item.name,
                    quantity: 1,
                    unitPrice: unit,
                    imageUrl: item.imageUrl ?? undefined,
                },
            ];
        });
    }, []);

    const updateQty = (id: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((c) => (c.menuItemId === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c))
                .filter((c) => c.quantity > 0),
        );
    };

    const callStaff = async () => {
        try {
            const res = await api.publicPost(`/public/tables/${encodeURIComponent(tableCode)}/staff-call`, {});
            await parseResponse(res);
            toast.success("Đã gửi yêu cầu — nhân viên sẽ tới bàn.");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Không gửi được");
        }
    };

    const openServiceTypeChoice = () => {
        if (cart.length === 0) return;
        setServiceTypeModalOpen(true);
    };

    const sendOrder = async (kind: OrderServiceKind) => {
        setServiceTypeModalOpen(false);
        if (cart.length === 0) return;
        setSubmitting(true);
        try {
            const items = cart.map((c) => ({
                menuItemId: c.menuItemId,
                quantity: c.quantity,
                notes: itemNotes[c.menuItemId]?.trim() || undefined,
            }));
            if (kind === "dine_in") {
                const res = await api.publicPost(`/public/tables/${encodeURIComponent(tableCode)}/orders`, {
                    items,
                    notes: "Đặt qua QR — tại chỗ",
                });
                await parseResponse(res);
                toast.success("Đã gửi đơn — bếp sẽ chuẩn bị món.");
            } else {
                const res = await api.publicPost(`/public/takeaway/orders`, {
                    items,
                    notes: `Đặt qua QR — mang về — bàn ${tableCode}`,
                });
                await parseResponse(res);
                toast.success("Đã gửi đơn mang về — nhận món tại quầy khi bếp xong.");
            }
            setCart([]);
            setItemNotes({});
            setCartOpen(false);
            await qc.invalidateQueries({ queryKey: ["public-table", tableCode] });
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Gửi đơn thất bại");
        } finally {
            setSubmitting(false);
        }
    };

    const buildConfirmInvoiceBody = (orderId: string): Record<string, unknown> => {
        const p = getInvPref(orderId);
        if (p.mode === "email_plain" || p.mode === "email_pdf") {
            return {
                invoiceMode: p.mode,
                customerEmail: p.email.trim(),
                ...(p.customerName.trim() ? { customerName: p.customerName.trim() } : {}),
            };
        }
        return { invoiceMode: "none" };
    };

    const runPaymentCreateAndConfirm = async (order: ApiPublicOrder, confirmBody: Record<string, unknown>) => {
        if (order.payment?.status === "PAID") {
            toast.info("Đơn đã thanh toán.");
            return;
        }
        let paymentId: string;
        if (order.payment?.status === "PENDING" && order.payment.id) {
            paymentId = order.payment.id;
        } else {
            const createRes = await api.publicPost(
                `/public/tables/${encodeURIComponent(tableCode)}/orders/${order.id}/payment`,
                { amount: Number(order.total), paymentMethod: payMethod },
            );
            const created = await parseResponse<{ id: string }>(createRes);
            paymentId = created.id;
        }
        const confirmRes = await api.publicPatch(
            `/public/tables/${encodeURIComponent(tableCode)}/payments/${paymentId}/confirm`,
            confirmBody,
        );
        await parseResponse(confirmRes);
        const im = confirmBody.invoiceMode;
        const emailInvoice = im === "email_plain" || im === "email_pdf";
        toast.success(
            emailInvoice
                ? "Đã thanh toán — hóa đơn sẽ gửi email (nếu đã cấu hình SMTP)."
                : "Cảm ơn bạn — đã thanh toán.",
        );
        await qc.invalidateQueries({ queryKey: ["public-table", tableCode] });
    };

    const payOrder = async (order: ApiPublicOrder) => {
        if (order.status !== "SERVED") {
            toast.error("Chỉ thanh toán khi món đã lên bàn đủ.");
            return;
        }
        const p = getInvPref(order.id);
        if (p.mode === "direct") {
            toast.error('Chọn «Tải PDF & thanh toán» cho hóa đơn trực tiếp.');
            return;
        }
        if ((p.mode === "email_plain" || p.mode === "email_pdf") && !p.email.trim()) {
            toast.error("Nhập email để nhận hóa đơn điện tử.");
            return;
        }
        if (
            (p.mode === "email_plain" || p.mode === "email_pdf") &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())
        ) {
            toast.error("Email không hợp lệ.");
            return;
        }
        setPayingId(order.id);
        try {
            await runPaymentCreateAndConfirm(order, buildConfirmInvoiceBody(order.id));
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Thanh toán thất bại");
        } finally {
            setPayingId(null);
        }
    };

    const payDirectPdfThenConfirm = async (order: ApiPublicOrder) => {
        if (order.status !== "SERVED") return;
        setPayingId(order.id);
        try {
            await downloadPublicOrderInvoicePdf(tableCode, order.id);
            await runPaymentCreateAndConfirm(order, { invoiceMode: "none" });
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Không thể tải hoặc thanh toán");
        } finally {
            setPayingId(null);
        }
    };

    const formatPrice = (p: number) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);

    if (!tableCode) {
        return <div className="min-h-screen bg-charcoal text-cream p-6">Thiếu mã bàn</div>;
    }

    if (snapError) {
        return (
            <div className="min-h-screen bg-charcoal text-cream flex items-center justify-center p-6">
                <p className="text-center text-red-400">
                    {(snapError as Error).message || "Không tìm thấy bàn hoặc lỗi mạng."}
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-charcoal text-cream">
            <header className="sticky top-0 z-40 bg-charcoal/95 backdrop-blur-md border-b border-white/10">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div>
                        <p className="font-serif text-gold text-base font-semibold">The Albion</p>
                        <p className="text-cream/50 text-xs">
                            Bàn{" "}
                            <span className="text-gold font-bold">
                                {snapshot?.table.tableCode ?? tableCode}
                            </span>
                            {snapshot?.table.tableName ? ` · ${snapshot.table.tableName}` : ""}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => i18n.changeLanguage(lang === "vi" ? "en" : "vi")}
                            className="text-cream/50 hover:text-gold transition-colors flex items-center gap-1 text-xs"
                        >
                            <Globe size={14} />
                            {lang === "vi" ? "EN" : "VI"}
                        </button>
                        <button
                            type="button"
                            onClick={callStaff}
                            className="flex items-center gap-1.5 border border-cream/20 text-cream/70 hover:border-gold hover:text-gold px-3 py-1.5 text-xs transition-colors"
                        >
                            <Bell size={13} />
                            Gọi nhân viên
                        </button>
                        <button
                            type="button"
                            onClick={() => setCartOpen(true)}
                            className="relative bg-gold text-charcoal px-3 py-1.5 flex items-center gap-1.5 text-xs font-semibold"
                        >
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
            </header>

            <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
                <div className="flex items-center justify-between text-xs text-cream/50">
                    <button type="button" onClick={() => refetch()} className="underline hover:text-gold">
                        {snapLoading ? "Đang cập nhật…" : "Cập nhật trạng thái"}
                    </button>
                </div>

                {/* Đơn đang có */}
                {snapshot?.session && snapshot.session.orders.length > 0 && (
                    <div className="space-y-3">
                        <h2 className="text-sm font-semibold text-gold tracking-wide uppercase">Đơn của bạn</h2>
                        {snapshot.session.orders.map((order) => (
                            <div
                                key={order.id}
                                className="border border-white/10 bg-white/5 p-3 rounded-lg space-y-2"
                            >
                                <div className="flex justify-between items-start gap-2">
                                    <span className="font-mono text-xs text-cream/60">#{order.orderNumber}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10">
                                        {ORDER_STATUS_VI[order.status] ?? order.status}
                                    </span>
                                </div>
                                <ul className="text-xs space-y-1">
                                    {order.orderItems.map((it) => (
                                        <li key={it.id} className="flex justify-between gap-2">
                                            <span>
                                                {lang === "vi" ? it.menuItem?.name ?? "—" : it.menuItem?.name ?? "—"} ×{" "}
                                                {it.quantity}
                                            </span>
                                            <span className="text-cream/50 shrink-0">{itemStatusLabel(it.status)}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex justify-between text-sm pt-1 border-t border-white/10">
                                    <span className="text-cream/60">Tổng</span>
                                    <span className="text-gold font-semibold">
                                        {formatPrice(Number(order.total))}
                                    </span>
                                </div>
                                {order.status === "SERVED" && (
                                    <div className="pt-2 space-y-2">
                                        <p className="text-[11px] text-cream/50">
                                            Nhân viên có thể xác nhận món đã lên tại quầy. Thanh toán tại đây hoặc quầy.
                                        </p>
                                        {order.payment?.status !== "PAID" && (
                                            <>
                                                <p className="text-[10px] font-medium uppercase tracking-wide text-cream/45">
                                                    Hóa đơn
                                                </p>
                                                <div className="grid gap-1.5 text-[11px] text-cream/85">
                                                    {(
                                                        [
                                                            ["none", "Không gửi hóa đơn"],
                                                            ["email_plain", "Hóa đơn điện tử — nội dung chi tiết (email)"],
                                                            ["email_pdf", "Hóa đơn điện tử — kèm PDF (email)"],
                                                            ["direct", "Hóa đơn trực tiếp — tải PDF về máy"],
                                                        ] as const
                                                    ).map(([val, label]) => (
                                                        <label key={val} className="flex cursor-pointer items-start gap-2">
                                                            <input
                                                                type="radio"
                                                                name={`inv-cust-${order.id}`}
                                                                checked={getInvPref(order.id).mode === val}
                                                                onChange={() => setInvPref(order.id, { mode: val })}
                                                                className="mt-0.5"
                                                            />
                                                            <span>{label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                {(getInvPref(order.id).mode === "email_plain" ||
                                                    getInvPref(order.id).mode === "email_pdf") && (
                                                    <div className="grid gap-2 sm:grid-cols-2">
                                                        <input
                                                            type="email"
                                                            placeholder="Email *"
                                                            value={getInvPref(order.id).email}
                                                            onChange={(e) => setInvPref(order.id, { email: e.target.value })}
                                                            className="min-h-[38px] rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-cream"
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Tên (tuỳ chọn)"
                                                            value={getInvPref(order.id).customerName}
                                                            onChange={(e) =>
                                                                setInvPref(order.id, { customerName: e.target.value })
                                                            }
                                                            className="min-h-[38px] rounded border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-cream"
                                                        />
                                                    </div>
                                                )}
                                                <p className="text-[10px] text-cream/40">Phương thức thanh toán</p>
                                                <select
                                                    value={payMethod}
                                                    onChange={(e) => setPayMethod(e.target.value)}
                                                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-2 text-xs text-cream"
                                                >
                                                    <option value="cash">Tiền mặt</option>
                                                    <option value="card">Thẻ</option>
                                                    <option value="transfer">Chuyển khoản</option>
                                                </select>
                                                {getInvPref(order.id).mode === "direct" ? (
                                                    <button
                                                        type="button"
                                                        disabled={payingId === order.id}
                                                        onClick={() => payDirectPdfThenConfirm(order)}
                                                        className="w-full flex items-center justify-center gap-2 bg-gold text-charcoal py-2.5 text-xs font-semibold uppercase tracking-wide disabled:opacity-50"
                                                    >
                                                        {payingId === order.id ? (
                                                            <Loader2 className="animate-spin" size={14} />
                                                        ) : (
                                                            <FileText size={14} />
                                                        )}
                                                        Tải PDF &amp; thanh toán
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        disabled={payingId === order.id}
                                                        onClick={() => payOrder(order)}
                                                        className="w-full flex items-center justify-center gap-2 bg-gold text-charcoal py-2.5 text-xs font-semibold uppercase tracking-wide disabled:opacity-50"
                                                    >
                                                        {payingId === order.id ? (
                                                            <Loader2 className="animate-spin" size={14} />
                                                        ) : (
                                                            <CreditCard size={14} />
                                                        )}
                                                        Thanh toán
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        {order.payment?.status === "PAID" && (
                                            <p className="text-emerald-400 text-xs font-medium text-center">
                                                Đã thanh toán — cảm ơn bạn!
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Categories */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        type="button"
                        onClick={() => setSelectedCat("all")}
                        className={cn(
                            "shrink-0 px-4 py-1.5 text-xs border transition-colors",
                            selectedCat === "all"
                                ? "border-gold bg-gold/20 text-gold"
                                : "border-white/10 text-cream/50 hover:text-cream",
                        )}
                    >
                        {lang === "vi" ? "Tất cả" : "All"}
                    </button>
                    {catLoading ? (
                        <Loader2 className="animate-spin text-gold" size={18} />
                    ) : (
                        categoryTabs.map((tab) => {
                            const selected =
                                selectedCat === tab.representativeId ||
                                tab.categoryIds.includes(selectedCat);
                            return (
                                <button
                                    type="button"
                                    key={tab.representativeId}
                                    onClick={() => setSelectedCat(tab.representativeId)}
                                    className={cn(
                                        "shrink-0 px-4 py-1.5 text-xs border transition-colors",
                                        selected
                                            ? "border-gold bg-gold/20 text-gold"
                                            : "border-white/10 text-cream/50 hover:text-cream",
                                    )}
                                >
                                    {tab.label}
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Menu grid */}
                {menuLoading ? (
                    <div className="flex justify-center py-16">
                        <Loader2 className="animate-spin text-gold" size={28} />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {filteredItems.map((item) => {
                            const inCart = cart.find((c) => c.menuItemId === item.id);
                            const price = Number(item.price);
                            return (
                                <div key={item.id} className="bg-white/5 border border-white/10 overflow-hidden">
                                    <div className="relative h-36 img-zoom">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={item.imageUrl || PLACEHOLDER_IMG}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
                                            }}
                                        />
                                        {item.tags?.includes("signature") && (
                                            <span className="absolute top-2 left-2 bg-gold text-charcoal text-[9px] px-1.5 py-0.5 font-bold uppercase">
                                                Signature
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <p className="text-cream text-sm font-medium leading-snug">
                                            {lang === "vi" ? item.nameVi ?? item.name : item.name}
                                        </p>
                                        {item.description && (
                                            <p className="text-cream/40 text-xs mt-0.5 line-clamp-2">
                                                {lang === "vi" ? item.descriptionVi || item.description : item.description}
                                            </p>
                                        )}
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-gold text-sm font-semibold">{formatPrice(price)}</p>
                                            {inCart ? (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQty(item.id, -1)}
                                                        className="w-6 h-6 bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                                    >
                                                        <Minus size={11} />
                                                    </button>
                                                    <span className="text-cream text-sm w-5 text-center">{inCart.quantity}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateQty(item.id, 1)}
                                                        className="w-6 h-6 bg-gold/20 hover:bg-gold/40 text-gold flex items-center justify-center transition-colors"
                                                    >
                                                        <Plus size={11} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => addToCart(item)}
                                                    className="text-gold border border-gold/40 hover:bg-gold hover:text-charcoal text-xs px-2 py-1 transition-colors"
                                                >
                                                    <Plus size={13} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Cart Drawer */}
            {cartOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setCartOpen(false)} aria-hidden />
                    <div className="relative w-full max-w-sm bg-charcoal-light border-l border-white/10 h-full overflow-y-auto flex flex-col">
                        <div className="sticky top-0 bg-charcoal-light border-b border-white/10 px-5 py-4 flex items-center justify-between">
                            <h2 className="font-serif text-cream text-lg">Giỏ hàng</h2>
                            <button type="button" onClick={() => setCartOpen(false)} className="text-cream/50 hover:text-cream">
                                <ChevronDown size={20} />
                            </button>
                        </div>
                        <div className="flex-1 px-5 py-4 space-y-3">
                            {cart.length === 0 ? (
                                <p className="text-cream/40 text-sm text-center py-10">Chưa có món nào</p>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.menuItemId} className="glass-card p-3">
                                        <div className="flex items-start gap-3">
                                            {item.imageUrl && (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={item.imageUrl}
                                                    alt=""
                                                    className="w-12 h-12 object-cover rounded"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
                                                    }}
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-cream text-sm">
                                                    {lang === "vi" ? item.menuItemNameVi : item.menuItemName}
                                                </p>
                                                <p className="text-gold text-xs">{formatPrice(item.unitPrice)}</p>
                                                <input
                                                    placeholder="Ghi chú..."
                                                    value={itemNotes[item.menuItemId] || ""}
                                                    onChange={(e) =>
                                                        setItemNotes((p) => ({ ...p, [item.menuItemId]: e.target.value }))
                                                    }
                                                    className="mt-1 w-full text-xs bg-transparent border-b border-white/10 text-cream/60 placeholder-cream/20 focus:outline-none focus:border-gold/40 py-0.5"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => updateQty(item.menuItemId, -1)}
                                                    className="w-5 h-5 bg-white/10 flex items-center justify-center"
                                                >
                                                    <Minus size={10} />
                                                </button>
                                                <span className="text-cream text-sm w-4 text-center">{item.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => updateQty(item.menuItemId, 1)}
                                                    className="w-5 h-5 bg-gold/20 text-gold flex items-center justify-center"
                                                >
                                                    <Plus size={10} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setCart((p) => p.filter((c) => c.menuItemId !== item.menuItemId))}
                                                    className="ml-1 text-red-400/60 hover:text-red-400"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {cart.length > 0 && (
                            <div className="sticky bottom-0 bg-charcoal-light border-t border-white/10 px-5 py-4">
                                <div className="flex justify-between mb-3">
                                    <span className="text-cream/60 text-sm">Tổng cộng</span>
                                    <span className="text-gold font-semibold">{formatPrice(totalPrice)}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={openServiceTypeChoice}
                                    disabled={submitting}
                                    className="w-full bg-gold text-charcoal font-semibold py-3 flex items-center justify-center gap-2 hover:bg-gold-light transition-colors text-sm tracking-widest uppercase disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />}
                                    Gửi đơn
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <OrderServiceTypeModal
                open={serviceTypeModalOpen}
                onClose={() => setServiceTypeModalOpen(false)}
                onChoose={(kind) => {
                    void sendOrder(kind);
                }}
                lang={lang}
            />
        </div>
    );
}
