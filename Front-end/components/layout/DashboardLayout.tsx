"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
    LayoutGrid, ClipboardList, ChefHat, BarChart3, UtensilsCrossed,
    Table2, CalendarDays, Settings, Users, Bell, LogOut,
    Menu, X, Volume2, VolumeX, ChevronRight, Sparkles,
} from "lucide-react";
import { StaffNotificationBell } from "@/components/StaffNotificationBell";
import { setSoundEnabled, getSoundEnabled } from "@/lib/sound";

interface NavItem {
    label: string;
    labelVi: string;
    href: string;
    icon: React.ReactNode;
    roles: string[];
}

const navItems: NavItem[] = [
    // Cashier
    { label: "Table Map", labelVi: "Sơ đồ bàn", href: "/cashier", icon: <LayoutGrid size={20} />, roles: ["cashier"] },
    { label: "Orders", labelVi: "Đơn hàng", href: "/cashier/orders", icon: <ClipboardList size={20} />, roles: ["cashier"] },
    { label: "Staff Calls", labelVi: "Gọi nhân viên", href: "/cashier/staff-calls", icon: <Bell size={20} />, roles: ["cashier"] },
    // Kitchen
    { label: "Kitchen", labelVi: "Bếp", href: "/kitchen", icon: <ChefHat size={20} />, roles: ["kitchen"] },
    // Manager (chỉ dành cho role manager, không hiện cho admin)
    { label: "Overview", labelVi: "Tổng quan", href: "/manager", icon: <BarChart3 size={20} />, roles: ["manager"] },
    { label: "Menu", labelVi: "Thực đơn", href: "/manager/menu", icon: <UtensilsCrossed size={20} />, roles: ["manager"] },
    { label: "Tables", labelVi: "Bàn & QR", href: "/manager/tables", icon: <Table2 size={20} />, roles: ["manager"] },
    { label: "Reservations", labelVi: "Đặt bàn", href: "/manager/reservations", icon: <CalendarDays size={20} />, roles: ["manager"] },
    { label: "Reports", labelVi: "Báo cáo", href: "/manager/reports", icon: <BarChart3 size={20} />, roles: ["manager"] },
    // Admin
    { label: "Users", labelVi: "Người dùng", href: "/admin/users", icon: <Users size={20} />, roles: ["admin"] },
    { label: "Settings", labelVi: "Cài đặt", href: "/admin/settings", icon: <Settings size={20} />, roles: ["admin"] },
];

const ROLE_COLORS: Record<string, string> = {
    admin: "from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/30",
    manager: "from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/30",
    cashier: "from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/30",
    kitchen: "from-orange-500/20 to-orange-500/5 text-orange-400 border-orange-500/30",
};

const ROLE_LABELS: Record<string, string> = {
    admin: "Quản trị", manager: "Quản lý", cashier: "Thu ngân", kitchen: "Bếp",
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();
    const { i18n } = useTranslation();
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [soundOn, setSoundOn] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [dateStr, setDateStr] = useState("");

    useEffect(() => {
        setSoundOn(getSoundEnabled());
        setMounted(true);
        const updateDate = () =>
            setDateStr(new Date().toLocaleDateString("vi-VN", {
                weekday: "long", day: "2-digit", month: "2-digit", year: "numeric",
            }));
        updateDate();
        const t = setInterval(updateDate, 60000);
        return () => clearInterval(t);
    }, []);

    const toggleSound = () => {
        const next = !soundOn;
        setSoundOn(next);
        setSoundEnabled(next);
    };

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    // Only compute nav after mount (user comes from sessionStorage → null on SSR)
    // user.role có thể là string "Admin" hoặc object {id, name} tùy sessionStorage
    const getRoleString = (role: unknown): string => {
        if (!role) return "";
        if (typeof role === "string") return role.toLowerCase();
        if (typeof role === "object" && role !== null && "name" in role)
            return (role as { name: string }).name.toLowerCase();
        return String(role).toLowerCase();
    };
    const userRole = getRoleString(user?.role);

    const filteredNav = mounted ? navItems.filter((item) =>
        user ? item.roles.includes(userRole) : false
    ) : [];
    const deduped = filteredNav.reduce<NavItem[]>((acc, item) => {
        if (!acc.find((a) => a.href === item.href)) acc.push(item);
        return acc;
    }, []);

    const lang = i18n.language === "vi" ? "vi" : "en";
    const normalizedRole = userRole || "cashier";
    const roleColor = ROLE_COLORS[normalizedRole] ?? ROLE_COLORS["cashier"];

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: "#0A0A0A" }}>

            {/* ── SIDEBAR ──────────────────────────────── */}
            <aside
                className={cn(
                    "flex flex-col shrink-0 transition-all duration-300 relative",
                    sidebarOpen ? "w-72" : "w-[70px]"
                )}
                style={{
                    background: "linear-gradient(180deg, #111111 0%, #0D0D0D 100%)",
                    borderRight: "1px solid rgba(255,255,255,0.06)",
                }}
            >
                {/* Top gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-px"
                    style={{ background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.5), transparent)" }} />

                {/* Logo */}
                <div className={cn(
                    "flex items-center border-b border-white/10 transition-all duration-300",
                    sidebarOpen ? "px-5 py-4 gap-3" : "px-0 py-4 justify-center"
                )}>
                    {sidebarOpen && (
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] tracking-[0.2em] uppercase text-gold/70">The Albion</p>
                            <p className="text-sm font-semibold text-cream tracking-tight">Management</p>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg text-cream/40 hover:bg-white/5 hover:text-cream transition-colors"
                    >
                        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>

                {/* Nav items */}
                <nav className="flex-1 py-3 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                    {deduped.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/" && item.href.length > 1 && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                {...(!sidebarOpen ? { title: lang === "vi" ? item.labelVi : item.label } : {})}
                                className={cn(
                                    "sidebar-item",
                                    isActive && "active",
                                    !sidebarOpen && "justify-center px-0 mx-2"
                                )}
                            >
                                <span className="shrink-0">{item.icon}</span>
                                {sidebarOpen && (
                                    <>
                                        <span className="truncate">{lang === "vi" ? item.labelVi : item.label}</span>
                                        {isActive && <ChevronRight size={12} className="ml-auto shrink-0 opacity-60" />}
                                    </>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User section */}
                <div className="border-t border-white/10 p-3">
                    {sidebarOpen ? (
                        <div className={cn("flex items-center gap-3 rounded-xl px-3 py-3 mb-2 border bg-gradient-to-r", roleColor)}>
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 bg-gold/20 text-gold border border-gold/30">
                                {user?.fullName?.[0] ?? "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-cream truncate">{user?.fullName}</p>
                                <p className="text-xs text-cream/50 truncate">{ROLE_LABELS[normalizedRole] ?? user?.role}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center mb-2">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold bg-gold/20 text-gold border border-gold/30">
                                {user?.fullName?.[0] ?? "?"}
                            </div>
                        </div>
                    )}
                    <div className={cn("flex gap-2", !sidebarOpen && "flex-col items-center")}>
                        <button
                            onClick={toggleSound}
                            title={soundOn ? "Tắt âm thanh" : "Bật âm thanh"}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs text-cream/50 hover:bg-white/5 hover:text-cream/80 transition-colors"
                        >
                            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
                            {sidebarOpen && <span>{soundOn ? "Âm thanh" : "Im lặng"}</span>}
                        </button>
                        <button
                            onClick={handleLogout}
                            title="Đăng xuất"
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs text-cream/50 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        >
                            <LogOut size={16} />
                            {sidebarOpen && <span>Đăng xuất</span>}
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── MAIN AREA ─────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Topbar */}
                <header className="flex items-center justify-between px-5 lg:px-6 py-3.5 shrink-0 bg-charcoal/95 backdrop-blur-md border-b border-white/10">
                    <div suppressHydrationWarning>
                        <h2 className="text-sm font-semibold text-cream/90" suppressHydrationWarning>
                            {mounted ? (deduped.find(n => pathname === n.href || (n.href.length > 1 && pathname.startsWith(n.href)))?.labelVi ?? "Dashboard") : ""}
                        </h2>
                        <p className="text-xs text-cream/40 mt-0.5" suppressHydrationWarning>
                            {dateStr}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <StaffNotificationBell />
                        <button
                            onClick={() => i18n.changeLanguage(i18n.language === "en" ? "vi" : "en")}
                            className="text-[10px] tracking-widest uppercase font-medium px-2.5 py-1.5 rounded-lg border border-white/10 text-cream/50 hover:border-gold/40 hover:text-cream/80 transition-colors"
                        >
                            {i18n.language === "en" ? "VI" : "EN"}
                        </button>
                        <div
                            className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10"
                            suppressHydrationWarning
                        >
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold bg-gold/20 text-gold border border-gold/30" suppressHydrationWarning>
                                {mounted ? (user?.fullName?.[0] ?? "?") : ""}
                            </div>
                            <span className="text-sm font-medium text-cream/90 hidden sm:block" suppressHydrationWarning>
                                {mounted ? user?.fullName : ""}
                            </span>
                            <Sparkles size={12} className="text-gold/80 hidden sm:block" />
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto p-5 lg:p-6"
                    style={{ background: "linear-gradient(180deg, #0D0D0D 0%, #0A0A0A 100%)" }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
