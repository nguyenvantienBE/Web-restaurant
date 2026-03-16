import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Menu | The Albion by Kirk",
    description:
        "Explore the curated menu at The Albion by Kirk — modern European cuisine on the 23rd floor of Hôtel des Arts Saigon.",
};

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LiveStatus } from "@/components/sections/LiveStatus";
import { MenuSection } from "@/components/sections/MenuSection";

export default function MenuPage() {
    return (
        <main className="pt-20 lg:pt-24">
            <Navbar />

            {/* Hero */}
            <section className="relative h-64 md:h-80 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=1920&q=80"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-charcoal/70" />
                <div className="relative text-center">
                    <p className="section-label mb-3">The Albion by Kirk</p>
                    <h1 className="font-serif text-cream text-5xl md:text-7xl">Menu</h1>
                    <div className="divider-gold" />
                </div>
            </section>

            <MenuSection />
            <div className="min-h-[4rem] lg:min-h-[6rem] bg-charcoal-light" aria-hidden />
            <Footer />
            <LiveStatus />
        </main>
    );
}
