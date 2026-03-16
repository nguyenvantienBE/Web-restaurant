"use client";

import { useReservationModal } from "@/lib/reservation-modal";
import { ReservationSection } from "@/components/sections/ReservationSection";
import { useTranslation } from "react-i18next";

export function ReservationModal() {
    const { isOpen, close } = useReservationModal();
    const { t } = useTranslation();

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/90 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && close()}
        >
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl bg-charcoal/95 border border-gold/20">
                <button
                    type="button"
                    onClick={close}
                    className="absolute top-4 right-4 z-[110] p-2 text-cream/60 hover:text-cream hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Đóng"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>
                <div className="p-5 md:p-6 pt-12">
                    <div className="text-center mb-5">
                        <p className="text-xs tracking-[0.2em] uppercase text-gold/80 mb-1.5">{t("reservation.label")}</p>
                        <h2 className="text-2xl font-serif text-cream">{t("reservation.title")}</h2>
                        <div className="divider-gold my-2.5" />
                        <p className="text-sm text-cream/70">{t("reservation.subtitle")}</p>
                    </div>
                    <ReservationSection embedded onClose={close} />
                </div>
            </div>
        </div>
    );
}
