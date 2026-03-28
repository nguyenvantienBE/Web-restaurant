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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-transparent"
            onClick={(e) => e.target === e.currentTarget && close()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reservation-modal-title"
        >
            <div
                className="reservation-form-panel relative w-full max-w-[min(92vw,560px)] max-h-[92vh] overflow-y-auto px-8 pb-10 pt-12 sm:px-11 sm:pb-12 sm:pt-14"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={close}
                    className="absolute top-4 right-4 z-[110] p-2.5 text-[#c4b89a]/70 hover:text-cream hover:bg-white/[0.06] rounded-sm transition-colors duration-300"
                    aria-label="Đóng"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                <header className="mb-8 w-full text-center sm:mb-9">
                    <div className="mb-5 flex items-center justify-center gap-3 sm:gap-5">
                        <span className="h-px w-10 max-w-[28%] bg-gradient-to-r from-transparent via-[#c5a059]/80 to-[#c5a059]/30 sm:w-14" />
                        <span className="section-label mb-0 whitespace-nowrap">{t("reservation.label")}</span>
                        <span className="h-px w-10 max-w-[28%] bg-gradient-to-l from-transparent via-[#c5a059]/80 to-[#c5a059]/30 sm:w-14" />
                    </div>
                    <h2
                        id="reservation-modal-title"
                        className="mb-4 w-full text-center font-serif text-[1.65rem] font-normal leading-tight tracking-tight text-[#ebe3d6] sm:text-[1.9rem]"
                    >
                        {t("reservation.title")}
                    </h2>
                    <p className="mx-auto w-full max-w-lg px-1 text-center font-serif text-[13px] font-light italic leading-relaxed tracking-[0.02em] text-cream/60 sm:text-[14px]">
                        {t("reservation.subtitle")}
                    </p>
                </header>

                <ReservationSection embedded onClose={close} />
            </div>
        </div>
    );
}
