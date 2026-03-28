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
        CLAIMS.SHIFT_OPEN,
        CLAIMS.SHIFT_EXPENSE,
        CLAIMS.SHIFT_APPROVE_DIFF,
    ],
    cashier: [
        CLAIMS.ORDER_READ, CLAIMS.ORDER_CONFIRM, CLAIMS.ORDER_UPDATE, CLAIMS.ORDER_CANCEL,
        CLAIMS.TABLE_READ, CLAIMS.TABLE_UPDATE,
        CLAIMS.ITEM_SERVE,
        CLAIMS.STAFF_CALL_HANDLE,
        CLAIMS.PAYMENT_READ, CLAIMS.PAYMENT_CONFIRM,
        CLAIMS.INVOICE_GENERATE, CLAIMS.INVOICE_SEND_EMAIL,
        CLAIMS.SHIFT_OPEN,
        CLAIMS.SHIFT_EXPENSE,
        CLAIMS.SHIFT_CLOSE,
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
// Giữ sẵn sơ đồ bàn (mã bàn, khu vực, sức chứa) nhưng tất cả ở trạng thái trống
export const mockTables: Table[] = [
    { id: "t1", tableCode: "A1", area: "indoor", capacity: 2, status: "EMPTY" },
    { id: "t2", tableCode: "A2", area: "indoor", capacity: 2, status: "EMPTY" },
    { id: "t3", tableCode: "A3", area: "indoor", capacity: 4, status: "EMPTY" },
    { id: "t4", tableCode: "A4", area: "indoor", capacity: 4, status: "EMPTY" },
    { id: "t5", tableCode: "A5", area: "indoor", capacity: 6, status: "EMPTY" },
    { id: "t6", tableCode: "B1", area: "outdoor", capacity: 2, status: "EMPTY" },
    { id: "t7", tableCode: "B2", area: "outdoor", capacity: 4, status: "EMPTY" },
    { id: "t8", tableCode: "B3", area: "outdoor", capacity: 4, status: "EMPTY" },
    { id: "t9", tableCode: "R1", area: "rooftop", capacity: 2, status: "EMPTY" },
    { id: "t10", tableCode: "R2", area: "rooftop", capacity: 4, status: "EMPTY" },
    { id: "t11", tableCode: "R3", area: "rooftop", capacity: 6, status: "EMPTY" },
    { id: "t12", tableCode: "BAR1", area: "bar", capacity: 1, status: "EMPTY" },
];

// ---- MOCK ORDERS -------------------------------------------
// Xoá dữ liệu demo, để trống – sẽ dùng dữ liệu thật từ backend
export const mockOrders: Order[] = [];

// ---- MOCK RESERVATIONS -------------------------------------
// Đã xoá dữ liệu demo, để trống cho dữ liệu thật từ backend
export const mockReservations: Reservation[] = [];

// ---- MOCK STAFF CALLS --------------------------------------
export const mockStaffCalls: StaffCall[] = [];

// ---- MOCK AUDIT LOGS ---------------------------------------
export const mockAuditLogs: AuditLog[] = [];

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
export const mockSessions: TableSession[] = [];
