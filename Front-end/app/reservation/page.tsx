import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Reserve a Table | The Albion by Kirk",
    description:
        "Reserve your table at The Albion by Kirk — modern European dining on the 23rd floor of Hôtel des Arts Saigon.",
};

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ReservationSection } from "@/components/sections/ReservationSection";
import { LiveStatus } from "@/components/sections/LiveStatus";

export default function ReservationPage() {
    return (
        <main className="pt-20 lg:pt-24">
            <Navbar />

            {/* Hero */}
            <section className="relative h-64 md:h-80 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80"
                    alt="Fine dining table setting"
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-charcoal/70" />
                <div className="relative text-center">
                    <p className="section-label mb-3">The Albion by Kirk</p>
                    <h1 className="font-serif text-cream text-5xl md:text-7xl">
                        Reserve
                    </h1>
                    <div className="divider-gold" />
                </div>
            </section>

            <ReservationSection />
            <Footer />
            <LiveStatus />
        </main>
    );
}
