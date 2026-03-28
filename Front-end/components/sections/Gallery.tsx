"use client";

import { useTranslation } from "react-i18next";
import { SectionContainer } from "@/components/layout/SectionContainer";

const galleryImages = [
    {
        src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
        alt: "Signature dish",
        span: "col-span-1 row-span-2",
    },
    {
        src: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
        alt: "City view at night",
        span: "col-span-1 row-span-1",
    },
    {
        src: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800&q=80",
        alt: "Restaurant interior",
        span: "col-span-1 row-span-1",
    },
    {
        src: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&q=80",
        alt: "Fine dining plating",
        span: "col-span-1 row-span-1",
    },
    {
        src: "https://images.unsplash.com/photo-1544025162-d76594f0af5b?w=800&q=80",
        alt: "Chef at work",
        span: "col-span-2 row-span-1",
    },
];

export function Gallery() {
    const { t } = useTranslation();

    return (
        <section id="gallery" className="py-24 lg:py-32 bg-charcoal-medium border-t border-white/5 overflow-x-hidden">
            <SectionContainer>
                {/* Header */}
                <div className="mb-16 flex w-full flex-col items-center">
                    <p className="section-label mb-4 w-full text-center">{t("gallery.label")}</p>
                    <h2 className="section-title w-full max-w-4xl text-center">{t("gallery.title")}</h2>
                    <div className="divider-gold mx-auto" aria-hidden />
                </div>

                {/* Masonry-style grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 grid-rows-3 gap-3 h-[600px] md:h-[700px]">
                    {galleryImages.map((img, idx) => (
                        <div
                            key={idx}
                            className={`img-zoom overflow-hidden ${img.span}`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={img.src}
                                alt={img.alt}
                                loading="lazy"
                                className="w-full h-full object-cover transition-all duration-700 hover:brightness-110"
                                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                            />
                        </div>
                    ))}
                </div>
            </SectionContainer>
        </section>
    );
}
