"use client";

import { useTranslation } from "react-i18next";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Tab = "dinner" | "bar" | "tasting";

export function MenuSection() {
    const { t } = useTranslation();
    const [tab, setTab] = useState<Tab>("dinner");

    const tabs: { key: Tab; label: string }[] = [
        { key: "dinner", label: t("menu.tabs.dinner") },
        { key: "bar", label: t("menu.tabs.bar") },
        { key: "tasting", label: t("menu.tabs.tasting") },
    ];

    return (
        <section id="menu" className="py-24 lg:py-32 bg-charcoal-light">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                {/* Header */}
                <div className="text-center mb-16">
                    <p className="section-label mb-4">{t("menu.label")}</p>
                    <h2 className="section-title mb-4">{t("menu.title")}</h2>
                    <div className="divider-gold" />
                    <p className="section-subtitle max-w-xl mx-auto">{t("menu.subtitle")}</p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-12">
                    <div className="flex flex-wrap justify-center gap-3">
                        {tabs.map((tb) => (
                            <button
                                key={tb.key}
                                onClick={() => setTab(tb.key)}
                                className={cn(
                                    "px-8 py-3.5 text-xs tracking-[0.2em] uppercase font-semibold transition-all duration-300 border rounded-sm",
                                    tab === tb.key
                                        ? "bg-gold text-charcoal border-gold shadow-[0_4px_20px_rgba(201,169,110,0.35)]"
                                        : "bg-transparent text-cream/50 border-white/15 hover:text-cream hover:border-white/40 hover:bg-white/5"
                                )}
                            >
                                {tb.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content - empty placeholder as requested */}
                <div className="min-h-[300px] flex flex-col items-center justify-center">
                    <div className="glass-card p-12 text-center max-w-lg mx-auto">
                        <div className="w-16 h-px bg-gold mx-auto mb-8" />
                        <p className="font-serif text-cream/60 text-xl italic mb-3">
                            {t("menu.coming_soon")}
                        </p>
                        <p className="text-cream/30 text-xs tracking-widest uppercase">
                            — {tabs.find((tb) => tb.key === tab)?.label} —
                        </p>
                        <div className="w-16 h-px bg-gold mx-auto mt-8" />
                    </div>
                </div>
            </div>
        </section>
    );
}
