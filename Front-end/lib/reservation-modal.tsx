"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type ReservationModalContextValue = {
    isOpen: boolean;
    open: () => void;
    close: () => void;
};

const ReservationModalContext = createContext<ReservationModalContextValue | null>(null);

export function ReservationModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setOpen] = useState(false);
    const open = useCallback(() => setOpen(true), []);
    const close = useCallback(() => setOpen(false), []);
    return (
        <ReservationModalContext.Provider value={{ isOpen, open, close }}>
            {children}
        </ReservationModalContext.Provider>
    );
}

export function useReservationModal() {
    const ctx = useContext(ReservationModalContext);
    if (!ctx) return { isOpen: false, open: () => {}, close: () => {} };
    return ctx;
}
