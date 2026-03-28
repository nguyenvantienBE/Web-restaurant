"use client";

import { UtensilsCrossed, Package, X } from "lucide-react";

export type OrderServiceKind = "dine_in" | "takeaway";

type Props = {
    open: boolean;
    onClose: () => void;
    onChoose: (kind: OrderServiceKind) => void;
    /** vi | en */
    lang?: "vi" | "en";
};

const COPY: Record<
    "vi" | "en",
    { title: string; subtitle: string; dineIn: string; takeaway: string; cancel: string }
> = {
    vi: {
        title: "Bạn đặt như thế nào?",
        subtitle: "Chọn ăn tại chỗ hoặc mang về trước khi gửi xuống bếp.",
        dineIn: "Ăn tại chỗ",
        takeaway: "Mang về",
        cancel: "Quay lại",
    },
    en: {
        title: "How would you like your order?",
        subtitle: "Dine in or take away before sending to the kitchen.",
        dineIn: "Dine in",
        takeaway: "Take away",
        cancel: "Back",
    },
};

export function OrderServiceTypeModal({ open, onClose, onChoose, lang = "vi" }: Props) {
    const t = COPY[lang];
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Đóng" onClick={onClose} />
            <div
                role="dialog"
                aria-modal
                aria-labelledby="order-service-type-title"
                className="relative z-10 w-full max-w-sm rounded-xl border border-white/10 bg-charcoal-light p-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-start justify-between gap-2">
                    <div>
                        <h2 id="order-service-type-title" className="font-serif text-lg text-cream">
                            {t.title}
                        </h2>
                        <p className="mt-1 text-xs text-cream/50 leading-relaxed">{t.subtitle}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 rounded p-1 text-cream/40 hover:bg-white/5 hover:text-cream"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="grid gap-2">
                    <button
                        type="button"
                        onClick={() => onChoose("dine_in")}
                        className="flex w-full items-center gap-3 rounded-lg border border-gold/35 bg-gold/10 px-4 py-3 text-left transition-colors hover:bg-gold/20"
                    >
                        <UtensilsCrossed className="shrink-0 text-gold" size={22} />
                        <span className="font-medium text-cream">{t.dineIn}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => onChoose("takeaway")}
                        className="flex w-full items-center gap-3 rounded-lg border border-white/15 bg-white/[0.04] px-4 py-3 text-left transition-colors hover:bg-white/[0.08]"
                    >
                        <Package className="shrink-0 text-cream/70" size={22} />
                        <span className="font-medium text-cream">{t.takeaway}</span>
                    </button>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 w-full py-2 text-center text-xs text-cream/45 hover:text-cream/70"
                >
                    {t.cancel}
                </button>
            </div>
        </div>
    );
}
