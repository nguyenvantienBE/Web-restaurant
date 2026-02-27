"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { mockUsers, ROLE_CLAIMS } from "@/lib/mock/data";
import { User, ClaimValue, CLAIMS } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Search, Shield, UserCheck, UserX, Eye, X, UsersIcon } from "lucide-react";

const inviteSchema = z.object({
    fullName: z.string().min(2, "Nhập họ tên"),
    email: z.string().email("Email không hợp lệ"),
    role: z.enum(["cashier", "kitchen", "manager"]),
});
type InviteForm = z.infer<typeof inviteSchema>;

const ROLE_STYLES: Record<string, { label: string; cls: string }> = {
    admin: { label: "Quản trị", cls: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
    manager: { label: "Quản lý", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    cashier: { label: "Thu ngân", cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
    kitchen: { label: "Bếp", cls: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
};

export default function AdminUsersPage() {
    const { hasClaim } = useAuth();
    const [users, setUsers] = useState<User[]>(mockUsers);
    const [search, setSearch] = useState("");
    const [inviteOpen, setInviteOpen] = useState(false);
    const [claimsView, setClaimsView] = useState<User | null>(null);
    const [roleFilter, setRoleFilter] = useState<string>("all");

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<InviteForm>({
        resolver: zodResolver(inviteSchema) as never,
        defaultValues: { role: "cashier" },
    });

    const filtered = users.filter((u) => {
        const matchSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === "all" || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    const onInvite = async (data: InviteForm) => {
        await new Promise(r => setTimeout(r, 500));
        const newUser: User = {
            id: `u_${Date.now()}`, email: data.email, fullName: data.fullName,
            role: data.role, claims: ROLE_CLAIMS[data.role],
            isActive: true, createdAt: new Date().toISOString(),
        };
        setUsers(prev => [...prev, newUser]);
        toast.success("Đã mời nhân viên mới!");
        reset(); setInviteOpen(false);
    };

    const toggleActive = (id: string) => {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
        toast.success("Đã cập nhật trạng thái tài khoản");
    };

    const activeCount = users.filter(u => u.isActive).length;

    return (
        <DashboardLayout>
            <div className="space-y-5 animate-fade-up">

                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="section-title">Quản lý người dùng</h1>
                        <p className="section-sub">{users.length} tài khoản · {activeCount} đang hoạt động</p>
                    </div>
                    {hasClaim(CLAIMS.USER_CREATE) && (
                        <button onClick={() => setInviteOpen(true)} className="btn-gold">
                            <Plus size={14} /> Mời nhân viên
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="dash-card p-4 flex flex-wrap gap-3 items-center">
                    <div className="flex items-center flex-1 min-w-[200px] input-dark gap-2 px-3">
                        <Search size={13} className="shrink-0" style={{ color: "rgba(245,240,232,0.25)" }} />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Tìm theo tên, email..."
                            className="flex-1 bg-transparent outline-none text-sm min-w-0"
                            style={{ color: "#F5F0E8" }} />
                    </div>
                    <div className="flex gap-1.5">
                        {["all", "admin", "manager", "cashier", "kitchen"].map(r => (
                            <button key={r} onClick={() => setRoleFilter(r)}
                                className="px-5 py-2.5 text-sm font-medium rounded transition-all border"
                                style={{
                                    border: roleFilter === r ? "1px solid rgba(201,169,110,0.5)" : "1px solid rgba(255,255,255,0.08)",
                                    background: roleFilter === r ? "rgba(201,169,110,0.1)" : "transparent",
                                    color: roleFilter === r ? "#C9A96E" : "rgba(245,240,232,0.4)",
                                }}>
                                {r === "all" ? "Tất cả" : ROLE_STYLES[r]?.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="dash-card overflow-hidden">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nhân viên</th>
                                <th>Vai trò</th>
                                <th>Trạng thái</th>
                                <th>Đăng nhập lần cuối</th>
                                <th className="text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                                style={{ background: "rgba(201,169,110,0.12)", color: "#C9A96E", border: "1px solid rgba(201,169,110,0.2)" }}>
                                                {user.fullName[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium" style={{ color: "#F5F0E8" }}>{user.fullName}</p>
                                                <p className="text-[11px]" style={{ color: "rgba(245,240,232,0.3)" }}>{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border tracking-wide ${ROLE_STYLES[user.role]?.cls}`}>
                                            {ROLE_STYLES[user.role]?.label}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="flex items-center gap-1.5 text-xs">
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-400" : "bg-slate-500"}`} />
                                            <span style={{ color: user.isActive ? "rgba(52,211,153,0.9)" : "rgba(245,240,232,0.3)" }}>
                                                {user.isActive ? "Hoạt động" : "Tạm khoá"}
                                            </span>
                                        </span>
                                    </td>
                                    <td className="text-xs" style={{ color: "rgba(245,240,232,0.35)" }}>
                                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "Chưa đăng nhập"}
                                    </td>
                                    <td>
                                        <div className="flex items-center justify-end gap-1.5">
                                            {hasClaim(CLAIMS.CLAIM_ASSIGN) && (
                                                <button onClick={() => setClaimsView(user)}
                                                    className="btn-ghost px-2.5 py-1 text-[11px]">
                                                    <Eye size={11} /> Quyền
                                                </button>
                                            )}
                                            {hasClaim(CLAIMS.USER_DISABLE) && user.role !== "admin" && (
                                                <button onClick={() => toggleActive(user.id)}
                                                    className={user.isActive ? "btn-danger px-2.5 py-1 text-[11px]" : "btn-ghost px-2.5 py-1 text-[11px]"}>
                                                    {user.isActive ? <><UserX size={11} /> Khoá</> : <><UserCheck size={11} /> Mở</>}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div className="py-12 text-center" style={{ color: "rgba(245,240,232,0.25)" }}>
                            <UsersIcon size={32} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Không tìm thấy nhân viên</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Invite Modal */}
            {inviteOpen && (
                <div className="modal-overlay" onClick={() => setInviteOpen(false)}>
                    <div className="modal-box max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <div>
                                <h3 className="font-serif text-lg" style={{ color: "#F5F0E8" }}>Mời nhân viên</h3>
                                <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.35)" }}>Gửi lời mời qua email</p>
                            </div>
                            <button onClick={() => setInviteOpen(false)} className="p-1 rounded hover:bg-white/5" style={{ color: "rgba(245,240,232,0.3)" }}>
                                <X size={16} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onInvite)} className="p-6 space-y-4">
                            <div>
                                <label className="block text-[11px] font-medium tracking-widest uppercase mb-1.5" style={{ color: "rgba(245,240,232,0.4)" }}>Họ và tên *</label>
                                <input {...register("fullName")} className="input-dark" placeholder="Nguyễn Văn A" />
                                {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>}
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium tracking-widest uppercase mb-1.5" style={{ color: "rgba(245,240,232,0.4)" }}>Email *</label>
                                <input {...register("email")} type="email" className="input-dark" placeholder="email@albion.vn" />
                                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium tracking-widest uppercase mb-1.5" style={{ color: "rgba(245,240,232,0.4)" }}>Vai trò *</label>
                                <select {...register("role")} className="input-dark">
                                    <option value="cashier">Thu ngân</option>
                                    <option value="kitchen">Bếp</option>
                                    <option value="manager">Quản lý</option>
                                </select>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="button" onClick={() => setInviteOpen(false)} className="btn-ghost flex-1">Huỷ</button>
                                <button type="submit" disabled={isSubmitting} className="btn-gold flex-1 justify-center">
                                    {isSubmitting ? "Đang gửi..." : "Gửi lời mời"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Claims viewer modal */}
            {claimsView && (
                <div className="modal-overlay" onClick={() => setClaimsView(null)}>
                    <div className="modal-box max-w-lg" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <div>
                                <h3 className="font-serif text-lg" style={{ color: "#F5F0E8" }}>Phân quyền — {claimsView.fullName}</h3>
                                <p className="text-xs mt-0.5" style={{ color: "rgba(245,240,232,0.35)" }}>{claimsView.claims.length} quyền được cấp</p>
                            </div>
                            <button onClick={() => setClaimsView(null)} className="p-1 rounded hover:bg-white/5" style={{ color: "rgba(245,240,232,0.3)" }}>
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-wrap gap-2">
                                {claimsView.claims.map((c: ClaimValue) => (
                                    <span key={c} className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-medium border"
                                        style={{ background: "rgba(201,169,110,0.08)", color: "rgba(201,169,110,0.8)", borderColor: "rgba(201,169,110,0.2)" }}>
                                        <Shield size={9} /> {c}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
