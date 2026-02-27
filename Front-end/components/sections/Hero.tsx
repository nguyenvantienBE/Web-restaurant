"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";

const heroSlides = [
    {
        image:
            "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80",
        alt: "Fine dining dish at The Albion",
    },
    {
        image:
            "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1920&q=80",
        alt: "Elegant restaurant interior",
    },
    {
        image:
            "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1920&q=80",
        alt: "Panoramic city view from rooftop",
    },
    {
        image:
            "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=1920&q=80",
        alt: "Artfully plated European cuisine",
    },
    {
        image:
            "https://images.unsplash.com/photo-1544025162-d76594f0af5b?w=1920&q=80",
        alt: "Chef preparing signature dish",
    },
];

export function Hero() {
    const { t } = useTranslation();
    const [current, setCurrent] = useState(0);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setLoaded(true);
        const interval = setInterval(() => {
            setCurrent((prev) => (prev + 1) % heroSlides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const scrollToContent = () => {
        document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <section className="relative h-screen min-h-[600px] overflow-hidden">
            {/* Background image slider */}
            {heroSlides.map((slide, idx) => (
                <div
                    key={idx}
                    className="absolute inset-0 transition-opacity duration-1000"
                    style={{ opacity: idx === current ? 1 : 0 }}
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={slide.image}
                        alt=""
                        loading={idx === 0 ? "eager" : "lazy"}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                </div>
            ))}

            {/* Dark overlay */}
            <div className="hero-gradient absolute inset-0" />
            <div className="absolute inset-0 bg-charcoal/40" />

            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
                {/* Tagline label */}
                <div
                    className={`transition-all duration-1000 delay-300 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                >
                    <p className="section-label mb-8">{t("hero.tagline")}</p>
                </div>

                {/* Main title */}
                <div
                    className={`transition-all duration-1000 delay-500 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                >
                    <h1 className="font-serif text-cream leading-none mb-2">
                        <span className="text-6xl md:text-8xl lg:text-9xl font-bold block">THE</span>
                        <span className="text-3xl md:text-5xl lg:text-6xl font-light tracking-[0.25em] uppercase block mt-2">
                            Albion by Kirk
                        </span>
                    </h1>
                </div>

                {/* Divider */}
                <div
                    className={`transition-all duration-1000 delay-700 ${loaded ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"}`}
                >
                    <div className="w-24 h-px bg-gold mx-auto my-6" />
                </div>

                {/* Subtitle */}
                <div
                    className={`transition-all duration-1000 delay-700 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                >
                    <p className="text-cream/70 text-sm md:text-base tracking-[0.3em] uppercase font-light mb-10">
                        {t("hero.subtitle")}
                    </p>
                </div>

                {/* CTAs */}
                <div
                    className={`flex flex-col sm:flex-row gap-4 transition-all duration-1000 delay-900 ${loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                >
                    <Link href="/reservation" className="btn-gold">
                        {t("hero.cta_reserve")}
                    </Link>
                    <Link href="/menu" className="btn-outline-gold">
                        {t("hero.cta_menu")}
                    </Link>
                </div>
            </div>

            {/* Slide dots */}
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
                {heroSlides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrent(idx)}
                        className={`rounded-full transition-all duration-300 ${idx === current
                            ? "w-6 h-1.5 bg-gold"
                            : "w-1.5 h-1.5 bg-cream/40 hover:bg-cream/70"
                            }`}
                    />
                ))}
            </div>

            {/* Scroll indicator */}
            <button
                onClick={scrollToContent}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-cream/50 hover:text-gold transition-colors animate-bounce"
            >
                <ChevronDown size={24} />
            </button>
        </section>
    );
}
