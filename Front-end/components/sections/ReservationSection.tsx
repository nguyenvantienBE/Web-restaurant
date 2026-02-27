"use client";

import { useTranslation } from "react-i18next";

export function ReservationSection() {
    const { t } = useTranslation();

    return (
        <section
            id="reservation"
            className="relative py-24 lg:py-32 overflow-hidden"
        >
            {/* Background image */}
            <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1920&q=80"
                    alt="Restaurant ambience"
                    className="w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-charcoal/80" />
            </div>

            <div className="relative max-w-3xl mx-auto px-6 lg:px-12 text-center">
                <p className="section-label mb-6">{t("reservation.label")}</p>
                <h2 className="section-title mb-6">{t("reservation.title")}</h2>
                <div className="divider-gold" />
                <p className="section-subtitle mb-12">{t("reservation.subtitle")}</p>

                {/* Placeholder - coming soon */}
                <div className="glass-card p-12 border border-gold/20">
                    <div className="w-12 h-px bg-gold mx-auto mb-8" />
                    <p className="font-serif text-cream/60 text-xl italic mb-6">
                        {t("reservation.coming_soon")}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-cream/50">
                        <div className="flex items-center gap-2">
                            <span className="text-gold">📞</span>
                            <span>0901 379 129</span>
                        </div>
                        <div className="hidden sm:block w-px h-4 bg-cream/20" />
                        <div className="flex items-center gap-2">
                            <span className="text-gold">✉</span>
                            <span>tuong.cat@accor.com</span>
                        </div>
                    </div>
                    <div className="w-12 h-px bg-gold mx-auto mt-8" />
                </div>
            </div>
        </section>
    );
}
