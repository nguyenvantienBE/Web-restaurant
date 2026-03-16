"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";

const schema = z.object({
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});
type FormData = z.infer<typeof schema>;

const ROLE_REDIRECT: Record<string, string> = {
    admin: "/admin/users",
    manager: "/manager",
    cashier: "/cashier",
    kitchen: "/kitchen",
};

const DEMO_ACCOUNTS = [
    { label: "Admin", email: "admin@restaurant.com", password: "admin123", color: "#a78bfa" },
    { label: "Manager", email: "manager@restaurant.com", password: "manager123", color: "#60a5fa" },
    { label: "Cashier", email: "cashier@restaurant.com", password: "cashier123", color: "#34d399" },
    { label: "Kitchen", email: "kitchen@restaurant.com", password: "kitchen123", color: "#fb923c" },
];

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [showPw, setShowPw] = useState(false);
    const [serverError, setServerError] = useState("");

    const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    const onSubmit = async (data: FormData) => {
        setServerError("");
        const result = await login(data.email, data.password);
        if (!result.success) {
            setServerError(result.error ?? "Đăng nhập thất bại");
            return;
        }
        const user = JSON.parse(sessionStorage.getItem("auth_user") || "{}");
        router.push(ROLE_REDIRECT[user.role] || "/cashier");
    };

    return (
        <div className="min-h-screen flex" style={{ background: "#0A0A0A" }}>

            {/* ── LEFT: Branding image ──────────────────── */}
            <div className="hidden lg:flex flex-col justify-between w-[55%] relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=90"
                    alt="The Albion Restaurant"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ opacity: 0.45 }}
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0"
                    style={{ background: "linear-gradient(120deg, rgba(10,10,10,0.7) 0%, rgba(10,10,10,0.2) 50%, rgba(10,10,10,0.8) 100%)" }} />
                {/* Right edge fade */}
                <div className="absolute inset-y-0 right-0 w-40"
                    style={{ background: "linear-gradient(to right, transparent, #0A0A0A)" }} />

                {/* Top branding */}
                <div className="relative px-16 pt-14">
                    <p className="text-xs tracking-[0.35em] uppercase mb-2"
                        style={{ color: "rgba(201,169,110,0.7)" }}>
                        Hôtel des Arts Saigon
                    </p>
                    <h1 className="font-serif text-6xl font-normal leading-tight"
                        style={{ color: "#F5F0E8" }}>
                        The<br />Albion
                    </h1>
                    <p className="text-xs tracking-[0.4em] uppercase mt-3"
                        style={{ color: "rgba(245,240,232,0.3)" }}>
                        Management System
                    </p>
                    {/* Gold line */}
                    <div className="mt-6 w-16 h-px"
                        style={{ background: "linear-gradient(to right, #C9A96E, transparent)" }} />
                </div>

                {/* Bottom info */}
                <div className="relative px-16 pb-10">
                    <p className="text-xs" style={{ color: "rgba(245,240,232,0.25)" }}>
                        Floor 23 · Hôtel des Arts Saigon · District 3, HCMC
                    </p>
                </div>
            </div>

            {/* ── RIGHT: Login form ─────────────────────── */}
            <div className="flex-1 flex items-center justify-center px-8 py-12"
                style={{ background: "linear-gradient(160deg, #0f0f0f 0%, #0A0A0A 100%)" }}>
                <div className="w-full max-w-lg">

                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-12">
                        <p className="text-xs tracking-[0.35em] uppercase mb-2"
                            style={{ color: "rgba(201,169,110,0.7)" }}>Hôtel des Arts Saigon</p>
                        <h1 className="font-serif text-4xl" style={{ color: "#F5F0E8" }}>The Albion</h1>
                        <p className="text-xs tracking-[0.4em] uppercase mt-2"
                            style={{ color: "rgba(245,240,232,0.3)" }}>Management System</p>
                    </div>

                    {/* Heading */}
                    <div className="mb-10">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={14} style={{ color: "#C9A96E" }} />
                            <span className="text-xs tracking-[0.2em] uppercase"
                                style={{ color: "rgba(201,169,110,0.6)" }}>Staff Portal</span>
                        </div>
                        <h2 className="font-serif text-4xl mb-2" style={{ color: "#F5F0E8" }}>
                            Đăng nhập
                        </h2>
                        <p className="text-base" style={{ color: "rgba(245,240,232,0.35)" }}>
                            Nhập thông tin để tiếp tục
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        {/* Email */}
                        <div>
                            <label className="block text-xs tracking-[0.15em] uppercase font-semibold mb-2.5"
                                style={{ color: "rgba(245,240,232,0.45)" }}>
                                Email
                            </label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2"
                                    style={{ color: "rgba(245,240,232,0.25)" }} />
                                <input
                                    {...register("email")}
                                    type="email"
                                    placeholder="email@albion.vn"
                                    className="input-dark pl-11"
                                    style={{ fontSize: "1rem", padding: "1rem 1rem 1rem 2.75rem" }}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-red-400 text-sm mt-2">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-xs tracking-[0.15em] uppercase font-semibold mb-2.5"
                                style={{ color: "rgba(245,240,232,0.45)" }}>
                                Mật khẩu
                            </label>
                            <div className="relative">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2"
                                    style={{ color: "rgba(245,240,232,0.25)" }} />
                                <input
                                    {...register("password")}
                                    type={showPw ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="input-dark pl-11 pr-12"
                                    style={{ fontSize: "1rem", padding: "1rem 3rem 1rem 2.75rem" }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(!showPw)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
                                    style={{ color: "rgba(245,240,232,0.3)" }}
                                >
                                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-400 text-sm mt-2">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Server error */}
                        {serverError && (
                            <div className="px-4 py-3 rounded"
                                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
                                <p className="text-red-400 text-sm">{serverError}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-gold w-full justify-center"
                            style={{ padding: "1.1rem 2rem", fontSize: "0.85rem" }}
                        >
                            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                        </button>
                    </form>

                    {/* Demo accounts */}
                    <div className="mt-10">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                            <p className="text-xs" style={{ color: "rgba(245,240,232,0.25)" }}>
                                Điền nhanh — nhập mật khẩu đúng
                            </p>
                            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {DEMO_ACCOUNTS.map((acc) => (
                                <button
                                    key={acc.email}
                                    onClick={() => {
                                        setValue("email", acc.email);
                                        setValue("password", acc.password);
                                    }}
                                    className="p-4 text-left rounded-sm transition-all group"
                                    style={{
                                        background: "rgba(255,255,255,0.025)",
                                        border: "1px solid rgba(255,255,255,0.07)",
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = `${acc.color}40`)}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
                                >
                                    <span className="flex items-center gap-2 mb-1">
                                        <span className="w-2 h-2 rounded-full shrink-0"
                                            style={{ background: acc.color }} />
                                        <span className="text-sm font-semibold"
                                            style={{ color: "rgba(245,240,232,0.75)" }}>
                                            {acc.label}
                                        </span>
                                    </span>
                                    <span className="text-xs block truncate"
                                        style={{ color: "rgba(245,240,232,0.3)" }}>
                                        {acc.email}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
