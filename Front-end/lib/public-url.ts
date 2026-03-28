/**
 * Gốc URL cho link/QR khách (đặt món tại bàn).
 * Ưu tiên NEXT_PUBLIC_FRONTEND_URL: khi NV mở quản lý bằng localhost, QR vẫn trỏ đúng IP LAN / domain cho điện thoại.
 */
export function getPublicFrontendOrigin(): string {
    const fromEnv =
        typeof process !== "undefined" ? process.env.NEXT_PUBLIC_FRONTEND_URL?.trim() : undefined;
    if (fromEnv) return fromEnv.replace(/\/$/, "");
    if (typeof window !== "undefined") return window.location.origin;
    return "http://localhost:3001";
}
