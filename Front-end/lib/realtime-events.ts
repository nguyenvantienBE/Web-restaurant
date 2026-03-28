/** Khớp với `back-end/src/realtime/realtime.events.ts` — dùng cho socket.io client */
export const REALTIME_EVENTS = {
    ORDER_NEW: "order:new",
    ORDER_UPDATED: "order:updated",
    ORDER_CANCELLED: "order:cancelled",
    /** Ticket xuống bếp (đơn CONFIRMED / QR tại chỗ) */
    KITCHEN_TICKET: "kitchen:ticket",
    ITEM_STATUS_CHANGED: "item:statusChanged",
    TABLE_STATUS_CHANGED: "table:statusChanged",
    PAYMENT_COMPLETED: "payment:completed",

    RESERVATION_NEW: "reservation:new",
    RESERVATION_UPDATED: "reservation:updated",
} as const;
