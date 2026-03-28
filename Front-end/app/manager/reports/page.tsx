"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { CLAIMS } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { TrendingUp, DollarSign, FileDown, Loader2, RefreshCw, Calendar } from "lucide-react";
import { toast } from "sonner";
import { useReportDashboard, vnTodayYmd, type ReportMode } from "@/lib/hooks/useReports";
import { useCashierQueriesRefresh } from "@/lib/hooks/useCashierQueriesRefresh";

const TOOLTIP_STYLE = {
    background: "#1A1A1A",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#F5F0E8",
    fontSize: 12,
};

const METHOD_COLORS: Record<string, string> = {
    cash: "#C9A96E",
    card: "#60A5FA",
    transfer: "#4ADE80",
    qr: "#34d399",
};

function methodLabelVi(m: string): string {
    const map: Record<string, string> = {
        cash: "Tiền mặt",
        card: "Thẻ",
        transfer: "Chuyển khoản",
        qr: "QR",
    };
    return map[m] || m;
}

const formatVND = (p: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);

function formatAxisMoney(p: number) {
    if (p >= 1_000_000) return `${(p / 1_000_000).toFixed(1)}M`;
    if (p >= 1000) return `${(p / 1000).toFixed(0)}k`;
    return String(Math.round(p));
}

export default function ReportsPage() {
    useCashierQueriesRefresh(true, { includeReports: true });
    const { hasClaim } = useAuth();
    const router = useRouter();
    const [mode, setMode] = useState<ReportMode>("week");
    const [anchorDate, setAnchorDate] = useState(() => vnTodayYmd());

    const todayYmd = vnTodayYmd();
    const isLive = mode === "day" && anchorDate === todayYmd;
    const refetchMs = isLive ? 30_000 : false;

    const { data, isLoading, isFetching, error, refetch } = useReportDashboard(mode, anchorDate, refetchMs);

    const pieData = useMemo(() => {
        if (!data?.revenueByMethodPct?.length) return [];
        return data.revenueByMethodPct.map((r) => ({
            name: methodLabelVi(r.method),
            value: r.percent,
            amount: r.amount,
            key: r.method,
        }));
    }, [data]);

    const chartData = useMemo(() => {
        if (!data?.series?.length) return [];
        return data.series.map((s) => ({
            ...s,
            revenue: s.revenue,
            orders: s.orders,
        }));
    }, [data]);

    const kpi = useMemo(() => {
        if (!data) return null;
        const { summary } = data;
        const revTitle =
            mode === "day" ? "Doanh thu ngày" : mode === "week" ? "Doanh thu tuần" : "Doanh thu tháng";
        const ordTitle =
            mode === "day" ? "Đơn đã thanh toán" : mode === "week" ? "Tổng đơn (tuần)" : "Tổng đơn (tháng)";
        const third =
            mode === "day"
                ? { label: "Giao dịch thanh toán", value: `${summary.transactionCount}`, sub: "phiếu" }
                : {
                      label: "TB/ngày",
                      value: formatVND(summary.avgPerDay),
                      sub: undefined,
                  };
        return [
            { label: revTitle, value: formatVND(summary.totalRevenue), icon: <DollarSign size={18} />, color: "text-gold" },
            { label: ordTitle, value: `${summary.orderCount} đơn`, icon: <TrendingUp size={18} />, color: "text-blue-400" },
            {
                label: third.label,
                value: third.sub ? `${third.value} ${third.sub}` : third.value,
                icon: <TrendingUp size={18} />,
                color: "text-emerald-400",
            },
            {
                label: "TB/đơn",
                value: formatVND(summary.avgPerOrder),
                icon: <DollarSign size={18} />,
                color: "text-purple-400",
            },
        ];
    }, [data, mode]);

    if (!hasClaim(CLAIMS.REPORT_VIEW)) {
        return (
            <DashboardLayout>
                <p className="text-cream/50">Bạn không có quyền xem báo cáo.</p>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="font-serif text-cream text-2xl">Báo cáo & Kết ca</h1>
                        <p className="text-cream/40 text-sm flex flex-wrap items-center gap-2">
                            {data?.range.labelVi ?? "—"}
                            {isLive && (
                                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                                    Realtime · 30s
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex rounded-lg border border-white/10 p-0.5">
                            {(
                                [
                                    ["day", "Ngày"],
                                    ["week", "Tuần"],
                                    ["month", "Tháng"],
                                ] as const
                            ).map(([m, lab]) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMode(m)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                        mode === m ? "bg-gold/20 text-gold" : "text-cream/50 hover:text-cream/80"
                                    }`}
                                >
                                    {lab}
                                </button>
                            ))}
                        </div>
                        <label className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-cream/70">
                            <Calendar size={14} />
                            <input
                                type="date"
                                value={anchorDate}
                                onChange={(e) => setAnchorDate(e.target.value)}
                                className="bg-transparent border-none outline-none text-cream"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            disabled={isFetching}
                            className="flex items-center gap-2 border border-white/10 text-cream/60 hover:text-cream px-3 py-2 text-sm transition-colors"
                        >
                            {isFetching ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                            Làm mới
                        </button>
                        <button
                            type="button"
                            onClick={() => toast.info("Xuất PDF — sẽ nối máy in / PDF sau")}
                            className="flex items-center gap-2 border border-white/10 text-cream/60 hover:text-cream px-3 py-2 text-sm transition-colors"
                        >
                            <FileDown size={14} /> Xuất PDF
                        </button>
                        {hasClaim(CLAIMS.SHIFT_CLOSE) && (
                            <button
                                type="button"
                                onClick={() => router.push("/manager/reports/shift")}
                                className="flex items-center gap-2 bg-gold text-charcoal px-4 py-2 text-sm font-semibold hover:bg-gold-light transition-colors"
                            >
                                Kết ca hôm nay
                            </button>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {(error as Error).message || "Không tải được báo cáo"}
                    </div>
                )}

                {isLoading && (
                    <div className="flex items-center justify-center py-24 text-cream/40">
                        <Loader2 className="animate-spin mr-2" size={24} />
                        Đang tải số liệu từ máy chủ...
                    </div>
                )}

                {!isLoading && data && kpi && (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {kpi.map((k) => (
                                <div key={k.label} className="bg-white/5 border border-white/10 p-4">
                                    <div className={`mb-2 ${k.color}`}>{k.icon}</div>
                                    <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
                                    <p className="text-cream/50 text-xs mt-1">{k.label}</p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white/5 border border-white/10 p-5">
                            <h3 className="text-cream font-medium mb-4">
                                {mode === "day"
                                    ? "Doanh thu trong ngày"
                                    : mode === "week"
                                      ? "Doanh thu theo ngày (tuần chọn)"
                                      : "Doanh thu theo ngày (trong tháng)"}
                            </h3>
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                    <YAxis
                                        stroke="rgba(255,255,255,0.3)"
                                        fontSize={11}
                                        tickFormatter={formatAxisMoney}
                                    />
                                    <Tooltip
                                        contentStyle={TOOLTIP_STYLE}
                                        formatter={(v) => [formatVND(Number(v ?? 0)), "Doanh thu"]}
                                    />
                                    <Bar dataKey="revenue" fill="#C9A96E" radius={[3, 3, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="bg-white/5 border border-white/10 p-5">
                                <h3 className="text-cream font-medium mb-4">Phương thức thanh toán</h3>
                                {pieData.length === 0 ? (
                                    <p className="text-cream/35 text-sm">Chưa có giao dịch trong kỳ</p>
                                ) : (
                                    <div className="flex items-center gap-6 flex-wrap">
                                        <ResponsiveContainer width={160} height={160}>
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={44}
                                                    outerRadius={70}
                                                    dataKey="value"
                                                    nameKey="name"
                                                >
                                                    {pieData.map((entry, i) => (
                                                        <Cell
                                                            key={i}
                                                            fill={METHOD_COLORS[entry.key] ?? `hsl(${(i * 47) % 360}, 55%, 55%)`}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={TOOLTIP_STYLE}
                                                    formatter={(val, _n, p) => {
                                                        const payload = p?.payload as { amount?: number; name?: string } | undefined;
                                                        return [
                                                            `${Number(val ?? 0).toFixed(1)}% · ${formatVND(payload?.amount ?? 0)}`,
                                                            payload?.name ?? "",
                                                        ];
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="space-y-2 flex-1 min-w-[180px]">
                                            {pieData.map((d) => (
                                                <div key={d.key} className="flex items-center gap-2">
                                                    <span
                                                        className="w-3 h-3 rounded-full shrink-0"
                                                        style={{
                                                            background:
                                                                METHOD_COLORS[d.key] ??
                                                                `hsl(${d.key.length * 40}, 55%, 55%)`,
                                                        }}
                                                    />
                                                    <span className="text-cream/70 text-sm">{d.name}</span>
                                                    <span className="text-cream font-bold ml-auto">
                                                        {d.value.toFixed(1)}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="bg-white/5 border border-white/10 p-5">
                                <h3 className="text-cream font-medium mb-4">
                                    Top món bán chạy ({mode === "day" ? "ngày" : mode === "week" ? "tuần" : "tháng"})
                                </h3>
                                {!data.topItems?.length ? (
                                    <p className="text-cream/35 text-sm">Chưa có dữ liệu món trong kỳ</p>
                                ) : (
                                    <div className="space-y-2">
                                        {data.topItems.map((item, idx) => (
                                            <div key={item.menuItemId} className="flex items-center gap-3">
                                                <span className="text-cream/30 text-xs w-4">{idx + 1}</span>
                                                <span className="text-cream/80 text-sm flex-1 truncate">{item.name}</span>
                                                <span className="text-cream/50 text-xs">{item.totalSold}×</span>
                                                <span className="text-gold text-sm font-medium">
                                                    {formatVND(item.revenueGenerated)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-5">
                            <h3 className="text-cream font-medium mb-4">
                                Số đơn (đã thanh toán) theo {mode === "day" ? "ngày" : "từng ngày trong kỳ"}
                            </h3>
                            <ResponsiveContainer width="100%" height={180}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="label" stroke="rgba(255,255,255,0.3)" fontSize={11} />
                                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} allowDecimals={false} />
                                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                                    <Line
                                        type="monotone"
                                        dataKey="orders"
                                        stroke="#60A5FA"
                                        strokeWidth={2}
                                        dot={{ fill: "#60A5FA", r: 3 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <p className="text-cream/30 text-xs">
                            Số liệu theo thời điểm thanh toán (PAID) · múi giờ Việt Nam.{" "}
                            <Link href="/manager/reports/shift" className="text-gold/80 hover:underline">
                                Xem tổng kết ca ngày
                            </Link>
                        </p>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
