"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, parseResponse } from "@/lib/api";
import type { Table } from "@/lib/types";

type ReservationSectionProps = {
    /** Khi true: chỉ hiển thị form (dùng trong modal), có nút đóng và gọi onClose khi gửi thành công */
    embedded?: boolean;
    onClose?: () => void;
};

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
                // Chỉ hiển thị bàn đang active, ưu tiên bàn trống
                setTables(Array.isArray(data) ? data : []);
            } catch {
                // ignore, không chặn đặt bàn nếu load bàn lỗi
            }
        }
        loadTables();
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setSuccess(null);
        setError(null);

        const form = e.currentTarget;
        const date = (form.elements.namedItem("date") as HTMLInputElement).value;
        const time = (form.elements.namedItem("time") as HTMLInputElement).value;

        const payload = {
            customerName: (form.elements.namedItem("name") as HTMLInputElement).value,
            customerPhone: (form.elements.namedItem("phone") as HTMLInputElement).value,
            customerEmail: (form.elements.namedItem("email") as HTMLInputElement).value || undefined,
            guestCount: Number((form.elements.namedItem("guestCount") as HTMLInputElement).value),
            reservationTime: new Date(`${date}T${time || "19:00"}:00`).toISOString(),
            area: selectedArea || undefined,
            notes: (form.elements.namedItem("notes") as HTMLTextAreaElement).value || undefined,
            tableCode: selectedTableCode || undefined,
        };

        try {
            const res = await api.publicPost("/public/reservations", payload);
            await parseResponse(res);
            setSuccess("Đặt bàn thành công! Nhà hàng sẽ liên hệ xác nhận.");
            form.reset();
            setSelectedTableCode("");
            setSelectedArea("");
            onClose?.();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Đặt bàn thất bại, vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }

    const inputClass = embedded
        ? "w-full bg-white/[0.06] border border-white/20 rounded-xl px-4 py-2.5 text-cream placeholder:text-cream/40 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50 transition-all duration-200 hover:border-white/30"
        : "w-full bg-white/[0.06] border border-white/20 rounded-xl px-4 py-3 text-cream placeholder:text-cream/40 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/50 transition-all duration-200 hover:border-white/30";
    const labelClass = embedded
        ? "block text-[11px] tracking-[0.18em] uppercase text-cream/80 mb-2 font-medium"
        : "block text-[11px] tracking-[0.2em] uppercase text-cream/80 mb-2 font-medium";

    const getAreaLabel = (t: Table & { floor?: string }) => {
        let area = t.area;
        const code = (t.tableCode || "").toUpperCase();
        const floor = (t as any).floor as string | undefined;

        // Ưu tiên area nếu backend có trả về
        if (!area && floor) {
            const f = floor.toLowerCase();
            if (f.includes("ground")) area = "indoor";
            else if (f.includes("first")) area = "rooftop";
        }

        // Nếu vẫn chưa xác định, suy luận theo mã bàn
        if (!area) {
            if (code.startsWith("A")) area = "indoor";
            else if (code.startsWith("B")) area = "outdoor";
            else if (code.startsWith("R")) area = "rooftop";
            else if (code.includes("BAR")) area = "bar";
            else {
                const num = parseInt(code.replace(/\\D/g, ""), 10);
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

    const formContent = (
        <div
            className={
                embedded
                    ? "relative p-5 md:p-6 border border-gold/25 bg-charcoal/98 rounded-xl text-left shadow-lg shadow-black/30"
                    : "glass-card p-8 md:p-10 border border-gold/25 rounded-2xl text-left shadow-xl shadow-black/20"
            }
        >
            <form onSubmit={handleSubmit} className={embedded ? "space-y-5" : "space-y-5"}>
                <div>
                    <label className={labelClass}>Họ tên *</label>
                    <input name="name" required className={inputClass} placeholder="Nguyễn Văn A" />
                </div>
                <div>
                    <label className={labelClass}>Số điện thoại *</label>
                    <input name="phone" required className={inputClass} placeholder="0901 234 567" />
                </div>
                <div>
                    <label className={labelClass}>Email</label>
                    <input name="email" type="email" className={inputClass} placeholder="email@example.com" />
                </div>
                <div>
                    <label className={labelClass}>Số khách *</label>
                    <input
                        name="guestCount"
                        type="number"
                        min={1}
                        required
                        className={inputClass}
                        placeholder="2"
                    />
                </div>
                <div>
                    <label className={labelClass}>Ngày *</label>
                    <input name="date" type="date" required className={inputClass} />
                </div>
                <div>
                    <label className={labelClass}>Giờ *</label>
                    <input name="time" type="time" required className={inputClass} />
                </div>
                <div className="relative">
                    <label className={labelClass}>Khu vực</label>
                    <input type="hidden" name="area" value={selectedArea} />
                    <button
                        type="button"
                        onClick={() => setAreaDropdownOpen((o) => !o)}
                        className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm text-left border transition-all duration-200 ${inputClass}`}
                    >
                        <span className={selectedArea ? "text-cream" : "text-cream/40"}>
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
                        <span className="text-cream/50 text-xs">▼</span>
                    </button>
                    {areaDropdownOpen && (
                        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-white/20 bg-[#141414] shadow-xl">
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
                                    className="w-full text-left px-4 py-3 text-sm text-cream/90 hover:bg-white/10 transition-colors first:rounded-t-xl"
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div className="relative">
                    <label className={labelClass}>Chọn bàn (tuỳ chọn)</label>
                    <input type="hidden" name="tableCode" value={selectedTableCode} />
                    <button
                        type="button"
                        onClick={() => setTableDropdownOpen((o) => !o)}
                        className={`w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm text-left border transition-all duration-200 ${inputClass}`}
                    >
                        <span className={selectedTableCode ? "text-cream" : "text-cream/40"}>
                            {selectedTableCode
                                ? (() => {
                                    const tb = tables.find((t) => t.tableCode === selectedTableCode);
                                    if (!tb) return selectedTableCode;
                                    return `${tb.tableCode} · ${getAreaLabel(tb)} · ${tb.capacity} khách`;
                                })()
                                : "Để nhà hàng sắp xếp"}
                        </span>
                        <span className="text-cream/50 text-xs">▼</span>
                    </button>
                    {tableDropdownOpen && (
                        <div className="absolute z-20 mt-2 w-full max-h-56 overflow-y-auto rounded-xl border border-white/20 bg-charcoal-light shadow-xl">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedTableCode("");
                                    setTableDropdownOpen(false);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-cream/80 hover:bg-white/10 rounded-t-xl transition-colors"
                            >
                                Để nhà hàng sắp xếp
                            </button>
                            <div className="border-t border-white/10" />
                            {tables
                                .sort((a, b) => a.tableCode.localeCompare(b.tableCode))
                                .map((t) => {
                                    const label = `${t.tableCode} · ${getAreaLabel(t)} · ${t.capacity} khách`;
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedTableCode(t.tableCode);
                                                setTableDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm text-cream/90 hover:bg-white/10 transition-colors"
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                        </div>
                    )}
                </div>
                <div>
                    <label className={labelClass}>Ghi chú</label>
                    <textarea
                        name="notes"
                        rows={embedded ? 3 : 3}
                        placeholder="Yêu cầu đặc biệt, dịp kỷ niệm..."
                        className={`${inputClass} resize-none ${embedded ? "min-h-[80px]" : "min-h-[88px]"}`}
                    />
                </div>
                {(error || success) && (
                    <div className="space-y-2">
                        {error && (
                            <p className={embedded ? "text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3" : "text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"}>
                                {error}
                            </p>
                        )}
                        {success && (
                            <p className={embedded ? "text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3" : "text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3"}>
                                {success}
                            </p>
                        )}
                    </div>
                )}
                <div className={`pt-2 ${embedded ? "flex justify-center" : "flex justify-end"}`}>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full inline-flex items-center justify-center bg-gold text-charcoal font-semibold tracking-wide uppercase rounded-xl hover:bg-gold-light focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 focus:ring-offset-charcoal transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-gold/20 ${embedded ? "py-3.5 text-sm" : "sm:w-auto min-w-[180px] px-8 py-3.5 text-sm"}`}
                    >
                        {loading ? "Đang gửi..." : "Đặt bàn"}
                    </button>
                </div>
            </form>
        </div>
    );

    if (embedded) return formContent;

    return (
        <section id="reservation" className="relative py-24 lg:py-32 overflow-hidden">
            <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1920&q=80"
                    alt="Restaurant ambience"
                    className="w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-charcoal/80" />
            </div>
            <div className="relative max-w-2xl mx-auto px-6 lg:px-12 text-center">
                <p className="section-label mb-6">{t("reservation.label")}</p>
                <h2 className="section-title mb-6">{t("reservation.title")}</h2>
                <div className="divider-gold" />
                <p className="section-subtitle mb-12">{t("reservation.subtitle")}</p>
                {formContent}
            </div>
        </section>
    );
}
