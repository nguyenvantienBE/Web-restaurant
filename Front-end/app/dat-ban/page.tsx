"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Calendar, Clock, Users, Phone, Mail, User, MapPin, FileText, ChevronLeft } from "lucide-react";
import Link from "next/link";

const schema = z.object({
    customerName: z.string().min(2, "Vui lòng nhập tên"),
    customerPhone: z.string().regex(/^0\d{9}$/, "Số điện thoại không hợp lệ"),
    customerEmail: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
    partySize: z.coerce.number().int().min(1, "Tối thiểu 1 người").max(20, "Tối đa 20 người"),
    date: z.string().min(1, "Chọn ngày"),
    time: z.string().min(1, "Chọn giờ"),
    area: z.enum(["indoor", "outdoor", "rooftop", "bar"]).optional(),
    note: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const TIME_SLOTS = ["17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];
const AREAS = [
    { value: "indoor", label: "Trong nhà", desc: "Máy lạnh, yên tĩnh" },
    { value: "outdoor", label: "Ngoài trời", desc: "Không gian mở, gió mát" },
    { value: "rooftop", label: "Sân thượng", desc: "View thành phố tuyệt đẹp" },
    { value: "bar", label: "Khu bar", desc: "Không khí sôi động" },
] as const;

export default function DatBanPage() {
    const [submitted, setSubmitted] = useState(false);
    const [bookingRef, setBookingRef] = useState("");

    const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema) as never,
    });

    const selectedTime = watch("time");
    const selectedArea = watch("area");

    const onSubmit = async (data: FormData) => {
        await new Promise((r) => setTimeout(r, 800)); // simulate API
        const ref = `ALB-${Date.now().toString().slice(-6)}`;
        setBookingRef(ref);
        setSubmitted(true);
        toast.success("Đặt bàn thành công!");
        console.log("Reservation:", data);
    };

    const formatDate = (d: string) => {
        if (!d) return "";
        return new Date(d + "T00:00:00").toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-charcoal flex items-center justify-center px-4">
                <div className="max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-emerald-400 text-3xl">✓</span>
                    </div>
                    <p className="text-gold text-xs tracking-widest uppercase mb-2">Đặt bàn thành công</p>
                    <h1 className="font-serif text-cream text-3xl mb-4">Cảm ơn quý khách!</h1>
                    <p className="text-cream/60 text-sm mb-6">
                        Chúng tôi đã nhận đặt bàn của bạn. Mã đặt bàn của bạn là:
                    </p>
                    <div className="border border-gold/30 bg-gold/10 px-6 py-4 mb-6">
                        <p className="font-mono text-gold text-2xl tracking-widest">{bookingRef}</p>
                    </div>
                    <p className="text-cream/40 text-xs mb-8">
                        Chúng tôi sẽ liên hệ xác nhận trong vòng 1-2 giờ. Nếu cần hỗ trợ: <br />
                        <span className="text-gold">0901 379 129</span>
                    </p>
                    <Link href="/" className="btn-gold text-xs tracking-widest">
                        ← Về trang chủ
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-charcoal text-cream">
            {/* Header */}
            <div className="relative h-52 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80"
                    alt="Restaurant" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-charcoal/60 to-charcoal" />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
                    <p className="text-gold text-xs tracking-[0.3em] uppercase mb-1">The Albion by Kirk</p>
                    <h1 className="font-serif text-cream text-3xl">Đặt Bàn</h1>
                </div>
                <Link href="/" className="absolute top-4 left-4 text-cream/60 hover:text-cream flex items-center gap-1 text-sm">
                    <ChevronLeft size={16} /> Về trang chủ
                </Link>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Personal info */}
                    <div className="glass-card p-6">
                        <h2 className="font-serif text-cream text-xl mb-5">Thông tin liên hệ</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-cream/50 text-xs tracking-widest uppercase mb-2">Tên khách hàng *</label>
                                <div className="relative">
                                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30" />
                                    <input {...register("customerName")} placeholder="Nguyễn Văn A"
                                        className="w-full bg-white/5 border border-white/10 text-cream placeholder-cream/20 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-gold/50" />
                                </div>
                                {errors.customerName && <p className="text-red-400 text-xs mt-1">{errors.customerName.message}</p>}
                            </div>
                            <div>
                                <label className="block text-cream/50 text-xs tracking-widest uppercase mb-2">Số điện thoại *</label>
                                <div className="relative">
                                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30" />
                                    <input {...register("customerPhone")} placeholder="0901 234 567"
                                        className="w-full bg-white/5 border border-white/10 text-cream placeholder-cream/20 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-gold/50" />
                                </div>
                                {errors.customerPhone && <p className="text-red-400 text-xs mt-1">{errors.customerPhone.message}</p>}
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-cream/50 text-xs tracking-widest uppercase mb-2">Email (để nhận xác nhận)</label>
                                <div className="relative">
                                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30" />
                                    <input {...register("customerEmail")} type="email" placeholder="email@example.com"
                                        className="w-full bg-white/5 border border-white/10 text-cream placeholder-cream/20 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-gold/50" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Date, time, guests */}
                    <div className="glass-card p-6">
                        <h2 className="font-serif text-cream text-xl mb-5">Chi tiết đặt bàn</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                            <div>
                                <label className="block text-cream/50 text-xs tracking-widest uppercase mb-2">Ngày đến *</label>
                                <div className="relative">
                                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30" />
                                    <input {...register("date")} type="date"
                                        min={new Date().toISOString().split("T")[0]}
                                        className="w-full bg-white/5 border border-white/10 text-cream pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-gold/50" />
                                </div>
                                {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date.message}</p>}
                            </div>
                            <div>
                                <label className="block text-cream/50 text-xs tracking-widest uppercase mb-2">Số khách *</label>
                                <div className="relative">
                                    <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cream/30" />
                                    <input {...register("partySize")} type="number" min={1} max={20}
                                        className="w-full bg-white/5 border border-white/10 text-cream pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-gold/50" />
                                </div>
                                {errors.partySize && <p className="text-red-400 text-xs mt-1">{errors.partySize.message}</p>}
                            </div>
                        </div>
                        {/* Time slots */}
                        <div>
                            <label className="block text-cream/50 text-xs tracking-widest uppercase mb-3">Chọn giờ *</label>
                            <div className="grid grid-cols-4 gap-2">
                                {TIME_SLOTS.map((slot) => (
                                    <button key={slot} type="button"
                                        onClick={() => setValue("time", slot)}
                                        className={`py-2 text-sm border transition-colors ${selectedTime === slot ? "border-gold bg-gold/20 text-gold" : "border-white/10 text-cream/50 hover:text-cream hover:border-white/30"}`}>
                                        <Clock size={11} className="inline mr-1" />{slot}
                                    </button>
                                ))}
                            </div>
                            {errors.time && <p className="text-red-400 text-xs mt-1">{errors.time.message}</p>}
                        </div>
                    </div>

                    {/* Area selection */}
                    <div className="glass-card p-6">
                        <h2 className="font-serif text-cream text-xl mb-5 flex items-center gap-2">
                            <MapPin size={18} className="text-gold" /> Khu vực (tuỳ chọn)
                        </h2>
                        <div className="grid grid-cols-2 gap-3">
                            {AREAS.map((area) => (
                                <button key={area.value} type="button"
                                    onClick={() => setValue("area", area.value)}
                                    className={`p-4 border text-left transition-colors ${selectedArea === area.value ? "border-gold bg-gold/10" : "border-white/10 hover:border-white/30"}`}>
                                    <p className={`text-sm font-medium ${selectedArea === area.value ? "text-gold" : "text-cream"}`}>{area.label}</p>
                                    <p className="text-cream/40 text-xs mt-0.5">{area.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Note */}
                    <div className="glass-card p-6">
                        <label className="block text-cream/50 text-xs tracking-widest uppercase mb-2 flex items-center gap-2">
                            <FileText size={13} /> Ghi chú thêm
                        </label>
                        <textarea {...register("note")} rows={3} placeholder="Dị ứng thực phẩm, yêu cầu đặc biệt..."
                            className="w-full bg-white/5 border border-white/10 text-cream placeholder-cream/20 px-3 py-2.5 text-sm focus:outline-none focus:border-gold/50 resize-none" />
                    </div>

                    <button type="submit" disabled={isSubmitting}
                        className="w-full bg-gold text-charcoal py-4 font-semibold tracking-widest uppercase text-sm hover:bg-gold-light transition-colors disabled:opacity-50">
                        {isSubmitting ? "Đang gửi..." : "Xác nhận đặt bàn"}
                    </button>

                    <p className="text-cream/30 text-xs text-center">
                        Giờ phục vụ: 17:30 – 23:30 · Giữ bàn trong 15 phút
                    </p>
                </form>
            </div>
        </div>
    );
}
