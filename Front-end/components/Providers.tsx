"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/lib/auth";
import { ReservationModalProvider } from "@/lib/reservation-modal";
import { ReservationModal } from "@/components/ReservationModal";
import { Toaster } from "sonner";
import "@/lib/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ReservationModalProvider>
                    {children}
                    <ReservationModal />
                        <Toaster
                        position="top-right"
                        toastOptions={{
                            style: { background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8" },
                        }}
                    />
                </ReservationModalProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}
