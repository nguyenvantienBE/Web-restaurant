"use client";

import { useTranslation } from "react-i18next";
import { useReservationModal } from "@/lib/reservation-modal";

export function ReservationCTA() {
    const { t } = useTranslation();
    const { open: openReservation } = useReservationModal();

    return (
        <section
            id="reservation"
            className="relative py-24 lg:py-32 overflow-hidden"
        >
            <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1920&q=80"
                    alt="Restaurant ambience"
                    className="w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-charcoal/80" />
            </div>

            <div className="relative max-w-2xl mx-auto px-6 lg:px-12 text-center">
                <p className="section-label mb-6">{t("reservation.label")}</p>
                <h2 className="section-title mb-6">{t("reservation.title")}</h2>
                <div className="divider-gold mx-auto" aria-hidden />
                <p className="section-subtitle mb-10">{t("reservation.subtitle")}</p>
                <button
                    type="button"
                    onClick={() => openReservation()}
                    className="inline-block px-10 py-4 bg-gold text-charcoal font-medium tracking-wider uppercase hover:bg-gold/90 transition-colors rounded-sm"
                >
                    {t("nav.reservation")}
                </button>
            </div>
        </section>
    );
}
