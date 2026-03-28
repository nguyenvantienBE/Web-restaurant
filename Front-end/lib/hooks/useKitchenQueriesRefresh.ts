"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { REALTIME_EVENTS } from "@/lib/realtime-events";

/**
 * Bếp refetch ticket ngay khi có đơn xuống bếp / hủy / đổi trạng thái món (socket),
 * thay vì chờ polling ~15s.
 */
export function useKitchenQueriesRefresh(enabled: boolean) {
    const qc = useQueryClient();

    useEffect(() => {
        if (!enabled || typeof window === "undefined") return;

        const socket = getSocket();
        const token = sessionStorage.getItem("accessToken");
        socket.auth = { token: token || "" };
        socket.connect();

        const refresh = () => {
            qc.invalidateQueries({ queryKey: ["kitchen"] });
        };

        const events = [
            REALTIME_EVENTS.KITCHEN_TICKET,
            REALTIME_EVENTS.ORDER_CANCELLED,
            REALTIME_EVENTS.ITEM_STATUS_CHANGED,
            REALTIME_EVENTS.PAYMENT_COMPLETED,
        ];

        events.forEach((ev) => socket.on(ev, refresh));

        return () => {
            events.forEach((ev) => socket.off(ev, refresh));
        };
    }, [enabled, qc]);
}
