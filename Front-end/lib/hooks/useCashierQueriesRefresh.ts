"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import { REALTIME_EVENTS } from "@/lib/realtime-events";

type CashierRefreshOptions = {
    /** Thêm invalidate báo cáo (dashboard manager) — chỉ bật ở màn cần, tránh refetch thừa */
    includeReports?: boolean;
    /** Danh sách đặt bàn (manager) */
    includeReservations?: boolean;
};

/**
 * Khi đơn / bàn / thanh toán / món đổi, backend emit socket — refetch đơn + bàn ngay
 * (thay vì chờ polling 20–30s).
 */
export function useCashierQueriesRefresh(enabled: boolean, options?: CashierRefreshOptions) {
    const qc = useQueryClient();
    const includeReports = options?.includeReports === true;
    const includeReservations = options?.includeReservations === true;

    useEffect(() => {
        if (!enabled || typeof window === "undefined") return;

        const socket = getSocket();
        const token = sessionStorage.getItem("accessToken");
        socket.auth = { token: token || "" };
        socket.connect();

        const refresh = () => {
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["tables"] });
            if (includeReports) {
                qc.invalidateQueries({ queryKey: ["reports"] });
            }
            if (includeReservations) {
                qc.invalidateQueries({ queryKey: ["reservations"] });
            }
        };

        const events: string[] = [
            REALTIME_EVENTS.ORDER_NEW,
            REALTIME_EVENTS.ORDER_UPDATED,
            REALTIME_EVENTS.ORDER_CANCELLED,
            REALTIME_EVENTS.ITEM_STATUS_CHANGED,
            REALTIME_EVENTS.TABLE_STATUS_CHANGED,
            REALTIME_EVENTS.PAYMENT_COMPLETED,
        ];
        if (includeReservations) {
            events.push(REALTIME_EVENTS.RESERVATION_NEW, REALTIME_EVENTS.RESERVATION_UPDATED);
        }

        events.forEach((ev) => socket.on(ev, refresh));

        return () => {
            events.forEach((ev) => socket.off(ev, refresh));
        };
    }, [enabled, qc, includeReports, includeReservations]);
}
