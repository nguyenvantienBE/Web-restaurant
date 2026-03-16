"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AuthUser, ClaimValue, UserRole } from "@/lib/types";
import { api, saveTokens, clearTokens } from "@/lib/api";

interface AuthContextType {
    user: AuthUser | null;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    hasClaim: (claim: ClaimValue) => boolean;
    hasRole: (role: UserRole) => boolean;
    hasAnyClaim: (claims: ClaimValue[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(() => {
        if (typeof window !== "undefined") {
            try {
                const stored = sessionStorage.getItem("auth_user");
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // Validate role is a clean lowercase string — not an object
                    const role = parsed?.role;
                    if (typeof role === "object" && role !== null) {
                        // Role is object {id, name} — stale format, clear and re-login
                        sessionStorage.clear();
                        return null;
                    }
                    // Normalize to lowercase nếu chưa lowercase
                    if (typeof role === "string" && role !== role.toLowerCase()) {
                        parsed.role = role.toLowerCase();
                        sessionStorage.setItem("auth_user", JSON.stringify(parsed));
                    }
                    return parsed;
                }
            } catch {
                sessionStorage.clear();
            }
        }
        return null;
    });

    const login = useCallback(async (email: string, password: string) => {
        try {
            const res = await api.publicPost("/auth/login", { email, password });
            const json = await res.json();

            if (!res.ok) {
                return {
                    success: false,
                    error: json.message || "Email hoặc mật khẩu không đúng",
                };
            }

            // Backend trả về: { data: { user, accessToken, refreshToken } }
            const payload = json.data ?? json;
            const { user: userInfo, accessToken, refreshToken } = payload;

            // Lưu tokens
            saveTokens(accessToken, refreshToken);

            const authUser: AuthUser = {
                id: userInfo.id,
                email: userInfo.email,
                fullName: userInfo.fullName,
                role: (userInfo.role?.name ?? userInfo.role)?.toLowerCase() as UserRole,
                claims: userInfo.claims ?? [],
                isActive: true,
                createdAt: new Date().toISOString(),
                token: accessToken,
            };

            sessionStorage.setItem("auth_user", JSON.stringify(authUser));
            setUser(authUser);
            return { success: true };
        } catch (err: unknown) {
            return {
                success: false,
                error: err instanceof Error ? err.message : "Đăng nhập thất bại",
            };
        }
    }, []);

    const logout = useCallback(async () => {
        const refreshToken = sessionStorage.getItem("refreshToken");
        if (refreshToken) {
            try {
                await api.publicPost("/auth/logout", { refreshToken });
            } catch {
                // ignore logout errors
            }
        }
        clearTokens();
        setUser(null);
    }, []);

    const hasClaim = useCallback(
        (claim: ClaimValue) => user?.claims.includes(claim) ?? false,
        [user]
    );

    const hasRole = useCallback(
        (role: UserRole) => user?.role === role,
        [user]
    );

    const hasAnyClaim = useCallback(
        (claims: ClaimValue[]) => claims.some((c) => user?.claims.includes(c)),
        [user]
    );

    return (
        <AuthContext.Provider value={{ user, login, logout, hasClaim, hasRole, hasAnyClaim }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
