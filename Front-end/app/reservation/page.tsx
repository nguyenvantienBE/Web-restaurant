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
        <main className="min-h-screen w-full min-w-0 overflow-x-clip bg-charcoal pt-20 lg:pt-24">
            <Navbar />
            <ReservationSection />
            <Footer />
            <LiveStatus />
        </main>
    );
}
