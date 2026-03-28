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

    /** GET nhị phân (PDF, …) — trả blob + tên file từ Content-Disposition */
    getBlob: async (path: string): Promise<{ blob: Blob; filename: string }> => {
        const res = await apiFetch(path);
        if (!res.ok) {
            const text = await res.text();
            let msg = "";
            try {
                const json = JSON.parse(text) as Record<string, unknown>;
                const m = json.message;
                if (typeof m === "string") msg = m;
                else if (Array.isArray(m) && m.length && typeof m[0] === "string") msg = m.join(" ");
            } catch {
                msg = text.slice(0, 200);
            }
            throw new Error(msg || `HTTP ${res.status}`);
        }
        const blob = await res.blob();
        const cd = res.headers.get("Content-Disposition") || "";
        const m = cd.match(/filename\*?=(?:UTF-8''|")?([^";\n]+)/i) || cd.match(/filename="?([^";]+)"?/i);
        const raw = m?.[1]?.trim();
        const filename = raw ? decodeURIComponent(raw.replace(/^"|"$/g, "")) : "download.bin";
        return { blob, filename };
    },

    /** Gọi API không cần auth (public endpoints) */
    publicPost: (path: string, body?: unknown) =>
        fetch(`${BASE_URL}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        }),

    publicGet: (path: string) =>
        fetch(`${BASE_URL}${path}`, { method: "GET" }),

    publicPatch: (path: string, body?: unknown) =>
        fetch(`${BASE_URL}${path}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body ?? {}),
        }),

    /** GET nhị phân không JWT (PDF khách QR) */
    publicGetBlob: async (path: string): Promise<{ blob: Blob; filename: string }> => {
        const res = await fetch(`${BASE_URL}${path}`);
        if (!res.ok) {
            const text = await res.text();
            let msg = "";
            try {
                const json = JSON.parse(text) as Record<string, unknown>;
                const m = json.message;
                if (typeof m === "string") msg = m;
                else if (Array.isArray(m) && m.length && typeof m[0] === "string") msg = m.join(" ");
            } catch {
                msg = text.slice(0, 200);
            }
            throw new Error(msg || `HTTP ${res.status}`);
        }
        const blob = await res.blob();
        const cd = res.headers.get("Content-Disposition") || "";
        const m = cd.match(/filename\*?=(?:UTF-8''|")?([^";\n]+)/i) || cd.match(/filename="?([^";]+)"?/i);
        const raw = m?.[1]?.trim();
        const filename = raw ? decodeURIComponent(raw.replace(/^"|"$/g, "")) : "invoice.pdf";
        return { blob, filename };
    },
};

function extractApiErrorMessage(json: unknown): string {
    if (!json || typeof json !== "object") return "";
    const o = json as Record<string, unknown>;
    const m = o.message;
    if (typeof m === "string" && m.trim()) return m;
    if (Array.isArray(m)) {
        const parts = m.filter((x): x is string => typeof x === "string");
        if (parts.length) return parts.join(" ");
    }
    if (typeof o.error === "string" && o.error.trim()) return o.error;
    return "";
}

/** Parse response, trả về data hoặc throw error */
export async function parseResponse<T>(res: Response): Promise<T> {
    const text = await res.text();
    let json: unknown = {};
    if (text) {
        try {
            json = JSON.parse(text) as unknown;
        } catch {
            throw new Error(`HTTP ${res.status}: ${res.statusText || "Phản hồi không hợp lệ"}`);
        }
    }
    if (!res.ok) {
        const msg = extractApiErrorMessage(json);
        throw new Error(msg || `HTTP ${res.status}`);
    }
    const j = json as Record<string, unknown>;
    return (j.data ?? j) as T;
}

export { saveTokens, clearTokens };
