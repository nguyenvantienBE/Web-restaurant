export const RealtimeEvents = {
  // Orders
  ORDER_NEW: 'order:new',
  ORDER_CONFIRMED: 'order:confirmed',
  ORDER_UPDATED: 'order:updated',
  ORDER_CANCELLED: 'order:cancelled',

  // Kitchen
  KITCHEN_TICKET: 'kitchen:ticket',
  ITEM_STATUS_CHANGED: 'item:statusChanged',

  // Tables
  TABLE_STATUS_CHANGED: 'table:statusChanged',

  // Staff calls
  STAFF_CALL: 'staff:call',
  STAFF_CALL_RESOLVED: 'staff:callResolved',

  // Payments
  PAYMENT_COMPLETED: 'payment:completed',

  // Reservations
  RESERVATION_NEW: 'reservation:new',
  RESERVATION_UPDATED: 'reservation:updated',

  // Connection
  JOIN_ROOM: 'join:room',
};

export const RealtimeRooms = {
  CASHIER: 'room:cashier',
  KITCHEN: 'room:kitchen',
  MANAGER: 'room:manager',
  /** Tất cả nhân sự (chuông đặt bàn, v.v.) */
  STAFF: 'room:staff',
};
