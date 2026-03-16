/**
 * API Client — tự gắn Bearer JWT token vào mọi request.
 * Xử lý 401: tự refresh token rồi retry 1 lần.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function getTokens() {
    if (typeof window === "undefined") return { accessToken: null, refreshToken: null };
    return {
        accessToken: sessionStorage.getItem("accessToken"),
        refreshToken: sessionStorage.getItem("refreshToken"),
    };
}

function saveTokens(accessToken: string, refreshToken: string) {
    sessionStorage.setItem("accessToken", accessToken);
    sessionStorage.setItem("refreshToken", refreshToken);
}

function clearTokens() {
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("auth_user");
}

async function refreshAccessToken(): Promise<string | null> {
    const { refreshToken } = getTokens();
    if (!refreshToken) return null;
    try {
        const res = await fetch(`${BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
        });
        if (!res.ok) { clearTokens(); return null; }
        const data = await res.json();
        const newAccess = data.data?.accessToken || data.accessToken;
        const newRefresh = data.data?.refreshToken || data.refreshToken;
        if (newAccess) saveTokens(newAccess, newRefresh || refreshToken);
        return newAccess || null;
    } catch {
        clearTokens();
        return null;
    }
}

async function apiFetch(path: string, options: RequestInit = {}, retry = true): Promise<Response> {
    const { accessToken } = getTokens();
    const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

    if (res.status === 401 && retry) {
        const newToken = await refreshAccessToken();
        if (!newToken) {
            // Force logout
            if (typeof window !== "undefined") window.location.href = "/login";
            return res;
        }
        return apiFetch(path, options, false);
    }

    return res;
}

export const api = {
    get: (path: string) => apiFetch(path),
    post: (path: string, body?: unknown) =>
        apiFetch(path, { method: "POST", body: JSON.stringify(body) }),
    patch: (path: string, body?: unknown) =>
        apiFetch(path, { method: "PATCH", body: JSON.stringify(body) }),
    delete: (path: string) => apiFetch(path, { method: "DELETE" }),

    /** Gọi API không cần auth (public endpoints) */
    publicPost: (path: string, body?: unknown) =>
        fetch(`${BASE_URL}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        }),
};

/** Parse response, trả về data hoặc throw error */
export async function parseResponse<T>(res: Response): Promise<T> {
    const json = await res.json();
    if (!res.ok) {
        throw new Error(json.message || `HTTP ${res.status}`);
    }
    // NestJS TransformInterceptor bọc data trong { data: ... }
    return (json.data ?? json) as T;
}

export { saveTokens, clearTokens };
