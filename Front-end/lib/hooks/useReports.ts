import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, parseResponse } from "@/lib/api";

export type ReportMode = "day" | "week" | "month";

export interface DashboardSeriesPoint {
    date: string;
    label: string;
    revenue: number;
    orders: number;
}

export interface DashboardTopItem {
    menuItemId: string;
    name: string;
    price: number;
    totalSold: number;
    revenueGenerated: number;
}

export interface ReportDashboard {
    mode: ReportMode;
    anchorDate: string;
    range: {
        start: string;
        end: string;
        labelVi: string;
    };
    summary: {
        totalRevenue: number;
        orderCount: number;
        transactionCount: number;
        avgPerDay: number;
        avgPerOrder: number;
    };
    series: DashboardSeriesPoint[];
    revenueByMethod: Record<string, number>;
    revenueByMethodPct: { method: string; amount: number; percent: number }[];
    topItems: DashboardTopItem[];
}

export interface ShiftSummary {
    shiftDate: string;
    generatedAt: string;
    range: { start: string; end: string };
    totalRevenue: number;
    totalTransactions: number;
    orderCount: number;
    revenueByMethod: Record<string, number>;
    revenueByMethodPct: { method: string; amount: number; percent: number }[];
    cashTotal: number;
    cardTotal: number;
    transferTotal: number;
    cancelledOrders: number;
    completedOrders: number;
    topItems: DashboardTopItem[];
}

export function vnTodayYmd(): string {
    return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

export function useReportDashboard(mode: ReportMode, dateYmd: string | undefined, refetchMs: number | false) {
    const q = dateYmd ? `mode=${mode}&date=${encodeURIComponent(dateYmd)}` : `mode=${mode}`;
    return useQuery<ReportDashboard>({
        queryKey: ["reports", "dashboard", mode, dateYmd ?? "today"],
        queryFn: async () => {
            const res = await api.get(`/reports/dashboard?${q}`);
            return parseResponse<ReportDashboard>(res);
        },
        refetchInterval: refetchMs === false ? undefined : refetchMs,
        staleTime: 15_000,
    });
}

export function useShiftSummary(dateYmd?: string) {
    const q = dateYmd ? `?date=${encodeURIComponent(dateYmd)}` : "";
    return useQuery<ShiftSummary>({
        queryKey: ["reports", "shift-summary", dateYmd ?? "today"],
        queryFn: async () => {
            const res = await api.get(`/reports/shift-summary${q}`);
            return parseResponse<ShiftSummary>(res);
        },
        staleTime: 10_000,
    });
}

/** @deprecated Dùng POST /shifts/:id/close (kết ca POS) */
export function useEndShift() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const res = await api.post("/reports/end-shift", {});
            return parseResponse(res);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["reports"] });
        },
    });
}
