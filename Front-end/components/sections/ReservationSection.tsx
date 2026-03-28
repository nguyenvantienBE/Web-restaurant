"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { api, parseResponse } from "@/lib/api";
import type { Table } from "@/lib/types";
import { cn } from "@/lib/utils";

const TIME_SLOTS = [
    "17:30",
    "18:00",
    "18:30",
    "19:00",
    "19:30",
    "20:00",
    "20:30",
    "21:00",
    "21:30",
    "22:00",
];

type ReservationSectionProps = {
    embedded?: boolean;
    onClose?: () => void;
};

const luxuryLabel =
    "block text-[10px] tracking-[0.22em] uppercase text-[#c5a059] mb-2.5 font-semibold font-sans";
const luxuryInput =
    "w-full rounded-sm border border-[#6b5a42]/60 bg-[#0a0908] px-4 py-3.5 text-[15px] font-light text-cream/95 placeholder:text-cream/28 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-[border-color,box-shadow] duration-300 focus:border-[#b8956a]/75 focus:outline-none focus:ring-1 focus:ring-[#8a7348]/35 hover:border-[#7d6a4f]/80";

export function ReservationSection({ embedded, onClose }: ReservationSectionProps = {}) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [tables, setTables] = useState<Table[]>([]);
    const [selectedTableCode, setSelectedTableCode] = useState<string>("");
    const [tableDropdownOpen, setTableDropdownOpen] = useState(false);
    const [selectedArea, setSelectedArea] = useState<string>("");
    const [areaDropdownOpen, setAreaDropdownOpen] = useState(false);

    useEffect(() => {
        async function loadTables() {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/tables`
                );
                const json = await res.json();
                const data = (json.data ?? json) as Table[];
                setTables(Array.isArray(data) ? data : []);
            } catch {
                // ignore
            }
        }
        loadTables();
    }, []);

    function buildReservationIso(dateStr: string, timeStr: string): string {
        const tPart = timeStr?.trim() || "19:00";
        const timePart = tPart.length === 5 ? `${tPart}:00` : tPart.length >= 8 ? tPart : `${tPart}:00`;
        const d = new Date(`${dateStr}T${timePart}`);
        if (Number.isNaN(d.getTime())) {
            throw new Error("Ngày hoặc giờ không hợp lệ");
        }
        return d.toISOString();
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setSuccess(null);
        setError(null);

        const form = e.currentTarget;
        const date = (form.elements.namedItem("date") as HTMLInputElement).value;
        const time = (form.elements.namedItem("time") as HTMLSelectElement).value;
        const guestCount = Number((form.elements.namedItem("guestCount") as HTMLSelectElement).value);

        if (!date || !time) {
            setError("Vui lòng chọn đủ ngày và giờ.");
            setLoading(false);
            return;
        }
        if (!Number.isFinite(guestCount) || guestCount < 1) {
            setError("Số khách phải từ 1 trở lên.");
            setLoading(false);
            return;
        }

        let reservationTime: string;
        try {
            reservationTime = buildReservationIso(date, time);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ngày giờ không hợp lệ");
            setLoading(false);
            return;
        }

        const payload = {
            customerName: (form.elements.namedItem("name") as HTMLInputElement).value.trim(),
            customerPhone: (form.elements.namedItem("phone") as HTMLInputElement).value.trim(),
            customerEmail: (form.elements.namedItem("email") as HTMLInputElement).value.trim() || undefined,
            guestCount,
            reservationTime,
            area: selectedArea || undefined,
            notes: (form.elements.namedItem("notes") as HTMLTextAreaElement).value.trim() || undefined,
            tableCode: selectedTableCode?.trim() || undefined,
        };

        try {
            const res = await api.publicPost("/public/reservations", payload);
            const created = await parseResponse<{ confirmationCode?: string }>(res);
            const code = created?.confirmationCode;
            setSuccess(
                code
                    ? `Đặt bàn thành công! Mã phiếu của bạn: ${code}. Vui lòng giữ mã để nhận bàn tại nhà hàng. Chúng tôi sẽ gửi email xác nhận khi được duyệt (khi đã cấu hình email).`
                    : "Đặt bàn thành công! Nhà hàng sẽ liên hệ xác nhận.",
            );
            form.reset();
            setSelectedTableCode("");
            setSelectedArea("");
            if (onClose) {
                window.setTimeout(() => onClose(), 1600);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Đặt bàn thất bại, vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }

    const dropBtnClass = `${luxuryInput} flex items-center justify-between gap-3 text-left cursor-pointer`;
    const dropPanelClass =
        "absolute z-20 mt-2 w-full overflow-hidden rounded-sm border border-[#3d3428]/95 bg-[#0c0b0a] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.85)]";
    const tableDropPanelClass =
        "absolute z-20 mt-2 w-full max-h-56 overflow-y-auto rounded-sm border border-[#3d3428]/95 bg-[#0c0b0a] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.85)]";

    const getAreaLabel = (tb: Table & { floor?: string }) => {
        let area = tb.area;
        const code = (tb.tableCode || "").toUpperCase();
        const floor = (tb as { floor?: string }).floor;

        if (!area && floor) {
            const f = floor.toLowerCase();
            if (f.includes("ground")) area = "indoor";
            else if (f.includes("first")) area = "rooftop";
        }

        if (!area) {
            if (code.startsWith("A")) area = "indoor";
            else if (code.startsWith("B")) area = "outdoor";
            else if (code.startsWith("R")) area = "rooftop";
            else if (code.includes("BAR")) area = "bar";
            else {
                const num = parseInt(code.replace(/\D/g, ""), 10);
                if (!Number.isNaN(num)) {
                    if (num <= 3) area = "indoor";
                    else if (num <= 6) area = "outdoor";
                    else area = "rooftop";
                }
            }
        }

        switch (area) {
            case "indoor":
                return "Trong nhà";
            case "outdoor":
                return "Ngoài trời";
            case "rooftop":
                return "Sân thượng";
            case "bar":
                return "Khu bar";
            default:
                return "Bất kỳ";
        }
    };

    const msgError =
        "text-sm text-red-300/95 bg-red-950/40 border border-red-500/25 rounded-sm px-4 py-3 leading-relaxed";
    const msgOk =
        "text-sm text-emerald-300/95 bg-emerald-950/35 border border-emerald-500/25 rounded-sm px-4 py-3 leading-relaxed";

    const formFields = (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-x-6 md:gap-y-5">
                <div>
                    <label className={luxuryLabel}>
                        Họ tên <span className="text-[#d4a84b]">*</span>
                    </label>
                    <input
                        name="name"
                        required
                        className={luxuryInput}
                        placeholder="Nguyễn Văn A"
                        autoComplete="name"
                    />
                </div>
                <div>
                    <label className={luxuryLabel}>
                        Số điện thoại <span className="text-[#d4a84b]">*</span>
                    </label>
                    <input
                        name="phone"
                        required
                        className={luxuryInput}
                        placeholder="0901 234 567"
                        autoComplete="tel"
                    />
                </div>
            </div>

            <div>
                <label className={luxuryLabel}>Email</label>
                <input
                    name="email"
                    type="email"
                    className={luxuryInput}
                    placeholder="mail@example.com"
                    autoComplete="email"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-x-6">
                <div>
                    <label className={luxuryLabel}>
                        Số khách <span className="text-[#d4a84b]">*</span>
                    </label>
                    <div className="relative">
                        <select
                            name="guestCount"
                            required
                            defaultValue="2"
                            className={cn(luxuryInput, "appearance-none cursor-pointer pr-11")}
                        >
                            {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a8946e]/90"
                            strokeWidth={1.75}
                        />
                    </div>
                </div>
                <div>
                    <label className={luxuryLabel}>
                        Giờ <span className="text-[#d4a84b]">*</span>
                    </label>
                    <div className="relative">
                        <select
                            name="time"
                            required
                            defaultValue=""
                            className={cn(luxuryInput, "appearance-none cursor-pointer pr-11")}
                        >
                            <option value="" disabled>
                                — : —
                            </option>
                            {TIME_SLOTS.map((slot) => (
                                <option key={slot} value={slot}>
                                    {slot}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a8946e]/90"
                            strokeWidth={1.75}
                        />
                    </div>
                </div>
            </div>

            <div>
                <label className={luxuryLabel}>
                    Ngày <span className="text-[#d4a84b]">*</span>
                </label>
                <input name="date" type="date" required className={luxuryInput} />
            </div>

            <div className="relative">
                <label className={luxuryLabel}>Khu vực</label>
                <input type="hidden" name="area" value={selectedArea} />
                <button
                    type="button"
                    onClick={() => setAreaDropdownOpen((o) => !o)}
                    className={dropBtnClass}
                >
                    <span className={selectedArea ? "text-cream/95" : "text-cream/35"}>
                        {selectedArea === "indoor"
                            ? "Trong nhà"
                            : selectedArea === "outdoor"
                              ? "Ngoài trời"
                              : selectedArea === "rooftop"
                                ? "Sân thượng"
                                : selectedArea === "bar"
                                  ? "Khu bar"
                                  : "Bất kỳ"}
                    </span>
                    <ChevronDown size={16} className="text-[#a8946e]/85 shrink-0" strokeWidth={1.75} />
                </button>
                {areaDropdownOpen && (
                    <div className={dropPanelClass}>
                        {[
                            { value: "", label: "Bất kỳ" },
                            { value: "indoor", label: "Trong nhà" },
                            { value: "outdoor", label: "Ngoài trời" },
                            { value: "rooftop", label: "Sân thượng" },
                            { value: "bar", label: "Khu bar" },
                        ].map((opt) => (
                            <button
                                key={opt.value || "any"}
                                type="button"
                                onClick={() => {
                                    setSelectedArea(opt.value);
                                    setAreaDropdownOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-cream/90 hover:bg-white/[0.06] transition-colors"
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="relative">
                <label className={luxuryLabel}>Chọn bàn (tuỳ chọn)</label>
                <input type="hidden" name="tableCode" value={selectedTableCode} />
                <button
                    type="button"
                    onClick={() => setTableDropdownOpen((o) => !o)}
                    className={dropBtnClass}
                >
                    <span className={selectedTableCode ? "text-cream/95 line-clamp-2" : "text-cream/35"}>
                        {selectedTableCode
                            ? (() => {
                                  const tb = tables.find((x) => x.tableCode === selectedTableCode);
                                  if (!tb) return selectedTableCode;
                                  return `${tb.tableCode} · ${getAreaLabel(tb)} · ${tb.capacity} khách`;
                              })()
                            : "—"}
                    </span>
                    <ChevronDown size={16} className="text-[#a8946e]/85 shrink-0" strokeWidth={1.75} />
                </button>
                {tableDropdownOpen && (
                    <div className={tableDropPanelClass}>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedTableCode("");
                                setTableDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-cream/80 hover:bg-white/[0.06] transition-colors"
                        >
                            Để nhà hàng sắp xếp
                        </button>
                        <div className="border-t border-white/[0.08]" />
                        {tables
                            .sort((a, b) => a.tableCode.localeCompare(b.tableCode))
                            .map((tb) => {
                                const label = `${tb.tableCode} · ${getAreaLabel(tb)} · ${tb.capacity} khách`;
                                return (
                                    <button
                                        key={tb.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedTableCode(tb.tableCode);
                                            setTableDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm text-cream/90 hover:bg-white/[0.06] transition-colors"
                                    >
                                        {label}
                                    </button>
                                );
                            })}
                    </div>
                )}
            </div>

            <div>
                <label className={luxuryLabel}>Ghi chú</label>
                <textarea
                    name="notes"
                    rows={embedded ? 6 : 5}
                    placeholder="Yêu cầu đặc biệt, dịp kỷ niệm..."
                    className={cn(luxuryInput, "resize-y min-h-[140px] leading-relaxed")}
                />
            </div>

            {(error || success) && (
                <div className="space-y-2">
                    {error && <p className={msgError}>{error}</p>}
                    {success && <p className={msgOk}>{success}</p>}
                </div>
            )}

            <div className="pt-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center rounded-sm border border-[#8a7348]/50 bg-gradient-to-b from-[#e4c88a] via-[#c9a96e] to-[#8f7349] py-4 text-[12px] font-bold tracking-[0.28em] uppercase text-[#1a1510] shadow-[0_14px_40px_-10px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.35)] transition-[filter,opacity] duration-300 hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b8956a]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0908] disabled:cursor-not-allowed disabled:opacity-55"
                >
                    {loading ? "Đang gửi..." : "Đặt bàn"}
                </button>
            </div>
        </>
    );

    const form = (
        <form onSubmit={handleSubmit}>
            <div
                className={cn(
                    "text-left",
                    !embedded && "reservation-form-panel px-8 py-9 md:px-10 md:py-11",
                )}
            >
                {!embedded && (
                    <header className="text-center mb-9 md:mb-10">
                        <div className="flex items-center justify-center gap-3 sm:gap-5 mb-5">
                            <span className="h-px w-12 sm:w-16 max-w-[30%] bg-gradient-to-r from-transparent via-[#c5a059]/80 to-[#c5a059]/30" />
                            <span className="section-label mb-0 whitespace-nowrap">{t("reservation.label")}</span>
                            <span className="h-px w-12 sm:w-16 max-w-[30%] bg-gradient-to-l from-transparent via-[#c5a059]/80 to-[#c5a059]/30" />
                        </div>
                        <h2 className="font-serif text-[1.7rem] sm:text-[2rem] text-[#ebe3d6] font-normal tracking-tight mb-3 leading-tight">
                            {t("reservation.title")}
                        </h2>
                        <p className="text-[13px] sm:text-sm text-cream/50 font-light leading-relaxed max-w-md mx-auto">
                            {t("reservation.subtitle")}
                        </p>
                    </header>
                )}
                <div className="space-y-5 md:space-y-6">{formFields}</div>
            </div>
        </form>
    );

    if (embedded) {
        return form;
    }

    return (
        <section id="reservation" className="relative py-24 lg:py-32 overflow-hidden">
            <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1920&q=80"
                    alt=""
                    className="h-full w-full object-cover scale-105 blur-[3px]"
                />
                <div className="absolute inset-0 bg-[#060504]/78 backdrop-blur-[10px]" />
            </div>
            <div className="relative z-10 mx-auto max-w-[480px] px-5 sm:px-6">{form}</div>
        </section>
    );
}
