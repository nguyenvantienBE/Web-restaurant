"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { mockStaffCalls } from "@/lib/mock/data";
import { StaffCall } from "@/lib/types";
import { CLAIMS } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { playSound } from "@/lib/sound";
import { Bell, BellOff, CheckCircle2, Clock, Table2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function StaffCallsPage() {
    const { hasClaim } = useAuth();
    const [calls, setCalls] = useState<StaffCall[]>(mockStaffCalls);
    const [filter, setFilter] = useState<"all" | "pending" | "resolved">("pending");

    // Simulate incoming staff call
    useEffect(() => {
        const timer = setTimeout(() => {
            const newCall: StaffCall = {
                id: `sc${Date.now()}`,
                tableCode: "R2",
                tableId: "t10",
                requestedAt: new Date().toISOString(),
                isResolved: false,
            };
            setCalls((prev) => [newCall, ...prev]);
            playSound("staffCall");
            toast.warning(`🔔 Bàn R2 gọi nhân viên!`, { description: "Vừa xảy ra" });
        }, 12000);
        return () => clearTimeout(timer);
    }, []);

    const filtered = calls.filter((c) => {
        if (filter === "pending") return !c.isResolved;
        if (filter === "resolved") return c.isResolved;
        return true;
    });

    const resolve = (id: string) => {
        setCalls((prev) =>
            prev.map((c) => c.id === id ? { ...c, isResolved: true, handledAt: new Date().toISOString(), handledBy: "u3" } : c)
        );
        toast.success("Đã đánh dấu xử lý");
    };

    const timeSince = (iso: string) => {
        const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
        if (diff < 60) return `${diff}s trước`;
        if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
        return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    };

    const pendingCount = calls.filter((c) => !c.isResolved).length;

    return (
        <DashboardLayout>
            <div className="space-y-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-serif text-cream text-2xl flex items-center gap-2">
                            {pendingCount > 0 ? <Bell size={24} className="text-gold animate-bounce" /> : <BellOff size={24} className="text-cream/40" />}
                            Gọi nhân viên
                        </h1>
                        <p className="text-cream/40 text-sm">
                            {pendingCount > 0 ? `${pendingCount} yêu cầu chưa xử lý` : "Không có yêu cầu nào"}
                        </p>
                    </div>
                    {pendingCount > 0 && (
                        <span className="bg-amber-500 text-charcoal text-sm font-bold px-3 py-1 rounded-full animate-pulse">
                            {pendingCount} MỚI
                        </span>
                    )}
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2">
                    {([["pending", "Chưa xử lý"], ["resolved", "Đã xử lý"], ["all", "Tất cả"]] as const).map(([val, label]) => (
                        <button key={val} onClick={() => setFilter(val)}
                            className={cn("px-4 py-1.5 text-xs border transition-colors",
                                filter === val ? "border-gold bg-gold/20 text-gold" : "border-white/10 text-cream/50 hover:text-cream")}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* Call list */}
                <div className="space-y-3">
                    {filtered.length === 0 && (
                        <div className="text-center py-16">
                            <BellOff size={36} className="mx-auto text-cream/20 mb-3" />
                            <p className="text-cream/30 text-sm">Không có yêu cầu</p>
                        </div>
                    )}
                    {filtered.map((call) => (
                        <div key={call.id}
                            className={cn("border p-4 flex items-center gap-4 transition-colors",
                                !call.isResolved
                                    ? "bg-amber-500/10 border-amber-500/30"
                                    : "bg-white/5 border-white/10 opacity-60")}>
                            {/* Table badge */}
                            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                                !call.isResolved ? "bg-amber-500/20 border-2 border-amber-500" : "bg-white/10 border border-white/20")}>
                                <span className={cn("font-bold text-sm", !call.isResolved ? "text-amber-400" : "text-cream/50")}>
                                    {call.tableCode}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <Table2 size={14} className={call.isResolved ? "text-cream/30" : "text-amber-400"} />
                                    <span className={cn("font-medium text-sm", !call.isResolved ? "text-cream" : "text-cream/50")}>
                                        Bàn {call.tableCode} gọi nhân viên
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-cream/40 mt-1">
                                    <span className="flex items-center gap-1"><Clock size={11} /> {timeSince(call.requestedAt)}</span>
                                    {call.isResolved && call.handledAt && (
                                        <span className="text-emerald-400 flex items-center gap-1">
                                            <CheckCircle2 size={11} /> Xử lý {timeSince(call.handledAt)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Action */}
                            {!call.isResolved && hasClaim(CLAIMS.STAFF_CALL_HANDLE) && (
                                <button onClick={() => resolve(call.id)}
                                    className="shrink-0 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1.5 text-xs transition-colors flex items-center gap-1">
                                    <CheckCircle2 size={13} /> Đã xử lý
                                </button>
                            )}
                            {call.isResolved && (
                                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
