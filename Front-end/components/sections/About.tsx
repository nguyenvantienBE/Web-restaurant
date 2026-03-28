"use client";

import { useTranslation } from "react-i18next";
import { Clock, MapPin, Award } from "lucide-react";
import { SectionContainer } from "@/components/layout/SectionContainer";

export function About() {
    const { t } = useTranslation();

    return (
        <section id="about" className="py-24 lg:py-32 bg-charcoal overflow-x-hidden">
            <SectionContainer>
                <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                    {/* Left: Text */}
                    <div>
                        <p className="section-label mb-6">{t("about.label")}</p>
                        <h2 className="section-title mb-8">{t("about.title")}</h2>
                        <div className="divider-gold ml-0" />
                        <p className="section-subtitle mb-6">{t("about.description")}</p>
                        <p className="text-cream/50 text-base leading-relaxed mb-10">
                            {t("about.detail")}
                        </p>

                        {/* Info cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="glass-card p-5 flex items-start gap-4">
                                <Clock size={18} className="text-gold mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-gold text-xs tracking-widest uppercase mb-1">
                                        {t("about.hours_label")}
                                    </p>
                                    <p className="text-cream/80 text-sm leading-snug">
                                        {t("about.hours")}
                                    </p>
                                </div>
                            </div>
                            <div className="glass-card p-5 flex items-start gap-4">
                                <MapPin size={18} className="text-gold mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-gold text-xs tracking-widest uppercase mb-1">
                                        {t("about.address_label")}
                                    </p>
                                    <p className="text-cream/80 text-sm leading-snug">
                                        {t("about.address")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Accor Plus */}
                        <div className="mt-6 border-l-2 border-gold/40 pl-4">
                            <p className="text-cream/40 text-xs leading-relaxed">
                                Accor Plus Explorer members receive 30% discount on dining &
                                15% off drinks.
                            </p>
                        </div>
                    </div>

                    {/* Right: Image stack */}
                    <div className="relative">
                        <div className="img-zoom h-[480px] lg:h-[560px] overflow-hidden relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"
                                alt="The Albion restaurant interior"
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                            {/* Floating badge — inside image, bottom-left corner */}
                            <div className="absolute bottom-0 left-0 bg-gold p-5 shadow-2xl hidden md:block z-20">
                                <div className="flex items-center gap-3">
                                    <Award size={20} className="text-charcoal" />
                                    <div>
                                        <p className="text-charcoal font-serif font-semibold text-sm">
                                            Michelin Selected
                                        </p>
                                        <p className="text-charcoal/70 text-xs tracking-widest">
                                            2025
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SectionContainer>
        </section>
    );
}
