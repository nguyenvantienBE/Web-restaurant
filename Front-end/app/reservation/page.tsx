import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Reserve a Table | The Albion by Kirk",
    description:
        "Reserve your table at The Albion by Kirk — modern European dining on the 23rd floor of Hôtel des Arts Saigon.",
};

import { ReservationSection } from "@/components/sections/ReservationSection";

export default function ReservationPage() {
    return (
        <main className="min-h-screen">
            <ReservationSection />
        </main>
    );
}
