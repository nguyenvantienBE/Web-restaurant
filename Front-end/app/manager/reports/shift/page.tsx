"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/lib/auth";
import { CLAIMS } from "@/lib/types";
import { useShiftSummary, vnTodayYmd } from "@/lib/hooks/useReports";
import { useCashierQueriesRefresh } from "@/lib/hooks/useCashierQueriesRefresh";
import {
    useCurrentShift,
    useClosePreview,
    useOpenShift,
    useCloseShift,
    useAddShiftExpense,
} from "@/lib/hooks/useShifts";
import { ArrowLeft, Loader2, Receipt, AlertTriangle, ChevronRight } from "lucide-react";
import { toast } from "sonner";

const formatVND = (p: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);

const EXPENSE_TYPES = [
    { value: "REFUND", label: "Hoàn tiền / refund" },
    { value: "INTERNAL_SPEND", label: "Chi nội bộ" },
    { value: "PURCHASE", label: "Mua hàng" },
    { value: "OTHER", label: "Khác" },
];

type Step = 1 | 2 | 3;

function ShiftSummaryContent() {
    useCashierQueriesRefresh(true, { includeReports: true });
    const { hasClaim } = useAuth();
    const search = useSearchParams();
    const dateParam = search.get("date") ?? undefined;
    const ymd = dateParam || vnTodayYmd();

    const { data: reportData, isLoading: reportLoading, error: reportError } = useShiftSummary(ymd);
    const { data: currentShift, isLoading: shiftLoading, refetch: refetchCurrent } = useCurrentShift();
    const preview = useClosePreview(currentShift?.id);
    const openShift = useOpenShift();
    const closeShift = useCloseShift(currentShift?.id);
    const addExpense = useAddShiftExpense(currentShift?.id);

    const [step, setStep] = useState<Step>(1);
    const [openingInput, setOpeningInput] = useState("");
    const [actualCashInput, setActualCashInput] = useState("");
    const [diffReason, setDiffReason] = useState("");
    const [managerId, setManagerId] = useState("");
    const [expAmount, setExpAmount] = useState("");
    const [expType, setExpType] = useState("OTHER");
    const [expNote, setExpNote] = useState("");

    const canOpen = hasClaim(CLAIMS.SHIFT_OPEN);
    const canExpense = hasClaim(CLAIMS.SHIFT_EXPENSE);
    const canClose = hasClaim(CLAIMS.SHIFT_CLOSE);
    const canApproveDiff = hasClaim(CLAIMS.SHIFT_APPROVE_DIFF);

    const expectedCash = preview.data?.expectedCash ?? 0;
    const actualNum = parseFloat(actualCashInput.replace(/,/g, "")) || 0;
    const difference = useMemo(() => actualNum - expectedCash, [actualNum, expectedCash]);

    const handleOpenShift = async () => {
        const v = parseFloat(openingInput.replace(/,/g, ""));
        if (Number.isNaN(v) || v < 0) {
            toast.error("Nhập tiền đầu ca hợp lệ");
            return;
        }
        try {
            await openShift.mutateAsync(v);
            toast.success("Đã mở ca");
            setOpeningInput("");
            refetchCurrent();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Không mở được ca");
        }
    };

    const handleAddExpense = async () => {
        const amt = parseFloat(expAmount.replace(/,/g, ""));
        if (Number.isNaN(amt) || amt <= 0) {
            toast.error("Số tiền chi không hợp lệ");
            return;
        }
        try {
            await addExpense.mutateAsync({ amount: amt, type: expType, note: expNote || undefined });
            toast.success("Đã ghi chi");
            setExpAmount("");
            setExpNote("");
            preview.refetch();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Lỗi ghi chi");
        }
    };

    const goClose = async () => {
        if (!preview.data?.validation.canClose) {
            toast.error("Chưa đủ điều kiện kết ca — xử lý đơn treo trước.");
            return;
        }
        setStep(2);
        setActualCashInput(String(Math.round(expectedCash)));
    };

    const submitClose = async () => {
        if (Number.isNaN(actualNum) || actualNum < 0) {
            toast.error("Nhập số tiền đếm thực tế");
            return;
        }
        const needReason = Math.abs(difference) >= 0.01;
        if (needReason && (!diffReason.trim() || diffReason.trim().length < 5)) {
            toast.error("Chênh lệch tiền mặt — nhập lý do tối thiểu 5 ký tự (bước 3).");
            setStep(3);
            return;
        }
        if (needReason && !canApproveDiff && !managerId.trim()) {
            toast.error("Cần ID người quản lý duyệt (UUID) hoặc đăng nhập tài khoản có quyền SHIFT_APPROVE_DIFF.");
            setStep(3);
            return;
        }
        try {
            await closeShift.mutateAsync({
                actualCash: actualNum,
                differenceReason: needReason ? diffReason.trim() : undefined,
                managerApproverId: needReason && !canApproveDiff ? managerId.trim() : undefined,
            });
            toast.success("Đã kết ca — đơn hàng trong ca đã khóa.");
            setStep(1);
            setActualCashInput("");
            setDiffReason("");
            setManagerId("");
            refetchCurrent();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Không kết ca được");
        }
    };

    if (!hasClaim(CLAIMS.REPORT_VIEW)) {
        return (
            <DashboardLayout>
                <p className="text-cream/50">Bạn không có quyền xem.</p>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-3xl">
                <div className="flex items-center gap-4 flex-wrap">
                    <Link
                        href="/manager/reports"
                        className="inline-flex items-center gap-2 text-cream/50 hover:text-cream text-sm"
                    >
                        <ArrowLeft size={16} /> Báo cáo
                    </Link>
                </div>

                <div>
                    <h1 className="font-serif text-cream text-2xl flex items-center gap-2">
                        <Receipt className="text-gold" size={26} />
                        Kết ca POS
                    </h1>
                    <p className="text-cream/40 text-sm mt-1">
                        Ngày {ymd} · Kiểm kê tiền mặt · Khóa đơn sau khi đóng ca
                    </p>
                </div>

                {shiftLoading && (
                    <div className="flex items-center gap-2 text-cream/40 py-6">
                        <Loader2 className="animate-spin" size={20} /> Đang kiểm tra ca...
                    </div>
                )}

                {!shiftLoading && !currentShift && canOpen && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
                        <p className="text-amber-200 text-sm font-medium">Chưa có ca mở — không thể tạo đơn mới.</p>
                        <div className="flex flex-wrap gap-2 items-end">
                            <label className="text-cream/60 text-xs block w-full">Tiền đầu ca (đếm được)</label>
                            <input
                                type="number"
                                min={0}
                                step={1000}
                                value={openingInput}
                                onChange={(e) => setOpeningInput(e.target.value)}
                                className="flex-1 min-w-[160px] rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-cream"
                                placeholder="0"
                            />
                            <button
                                type="button"
                                onClick={handleOpenShift}
                                disabled={openShift.isPending}
                                className="bg-gold text-charcoal px-4 py-2 text-sm font-semibold disabled:opacity-50"
                            >
                                {openShift.isPending ? "..." : "Mở ca"}
                            </button>
                        </div>
                    </div>
                )}

                {!shiftLoading && !currentShift && !canOpen && (
                    <p className="text-cream/45 text-sm">Không có ca đang mở. Liên hệ quản lý để mở ca.</p>
                )}

                {currentShift && (
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-cream/70">
                        Ca đang mở · Mở lúc {new Date(currentShift.openedAt).toLocaleString("vi-VN")} · Đầu ca:{" "}
                        {formatVND(Number(currentShift.openingCash))}
                    </div>
                )}

                {/* Báo cáo ngày (số liệu thật) */}
                {reportError && (
                    <div className="rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {(reportError as Error).message}
                    </div>
                )}
                {reportLoading && <Loader2 className="animate-spin text-cream/40" />}
                {reportData && (
                    <div className="rounded-xl border border-white/10 p-5 space-y-4">
                        <h2 className="text-cream font-medium">Tổng quan ngày (báo cáo)</h2>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                                <p className="text-cream/45">Doanh thu (PAID)</p>
                                <p className="text-gold font-semibold">{formatVND(reportData.totalRevenue)}</p>
                            </div>
                            <div>
                                <p className="text-cream/45">Đơn / GD</p>
                                <p className="text-cream">
                                    {reportData.orderCount} đơn · {reportData.totalTransactions} GD
                                </p>
                            </div>
                        </div>
                        <div className="text-xs text-cream/40">
                            Tiền mặt / thẻ / chuyển khoản theo ngày — khác với két tiền ca hiện tại (bước kết ca bên dưới).
                        </div>
                    </div>
                )}

                {/* Wizard kết ca */}
                {currentShift && canClose && (
                    <div className="space-y-4">
                        <div className="flex gap-2 text-xs">
                            {[1, 2, 3].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStep(s as Step)}
                                    className={`flex-1 rounded py-2 px-2 border ${
                                        step === s
                                            ? "border-gold bg-gold/15 text-gold"
                                            : "border-white/10 text-cream/45"
                                    }`}
                                >
                                    {s === 1 ? "1. Tổng kết" : s === 2 ? "2. Đếm tiền" : "3. Xác nhận"}
                                </button>
                            ))}
                        </div>

                        {step === 1 && preview.isLoading && (
                            <Loader2 className="animate-spin text-cream/40" />
                        )}
                        {step === 1 && preview.data && (
                            <div className="rounded-xl border border-white/10 p-5 space-y-4">
                                <h3 className="text-cream font-medium">Bước 1 — Tổng kết ca (shift hiện tại)</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-cream/45">Tiền đầu ca</p>
                                        <p className="text-cream">{formatVND(preview.data.shift.openingCash)}</p>
                                    </div>
                                    <div>
                                        <p className="text-cream/45">Bán tiền mặt (trong ca)</p>
                                        <p className="text-emerald-300">{formatVND(preview.data.cashSales)}</p>
                                    </div>
                                    <div>
                                        <p className="text-cream/45">Chi tiền mặt (đã ghi)</p>
                                        <p className="text-orange-300">− {formatVND(preview.data.expensesTotal)}</p>
                                    </div>
                                    <div>
                                        <p className="text-cream/45">Tiền mặt dự kiến trong két</p>
                                        <p className="text-gold font-bold text-lg">{formatVND(preview.data.expectedCash)}</p>
                                    </div>
                                </div>

                                {!preview.data.validation.canClose && (
                                    <div className="rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                                        <AlertTriangle className="inline mr-1 mb-0.5" size={14} />
                                        Không thể kết ca:{" "}
                                        {preview.data.validation.messages.join(" ") || "Còn đơn chưa xong."}
                                        {preview.data.validation.blockingOrders?.length > 0 && (
                                            <ul className="mt-2 list-disc pl-4">
                                                {preview.data.validation.blockingOrders.map((o) => (
                                                    <li key={o.id}>
                                                        #{o.orderNumber} ({o.status})
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}

                                {canExpense && (
                                    <div className="border-t border-white/10 pt-4 space-y-2">
                                        <p className="text-cream/60 text-sm">Ghi chi tiền mặt (giảm két)</p>
                                        <div className="flex flex-wrap gap-2">
                                            <select
                                                value={expType}
                                                onChange={(e) => setExpType(e.target.value)}
                                                className="rounded border border-white/15 bg-black/30 px-2 py-2 text-sm text-cream"
                                            >
                                                {EXPENSE_TYPES.map((t) => (
                                                    <option key={t.value} value={t.value}>
                                                        {t.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                placeholder="Số tiền"
                                                value={expAmount}
                                                onChange={(e) => setExpAmount(e.target.value)}
                                                className="w-32 rounded border border-white/15 bg-black/30 px-2 py-2 text-sm text-cream"
                                            />
                                            <input
                                                placeholder="Ghi chú"
                                                value={expNote}
                                                onChange={(e) => setExpNote(e.target.value)}
                                                className="flex-1 min-w-[120px] rounded border border-white/15 bg-black/30 px-2 py-2 text-sm text-cream"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleAddExpense}
                                                disabled={addExpense.isPending}
                                                className="px-3 py-2 text-sm border border-white/20 text-cream hover:bg-white/5"
                                            >
                                                Ghi chi
                                            </button>
                                        </div>
                                        {preview.data.expenses.length > 0 && (
                                            <ul className="text-xs text-cream/50 space-y-1">
                                                {preview.data.expenses.map((e) => (
                                                    <li key={e.id} className="flex justify-between">
                                                        <span>
                                                            {e.type} {e.note ? `· ${e.note}` : ""}
                                                        </span>
                                                        <span>{formatVND(e.amount)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={goClose}
                                    disabled={!preview.data.validation.canClose}
                                    className="inline-flex items-center gap-2 bg-gold text-charcoal px-5 py-2.5 text-sm font-semibold disabled:opacity-40"
                                >
                                    Tiếp: đếm tiền mặt <ChevronRight size={16} />
                                </button>
                            </div>
                        )}

                        {step === 2 && preview.data && (
                            <div className="rounded-xl border border-gold/25 bg-gold/[0.06] p-5 space-y-4">
                                <h3 className="text-cream font-medium">Bước 2 — Đếm tiền thực tế</h3>
                                <p className="text-cream/50 text-sm">
                                    Dự kiến trong két: <strong className="text-gold">{formatVND(expectedCash)}</strong>
                                </p>
                                <label className="block text-sm text-cream/60">Tiền mặt đếm được (thực tế)</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={actualCashInput}
                                    onChange={(e) => setActualCashInput(e.target.value)}
                                    className="w-full max-w-xs rounded-lg border border-white/15 bg-black/40 px-3 py-3 text-lg text-cream"
                                />
                                <div
                                    className={`text-sm font-medium ${
                                        Math.abs(difference) < 0.01 ? "text-emerald-400" : "text-amber-300"
                                    }`}
                                >
                                    Chênh lệch: {formatVND(difference)}
                                    {Math.abs(difference) < 0.01 ? " (khớp)" : ""}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="px-4 py-2 text-sm border border-white/15 text-cream/80"
                                    >
                                        Quay lại
                                    </button>
                                    {Math.abs(difference) < 0.01 && (
                                        <button
                                            type="button"
                                            onClick={submitClose}
                                            disabled={closeShift.isPending}
                                            className="px-4 py-2 text-sm bg-emerald-600 text-white font-semibold disabled:opacity-50"
                                        >
                                            Kết ca ngay (khớp két)
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => setStep(3)}
                                        className="px-4 py-2 text-sm bg-gold text-charcoal font-semibold"
                                    >
                                        Tiếp: xác nhận
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="rounded-xl border border-white/10 p-5 space-y-4">
                                <h3 className="text-cream font-medium">Bước 3 — Xác nhận kết ca</h3>
                                {Math.abs(difference) >= 0.01 && (
                                    <>
                                        <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                                            Có chênh lệch tiền mặt. Bắt buộc nhập lý do (audit).
                                        </div>
                                        <textarea
                                            value={diffReason}
                                            onChange={(e) => setDiffReason(e.target.value)}
                                            rows={3}
                                            className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-cream"
                                            placeholder="Lý do chênh lệch (tối thiểu 5 ký tự)..."
                                        />
                                        {!canApproveDiff && (
                                            <div>
                                                <label className="text-xs text-cream/50 block mb-1">
                                                    UUID người quản lý có quyền SHIFT_APPROVE_DIFF (bắt buộc nếu bạn không có
                                                    quyền duyệt)
                                                </label>
                                                <input
                                                    value={managerId}
                                                    onChange={(e) => setManagerId(e.target.value)}
                                                    className="w-full rounded border border-white/15 bg-black/30 px-3 py-2 text-sm font-mono text-cream"
                                                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="px-4 py-2 text-sm border border-white/15 text-cream/80"
                                    >
                                        Quay lại
                                    </button>
                                    <button
                                        type="button"
                                        onClick={submitClose}
                                        disabled={closeShift.isPending}
                                        className="px-5 py-2.5 text-sm font-semibold bg-gold text-charcoal disabled:opacity-50"
                                    >
                                        {closeShift.isPending ? "Đang kết ca..." : "Xác nhận kết ca"}
                                    </button>
                                </div>
                                <p className="text-cream/35 text-xs">
                                    Sau khi kết ca: đơn thuộc ca này không chỉnh sửa / không thêm thanh toán. Ca mới cần mở
                                    lại từ màn hình này.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Legacy báo cáo top món */}
                {reportData && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5">
                        <p className="text-cream font-medium mb-3">Top món (trong ngày — báo cáo)</p>
                        {!reportData.topItems?.length ? (
                            <p className="text-cream/35 text-sm">Chưa có món</p>
                        ) : (
                            <ul className="space-y-2">
                                {reportData.topItems.map((it, i) => (
                                    <li key={it.menuItemId} className="flex justify-between text-sm gap-2">
                                        <span className="text-cream/70">
                                            {i + 1}. {it.name}
                                        </span>
                                        <span className="text-gold shrink-0">
                                            {it.totalSold}× · {formatVND(it.revenueGenerated)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}

export default function ShiftSummaryPage() {
    return (
        <Suspense
            fallback={
                <DashboardLayout>
                    <div className="flex items-center gap-2 text-cream/40 py-12">
                        <Loader2 className="animate-spin" size={22} />
                        Đang tải...
                    </div>
                </DashboardLayout>
            }
        >
            <ShiftSummaryContent />
        </Suspense>
    );
}
