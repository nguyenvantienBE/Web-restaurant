"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";

interface LiveStatusData {
    tablesAvailable: number;
    status: "open" | "busy" | "closed";
    message: string;
}

export function useSocket() {
    const [data, setData] = useState<LiveStatusData>({
        tablesAvailable: 8,
        status: "open",
        message: "Accepting Reservations",
    });
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const socket = getSocket();
        socket.connect();

        socket.on("connect", () => setConnected(true));
        socket.on("disconnect", () => setConnected(false));
        socket.on("restaurant:status", (payload: LiveStatusData) => {
            setData(payload);
        });

        // Simulate live updates when not connected to real server
        const interval = setInterval(() => {
            if (!socket.connected) {
                setData((prev) => ({
                    ...prev,
                    tablesAvailable: Math.max(0, Math.min(15, prev.tablesAvailable + (Math.random() > 0.5 ? 1 : -1))),
                }));
            }
        }, 5000);

        return () => {
            clearInterval(interval);
            socket.off("connect");
            socket.off("disconnect");
            socket.off("restaurant:status");
        };
    }, []);

    return { data, connected };
}
