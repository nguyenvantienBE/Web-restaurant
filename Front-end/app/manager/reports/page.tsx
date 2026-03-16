"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { CLAIMS } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { TrendingUp, DollarSign, FileDown } from "lucide-react";
import { toast } from "sonner";

const DAILY_DATA = [
    { day: "T2", revenue: 28500000, orders: 32 },
    { day: "T3", revenue: 31200000, orders: 38 },
    { day: "T4", revenue: 25800000, orders: 29 },
    { day: "T5", revenue: 35600000, orders: 44 },
    { day: "T6", revenue: 48900000, orders: 61 },
    { day: "T7", revenue: 62300000, orders: 78 },
    { day: "CN", revenue: 55100000, orders: 67 },
];

const PAYMENT_DATA = [
    { name: "Tiền mặt", value: 45, color: "#C9A96E" },
    { name: "QR Code", value: 38, color: "#4ADE80" },
    { name: "Thẻ", value: 17, color: "#60A5FA" },
];

const TOP_MENU = [
    { name: "Negroni Albion", quantity: 89, revenue: 19580000 },
    { name: "Eton Mess", quantity: 76, revenue: 14820000 },
    { name: "Roast Lamb", quantity: 54, revenue: 35100000 },
    { name: "Langoustine", quantity: 48, revenue: 24960000 },
    { name: "Roasted Scallops", quantity: 42, revenue: 20160000 },
];

const TOOLTIP_STYLE = { background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F0E8", fontSize: 12 };
const formatPrice = (p: number) => `${(p / 1000000).toFixed(1)}M₫`;
const formatVND = (p: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);

export default function ReportsPage() {
    const { hasClaim } = useAuth();
    const totalRevenue = DAILY_DATA.reduce((s, d) => s + d.revenue, 0);
    const totalOrders = DAILY_DATA.reduce((s, d) => s + d.orders, 0);

    const closeShift = () => {
        toast.success("Ca đã kết thúc và lưu vào lịch sử!", { description: `Tổng: ${formatVND(totalRevenue)}` });
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="font-serif text-cream text-2xl">Báo cáo & Kết ca</h1>
                        <p className="text-cream/40 text-sm">Tuần này · 19/02 – 25/02/2026</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => toast.info("Đang xuất báo cáo PDF...")}
                            className="flex items-center gap-2 border border-white/10 text-cream/60 hover:text-cream px-3 py-2 text-sm transition-colors">
                            <FileDown size={14} /> Xuất PDF
                        </button>
                        {hasClaim(CLAIMS.SHIFT_CLOSE) && (
                            <button onClick={closeShift}
                                className="flex items-center gap-2 bg-gold text-charcoal px-4 py-2 text-sm font-semibold hover:bg-gold-light transition-colors">
                                Kết ca hôm nay
                            </button>
                        )}
                    </div>
                </div>

                {/* KPI */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Doanh thu tuần", value: formatVND(totalRevenue), icon: <DollarSign size={18} />, color: "text-gold" },
                        { label: "Tổng đơn tuần", value: `${totalOrders} đơn`, icon: <TrendingUp size={18} />, color: "text-blue-400" },
                        { label: "TB/ngày", value: formatVND(totalRevenue / 7), icon: <TrendingUp size={18} />, color: "text-emerald-400" },
                        { label: "TB/đơn", value: formatVND(totalRevenue / totalOrders), icon: <DollarSign size={18} />, color: "text-purple-400" },
                    ].map((k) => (
                        <div key={k.label} className="bg-white/5 border border-white/10 p-4">
                            <div className={`mb-2 ${k.color}`}>{k.icon}</div>
                            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                            <p className="text-cream/50 text-xs mt-1">{k.label}</p>
                        </div>
                    ))}
                </div>

                {/* Revenue chart */}
                <div className="bg-white/5 border border-white/10 p-5">
                    <h3 className="text-cream font-medium mb-4">Doanh thu theo ngày trong tuần</h3>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={DAILY_DATA}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickFormatter={formatPrice} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [formatVND(Number(v)), "Doanh thu"]} />
                            <Bar dataKey="revenue" fill="#C9A96E" radius={[3, 3, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Payment breakdown */}
                    <div className="bg-white/5 border border-white/10 p-5">
                        <h3 className="text-cream font-medium mb-4">Phương thức thanh toán</h3>
                        <div className="flex items-center gap-6">
                            <ResponsiveContainer width={150} height={150}>
                                <PieChart>
                                    <Pie data={PAYMENT_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                                        {PAYMENT_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2">
                                {PAYMENT_DATA.map((d) => (
                                    <div key={d.name} className="flex items-center gap-2">
                                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: d.color }} />
                                        <span className="text-cream/70 text-sm">{d.name}</span>
                                        <span className="text-cream font-bold ml-auto">{d.value}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Top items table */}
                    <div className="bg-white/5 border border-white/10 p-5">
                        <h3 className="text-cream font-medium mb-4">Top 5 món bán chạy (tuần)</h3>
                        <div className="space-y-2">
                            {TOP_MENU.map((item, idx) => (
                                <div key={item.name} className="flex items-center gap-3">
                                    <span className="text-cream/30 text-xs w-4">{idx + 1}</span>
                                    <span className="text-cream/80 text-sm flex-1 truncate">{item.name}</span>
                                    <span className="text-cream/50 text-xs">{item.quantity}×</span>
                                    <span className="text-gold text-sm font-medium">{formatVND(item.revenue)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Orders line chart */}
                <div className="bg-white/5 border border-white/10 p-5">
                    <h3 className="text-cream font-medium mb-4">Số đơn theo ngày</h3>
                    <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={DAILY_DATA}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                            <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} />
                            <Tooltip contentStyle={TOOLTIP_STYLE} />
                            <Line type="monotone" dataKey="orders" stroke="#60A5FA" strokeWidth={2} dot={{ fill: "#60A5FA", r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </DashboardLayout>
    );
}
