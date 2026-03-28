"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Instagram, Facebook, Twitter } from "lucide-react";
import { SectionContainer } from "@/components/layout/SectionContainer";

export function Footer() {
    const { t } = useTranslation();

    return (
        <footer
            id="location"
            className="bg-charcoal border-t border-white/10 pt-20 lg:pt-28 pb-8"
        >
            <SectionContainer>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="border border-gold/60 p-2">
                                <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                                    <path d="M4 4h10v10H4V4z" fill="#C9A96E" opacity="0.9" />
                                    <path d="M18 4h10v10H18V4z" fill="#C9A96E" opacity="0.4" />
                                    <path d="M4 18h10v10H4V18z" fill="#C9A96E" opacity="0.4" />
                                    <path d="M18 18h10v10H18V18z" fill="#C9A96E" opacity="0.7" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-cream font-serif text-xs tracking-widest uppercase">
                                    Hôtel des Arts
                                </p>
                                <p className="text-gold/70 text-[9px] tracking-[0.2em] uppercase">
                                    MGallery
                                </p>
                            </div>
                        </div>
                        <h3 className="font-serif text-cream text-lg mb-2">
                            The Albion by Kirk
                        </h3>
                        <p className="text-cream/40 text-xs leading-relaxed">
                            Modern European Restaurant
                        </p>
                    </div>

                    {/* Address */}
                    <div>
                        <h4 className="text-gold text-xs tracking-[0.2em] uppercase mb-5">
                            Contact
                        </h4>
                        <div className="space-y-3 text-cream/60 text-sm leading-relaxed">
                            <p style={{ whiteSpace: "pre-line" }}>{t("footer.address")}</p>
                        </div>
                        <div className="mt-5 space-y-2 text-cream/50 text-sm">
                            <p>{t("footer.hours")}</p>
                            <p>{t("footer.tel")}</p>
                            <a
                                href={`mailto:${t("footer.email")}`}
                                className="block hover:text-gold transition-colors"
                            >
                                {t("footer.email")}
                            </a>
                        </div>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h4 className="text-gold text-xs tracking-[0.2em] uppercase mb-5">
                            Navigation
                        </h4>
                        <nav className="space-y-3">
                            {[
                                { label: t("nav.home"), href: "/" },
                                { label: t("nav.menu"), href: "/menu" },
                                { label: t("nav.chef"), href: "/about" },
                                { label: t("nav.reservation"), href: "/reservation" },
                            ].map((l) => (
                                <Link
                                    key={l.href}
                                    href={l.href}
                                    className="block text-cream/60 hover:text-gold text-sm tracking-wide transition-colors duration-200"
                                >
                                    {l.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Social + newsletter teaser */}
                    <div>
                        <h4 className="text-gold text-xs tracking-[0.2em] uppercase mb-5">
                            Follow Us
                        </h4>
                        <div className="flex gap-4 mb-8">
                            {[
                                { icon: <Instagram size={18} />, href: "#", label: "Instagram" },
                                { icon: <Facebook size={18} />, href: "#", label: "Facebook" },
                                { icon: <Twitter size={18} />, href: "#", label: "Twitter" },
                            ].map((s) => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    aria-label={s.label}
                                    className="text-cream/50 hover:text-gold transition-colors p-2 border border-white/10 hover:border-gold/40"
                                >
                                    {s.icon}
                                </a>
                            ))}
                        </div>

                        <div>
                            <p className="text-cream/40 text-xs leading-relaxed mb-3">
                                Accor Plus Explorer members receive 30% dining discount.
                            </p>
                            <a
                                href="https://all.accor.com/enroll-loyalty/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gold text-xs tracking-widest uppercase hover:underline"
                            >
                                Become a Member →
                            </a>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10 pt-8">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                        <p className="text-cream/30 text-xs">{t("footer.rights")}</p>
                        <div className="flex gap-6 text-cream/30 text-xs">
                            <Link href="#" className="hover:text-cream/60 transition-colors">
                                Privacy Policy
                            </Link>
                            <Link href="#" className="hover:text-cream/60 transition-colors">
                                Cookie Policy
                            </Link>
                            <Link href="#" className="hover:text-cream/60 transition-colors">
                                Legal Notice
                            </Link>
                        </div>
                    </div>
                </div>
            </SectionContainer>
        </footer>
    );
}
