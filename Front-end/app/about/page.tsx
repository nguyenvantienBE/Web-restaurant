import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "The Chef | The Albion by Kirk",
    description:
        "Meet Chef Kirk Westaway — two Michelin-starred chef and founder of The Albion, Ho Chi Minh City.",
};

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Chef } from "@/components/sections/Chef";
import { LiveStatus } from "@/components/sections/LiveStatus";

export default function AboutPage() {
    return (
        <main className="pt-20 lg:pt-24">
            <Navbar />

            {/* Hero */}
            <section className="relative h-64 md:h-80 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=1920&q=80"
                    alt="Chef Kirk Westaway"
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-charcoal/70" />
                <div className="relative text-center">
                    <p className="section-label mb-3">The Albion by Kirk</p>
                    <h1 className="font-serif text-cream text-5xl md:text-7xl">
                        The Chef
                    </h1>
                    <div className="divider-gold" />
                </div>
            </section>

            <Chef />
            <Footer />
            <LiveStatus />
        </main>
    );
}
