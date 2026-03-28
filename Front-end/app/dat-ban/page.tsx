import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Đặt Bàn | The Albion by Kirk",
    description:
        "Đặt bàn tại The Albion by Kirk — ẩm thực Châu Âu hiện đại tại tầng 23 Hôtel des Arts Sài Gòn.",
};

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ReservationSection } from "@/components/sections/ReservationSection";
import { LiveStatus } from "@/components/sections/LiveStatus";

export default function DatBanPage() {
    return (
        <main className="min-h-screen w-full min-w-0 overflow-x-clip bg-charcoal pt-20 lg:pt-24">
            <Navbar />
            <ReservationSection />
            <Footer />
            <LiveStatus />
        </main>
    );
}
