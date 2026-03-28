"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { useTables, useUpdateTableStatus, ApiTable } from "@/lib/hooks/useTables";
import { useCashierQueriesRefresh } from "@/lib/hooks/useCashierQueriesRefresh";
import { useReservationCheckIn } from "@/lib/hooks/useReservationCheckIn";
import {
    useOrders,
    useConfirmOrder,
    useCancelOrder,
    useCompleteOrderPayment,
    useMarkItemServed,
    type ApiOrder,
} from "@/lib/hooks/useOrders";
import { CLAIMS } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { playSound } from "@/lib/sound";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Bell, Users, RefreshCw, Loader2, Ticket, Banknote, UtensilsCrossed, Hand, FileText } from "lucide-react";
import { downloadOrderInvoicePdf } from "@/lib/invoice-download";
import { getTableActivitySummary, itemStatusLabelVi, canStaffPlaceOrder } from "@/lib/cashier-table";
import { CashierStaffOrderModal } from "@/components/cashier/CashierStaffOrderModal";

const PAYMENT_METHOD_OPTIONS = [
    { value: "cash", label: "Tiền mặt" },
    { value: "card", label: "Thẻ" },
    { value: "transfer", label: "Chuyển khoản" },
] as const;

type InvoiceUiMode = "none" | "email_plain" | "email_pdf" | "direct";

const DEFAULT_INV_PREF = { mode: "none" as InvoiceUiMode, email: "", customerName: "" };

function orderAwaitingPayment(o: ApiOrder): boolean {
    if (o.status !== "SERVED") return false;
    if (!o.payment) return true;
    return o.payment.status === "PENDING";
}

const AREA_LABELS: Record<string, string> = {
    all: "Tất cả",
};

// Map trạng thái sang màu nền/viền
const TABLE_STYLE: Record<string, { bg: string; border: string }> = {
    EMPTY: { bg: "rgba(52,211,153,0.05)", border: "rgba(52,211,153,0.2)" },
    SEATED: { bg: "rgba(251,146,60,0.06)", border: "rgba(251,146,60,0.25)" },
    ORDERING: { bg: "rgba(251,146,60,0.06)", border: "rgba(251,146,60,0.25)" },
    SERVING: { bg: "rgba(251,146,60,0.06)", border: "rgba(251,146,60,0.25)" },
    NEED_PAYMENT: { bg: "rgba(248,113,113,0.07)", border: "rgba(248,113,113,0.3)" },
    NEED_CLEAN: { bg: "rgba(148,163,184,0.06)", border: "rgba(148,163,184,0.2)" },
};

export default function CashierPage() {
    const { hasClaim } = useAuth();
    /** Đồng bộ ngay khi bếp xong món / đổi trạng thái bàn (socket → refetch) */
    useCashierQueriesRefresh(true);
    const { data: tables = [], isLoading: tablesLoading, refetch: refetchTables } = useTables();
    const { data: orders = [], isLoading: ordersLoading } = useOrders();
    const updateStatus = useUpdateTableStatus();
    const confirmOrder = useConfirmOrder();
    const cancelOrder = useCancelOrder();
    const completePayment = useCompleteOrderPayment();
    const markItemServed = useMarkItemServed();
    const checkInReservation = useReservationCheckIn();

    const [payMethod, setPayMethod] = useState<string>("cash");
    /** Tuỳ chọn xuất hóa đơn theo từng đơn (modal bàn) */
    const [invPrefByOrder, setInvPrefByOrder] = useState<
        Record<string, { mode: InvoiceUiMode; email: string; customerName: string }>
    >({});

    const [reservationCodeInput, setReservationCodeInput] = useState("");
    const [checkInTableId, setCheckInTableId] = useState("");

    const [selectedTable, setSelectedTable] = useState<ApiTable | null>(null);
    const [staffOrderOpen, setStaffOrderOpen] = useState(false);
    const [floorFilter, setFloorFilter] = useState<string>("all");
    const [alertCount, setAlertCount] = useState(0);
    const [prevNewCount, setPrevNewCount] = useState(0);

    // Phát âm thanh khi có đơn mới
    useEffect(() => {
        const newCount = orders.filter((o) => o.status === "NEW").length;
        if (newCount > prevNewCount) {
            setAlertCount((c) => c + (newCount - prevNewCount));
            playSound("newOrder");
            toast.warning("🔔 Có đơn mới cần xác nhận!", { duration: 3000 });
        }
        setPrevNewCount(newCount);
    }, [orders, prevNewCount]);

    // Lấy danh sách floors duy nhất để filter
    const floors = ["all", ...Array.from(new Set(tables.map((t) => t.floor || "—").filter(Boolean)))];
    const filteredTables = floorFilter === "all" ? tables : tables.filter((t) => (t.floor || "—") === floorFilter);

    const handleUpdateStatus = useCallback(
        async (tableId: string, status: string) => {
            try {
                await updateStatus.mutateAsync({ id: tableId, status });
                toast.success("Đã cập nhật trạng thái bàn");
                setSelectedTable(null);
            } catch {
                toast.error("Cập nhật thất bại");
            }
        },
        [updateStatus]
    );

    const handleConfirmOrder = async (orderId: string) => {
        try {
            await confirmOrder.mutateAsync(orderId);
            toast.success("Đã xác nhận đơn hàng");
        } catch {
            toast.error("Xác nhận thất bại");
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        try {
            await cancelOrder.mutateAsync(orderId);
            toast.success("Đã hủy đơn hàng");
        } catch {
            toast.error("Hủy đơn thất bại");
        }
    };

    const handleReservationCheckIn = async () => {
        const code = reservationCodeInput.trim();
        if (!code) {
            toast.error("Nhập mã phiếu đặt bàn");
            return;
        }
        try {
            const r = await checkInReservation.mutateAsync({
                code,
                tableId: checkInTableId || undefined,
            });
            toast.success(
                r.tableCode
                    ? `Đã mở bàn ${r.tableCode} cho khách đặt bàn`
                    : (r.message ?? "Check-in thành công"),
            );
            setReservationCodeInput("");
            setCheckInTableId("");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Check-in thất bại");
        }
    };

    const stats = {
        empty: tables.filter((t) => t.status === "EMPTY").length,
        occupied: tables.filter((t) => !["EMPTY", "NEED_CLEAN"].includes(t.status)).length,
        needPayment: tables.filter((t) => t.status === "NEED_PAYMENT").length,
        needClean: tables.filter((t) => t.status === "NEED_CLEAN").length,
    };

    // Tìm orders cho bàn đang được chọn (qua session)
    const tableOrders = selectedTable
        ? orders.filter((o) => o.session?.table?.id === selectedTable.id && !["COMPLETED", "CANCELLED"].includes(o.status))
        : [];

    const payableOnTable = tableOrders.filter(orderAwaitingPayment);

    const getInvPref = (orderId: string) => invPrefByOrder[orderId] ?? DEFAULT_INV_PREF;

    const setInvPref = (orderId: string, patch: Partial<typeof DEFAULT_INV_PREF>) => {
        setInvPrefByOrder((prev) => ({
            ...prev,
            [orderId]: { ...(prev[orderId] ?? DEFAULT_INV_PREF), ...patch },
        }));
    };

    const handlePayOrder = async (order: ApiOrder) => {
        const p = getInvPref(order.id);
        if (p.mode === "direct") {
            toast.error("Chọn «Tải PDF & thanh toán» cho hóa đơn trực tiếp.");
            return;
        }
        if ((p.mode === "email_plain" || p.mode === "email_pdf") && !p.email.trim()) {
            toast.error("Nhập email khách để gửi hóa đơn điện tử.");
            return;
        }
        if (
            (p.mode === "email_plain" || p.mode === "email_pdf") &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())
        ) {
            toast.error("Email không hợp lệ.");
            return;
        }
        try {
            await completePayment.mutateAsync({
                order,
                paymentMethod: payMethod,
                invoice:
                    p.mode === "none"
                        ? { invoiceMode: "none" }
                        : {
                              invoiceMode: p.mode,
                              customerEmail: p.email.trim(),
                              customerName: p.customerName.trim() || undefined,
                          },
            });
            toast.success(
                p.mode === "none"
                    ? "Đã thanh toán — đã ghi doanh thu (kết ca)"
                    : "Đã thanh toán — đã gửi hóa đơn qua email (nếu SMTP đã cấu hình)",
            );
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Thanh toán thất bại");
        }
    };

    const handleDirectPdfAndPay = async (order: ApiOrder) => {
        try {
            await downloadOrderInvoicePdf(order.id);
            await completePayment.mutateAsync({
                order,
                paymentMethod: payMethod,
                invoice: { invoiceMode: "none" },
            });
            toast.success("Đã tải hóa đơn PDF và thanh toán — đã ghi doanh thu (kết ca)");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Không thể tải hoặc thanh toán");
        }
    };

    const handlePayAllOnTable = async () => {
        if (payableOnTable.length === 0) return;
        try {
            for (const order of payableOnTable) {
                await completePayment.mutateAsync({
                    order,
                    paymentMethod: payMethod,
                    invoice: { invoiceMode: "none" },
                });
            }
            toast.success(`Đã thanh toán ${payableOnTable.length} đơn`);
            setSelectedTable(null);
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Thanh toán thất bại");
        }
    };

    const handleMarkOneItemServed = async (itemId: string) => {
        try {
            await markItemServed.mutateAsync(itemId);
            toast.success("Đã xác nhận món đã lên bàn");
        } catch {
            toast.error("Không cập nhật được trạng thái phục vụ");
        }
    };

    const handleMarkAllReadyServed = async (order: ApiOrder) => {
        const readyIds = order.orderItems.filter((i) => i.status === "READY").map((i) => i.id);
        if (readyIds.length === 0) return;
        try {
            for (const id of readyIds) {
                await markItemServed.mutateAsync(id);
            }
            toast.success("Đã xác nhận tất cả món sẵn sàng đã lên bàn");
        } catch {
            toast.error("Không cập nhật được trạng thái phục vụ");
        }
    };

    const isLoading = tablesLoading || ordersLoading;

    const showPayFooter = hasClaim(CLAIMS.PAYMENT_CONFIRM) && payableOnTable.length > 0;
    const showTableActionsFooter = hasClaim(CLAIMS.TABLE_UPDATE);
    const showStaffOrderFooter =
        !!selectedTable &&
        canStaffPlaceOrder(selectedTable) &&
        hasClaim(CLAIMS.ORDER_READ);
    const showFooterBlock = showStaffOrderFooter || showPayFooter || showTableActionsFooter;

    const selectedSummary = selectedTable ? getTableActivitySummary(selectedTable, orders) : null;

    return (
        <DashboardLayout>
            <div className="space-y-4 animate-fade-up">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="section-title">Sơ đồ bàn</h1>
                        <p className="section-sub">
                            {isLoading ? "Đang tải..." : `${tables.length} bàn · ${stats.occupied} đang phục vụ`}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {alertCount > 0 && (
                            <div
                                className="flex items-center gap-2 px-3 py-2 rounded animate-fade-in"
                                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}
                            >
                                <Bell size={13} style={{ color: "#f87171" }} />
                                <span className="text-xs font-medium" style={{ color: "#f87171" }}>
                                    {alertCount} đơn mới
                                </span>
                            </div>
                        )}
                        <button
                            onClick={() => { setAlertCount(0); refetchTables(); }}
                            className="btn-ghost text-[11px]"
                        >
                            {isLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Làm mới
                        </button>
                    </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { label: "Trống", value: stats.empty, color: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.2)" },
                        { label: "Đang dùng", value: stats.occupied, color: "#fb923c", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.2)" },
                        { label: "Cần thanh toán", value: stats.needPayment, color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.2)" },
                        { label: "Cần dọn", value: stats.needClean, color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)" },
                    ].map((s) => (
                        <div
                            key={s.label}
                            className="px-4 py-3 rounded text-center"
                            style={{ background: s.bg, border: `1px solid ${s.border}` }}
                        >
                            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: "rgba(245,240,232,0.4)" }}>{s.label}</p>
                        </div>
                    ))}
                </div>

                {hasClaim(CLAIMS.TABLE_UPDATE) && (
                    <div
                        className="rounded-xl p-4 space-y-3"
                        style={{ background: "rgba(201,169,110,0.06)", border: "1px solid rgba(201,169,110,0.2)" }}
                    >
                        <div className="flex items-center gap-2">
                            <Ticket size={16} style={{ color: "#C9A96E" }} />
                            <h2 className="text-sm font-semibold" style={{ color: "#F5F0E8" }}>
                                Check-in đặt bàn
                            </h2>
                        </div>
                        <p className="text-[11px] leading-relaxed" style={{ color: "rgba(245,240,232,0.45)" }}>
                            Nhập mã phiếu (đã được quản lý duyệt). Trong ngày đặt bàn tại Việt Nam. Nếu khách chưa chọn bàn lúc đặt, chọn bàn trước khi xác nhận.
                        </p>
                        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:items-end">
                            <input
                                value={reservationCodeInput}
                                onChange={(e) => setReservationCodeInput(e.target.value.toUpperCase())}
                                placeholder="Mã phiếu (VD: AB12CD34)"
                                className="flex-1 min-w-[160px] rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm font-mono tracking-wide"
                                style={{ color: "#F5F0E8" }}
                            />
                            <select
                                value={checkInTableId}
                                onChange={(e) => setCheckInTableId(e.target.value)}
                                className="min-w-[180px] rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm"
                                style={{ color: "#F5F0E8" }}
                            >
                                <option value="">Bàn (nếu đặt chưa gán bàn)</option>
                                {tables
                                    .filter((t) => t.isActive && t.status === "EMPTY")
                                    .map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.tableCode} · {t.capacity} khách
                                        </option>
                                    ))}
                            </select>
                            <button
                                type="button"
                                onClick={handleReservationCheckIn}
                                disabled={checkInReservation.isPending}
                                className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                                style={{
                                    background: "linear-gradient(180deg, #c9a96e, #8f7349)",
                                    color: "#1a1510",
                                }}
                            >
                                {checkInReservation.isPending ? "Đang xử lý..." : "Xác nhận check-in"}
                            </button>
                        </div>
                    </div>
                )}

                {/* Floor filter */}
                {floors.length > 1 && (
                    <div className="flex gap-2 flex-wrap">
                        {floors.map((f) => (
                            <button
                                key={f}
                                onClick={() => setFloorFilter(f)}
                                className="px-4 py-1.5 text-[11px] font-medium rounded-full border transition-all"
                                style={{
                                    border: floorFilter === f ? "1px solid rgba(201,169,110,0.5)" : "1px solid rgba(255,255,255,0.07)",
                                    background: floorFilter === f ? "rgba(201,169,110,0.12)" : "transparent",
                                    color: floorFilter === f ? "#C9A96E" : "rgba(245,240,232,0.4)",
                                }}
                            >
                                {f === "all" ? "Tất cả" : `Tầng ${f}`}
                            </button>
                        ))}
                    </div>
                )}

                {/* Loading state */}
                {isLoading && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 size={32} className="animate-spin" style={{ color: "#C9A96E" }} />
                        <span className="ml-3 text-sm" style={{ color: "rgba(245,240,232,0.4)" }}>Đang tải dữ liệu...</span>
                    </div>
                )}

                {/* Table grid */}
                {!isLoading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                        {filteredTables.map((table) => {
                            const tableOrder = orders.find(
                                (o) => o.session?.table?.id === table.id && !["COMPLETED", "CANCELLED"].includes(o.status)
                            );
                            const hasNewOrder = tableOrder?.status === "NEW";
                            const style = TABLE_STYLE[table.status] ?? TABLE_STYLE.EMPTY;
                            const act = getTableActivitySummary(table, orders);
                            return (
                                <div
                                    key={table.id}
                                    onClick={() => setSelectedTable(table)}
                                    className={cn("table-cell cursor-pointer", hasNewOrder && "ticket-urgent")}
                                    style={{ background: style.bg, border: `1px solid ${style.border}` }}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="text-base font-bold" style={{ color: "#F5F0E8" }}>
                                            {table.tableCode}
                                        </span>
                                        {hasNewOrder && <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />}
                                    </div>
                                    <StatusBadge type="table" status={table.status as "EMPTY" | "SEATED" | "ORDERING" | "SERVING" | "NEED_PAYMENT" | "NEED_CLEAN"} size="sm" lang="vi" />
                                    <p className="text-[9px] mt-1.5 leading-snug font-medium" style={{ color: "rgba(245,240,232,0.65)" }}>
                                        {act.tag}
                                    </p>
                                    <p className="text-[8px] leading-tight line-clamp-2 mt-0.5" style={{ color: "rgba(245,240,232,0.38)" }}>
                                        {act.detail}
                                    </p>
                                    <div className="flex items-center gap-1 mt-2">
                                        <Users size={9} style={{ color: "rgba(245,240,232,0.3)" }} />
                                        <span className="text-[10px]" style={{ color: "rgba(245,240,232,0.3)" }}>
                                            {table.capacity} chỗ
                                        </span>
                                    </div>
                                    {tableOrder && (
                                        <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                                            <p className="text-[10px]" style={{ color: "rgba(245,240,232,0.4)" }}>
                                                {new Intl.NumberFormat("vi-VN").format(Number(tableOrder.total))}đ
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Table Detail Modal */}
            <Modal
                open={!!selectedTable}
                onClose={() => {
                    setSelectedTable(null);
                    setStaffOrderOpen(false);
                }}
                size="lg"
                title={`Bàn ${selectedTable?.tableCode}${selectedTable?.tableName ? ` — ${selectedTable.tableName}` : ""}`}
                footer={
                    showFooterBlock ? (
                    <div className="flex w-full flex-col gap-3">
                        {showStaffOrderFooter && (
                            <button
                                type="button"
                                onClick={() => setStaffOrderOpen(true)}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gold/35 bg-gold/10 py-3 text-[12px] font-semibold uppercase tracking-wide text-gold hover:bg-gold/15"
                            >
                                <UtensilsCrossed size={16} />
                                Đặt món cho khách
                            </button>
                        )}
                        {showPayFooter && (
                            <div
                                className="flex flex-col gap-2 rounded-lg p-3"
                                style={{
                                    background: "rgba(201,169,110,0.08)",
                                    border: "1px solid rgba(201,169,110,0.22)",
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <Banknote size={14} style={{ color: "#C9A96E" }} />
                                    <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#C9A96E" }}>
                                        Thanh toán (ghi nhận doanh thu · kết ca)
                                    </span>
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                                    <select
                                        value={payMethod}
                                        onChange={(e) => setPayMethod(e.target.value)}
                                        className="min-h-[40px] flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
                                        style={{ color: "#F5F0E8" }}
                                    >
                                        {PAYMENT_METHOD_OPTIONS.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    {payableOnTable.length === 1 ? (
                                        <button
                                            type="button"
                                            onClick={() => handlePayOrder(payableOnTable[0])}
                                            disabled={completePayment.isPending}
                                            className="btn-gold inline-flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide"
                                        >
                                            {completePayment.isPending ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Banknote size={14} />
                                            )}
                                            Thanh toán
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handlePayAllOnTable}
                                            disabled={completePayment.isPending}
                                            className="btn-gold inline-flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide"
                                        >
                                            {completePayment.isPending ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Banknote size={14} />
                                            )}
                                            Thanh toán tất cả ({payableOnTable.length} đơn)
                                        </button>
                                    )}
                                </div>
                                <p className="text-[10px] leading-relaxed" style={{ color: "rgba(245,240,232,0.38)" }}>
                                    Thanh toán hàng loạt không gửi email hóa đơn — xuất hóa đơn từng đơn trong thẻ đơn. Xác nhận sẽ ghi{" "}
                                    <strong className="text-cream/50">PAID</strong> + thời điểm thanh toán — dùng cho báo cáo doanh thu và kết ca.
                                </p>
                            </div>
                        )}
                        {showTableActionsFooter && (
                            <div className="flex flex-wrap gap-2">
                                {(["EMPTY", "SEATED", "NEED_CLEAN"] as string[]).map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => selectedTable && handleUpdateStatus(selectedTable.id, s)}
                                        disabled={updateStatus.isPending}
                                        className="btn-ghost flex-1 min-w-[100px] justify-center text-[11px]"
                                    >
                                        → {s === "EMPTY" ? "Trống" : s === "SEATED" ? "Khách vào" : "Cần dọn"}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    ) : undefined
                }
            >
                <div className="space-y-3">
                    {selectedTable && (
                        <div
                            className="flex items-center justify-between p-3 rounded"
                            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                        >
                            <div>
                                <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>Trạng thái</p>
                                <StatusBadge type="table" status={selectedTable.status as "EMPTY" | "SEATED" | "ORDERING" | "SERVING" | "NEED_PAYMENT" | "NEED_CLEAN"} size="md" lang="vi" />
                                {selectedSummary && (
                                    <p className="text-[10px] mt-2 leading-relaxed" style={{ color: "rgba(245,240,232,0.45)" }}>
                                        {selectedSummary.tag} · {selectedSummary.detail}
                                    </p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>Sức chứa</p>
                                <p className="text-sm font-medium" style={{ color: "#F5F0E8" }}>{selectedTable.capacity} người</p>
                            </div>
                        </div>
                    )}

                    {tableOrders.length === 0 ? (
                        <div className="py-8 text-center space-y-4">
                            <p className="text-sm" style={{ color: "rgba(245,240,232,0.35)" }}>
                                Chưa có đơn trên bàn
                            </p>
                            {selectedTable && canStaffPlaceOrder(selectedTable) && hasClaim(CLAIMS.ORDER_READ) && (
                                <button
                                    type="button"
                                    onClick={() => setStaffOrderOpen(true)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gold/35 bg-gold/10 px-5 py-2.5 text-sm font-semibold text-gold hover:bg-gold/15"
                                >
                                    <UtensilsCrossed size={16} />
                                    Đặt món cho khách
                                </button>
                            )}
                        </div>
                    ) : (
                        tableOrders.map((order) => (
                            <div key={order.id} className="dash-card p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-mono" style={{ color: "rgba(245,240,232,0.5)" }}>
                                        #{order.orderNumber}
                                    </span>
                                    <StatusBadge type="order" status={order.status as "NEW" | "CONFIRMED" | "IN_PROGRESS" | "READY" | "SERVED" | "COMPLETED" | "CANCELLED"} size="sm" lang="vi" />
                                </div>
                                <div className="space-y-2">
                                    {order.orderItems.map((item) => (
                                        <div key={item.id} className="text-xs">
                                            <div className="flex items-start justify-between gap-2">
                                                <span style={{ color: "rgba(245,240,232,0.75)" }}>
                                                    {item.menuItem?.name ?? "—"} × {item.quantity}
                                                </span>
                                                <span style={{ color: "rgba(245,240,232,0.45)" }}>
                                                    {new Intl.NumberFormat("vi-VN").format(Number(item.subtotal))}đ
                                                </span>
                                            </div>
                                            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                                                <span
                                                    className="inline-block rounded px-1.5 py-0.5 text-[9px] font-medium"
                                                    style={{
                                                        color:
                                                            item.status === "SERVED"
                                                                ? "#6ee7b7"
                                                                : item.status === "READY"
                                                                  ? "#fcd34d"
                                                                  : "rgba(245,240,232,0.5)",
                                                        background:
                                                            item.status === "SERVED"
                                                                ? "rgba(16,185,129,0.12)"
                                                                : item.status === "READY"
                                                                  ? "rgba(251,191,36,0.1)"
                                                                  : "rgba(255,255,255,0.04)",
                                                    }}
                                                >
                                                    {itemStatusLabelVi(item.status)}
                                                </span>
                                                {item.status === "READY" && hasClaim(CLAIMS.ITEM_SERVE) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMarkOneItemServed(item.id)}
                                                        disabled={markItemServed.isPending}
                                                        className="inline-flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/15 disabled:opacity-50"
                                                    >
                                                        {markItemServed.isPending ? (
                                                            <Loader2 size={12} className="animate-spin" />
                                                        ) : (
                                                            <Hand size={12} />
                                                        )}
                                                        Đã mang ra
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {hasClaim(CLAIMS.ITEM_SERVE) &&
                                    order.orderItems.filter((i) => i.status === "READY").length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleMarkAllReadyServed(order)}
                                            disabled={markItemServed.isPending}
                                            className="mt-2 w-full rounded-lg border border-emerald-500/35 bg-emerald-500/10 py-2 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/15 disabled:opacity-50"
                                        >
                                            {markItemServed.isPending ? (
                                                <span className="inline-flex items-center justify-center gap-2">
                                                    <Loader2 size={14} className="animate-spin" />
                                                    Đang cập nhật...
                                                </span>
                                            ) : (
                                                "Mang tất cả món sẵn sàng"
                                            )}
                                        </button>
                                    )}
                                <div
                                    className="flex justify-between items-center mt-3 pt-3"
                                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                                >
                                    <span className="text-xs" style={{ color: "rgba(245,240,232,0.4)" }}>Tổng</span>
                                    <span className="font-bold" style={{ color: "#C9A96E" }}>
                                        {new Intl.NumberFormat("vi-VN").format(Number(order.total))}đ
                                    </span>
                                </div>
                                {orderAwaitingPayment(order) && hasClaim(CLAIMS.PAYMENT_CONFIRM) && (
                                    <div
                                        className="mt-3 space-y-2 rounded-lg p-3"
                                        style={{
                                            background: "rgba(201,169,110,0.08)",
                                            border: "1px solid rgba(201,169,110,0.22)",
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Banknote size={14} style={{ color: "#C9A96E" }} />
                                            <span className="text-[11px] font-semibold" style={{ color: "#C9A96E" }}>
                                                Thanh toán đơn này
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "rgba(245,240,232,0.45)" }}>
                                                Xuất hóa đơn
                                            </p>
                                            <div className="grid gap-1.5 text-[11px]" style={{ color: "rgba(245,240,232,0.82)" }}>
                                                {(
                                                    [
                                                        ["none", "Không gửi hóa đơn"],
                                                        ["email_plain", "Hóa đơn điện tử — nội dung chi tiết (gửi email)"],
                                                        ["email_pdf", "Hóa đơn điện tử — kèm file PDF (gửi email)"],
                                                        ["direct", "Hóa đơn trực tiếp — tải PDF về máy"],
                                                    ] as const
                                                ).map(([val, label]) => (
                                                    <label key={val} className="flex cursor-pointer items-start gap-2">
                                                        <input
                                                            type="radio"
                                                            name={`inv-${order.id}`}
                                                            checked={getInvPref(order.id).mode === val}
                                                            onChange={() => setInvPref(order.id, { mode: val })}
                                                            className="mt-0.5"
                                                        />
                                                        <span>{label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            {(getInvPref(order.id).mode === "email_plain" ||
                                                getInvPref(order.id).mode === "email_pdf") && (
                                                <div className="grid gap-2 sm:grid-cols-2">
                                                    <input
                                                        type="email"
                                                        placeholder="Email khách *"
                                                        value={getInvPref(order.id).email}
                                                        onChange={(e) => setInvPref(order.id, { email: e.target.value })}
                                                        className="min-h-[38px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
                                                        style={{ color: "#F5F0E8" }}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Tên khách (tuỳ chọn)"
                                                        value={getInvPref(order.id).customerName}
                                                        onChange={(e) => setInvPref(order.id, { customerName: e.target.value })}
                                                        className="min-h-[38px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
                                                        style={{ color: "#F5F0E8" }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                                            <select
                                                value={payMethod}
                                                onChange={(e) => setPayMethod(e.target.value)}
                                                className="min-h-[40px] flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
                                                style={{ color: "#F5F0E8" }}
                                            >
                                                {PAYMENT_METHOD_OPTIONS.map((opt) => (
                                                    <option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {getInvPref(order.id).mode === "direct" ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDirectPdfAndPay(order)}
                                                    disabled={completePayment.isPending}
                                                    className="btn-gold inline-flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide"
                                                >
                                                    {completePayment.isPending ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <FileText size={14} />
                                                    )}
                                                    Tải PDF &amp; thanh toán
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => handlePayOrder(order)}
                                                    disabled={completePayment.isPending}
                                                    className="btn-gold inline-flex flex-1 items-center justify-center gap-2 px-4 py-2.5 text-[12px] font-semibold uppercase tracking-wide"
                                                >
                                                    {completePayment.isPending ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Banknote size={14} />
                                                    )}
                                                    Thanh toán
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-[10px] leading-relaxed" style={{ color: "rgba(245,240,232,0.35)" }}>
                                            Hóa đơn PDF dùng mẫu từ cài đặt nhà hàng. Email dùng nội dung admin chỉnh trong mục Cài đặt (template Handlebars).
                                        </p>
                                    </div>
                                )}
                                {orderAwaitingPayment(order) && !hasClaim(CLAIMS.PAYMENT_CONFIRM) && (
                                    <p
                                        className="mt-2 text-[10px] font-medium"
                                        style={{ color: "rgba(251, 191, 36, 0.95)" }}
                                    >
                                        Chờ thanh toán — cần quyền xác nhận thanh toán.
                                    </p>
                                )}
                                {!orderAwaitingPayment(order) &&
                                    order.status !== "COMPLETED" &&
                                    order.orderItems.some((i) => i.status === "READY") && (
                                        <p
                                            className="mt-2 text-[10px] leading-relaxed"
                                            style={{ color: "rgba(245,240,232,0.42)" }}
                                        >
                                            Bấm &quot;Đã mang ra&quot; khi đưa món tới bàn. Khi đủ món, hệ thống mở
                                            thanh toán (đúng luồng: bếp → sẵn sàng → phục vụ → thu tiền).
                                        </p>
                                    )}
                                {/* Action buttons */}
                                {hasClaim(CLAIMS.ORDER_CONFIRM) && order.status === "NEW" && (
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => handleConfirmOrder(order.id)}
                                            disabled={confirmOrder.isPending}
                                            className="btn-gold flex-1 text-[11px] justify-center"
                                            style={{ padding: "0.5rem" }}
                                        >
                                            ✓ Xác nhận
                                        </button>
                                        {hasClaim(CLAIMS.ORDER_CANCEL) && (
                                            <button
                                                onClick={() => handleCancelOrder(order.id)}
                                                disabled={cancelOrder.isPending}
                                                className="btn-ghost flex-1 text-[11px] justify-center"
                                                style={{ padding: "0.5rem", color: "#f87171" }}
                                            >
                                                ✗ Hủy
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </Modal>

            {selectedTable && (
                <CashierStaffOrderModal
                    open={staffOrderOpen}
                    onClose={() => setStaffOrderOpen(false)}
                    tableCode={selectedTable.tableCode}
                />
            )}
        </DashboardLayout>
    );
}
