"use client";

import { useTranslation } from "react-i18next";
import { SectionContainer } from "@/components/layout/SectionContainer";

export function Chef() {
    const { t } = useTranslation();

    const awards = [
        { key: "chef.awards.michelin", icon: "⭐" },
        { key: "chef.awards.tatler_ap", icon: "🏆" },
        { key: "chef.awards.tatler_vn", icon: "🥇" },
    ];

    return (
        <section id="chef" className="py-24 lg:py-32 bg-charcoal relative overflow-x-hidden">
            {/* Background texture */}
            <div className="absolute inset-0 opacity-5">
                <div
                    className="w-full h-full"
                    style={{
                        backgroundImage:
                            "repeating-linear-gradient(45deg, #C9A96E 0, #C9A96E 1px, transparent 0, transparent 50%)",
                        backgroundSize: "20px 20px",
                    }}
                />
            </div>

            <SectionContainer className="relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                    {/* Image */}
                    <div className="relative order-2 lg:order-1">
                        <div className="img-zoom h-[480px] lg:h-[560px] overflow-hidden relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&q=80"
                                alt="Chef Kirk Westaway"
                                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                        </div>
                    </div>

                    {/* Text */}
                    <div className="order-1 lg:order-2">
                        <p className="section-label mb-6">{t("chef.label")}</p>
                        <h2 className="font-serif text-5xl lg:text-6xl text-cream mb-2">
                            {t("chef.name")}
                        </h2>
                        <p className="text-gold text-sm tracking-[0.2em] uppercase mb-8">
                            {t("chef.title")}
                        </p>
                        <div className="w-16 h-px bg-gold mb-8" />

                        {/* Quote */}
                        <blockquote className="font-serif text-xl lg:text-2xl text-cream/80 italic leading-relaxed mb-8 border-l-2 border-gold pl-6">
                            {t("chef.quote")}
                        </blockquote>

                        <p className="text-cream/50 text-base leading-relaxed mb-12">
                            {t("chef.bio")}
                        </p>

                        {/* Awards */}
                        <div className="flex flex-col gap-3">
                            {awards.map((award) => (
                                <div
                                    key={award.key}
                                    className="flex items-center gap-3 glass-card p-3 px-4"
                                >
                                    <span className="text-base">{award.icon}</span>
                                    <span className="text-cream/70 text-xs tracking-[0.15em] uppercase font-medium">
                                        {t(award.key)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </SectionContainer>
        </section>
    );
}
