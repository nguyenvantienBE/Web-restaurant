import {
    User,
    UserRole,
    ClaimValue,
    Category,
    MenuItem,
    Table,
    TableSession,
    Order,
    OrderItem,
    Reservation,
    StaffCall,
    AuditLog,
    SystemConfig,
    CLAIMS,
} from "@/lib/types";

// ---- ROLE CLAIM PRESETS ------------------------------------
export const ROLE_CLAIMS: Record<UserRole, ClaimValue[]> = {
    admin: Object.values(CLAIMS) as ClaimValue[],
    manager: [
        CLAIMS.MENU_READ, CLAIMS.MENU_CREATE, CLAIMS.MENU_UPDATE, CLAIMS.MENU_DELETE,
        CLAIMS.CATEGORY_READ, CLAIMS.CATEGORY_CREATE, CLAIMS.CATEGORY_UPDATE, CLAIMS.CATEGORY_DELETE,
        CLAIMS.TABLE_READ, CLAIMS.TABLE_CREATE, CLAIMS.TABLE_UPDATE, CLAIMS.TABLE_DELETE,
        CLAIMS.QR_GENERATE,
        CLAIMS.ORDER_READ,
        CLAIMS.REPORT_VIEW,
        CLAIMS.SHIFT_CLOSE,
    ],
    cashier: [
        CLAIMS.ORDER_READ, CLAIMS.ORDER_CONFIRM, CLAIMS.ORDER_UPDATE, CLAIMS.ORDER_CANCEL,
        CLAIMS.TABLE_READ, CLAIMS.TABLE_UPDATE,
        CLAIMS.ITEM_SERVE,
        CLAIMS.STAFF_CALL_HANDLE,
        CLAIMS.PAYMENT_READ, CLAIMS.PAYMENT_CONFIRM,
        CLAIMS.INVOICE_GENERATE, CLAIMS.INVOICE_SEND_EMAIL,
    ],
    kitchen: [
        CLAIMS.KITCHEN_TICKET_READ,
        CLAIMS.ITEM_COOK_UPDATE,
        CLAIMS.KITCHEN_PRINT,
    ],
};

// ---- MOCK USERS --------------------------------------------
export const mockUsers: User[] = [
    {
        id: "u1",
        email: "admin@albion.vn",
        fullName: "Nguyễn Admin",
        role: "admin",
        claims: ROLE_CLAIMS.admin,
        isActive: true,
        createdAt: "2025-01-01T00:00:00Z",
        lastLogin: "2026-02-25T10:00:00Z",
    },
    {
        id: "u2",
        email: "manager@albion.vn",
        fullName: "Trần Quản Lý",
        role: "manager",
        claims: ROLE_CLAIMS.manager,
        isActive: true,
        createdAt: "2025-01-05T00:00:00Z",
        lastLogin: "2026-02-25T09:00:00Z",
    },
    {
        id: "u3",
        email: "cashier@albion.vn",
        fullName: "Lê Thu Ngân",
        role: "cashier",
        claims: ROLE_CLAIMS.cashier,
        isActive: true,
        createdAt: "2025-02-01T00:00:00Z",
        lastLogin: "2026-02-25T17:30:00Z",
    },
    {
        id: "u4",
        email: "kitchen@albion.vn",
        fullName: "Phạm Bếp Trưởng",
        role: "kitchen",
        claims: ROLE_CLAIMS.kitchen,
        isActive: true,
        createdAt: "2025-02-01T00:00:00Z",
        lastLogin: "2026-02-25T17:00:00Z",
    },
    {
        id: "u5",
        email: "cashier2@albion.vn",
        fullName: "Hoàng Văn Ca",
        role: "cashier",
        claims: ROLE_CLAIMS.cashier,
        isActive: false,
        createdAt: "2025-03-01T00:00:00Z",
    },
];

// ---- MOCK CATEGORIES ---------------------------------------
export const mockCategories: Category[] = [
    { id: "cat1", name: "Starters", nameVi: "Khai Vị", sortOrder: 1, isActive: true },
    { id: "cat2", name: "Main Courses", nameVi: "Món Chính", sortOrder: 2, isActive: true },
    { id: "cat3", name: "Desserts", nameVi: "Tráng Miệng", sortOrder: 3, isActive: true },
    { id: "cat4", name: "Cocktails", nameVi: "Cocktail", sortOrder: 4, isActive: true },
    { id: "cat5", name: "Wine", nameVi: "Rượu Vang", sortOrder: 5, isActive: true },
    { id: "cat6", name: "Non-Alcoholic", nameVi: "Không Cồn", sortOrder: 6, isActive: true },
];

// ---- MOCK MENU ITEMS ---------------------------------------
export const mockMenuItems: MenuItem[] = [
    // Starters
    {
        id: "m1", categoryId: "cat1",
        name: "The Albion Tomato", nameVi: "Cà Chua The Albion",
        description: "Organic Da Lat tomatoes, housemade ketchup, basil-orange sorbet",
        descriptionVi: "Cà chua hữu cơ Đà Lạt, tương cà tự làm, sorbet chanh xanh",
        price: 285000, imageUrl: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&q=80",
        isAvailable: true, unit: "dish", preparationTime: 8, tags: ["signature", "vegetarian"],
    },
    {
        id: "m2", categoryId: "cat1",
        name: "Oysters Natural", nameVi: "Hàu Tươi Tự Nhiên",
        description: "Fresh oysters from Japan, shallot vinaigrette, lemon",
        descriptionVi: "Hàu tươi từ Nhật, giấm hành tây, chanh tươi",
        price: 350000, imageUrl: "https://images.unsplash.com/photo-1606731219412-3b1c6b9a7c58?w=400&q=80",
        isAvailable: true, unit: "dish", preparationTime: 5,
    },
    {
        id: "m3", categoryId: "cat1",
        name: "Langoustine Platter", nameVi: "Tôm Hùm Nhỏ",
        description: "Langoustines with classic cocktail sauce",
        descriptionVi: "Tôm hùm nhỏ với sốt cocktail truyền thống",
        price: 520000, imageUrl: "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=400&q=80",
        isAvailable: true, unit: "dish", preparationTime: 10,
    },
    // Mains
    {
        id: "m4", categoryId: "cat2",
        name: "Roast Lamb", nameVi: "Thịt Cừu Nướng",
        description: "Roast lamb with fresh mint sauce, seasonal vegetables",
        descriptionVi: "Cừu nướng với sốt bạc hà tươi, rau củ theo mùa",
        price: 650000, imageUrl: "https://images.unsplash.com/photo-1544025162-d76594f0af5b?w=400&q=80",
        isAvailable: true, unit: "dish", preparationTime: 20, tags: ["bestseller"],
    },
    {
        id: "m5", categoryId: "cat2",
        name: "Roasted Scallops", nameVi: "Sò Điệp Nướng",
        description: "Sweet roasted scallops with BBQ cabbage",
        descriptionVi: "Sò điệp nướng ngọt với bắp cải BBQ",
        price: 480000, imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&q=80",
        isAvailable: true, unit: "dish", preparationTime: 15, tags: ["seafood"],
    },
    {
        id: "m6", categoryId: "cat2",
        name: "Roast Beef", nameVi: "Bò Nướng",
        description: "Prime roast beef with horseradish cream",
        descriptionVi: "Thịt bò thượng hạng với kem cải horseradish",
        price: 720000, imageUrl: "https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=400&q=80",
        isAvailable: false, unit: "dish", preparationTime: 25, tags: ["bestseller"],
    },
    // Desserts
    {
        id: "m7", categoryId: "cat3",
        name: "Eton Mess", nameVi: "Eton Mess",
        description: "Classic British dessert, strawberries, cream, meringue",
        descriptionVi: "Tráng miệng Anh kinh điển, dâu tây, kem, bánh meringue",
        price: 195000, imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80",
        isAvailable: true, unit: "dish", preparationTime: 5, tags: ["signature"],
    },
    // Bar
    {
        id: "m8", categoryId: "cat4",
        name: "Albion Negroni", nameVi: "Negroni Albion",
        description: "Gin, Campari, sweet vermouth, orange peel",
        descriptionVi: "Gin, Campari, rượu vermouth ngọt, vỏ cam",
        price: 220000, imageUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&q=80",
        isAvailable: true, unit: "glass", preparationTime: 3,
    },
    {
        id: "m9", categoryId: "cat4",
        name: "British Elderflower Spritz", nameVi: "Elderflower Spritz",
        description: "St. Germain, champagne, elderflower soda",
        descriptionVi: "St. Germain, champagne, nước soda hoa cổ thụ",
        price: 195000, isAvailable: true, unit: "glass", preparationTime: 3,
    },
    {
        id: "m10", categoryId: "cat6",
        name: "Fresh Lemonade", nameVi: "Nước Chanh Tươi",
        description: "Freshly squeezed lemon, mint, sparkling water",
        descriptionVi: "Chanh tươi vắt, bạc hà, nước có gas",
        price: 85000, isAvailable: true, unit: "glass", preparationTime: 2,
    },
];

// ---- MOCK TABLES -------------------------------------------
export const mockTables: Table[] = [
    { id: "t1", tableCode: "A1", area: "indoor", capacity: 2, status: "EMPTY" },
    { id: "t2", tableCode: "A2", area: "indoor", capacity: 2, status: "ORDERING" },
    { id: "t3", tableCode: "A3", area: "indoor", capacity: 4, status: "SERVING" },
    { id: "t4", tableCode: "A4", area: "indoor", capacity: 4, status: "NEED_PAYMENT" },
    { id: "t5", tableCode: "A5", area: "indoor", capacity: 6, status: "EMPTY" },
    { id: "t6", tableCode: "B1", area: "outdoor", capacity: 2, status: "SEATED" },
    { id: "t7", tableCode: "B2", area: "outdoor", capacity: 4, status: "EMPTY" },
    { id: "t8", tableCode: "B3", area: "outdoor", capacity: 4, status: "NEED_CLEAN" },
    { id: "t9", tableCode: "R1", area: "rooftop", capacity: 2, status: "EMPTY" },
    { id: "t10", tableCode: "R2", area: "rooftop", capacity: 4, status: "SERVING" },
    { id: "t11", tableCode: "R3", area: "rooftop", capacity: 6, status: "EMPTY" },
    { id: "t12", tableCode: "BAR1", area: "bar", capacity: 1, status: "SEATED" },
];

// ---- MOCK ORDERS -------------------------------------------
export const mockOrders: Order[] = [
    {
        id: "ord1", tableId: "t2", tableCode: "A2", sessionId: "sess1",
        type: "DINE_IN", status: "NEW",
        items: [
            { id: "oi1", orderId: "ord1", menuItemId: "m1", menuItemName: "The Albion Tomato", menuItemNameVi: "Cà Chua The Albion", quantity: 2, unitPrice: 285000, status: "NEW", updatedAt: "2026-02-25T17:45:00Z" },
            { id: "oi2", orderId: "ord1", menuItemId: "m8", menuItemName: "Albion Negroni", menuItemNameVi: "Negroni Albion", quantity: 2, unitPrice: 220000, status: "NEW", updatedAt: "2026-02-25T17:45:00Z" },
        ],
        note: "Allergy: nuts", totalAmount: 1010000,
        createdAt: "2026-02-25T17:45:00Z", updatedAt: "2026-02-25T17:45:00Z",
    },
    {
        id: "ord2", tableId: "t3", tableCode: "A3", sessionId: "sess2",
        type: "DINE_IN", status: "IN_PROGRESS",
        items: [
            { id: "oi3", orderId: "ord2", menuItemId: "m4", menuItemName: "Roast Lamb", menuItemNameVi: "Thịt Cừu Nướng", quantity: 2, unitPrice: 650000, status: "COOKING", updatedAt: "2026-02-25T18:00:00Z" },
            { id: "oi4", orderId: "ord2", menuItemId: "m5", menuItemName: "Roasted Scallops", menuItemNameVi: "Sò Điệp Nướng", quantity: 1, unitPrice: 480000, status: "READY", updatedAt: "2026-02-25T18:05:00Z" },
            { id: "oi5", orderId: "ord2", menuItemId: "m7", menuItemName: "Eton Mess", menuItemNameVi: "Eton Mess", quantity: 2, unitPrice: 195000, status: "NEW", updatedAt: "2026-02-25T18:00:00Z" },
        ],
        totalAmount: 1970000, createdAt: "2026-02-25T18:00:00Z", updatedAt: "2026-02-25T18:05:00Z",
        confirmedAt: "2026-02-25T18:02:00Z",
    },
    {
        id: "ord3", tableId: "t4", tableCode: "A4", sessionId: "sess3",
        type: "DINE_IN", status: "SERVED",
        items: [
            { id: "oi6", orderId: "ord3", menuItemId: "m2", menuItemName: "Oysters Natural", menuItemNameVi: "Hàu Tươi", quantity: 1, unitPrice: 350000, status: "SERVED", updatedAt: "2026-02-25T17:30:00Z" },
            { id: "oi7", orderId: "ord3", menuItemId: "m4", menuItemName: "Roast Lamb", menuItemNameVi: "Thịt Cừu Nướng", quantity: 1, unitPrice: 650000, status: "SERVED", updatedAt: "2026-02-25T17:50:00Z" },
        ],
        totalAmount: 1000000, createdAt: "2026-02-25T17:00:00Z", updatedAt: "2026-02-25T17:50:00Z",
        confirmedAt: "2026-02-25T17:05:00Z",
    },
    {
        id: "ord4", type: "TAKEAWAY", status: "CONFIRMED",
        customerName: "Nguyễn Minh", customerPhone: "0908123456",
        pickupTime: "2026-02-25T19:00:00Z",
        items: [
            { id: "oi8", orderId: "ord4", menuItemId: "m1", menuItemName: "The Albion Tomato", menuItemNameVi: "Cà Chua The Albion", quantity: 1, unitPrice: 285000, status: "COOKING", updatedAt: "2026-02-25T18:10:00Z" },
            { id: "oi9", orderId: "ord4", menuItemId: "m10", menuItemName: "Fresh Lemonade", menuItemNameVi: "Nước Chanh Tươi", quantity: 2, unitPrice: 85000, status: "READY", updatedAt: "2026-02-25T18:12:00Z" },
        ],
        totalAmount: 455000, createdAt: "2026-02-25T18:10:00Z", updatedAt: "2026-02-25T18:12:00Z",
        confirmedAt: "2026-02-25T18:11:00Z",
    },
];

// ---- MOCK RESERVATIONS -------------------------------------
export const mockReservations: Reservation[] = [
    {
        id: "res1", customerName: "Trần Thanh Hương", customerPhone: "0901234567",
        customerEmail: "huong@gmail.com", partySize: 4,
        date: "2026-02-26", time: "19:00", area: "rooftop",
        note: "Anniversary dinner", status: "PENDING",
        createdAt: "2026-02-25T10:00:00Z",
    },
    {
        id: "res2", customerName: "Lê Minh Tú", customerPhone: "0912345678",
        partySize: 2, date: "2026-02-26", time: "18:00",
        area: "indoor", status: "CONFIRMED",
        createdAt: "2026-02-24T15:00:00Z",
    },
    {
        id: "res3", customerName: "Phạm Quốc Bảo", customerPhone: "0923456789",
        partySize: 6, date: "2026-02-25", time: "20:00",
        area: "outdoor", note: "Birthday party",
        status: "CANCELLED", createdAt: "2026-02-23T09:00:00Z",
    },
    {
        id: "res4", customerName: "Nguyễn Thị Mai", customerPhone: "0934567890",
        partySize: 2, date: "2026-02-27", time: "19:30",
        area: "bar", status: "PENDING", createdAt: "2026-02-25T14:00:00Z",
    },
];

// ---- MOCK STAFF CALLS --------------------------------------
export const mockStaffCalls: StaffCall[] = [
    {
        id: "sc1", tableCode: "A3", tableId: "t3",
        requestedAt: "2026-02-25T18:10:00Z",
        isResolved: false,
    },
    {
        id: "sc2", tableCode: "R2", tableId: "t10",
        requestedAt: "2026-02-25T18:05:00Z",
        handledAt: "2026-02-25T18:07:00Z",
        handledBy: "u3", isResolved: true,
    },
];

// ---- MOCK AUDIT LOGS ---------------------------------------
export const mockAuditLogs: AuditLog[] = [
    {
        id: "al1", action: "ORDER_CONFIRMED", performedBy: "u3", performedByName: "Lê Thu Ngân",
        targetId: "ord2", timestamp: "2026-02-25T18:02:00Z",
    },
    {
        id: "al2", action: "ITEM_COOK_UPDATE", performedBy: "u4", performedByName: "Phạm Bếp Trưởng",
        targetId: "oi4", meta: { from: "COOKING", to: "READY" }, timestamp: "2026-02-25T18:05:00Z",
    },
    {
        id: "al3", action: "STAFF_CALL_HANDLED", performedBy: "u3", performedByName: "Lê Thu Ngân",
        targetId: "sc2", timestamp: "2026-02-25T18:07:00Z",
    },
];

// ---- SYSTEM CONFIG -----------------------------------------
export const mockSystemConfig: SystemConfig = {
    restaurantName: "The Albion by Kirk",
    restaurantAddress: "Floor 23, 76-78 Nguyen Thi Minh Khai, District 3, Ho Chi Minh City",
    phone: "0901 379 129",
    email: "tuong.cat@accor.com",
    openTime: "17:30",
    closeTime: "23:30",
    taxRate: 0.1,
    serviceChargeRate: 0.05,
    invoiceEmailFrom: "invoice@albion.vn",
    currency: "VND",
};

// ---- TABLE SESSION MOCK ------------------------------------
export const mockSessions: TableSession[] = [
    { id: "sess1", tableId: "t2", tableCode: "A2", status: "OPEN", openedAt: "2026-02-25T17:40:00Z" },
    { id: "sess2", tableId: "t3", tableCode: "A3", status: "OPEN", openedAt: "2026-02-25T17:55:00Z", customerCount: 3 },
    { id: "sess3", tableId: "t4", tableCode: "A4", status: "OPEN", openedAt: "2026-02-25T17:00:00Z", customerCount: 2 },
];
