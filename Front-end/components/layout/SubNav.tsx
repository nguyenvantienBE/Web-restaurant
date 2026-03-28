"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ChevronLeft } from "lucide-react";
import { useReservationModal } from "@/lib/reservation-modal";
import { SectionContainer } from "@/components/layout/SectionContainer";

const subNavLinks = [
    { key: "nav.information", href: "#about" },
    { key: "nav.gallery", href: "#gallery" },
    { key: "nav.chef", href: "#chef" },
    { key: "nav.location", href: "#location" },
];

export function SubNav() {
    const { t } = useTranslation();
    const { open: openReservation } = useReservationModal();

    return (
        <div className="bg-charcoal border-t border-white/10 z-40">
            <SectionContainer>
                <div className="flex items-center justify-between h-14 lg:h-16">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <ChevronLeft size={14} className="text-gold" />
                        <span className="font-serif text-cream text-sm lg:text-base tracking-wide">
                            {t("subnav.brand")}
                        </span>
                    </div>

                    {/* Sub links */}
                    <nav className="hidden md:flex items-center gap-8 lg:gap-12">
                        {subNavLinks.map((l) => (
                            <Link
                                key={l.key}
                                href={l.href}
                                className="nav-link text-cream/70 hover:text-gold text-xs tracking-[0.15em] uppercase font-medium transition-colors duration-200"
                            >
                                {t(l.key)}
                            </Link>
                        ))}
                    </nav>

                    {/* Book CTA */}
                    <button
                        type="button"
                        onClick={() => openReservation()}
                        className="btn-gold text-[10px] lg:text-[11px] tracking-[0.2em] py-3 px-5 lg:px-7"
                    >
                        {t("subnav.book")}
                    </button>
                </div>
            </SectionContainer>
        </div>
    );
}
