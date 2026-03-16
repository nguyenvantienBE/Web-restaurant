"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useTables } from "@/lib/hooks/useTables";
import { useOrders } from "@/lib/hooks/useOrders";
import { useMenuItems } from "@/lib/hooks/useMenu";
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, UtensilsCrossed, Table2, Package, Clock, Loader2 } from "lucide-react";

const TOOLTIP_STYLE = {
    background: "#141414",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#F5F0E8",
    fontSize: 11,
    borderRadius: 4,
};

const formatPrice = (p: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })
        .format(p).replace("₫", "đ");
const formatM = (p: number) => `${(p / 1_000_000).toFixed(1)}M`;

export default function ManagerPage() {
    const { data: tables = [], isLoading: tablesLoading } = useTables();
    const { data: orders = [], isLoading: ordersLoading } = useOrders();
    const { data: menuItems = [], isLoading: menuLoading } = useMenuItems();

    const isLoading = tablesLoading || ordersLoading || menuLoading;

    // Stats từ dữ liệu thật
    const totalRevenue = orders
        .filter((o) => ["SERVED", "COMPLETED", "PAID"].includes(o.status))
        .reduce((s, o) => s + (o.totalAmount || 0), 0);

    const occupiedTables = tables.filter((t) =>
        !["EMPTY", "NEED_CLEAN"].includes(t.status)
    ).length;

    const pendingOrders = orders.filter((o) =>
        ["NEW", "CONFIRMED", "IN_PROGRESS"].includes(o.status)
    ).length;

    const availableItems = menuItems.filter((m) => m.isAvailable).length;
    const outOfStockItems = menuItems.filter((m) => !m.isAvailable).length;
    const emptyTables = tables.filter((t) => t.status === "EMPTY").length;

    // Build revenue chart từ orders (group by created time)
    const revenueByHour: Record<string, number> = {};
    orders
        .filter((o) => ["SERVED", "COMPLETED", "PAID"].includes(o.status))
        .forEach((o) => {
            const hour = new Date(o.createdAt).toLocaleTimeString("vi-VN", {
                hour: "2-digit", minute: "2-digit",
            });
            revenueByHour[hour] = (revenueByHour[hour] || 0) + (o.totalAmount || 0);
        });

    const revenueData = Object.entries(revenueByHour)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([time, revenue]) => ({ time, revenue }));

    // Nếu không có data thật, hiển thị placeholder
    const chartData = revenueData.length > 0 ? revenueData : [
        { time: "Chưa có đơn", revenue: 0 },
    ];

    // Top items bán chạy — đếm từ orders
    const itemCounts: Record<string, { name: string; quantity: number }> = {};
    orders.forEach((o) => {
        (o.orderItems || []).forEach((item: { menuItemName?: string; menuItem?: { name?: string }; quantity?: number }) => {
            const name = item.menuItemName || item.menuItem?.name || "Unknown";
            if (!itemCounts[name]) itemCounts[name] = { name, quantity: 0 };
            itemCounts[name].quantity += item.quantity || 0;
        });
    });
    const topItemsData = Object.values(itemCounts)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    const [now, setNow] = useState(
        new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    );
    useEffect(() => {
        const t = setInterval(
            () => setNow(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })),
            1000
        );
        return () => clearInterval(t);
    }, []);

    const kpis = [
        {
            label: "Doanh thu hôm nay", value: formatPrice(totalRevenue),
            sub: `${orders.filter(o => ["SERVED", "COMPLETED", "PAID"].includes(o.status)).length} đơn hoàn thành`,
            icon: <TrendingUp size={18} />,
            accent: "rgba(201,169,110,0.15)", iconColor: "#C9A96E",
        },
        {
            label: "Đơn đang xử lý", value: String(pendingOrders),
            sub: `${orders.length} đơn tổng cộng`,
            icon: <Package size={18} />,
            accent: "rgba(96,165,250,0.12)", iconColor: "#60a5fa",
        },
        {
            label: "Bàn đang dùng", value: `${occupiedTables}/${tables.length}`,
            sub: `${emptyTables} bàn trống`,
            icon: <Table2 size={18} />,
            accent: "rgba(251,146,60,0.12)", iconColor: "#fb923c",
        },
        {
            label: "Món có sẵn", value: String(availableItems),
            sub: outOfStockItems > 0 ? `${outOfStockItems} hết hàng` : "Tất cả còn hàng",
            icon: <UtensilsCrossed size={18} />,
            accent: "rgba(52,211,153,0.12)", iconColor: "#34d399",
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-5 animate-fade-up">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="section-title">Tổng quan hôm nay</h1>
                        <p className="section-sub">
                            {new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {isLoading && <Loader2 size={16} className="animate-spin" style={{ color: "#C9A96E" }} />}
                        <div className="flex items-center gap-2 px-4 py-2 rounded"
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <Clock size={14} style={{ color: "#C9A96E" }} />
                            <span className="font-mono text-lg font-semibold" style={{ color: "#C9A96E" }}>{now}</span>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {kpis.map(kpi => (
                        <div key={kpi.label} className="kpi-card"
                            style={{ backgroundImage: `linear-gradient(145deg, ${kpi.accent}, transparent)` }}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-2 rounded" style={{ background: kpi.accent }}>
                                    <span style={{ color: kpi.iconColor }}>{kpi.icon}</span>
                                </div>
                            </div>
                            <p className="text-2xl font-bold tracking-tight" style={{ color: kpi.iconColor }}>{kpi.value}</p>
                            <p className="text-xs font-medium mt-1" style={{ color: "rgba(245,240,232,0.7)" }}>{kpi.label}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: "rgba(245,240,232,0.3)" }}>{kpi.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Revenue line chart */}
                    <div className="dash-card p-5 lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold" style={{ color: "rgba(245,240,232,0.7)" }}>Doanh thu theo giờ</h3>
                            <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(201,169,110,0.1)", color: "#C9A96E" }}>
                                Hôm nay · {formatPrice(totalRevenue)}
                            </span>
                        </div>
                        {chartData.length > 1 ? (
                            <ResponsiveContainer width="100%" height={180}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} />
                                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} tickFormatter={v => formatM(Number(v))} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={v => [formatPrice(Number(v)), "Doanh thu"]} />
                                    <Line type="monotone" dataKey="revenue" stroke="#C9A96E" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[180px]" style={{ color: "rgba(245,240,232,0.2)" }}>
                                <p className="text-sm">Chưa có đơn hoàn thành hôm nay</p>
                            </div>
                        )}
                    </div>

                    {/* Top items */}
                    <div className="dash-card p-5">
                        <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(245,240,232,0.7)" }}>Top món bán chạy</h3>
                        {topItemsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={topItemsData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                                    <XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} />
                                    <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={9} width={70} tickLine={false} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                                    <defs>
                                        <linearGradient id="barGold" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#A07C45" />
                                            <stop offset="100%" stopColor="#C9A96E" />
                                        </linearGradient>
                                    </defs>
                                    <Bar dataKey="quantity" fill="url(#barGold)" radius={[0, 3, 3, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[180px]" style={{ color: "rgba(245,240,232,0.2)" }}>
                                <p className="text-sm">Chưa có dữ liệu</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Live Table Status */}
                <div className="dash-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold" style={{ color: "rgba(245,240,232,0.7)" }}>Trạng thái bàn real-time</h3>
                        <span className="flex items-center gap-1.5 text-[10px]" style={{ color: "rgba(52,211,153,0.7)" }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" /> LIVE
                        </span>
                    </div>
                    {tablesLoading ? (
                        <div className="flex justify-center py-4">
                            <Loader2 size={20} className="animate-spin" style={{ color: "#C9A96E" }} />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-2">
                                {tables.map(table => (
                                    <div key={table.id} className="text-center">
                                        <div className={`w-full aspect-square flex items-center justify-center text-xs font-bold rounded mb-1 border transition-all
                                            ${table.status === "EMPTY" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                                                table.status === "NEED_PAYMENT" ? "bg-red-500/10 border-red-500/30 text-red-400" :
                                                    table.status === "SERVING" ? "bg-orange-500/10 border-orange-500/30 text-orange-400" :
                                                        table.status === "NEED_CLEAN" ? "bg-slate-500/10 border-slate-500/30 text-slate-400" :
                                                            "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"}`}>
                                            {table.tableCode}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-3 mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                                {[
                                    { s: "EMPTY", label: "Trống", color: "bg-emerald-400" },
                                    { s: "SEATED", label: "Khách vào", color: "bg-blue-400" },
                                    { s: "ORDERING", label: "Đang gọi", color: "bg-yellow-400" },
                                    { s: "SERVING", label: "Phục vụ", color: "bg-orange-400" },
                                    { s: "NEED_PAYMENT", label: "Cần TT", color: "bg-red-400" },
                                    { s: "NEED_CLEAN", label: "Dọn bàn", color: "bg-slate-400" },
                                ].map(item => (
                                    <span key={item.s} className="flex items-center gap-1.5 text-[10px]"
                                        style={{ color: "rgba(245,240,232,0.4)" }}>
                                        <span className={`w-2 h-2 rounded-full ${item.color} opacity-70`} />
                                        {item.label}
                                        <span style={{ color: "rgba(245,240,232,0.2)" }}>
                                            ({tables.filter(t => t.status === item.s).length})
                                        </span>
                                    </span>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
