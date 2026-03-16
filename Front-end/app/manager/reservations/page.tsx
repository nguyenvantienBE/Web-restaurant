"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Reservation, ReservationStatus, CLAIMS } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Search, Users, Phone, Calendar, Clock, Mail, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useReservations, useUpdateReservationStatus } from "@/lib/hooks/useReservations";

const STATUS_TABS: { status: ReservationStatus | "all"; label: string }[] = [
    { status: "all", label: "Tất cả" },
    { status: "PENDING", label: "⏳ Chờ duyệt" },
    { status: "CONFIRMED", label: "✓ Đã duyệt" },
    { status: "CANCELLED", label: "✗ Từ chối" },
    { status: "NO_SHOW", label: "Vắng mặt" },
    { status: "COMPLETED", label: "Hoàn tất" },
];

const AREA_VI: Record<string, string> = {
    indoor: "Trong nhà", outdoor: "Ngoài trời", rooftop: "Sân thượng", bar: "Khu bar",
};

export default function ReservationsPage() {
    const { hasClaim } = useAuth();
    const [tab, setTab] = useState<ReservationStatus | "all">("PENDING");
    const [search, setSearch] = useState("");
    const { data: reservations = [], isLoading } = useReservations(tab);
    const updateStatusMutation = useUpdateReservationStatus();

    const filtered = reservations.filter((r) => {
        const matchTab = tab === "all" || r.status === tab;
        const matchSearch = r.customerName.toLowerCase().includes(search.toLowerCase()) || r.customerPhone.includes(search);
        return matchTab && matchSearch;
    });

    const pendingCount = reservations.filter((r) => r.status === "PENDING").length;

    const handleStatusChange = async (id: string, status: ReservationStatus) => {
        try {
            await updateStatusMutation.mutateAsync({ id, status });
            toast.success(
                `Đặt bàn ${status === "CONFIRMED" ? "đã xác nhận" : status === "CANCELLED" ? "đã từ chối" : "đã cập nhật"
                }`,
            );
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Cập nhật trạng thái thất bại");
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="font-serif text-cream text-2xl">Quản lý đặt bàn</h1>
                        <p className="text-cream/40 text-sm">
                            {pendingCount > 0 ? <span className="text-amber-400">{pendingCount} đặt bàn chờ duyệt</span> : "Không có yêu cầu chờ duyệt"}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 pl-3 pr-3 py-2 focus-within:border-gold/50 transition-colors">
                        <Search size={13} className="shrink-0 text-cream/30" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo tên, SĐT..."
                            className="bg-transparent text-cream placeholder-cream/20 text-sm focus:outline-none min-w-0 w-48" />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-3 flex-wrap">
                    {STATUS_TABS.map(({ status, label }) => (
                        <button key={status} onClick={() => setTab(status)}
                            className={cn("px-6 py-3 text-sm font-semibold border rounded-full transition-colors",
                                tab === status ? "border-gold bg-gold/20 text-gold" : "border-white/10 text-cream/50 hover:text-cream hover:border-white/30")}>
                            {label}
                            {status === "PENDING" && pendingCount > 0 && (
                                <span className="ml-2 bg-amber-500 text-charcoal text-xs px-2 py-0.5 rounded-full font-bold">{pendingCount}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Loading */}
                {isLoading && (
                    <p className="text-cream/40 text-sm text-center py-10">Đang tải đặt bàn...</p>
                )}

                {/* Reservation cards */}
                <div className="space-y-4">
                    {!isLoading && filtered.length === 0 && (
                        <p className="text-cream/30 text-base text-center py-10">Không có đặt bàn nào</p>
                    )}
                    {filtered.map((res) => (
                        <div key={res.id}
                            className={cn("border px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-5 rounded-xl transition-colors",
                                res.status === "PENDING" ? "border-amber-500/30 bg-amber-500/5" : "border-white/10 bg-white/5")}>
                            {/* Info */}
                            <div className="flex-1 min-w-0 space-y-2.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-cream font-semibold text-base">{res.customerName}</span>
                                    <StatusBadge type="reservation" status={res.status} lang="vi" />
                                    {res.area && <span className="text-cream/40 text-xs">{AREA_VI[res.area]}</span>}
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-cream/60">
                                    <span className="flex items-center gap-1"><Phone size={11} /> {res.customerPhone}</span>
                                    {res.customerEmail && <span className="flex items-center gap-1"><Mail size={11} /> {res.customerEmail}</span>}
                                    <span className="flex items-center gap-1"><Calendar size={11} /> {new Date(res.date + "T00:00:00").toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })}</span>
                                    <span className="flex items-center gap-1"><Clock size={11} /> {res.time}</span>
                                    <span className="flex items-center gap-1"><Users size={11} /> {res.partySize} người</span>
                                </div>
                                {res.note && <p className="text-yellow-400 text-sm">📝 {res.note}</p>}
                            </div>
                            {/* Actions */}
                            {res.status === "PENDING" && hasClaim(CLAIMS.RESERVATION_UPDATE) && (
                                <div className="flex gap-3 shrink-0">
                                    <button
                                        onClick={() => handleStatusChange(res.id, "CONFIRMED")}
                                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 text-sm rounded-lg transition-colors font-semibold"
                                    >
                                        <Check size={15} /> Xác nhận
                                    </button>
                                    <button
                                        onClick={() => handleStatusChange(res.id, "CANCELLED")}
                                        className="flex items-center gap-2 border border-red-500/40 text-red-400 hover:bg-red-500/20 px-5 py-2.5 text-sm rounded-lg transition-colors font-semibold"
                                    >
                                        <X size={15} /> Từ chối
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
