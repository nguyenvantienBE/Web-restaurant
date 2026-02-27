"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Menu, X, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
    { key: "nav.home", href: "/" },
    { key: "nav.menu", href: "/menu" },
    { key: "nav.chef", href: "/about" },
    { key: "nav.gallery", href: "#gallery" },
    { key: "nav.reservation", href: "/reservation" },
];

export function Navbar() {
    const { t, i18n } = useTranslation();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const toggleLang = () => {
        i18n.changeLanguage(i18n.language === "en" ? "vi" : "en");
    };

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
                scrolled
                    ? "bg-charcoal/95 backdrop-blur-md border-b border-white/10"
                    : "bg-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <div className="flex items-center justify-between h-20 lg:h-24">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="flex flex-col items-center">
                            <div className="border border-gold/60 p-2 group-hover:border-gold transition-colors duration-300">
                                <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                                    <rect width="32" height="32" fill="transparent" />
                                    <path d="M4 4h10v10H4V4z" fill="#C9A96E" opacity="0.9" />
                                    <path d="M18 4h10v10H18V4z" fill="#C9A96E" opacity="0.4" />
                                    <path d="M4 18h10v10H4V18z" fill="#C9A96E" opacity="0.4" />
                                    <path d="M18 18h10v10H18V18z" fill="#C9A96E" opacity="0.7" />
                                </svg>
                            </div>
                            <span
                                className="text-gold font-serif text-[8px] tracking-[0.25em] uppercase mt-1"
                                style={{ lineHeight: "1.2" }}
                            >
                                GALLERY
                            </span>
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-cream font-serif text-sm tracking-widest uppercase">
                                <span className="font-light">HÔTEL des</span>{" "}
                                <span className="font-semibold">ARTS SAIGON</span>
                            </p>
                            <p className="text-gold/70 text-[10px] tracking-[0.2em] uppercase">
                                MGALLERY
                            </p>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden lg:flex items-center gap-10">
                        {navLinks.map((l) => (
                            <Link
                                key={l.key}
                                href={l.href}
                                className="nav-link text-cream/80 hover:text-cream text-xs tracking-[0.15em] uppercase font-medium transition-colors duration-200"
                            >
                                {t(l.key)}
                            </Link>
                        ))}
                    </nav>

                    {/* Right controls */}
                    <div className="flex items-center gap-4">
                        {/* Language switcher */}
                        <button
                            onClick={toggleLang}
                            className="flex items-center gap-1.5 text-cream/70 hover:text-gold text-xs tracking-widest uppercase transition-colors duration-200"
                        >
                            <Globe size={14} />
                            {i18n.language === "en" ? "EN" : "VI"}
                        </button>

                        {/* Book CTA - desktop */}
                        <Link
                            href="/reservation"
                            className="hidden lg:block btn-gold text-[10px] tracking-[0.2em]"
                        >
                            {t("subnav.book")}
                        </Link>

                        {/* Mobile menu toggle */}
                        <button
                            className="lg:hidden text-cream/80 hover:text-gold transition-colors"
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            <div
                className={cn(
                    "lg:hidden bg-charcoal/98 backdrop-blur-md border-t border-white/10 transition-all duration-300 overflow-hidden",
                    mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                )}
            >
                <nav className="px-6 py-6 flex flex-col gap-6">
                    {navLinks.map((l) => (
                        <Link
                            key={l.key}
                            href={l.href}
                            className="text-cream/80 hover:text-gold text-sm tracking-[0.2em] uppercase font-medium transition-colors"
                            onClick={() => setMobileOpen(false)}
                        >
                            {t(l.key)}
                        </Link>
                    ))}
                    <Link
                        href="/reservation"
                        className="btn-gold text-center text-[11px] tracking-[0.2em] mt-2"
                        onClick={() => setMobileOpen(false)}
                    >
                        {t("subnav.book")}
                    </Link>
                </nav>
            </div>
        </header>
    );
}
