// ============================================================
// ENTITY TYPES – Restaurant System (FINAL)
// ============================================================

// ---- CLAIMS (Permissions) ----------------------------------
export const CLAIMS = {
    // User/Role
    USER_READ: "USER_READ",
    USER_CREATE: "USER_CREATE",
    USER_UPDATE: "USER_UPDATE",
    USER_DISABLE: "USER_DISABLE",
    ROLE_READ: "ROLE_READ",
    ROLE_UPDATE: "ROLE_UPDATE",
    CLAIM_ASSIGN: "CLAIM_ASSIGN",
    // Menu
    MENU_READ: "MENU_READ",
    MENU_CREATE: "MENU_CREATE",
    MENU_UPDATE: "MENU_UPDATE",
    MENU_DELETE: "MENU_DELETE",
    CATEGORY_READ: "CATEGORY_READ",
    CATEGORY_CREATE: "CATEGORY_CREATE",
    CATEGORY_UPDATE: "CATEGORY_UPDATE",
    CATEGORY_DELETE: "CATEGORY_DELETE",
    // Table/QR
    TABLE_READ: "TABLE_READ",
    TABLE_CREATE: "TABLE_CREATE",
    TABLE_UPDATE: "TABLE_UPDATE",
    TABLE_DELETE: "TABLE_DELETE",
    QR_GENERATE: "QR_GENERATE",
    // Order (quầy)
    ORDER_READ: "ORDER_READ",
    ORDER_CONFIRM: "ORDER_CONFIRM",
    ORDER_UPDATE: "ORDER_UPDATE",
    ORDER_CANCEL: "ORDER_CANCEL",
    ITEM_SERVE: "ITEM_SERVE",
    STAFF_CALL_HANDLE: "STAFF_CALL_HANDLE",
    // Kitchen
    KITCHEN_TICKET_READ: "KITCHEN_TICKET_READ",
    ITEM_COOK_UPDATE: "ITEM_COOK_UPDATE",
    KITCHEN_PRINT: "KITCHEN_PRINT",
    // Payment/Invoice
    PAYMENT_READ: "PAYMENT_READ",
    PAYMENT_CONFIRM: "PAYMENT_CONFIRM",
    INVOICE_GENERATE: "INVOICE_GENERATE",
    INVOICE_SEND_EMAIL: "INVOICE_SEND_EMAIL",
    SETTINGS_MANAGE: "SETTINGS_MANAGE",
    // Reports/Shift (POS)
    REPORT_VIEW: "REPORT_VIEW",
    SHIFT_CLOSE: "SHIFT_CLOSE",
    SHIFT_OPEN: "SHIFT_OPEN",
    SHIFT_EXPENSE: "SHIFT_EXPENSE",
    SHIFT_APPROVE_DIFF: "SHIFT_APPROVE_DIFF",
    // Reservations
    RESERVATION_READ: "RESERVATION_READ",
    RESERVATION_UPDATE: "RESERVATION_UPDATE",
} as const;

export type ClaimKey = keyof typeof CLAIMS;
export type ClaimValue = (typeof CLAIMS)[ClaimKey];

// ---- USER & ROLE -------------------------------------------
export type UserRole = "admin" | "manager" | "cashier" | "kitchen";

export interface User {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    claims: ClaimValue[];
    isActive: boolean;
    avatarUrl?: string;
    createdAt: string;
    lastLogin?: string;
}

export interface AuthUser extends User {
    token: string;
}

// ---- CATEGORY & MENU ITEM ----------------------------------
export interface Category {
    id: string;
    name: string;
    nameVi: string;
    description?: string;
    sortOrder: number;
    isActive: boolean;
}

export type MenuItemUnit = "dish" | "glass" | "bottle" | "set";

export interface MenuItem {
    id: string;
    categoryId: string;
    name: string;
    nameVi: string;
    description?: string;
    descriptionVi?: string;
    price: number; // VND
    imageUrl?: string;
    isAvailable: boolean;
    unit: MenuItemUnit;
    preparationTime?: number; // minutes
    tags?: string[];
}

// ---- TABLE -------------------------------------------------
export type TableStatus =
    | "EMPTY"
    | "SEATED"
    | "ORDERING"
    | "SERVING"
    | "NEED_PAYMENT"
    | "NEED_CLEAN";

export type TableArea = "indoor" | "outdoor" | "rooftop" | "bar";

export interface Table {
    id: string;
    tableCode: string; // e.g. "A1", "B3"
    area: TableArea;
    capacity: number;
    status: TableStatus;
    qrUrl?: string;
    posX?: number; // for visual map
    posY?: number;
}

// ---- TABLE SESSION -----------------------------------------
export type TableSessionStatus = "OPEN" | "CLOSED";

export interface TableSession {
    id: string;
    tableId: string;
    tableCode: string;
    status: TableSessionStatus;
    openedAt: string;
    closedAt?: string;
    customerCount?: number;
}

// ---- ORDER -------------------------------------------------
export type OrderType = "DINE_IN" | "TAKEAWAY";

export type OrderStatus =
    | "NEW"
    | "CONFIRMED"
    | "IN_PROGRESS"
    | "READY"
    | "SERVED"
    | "COMPLETED"
    | "CANCELLED";

export interface Order {
    id: string;
    tableId?: string;
    tableCode?: string;
    sessionId?: string;
    type: OrderType;
    status: OrderStatus;
    items: OrderItem[];
    note?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    pickupTime?: string; // for TAKEAWAY
    createdAt: string;
    updatedAt: string;
    confirmedAt?: string;
    totalAmount: number;
}

// ---- ORDER ITEM --------------------------------------------
export type ItemStatus =
    | "NEW"
    | "COOKING"
    | "READY"
    | "SERVED"
    | "CANCELLED";

export interface OrderItem {
    id: string;
    orderId: string;
    menuItemId: string;
    menuItemName: string;
    menuItemNameVi: string;
    quantity: number;
    unitPrice: number;
    note?: string;
    status: ItemStatus;
    updatedAt: string;
}

// ---- CART (client-only) ------------------------------------
export interface CartItem {
    menuItemId: string;
    menuItemName: string;
    menuItemNameVi: string;
    quantity: number;
    unitPrice: number;
    note?: string;
    imageUrl?: string;
}

// ---- PAYMENT -----------------------------------------------
export type PaymentStatus =
    | "UNPAID"
    | "PENDING"
    | "PAID"
    | "FAILED"
    | "REFUNDED";

export type PaymentMethod = "CASH" | "QR_CODE" | "CARD";

export interface Payment {
    id: string;
    orderId: string;
    sessionId?: string;
    status: PaymentStatus;
    method?: PaymentMethod;
    amount: number;
    paidAt?: string;
    customerEmail?: string; // for invoice
    invoiceSent: boolean;
}

// ---- INVOICE -----------------------------------------------
export interface Invoice {
    id: string;
    orderId: string;
    paymentId: string;
    restaurantName: string;
    restaurantAddress: string;
    tableCode?: string;
    items: OrderItem[];
    subtotal: number;
    tax: number;
    serviceCharge: number;
    total: number;
    generatedAt: string;
    sentToEmail?: string;
}

// ---- RESERVATION -------------------------------------------
export type ReservationStatus =
    | "PENDING"
    | "CONFIRMED"
    | "CANCELLED"
    | "NO_SHOW"
    | "COMPLETED";

export interface Reservation {
    id: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    partySize: number;
    date: string; // ISO
    time: string; // HH:mm
    area?: TableArea;
    note?: string;
    status: ReservationStatus;
    /** Mã phiếu đặt bàn (khách đưa tại quầy) */
    confirmationCode?: string;
    checkedInAt?: string;
    tableCode?: string;
    handledBy?: string;
    createdAt: string;
}

// ---- STAFF CALL --------------------------------------------
export interface StaffCall {
    id: string;
    tableCode: string;
    tableId: string;
    requestedAt: string;
    handledAt?: string;
    handledBy?: string;
    isResolved: boolean;
}

// ---- AUDIT LOG --------------------------------------------
export type AuditAction =
    | "ORDER_CONFIRMED"
    | "ORDER_CANCELLED"
    | "ITEM_COOK_UPDATE"
    | "ITEM_SERVED"
    | "PAYMENT_CONFIRMED"
    | "SHIFT_CLOSED"
    | "USER_CREATED"
    | "USER_DISABLED"
    | "STAFF_CALL_HANDLED";

export interface AuditLog {
    id: string;
    action: AuditAction;
    performedBy: string; // userId
    performedByName: string;
    targetId?: string;
    meta?: Record<string, unknown>;
    timestamp: string;
}

// ---- SHIFT -------------------------------------------------
export interface Shift {
    id: string;
    opensAt: string;
    closedAt?: string;
    closedBy?: string;
    totalRevenue: number;
    orderCount: number;
    paymentBreakdown: Record<PaymentMethod, number>;
    topItems: Array<{ menuItemName: string; quantity: number }>;
}

// ---- SYSTEM CONFIG ----------------------------------------
export interface SystemConfig {
    restaurantName: string;
    restaurantAddress: string;
    phone: string;
    email: string;
    logoUrl?: string;
    openTime: string;
    closeTime: string;
    taxRate: number; // e.g. 0.1 for 10%
    serviceChargeRate: number;
    invoiceEmailFrom: string;
    currency: string;
}

/** GET/PATCH /settings/restaurant — cấu hình nhà hàng & template email hóa đơn */
export interface RestaurantSettingsDto {
    id: string;
    restaurantName: string;
    hotline: string | null;
    address: string | null;
    website: string | null;
    emailFrom: string | null;
    emailTemplatePlain: string;
    emailTemplatePdf: string;
    /** HH:mm — giờ VN, ca tự mở trong khung này */
    operationsOpenTime: string;
    operationsCloseTime: string;
    updatedAt: string;
}

// ---- SOCKET EVENTS ----------------------------------------
export interface SocketEvents {
    "order:new": { order: Order; tableCode?: string };
    "order:confirmed": { orderId: string; tableCode?: string };
    "kitchen:ticket": { order: Order };
    "item:statusChanged": { itemId: string; orderId: string; status: ItemStatus };
    "table:statusChanged": { tableId: string; tableCode: string; status: TableStatus };
    "staff:call": StaffCall;
}
