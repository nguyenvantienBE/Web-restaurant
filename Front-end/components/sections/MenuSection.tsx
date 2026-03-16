"use client";

import { useTranslation } from "react-i18next";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useMenuItems, useCategories, type ApiMenuItem } from "@/lib/hooks/useMenu";
import { Loader2, UtensilsCrossed } from "lucide-react";

type Tab = "dinner" | "bar" | "tasting";

const TAB_CATEGORY_NAMES: Record<Tab, string[]> = {
    dinner: ["Appetizers", "Main Course", "Món Việt", "Desserts"],
    bar: ["Beverages"],
    tasting: ["Main Course", "Desserts"],
};

const CATEGORY_I18N_KEYS: Record<string, string> = {
    Appetizers: "starters",
    "Main Course": "mains",
    Desserts: "desserts",
    Beverages: "drinks",
    "Món Việt": "vietnamese",
};

function formatPrice(price: number | string) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(price));
}

function MenuItemCard({ item }: { item: ApiMenuItem }) {
    return (
        <article className="group rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10 hover:border-gold/20 hover:bg-white/[0.05] transition-all duration-300">
            <div className="aspect-[4/3] relative bg-charcoal overflow-hidden">
                {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={item.imageUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white/[0.06] to-transparent">
                        <UtensilsCrossed size={32} className="text-cream/20" />
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-charcoal/90 to-transparent pointer-events-none" />
            </div>
            <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <h4 className="font-serif text-cream text-lg leading-tight flex-1 min-w-0">
                        {item.name}
                    </h4>
                    <span className="text-gold font-semibold shrink-0 whitespace-nowrap">
                        {formatPrice(item.price)}
                    </span>
                </div>
                {item.description && (
                    <p className="text-cream/50 text-sm mt-2 line-clamp-2 leading-relaxed">
                        {item.description}
                    </p>
                )}
            </div>
        </article>
    );
}

export function MenuSection() {
    const { t } = useTranslation();
    const [tab, setTab] = useState<Tab>("dinner");

    const { data: items = [], isLoading: itemsLoading } = useMenuItems();
    const { data: categories = [], isLoading: catsLoading } = useCategories();

    const tabs: { key: Tab; label: string }[] = [
        { key: "dinner", label: t("menu.tabs.dinner") },
        { key: "bar", label: t("menu.tabs.bar") },
        { key: "tasting", label: t("menu.tabs.tasting") },
    ];

    const categoryNamesForTab = TAB_CATEGORY_NAMES[tab];
    const categoriesForTab = useMemo(() => {
        return categories
            .filter((c) => categoryNamesForTab.includes(c.name))
            .sort((a, b) => a.sortOrder - b.sortOrder);
    }, [categories, categoryNamesForTab]);

    const itemsByCategory = useMemo(() => {
        const map = new Map<string, ApiMenuItem[]>();
        for (const cat of categoriesForTab) {
            const list = items
                .filter((i) => i.categoryId === cat.id && i.isAvailable)
                .sort((a, b) => a.sortOrder - b.sortOrder);
            if (list.length) map.set(cat.id, list);
        }
        return map;
    }, [items, categoriesForTab]);

    const hasContent = itemsByCategory.size > 0;
    const isLoading = itemsLoading || catsLoading;

    return (
        <section id="menu" className="pt-24 pb-32 lg:pt-32 lg:pb-40 bg-charcoal-light">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <div className="text-center mb-16">
                    <p className="section-label mb-4">{t("menu.label")}</p>
                    <h2 className="section-title mb-4">{t("menu.title")}</h2>
                    <div className="divider-gold" />
                    <p className="section-subtitle max-w-xl mx-auto">{t("menu.subtitle")}</p>
                </div>

                <div className="flex justify-center mb-14">
                    <div
                        role="tablist"
                        className="inline-flex p-1.5 rounded-xl bg-white/[0.06] border border-white/10"
                        aria-label={t("menu.label")}
                    >
                        {tabs.map((tb) => (
                            <button
                                key={tb.key}
                                role="tab"
                                aria-selected={tab === tb.key}
                                onClick={() => setTab(tb.key)}
                                className={cn(
                                    "relative px-6 py-3 text-xs tracking-[0.18em] uppercase font-semibold rounded-lg transition-all duration-300 min-w-[120px]",
                                    tab === tb.key
                                        ? "text-charcoal bg-gold shadow-md"
                                        : "text-cream/50 hover:text-cream hover:bg-white/5"
                                )}
                            >
                                {tb.label}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading && (
                    <div className="min-h-[320px] flex flex-col items-center justify-center">
                        <Loader2 size={40} className="animate-spin text-gold mb-4" />
                        <p className="text-cream/50 text-sm">{t("menu.loading")}</p>
                    </div>
                )}

                {!isLoading && !hasContent && (
                    <div className="min-h-[300px] flex flex-col items-center justify-center">
                        <div className="glass-card p-12 text-center max-w-lg mx-auto rounded-2xl">
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
                )}

                {!isLoading && hasContent && (
                    <div className="space-y-20">
                        {categoriesForTab.map((cat) => {
                            const list = itemsByCategory.get(cat.id);
                            if (!list?.length) return null;
                            const sectionKey = CATEGORY_I18N_KEYS[cat.name];
                            const sectionLabel = sectionKey ? t(`menu.${sectionKey}`) : cat.name;

                            return (
                                <div key={cat.id}>
                                    <h3 className="font-serif text-cream text-2xl md:text-3xl mb-8 tracking-tight">
                                        {sectionLabel}
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                        {list.map((item) => (
                                            <MenuItemCard key={item.id} item={item} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}
