"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { mockOrders, mockTables, mockMenuItems } from "@/lib/mock/data";
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, UtensilsCrossed, Table2, Package, Clock } from "lucide-react";

const REVENUE_DATA = [
    { time: "17:00", revenue: 0 },
    { time: "17:30", revenue: 450000 },
    { time: "18:00", revenue: 1200000 },
    { time: "18:30", revenue: 2100000 },
    { time: "19:00", revenue: 3800000 },
    { time: "19:30", revenue: 5600000 },
    { time: "20:00", revenue: 7200000 },
    { time: "20:30", revenue: 8900000 },
    { time: "21:00", revenue: 11200000 },
    { time: "21:30", revenue: 12400000 },
];

const TOP_ITEMS_DATA = [
    { name: "Roast Lamb", quantity: 18 },
    { name: "Langoustine", quantity: 14 },
    { name: "Eton Mess", quantity: 22 },
    { name: "Negroni", quantity: 31 },
    { name: "Scallops", quantity: 12 },
];

const TOOLTIP_STYLE = {
    background: "#141414",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#F5F0E8",
    fontSize: 11,
    borderRadius: 4,
};

export default function ManagerPage() {
    const formatPrice = (p: number) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p).replace("₫", "đ");
    const formatM = (p: number) => `${(p / 1_000_000).toFixed(1)}M`;

    const totalRevenue = mockOrders
        .filter(o => ["SERVED", "COMPLETED"].includes(o.status))
        .reduce((s, o) => s + o.totalAmount, 0);

    const occupiedTables = mockTables.filter(t => !["EMPTY", "NEED_CLEAN"].includes(t.status)).length;
    const pendingOrders = mockOrders.filter(o => ["NEW", "CONFIRMED", "IN_PROGRESS"].includes(o.status)).length;
    const availableItems = mockMenuItems.filter(m => m.isAvailable).length;

    const [now, setNow] = useState(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }));
    useEffect(() => {
        const t = setInterval(() =>
            setNow(new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })), 1000);
        return () => clearInterval(t);
    }, []);

    const kpis = [
        {
            label: "Doanh thu hôm nay", value: formatPrice(totalRevenue),
            sub: "+12% so với hôm qua", trend: true, icon: <TrendingUp size={18} />,
            accent: "rgba(201,169,110,0.15)", iconColor: "#C9A96E", topBorder: "#C9A96E",
        },
        {
            label: "Đơn đang xử lý", value: String(pendingOrders),
            sub: `${mockOrders.length} đơn tổng cộng`, trend: null, icon: <Package size={18} />,
            accent: "rgba(96,165,250,0.12)", iconColor: "#60a5fa", topBorder: "#60a5fa",
        },
        {
            label: "Bàn đang dùng", value: `${occupiedTables}/${mockTables.length}`,
            sub: `${mockTables.filter(t => t.status === "EMPTY").length} bàn trống`, trend: null, icon: <Table2 size={18} />,
            accent: "rgba(251,146,60,0.12)", iconColor: "#fb923c", topBorder: "#fb923c",
        },
        {
            label: "Món có sẵn", value: String(availableItems),
            sub: `${mockMenuItems.filter(m => !m.isAvailable).length} hết hàng`, trend: false, icon: <UtensilsCrossed size={18} />,
            accent: "rgba(52,211,153,0.12)", iconColor: "#34d399", topBorder: "#34d399",
        },
    ];

    return (
        <DashboardLayout>
            <div className="space-y-5 animate-fade-up">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="section-title">Tổng quan hôm nay</h1>
                        <p className="section-sub">{new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded"
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <Clock size={14} style={{ color: "#C9A96E" }} />
                        <span className="font-mono text-lg font-semibold" style={{ color: "#C9A96E" }}>{now}</span>
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
                                {kpi.trend !== null && (
                                    <span className="text-[10px] font-medium flex items-center gap-0.5"
                                        style={{ color: kpi.trend ? "#34d399" : "#f87171" }}>
                                        {kpi.trend ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                        {kpi.sub.includes("+") ? kpi.sub.split(" ")[0] : ""}
                                    </span>
                                )}
                            </div>
                            <p className="text-2xl font-bold tracking-tight" style={{ color: kpi.iconColor }}>{kpi.value}</p>
                            <p className="text-xs font-medium mt-1" style={{ color: "rgba(245,240,232,0.7)" }}>{kpi.label}</p>
                            <p className="text-[11px] mt-0.5" style={{ color: "rgba(245,240,232,0.3)" }}>{kpi.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Revenue line chart */}
                    <div className="dash-card p-5 lg:col-span-2">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold" style={{ color: "rgba(245,240,232,0.7)" }}>Doanh thu theo giờ</h3>
                            <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(201,169,110,0.1)", color: "#C9A96E" }}>
                                Hôm nay
                            </span>
                        </div>
                        <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={REVENUE_DATA}>
                                <defs>
                                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#C9A96E" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#C9A96E" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} />
                                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false}
                                    tickFormatter={v => `${(v / 1000000).toFixed(0)}M`} />
                                <Tooltip contentStyle={TOOLTIP_STYLE}
                                    formatter={v => [formatPrice(Number(v)), "Doanh thu"]} />
                                <Line type="monotone" dataKey="revenue" stroke="#C9A96E" strokeWidth={2}
                                    dot={false} activeDot={{ r: 4, fill: "#C9A96E" }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Top items */}
                    <div className="dash-card p-5">
                        <h3 className="text-sm font-semibold mb-4" style={{ color: "rgba(245,240,232,0.7)" }}>Top món bán chạy</h3>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={TOP_ITEMS_DATA} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                                <XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} />
                                <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={9} width={65} tickLine={false} />
                                <Tooltip contentStyle={TOOLTIP_STYLE} />
                                <Bar dataKey="quantity" fill="url(#barGold)" radius={[0, 3, 3, 0]}>
                                </Bar>
                                <defs>
                                    <linearGradient id="barGold" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#A07C45" />
                                        <stop offset="100%" stopColor="#C9A96E" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
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
                    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
                        {mockTables.map(table => (
                            <div key={table.id} className="text-center">
                                <div className={`w-full aspect-square flex items-center justify-center text-xs font-bold rounded mb-1 border transition-all ${table.status === "EMPTY" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                                        table.status === "NEED_PAYMENT" ? "bg-red-500/10 border-red-500/30 text-red-400" :
                                            table.status === "SERVING" ? "bg-orange-500/10 border-orange-500/30 text-orange-400" :
                                                table.status === "NEED_CLEAN" ? "bg-slate-500/10 border-slate-500/30 text-slate-400" :
                                                    "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                                    }`}>
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
                                    ({mockTables.filter(t => t.status === item.s).length})
                                </span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
