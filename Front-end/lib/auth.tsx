"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AuthUser, ClaimValue, UserRole } from "@/lib/types";
import { mockUsers } from "@/lib/mock/data";

interface AuthContextType {
    user: AuthUser | null;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => void;
    hasClaim: (claim: ClaimValue) => boolean;
    hasRole: (role: UserRole) => boolean;
    hasAnyClaim: (claims: ClaimValue[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(() => {
        // Persist auth in sessionStorage (mock)
        if (typeof window !== "undefined") {
            const stored = sessionStorage.getItem("auth_user");
            if (stored) return JSON.parse(stored);
        }
        return null;
    });

    const login = useCallback(async (email: string, _password: string) => {
        // Mock: find user by email (any password works in mock)
        const found = mockUsers.find(
            (u) => u.email.toLowerCase() === email.toLowerCase() && u.isActive
        );
        if (!found) {
            return { success: false, error: "Email hoặc mật khẩu không đúng" };
        }
        const authUser: AuthUser = {
            ...found,
            token: `mock_jwt_${found.id}_${Date.now()}`,
        };
        sessionStorage.setItem("auth_user", JSON.stringify(authUser));
        setUser(authUser);
        return { success: true };
    }, []);

    const logout = useCallback(() => {
        sessionStorage.removeItem("auth_user");
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
