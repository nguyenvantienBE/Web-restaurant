"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useUsers, useCreateUser, useDisableUser, useEnableUser, useUpdateUser, useRoles, ApiUser } from "@/lib/hooks/useUsers";
import { CLAIMS } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Search, UserCheck, UserX, Eye, X, UsersIcon, Loader2, RefreshCw } from "lucide-react";

const createSchema = z.object({
    fullName: z.string().min(2, "Nhập họ tên (tối thiểu 2 ký tự)"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
    roleId: z.string().min(1, "Chọn vai trò"),
});
type CreateForm = z.infer<typeof createSchema>;

const ROLE_STYLES: Record<string, { label: string; cls: string }> = {
    Admin: { label: "Quản trị", cls: "bg-violet-500/12 text-violet-300 border-violet-500/20" },
    Manager: { label: "Quản lý", cls: "bg-sky-500/12 text-sky-300 border-sky-500/20" },
    Cashier: { label: "Thu ngân", cls: "bg-teal-500/12 text-teal-300 border-teal-500/20" },
    Kitchen: { label: "Bếp", cls: "bg-amber-500/12 text-amber-300 border-amber-500/20" },
};

function getRoleStyle(roleName: string) {
    return ROLE_STYLES[roleName] ?? { label: roleName, cls: "bg-white/5 text-cream/70 border-white/10" };
}

function RoleEditModal({
    user,
    roles,
    getRoleStyle,
    onClose,
    onSave,
    isSaving,
}: {
    user: ApiUser;
    roles: Array<{ id: string; name: string }>;
    getRoleStyle: (name: string) => { label: string; cls: string };
    onClose: () => void;
    onSave: (roleId: string) => Promise<void>;
    isSaving: boolean;
}) {
    const [selectedRoleId, setSelectedRoleId] = useState(user.roleId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-charcoal shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                    <div>
                        <h3 className="text-xl font-semibold text-cream">Đổi vai trò</h3>
                        <p className="mt-1 text-base text-cream/60">{user.fullName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg text-cream/50 hover:bg-white/5 hover:text-cream transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-5">
                    <div>
                        <p className="text-sm font-medium text-cream/70 mb-2">Vai trò hiện tại</p>
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border ${getRoleStyle(user.role.name).cls}`}>
                            {getRoleStyle(user.role.name).label}
                        </span>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-cream/70 mb-2">Chọn vai trò mới</label>
                        <select
                            value={selectedRoleId}
                            onChange={(e) => setSelectedRoleId(e.target.value)}
                            className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-cream focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40"
                        >
                            {roles.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {getRoleStyle(r.name).label} ({r.name})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-white/15 text-cream/80 text-base font-medium hover:bg-white/5 transition-colors"
                        >
                            Huỷ
                        </button>
                        <button
                            type="button"
                            onClick={() => onSave(selectedRoleId)}
                            disabled={isSaving || selectedRoleId === user.roleId}
                            className="flex-1 py-3 rounded-xl bg-gold text-charcoal text-base font-medium hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSaving ? <><Loader2 size={18} className="animate-spin" /> Đang lưu...</> : "Lưu thay đổi"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminUsersPage() {
    const { hasClaim, user: me } = useAuth();
    const { data: users = [], isLoading, refetch } = useUsers();
    const { data: roles = [] } = useRoles();
    const createUser = useCreateUser();
    const disableUser = useDisableUser();
    const enableUser = useEnableUser();
    const updateUser = useUpdateUser();

    const [search, setSearch] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [roleEditUser, setRoleEditUser] = useState<ApiUser | null>(null);
    const [roleFilter, setRoleFilter] = useState<string>("all");

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateForm>({
        resolver: zodResolver(createSchema) as never,
    });

    const filtered = users.filter((u) => {
        const matchSearch =
            u.fullName.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === "all" || u.role.name === roleFilter;
        return matchSearch && matchRole;
    });

    const onCreateSubmit = async (data: CreateForm) => {
        try {
            await createUser.mutateAsync(data);
            toast.success("Đã tạo tài khoản nhân viên mới!");
            reset();
            setCreateOpen(false);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Tạo tài khoản thất bại");
        }
    };

    const handleToggleActive = async (user: ApiUser) => {
        try {
            if (user.isActive) {
                await disableUser.mutateAsync(user.id);
                toast.success(`Đã khoá tài khoản ${user.fullName}`);
            } else {
                await enableUser.mutateAsync(user.id);
                toast.success(`Đã mở khoá tài khoản ${user.fullName}`);
            }
        } catch {
            toast.error("Cập nhật thất bại");
        }
    };

    const activeCount = users.filter((u) => u.isActive).length;
    const uniqueRoleNames = Array.from(new Set(users.map((u) => u.role.name)));

    return (
        <DashboardLayout>
            <div className="space-y-6 animate-fade-up">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    <div>
                        <h1 className="text-2xl font-semibold text-cream tracking-tight">
                            Quản lý người dùng
                        </h1>
                        <p className="mt-1.5 text-base text-cream/50">
                            {isLoading ? "Đang tải..." : `${users.length} tài khoản · ${activeCount} đang hoạt động`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => refetch()}
                            className="flex items-center justify-center w-11 h-11 rounded-xl border border-white/10 text-cream/60 hover:bg-white/5 hover:text-cream transition-colors disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                        </button>
                        {hasClaim(CLAIMS.USER_CREATE) && (
                            <button
                                onClick={() => setCreateOpen(true)}
                                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-xl bg-gold text-charcoal text-base font-medium hover:bg-gold-light transition-colors"
                            >
                                <Plus size={20} /> Thêm nhân viên
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 flex flex-col sm:flex-row gap-5 sm:items-center">
                    <div className="flex-1 min-w-0 flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3.5">
                        <Search size={20} className="shrink-0 text-cream/40" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm theo tên, email..."
                            className="flex-1 min-w-0 bg-transparent outline-none text-base text-cream placeholder:text-cream/30"
                        />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {["all", ...uniqueRoleNames].map((r) => (
                            <button
                                key={r}
                                onClick={() => setRoleFilter(r)}
                                className={`px-5 py-3 rounded-xl text-base font-medium transition-all ${
                                    roleFilter === r
                                        ? "bg-gold/20 text-gold border border-gold/40"
                                        : "bg-white/5 text-cream/70 border border-white/10 hover:bg-white/10 hover:text-cream/90"
                                }`}
                            >
                                {r === "all" ? "Tất cả" : getRoleStyle(r).label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="flex items-center justify-center py-24 gap-4 text-cream/50">
                        <Loader2 size={28} className="animate-spin text-gold" />
                        <span className="text-base">Đang tải...</span>
                    </div>
                )}

                {/* Table */}
                {!isLoading && (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/[0.03]">
                                        <th className="text-left py-5 px-6 text-sm font-semibold uppercase tracking-wider text-cream/40">
                                            Nhân viên
                                        </th>
                                        <th className="text-left py-5 px-6 text-sm font-semibold uppercase tracking-wider text-cream/40">
                                            Vai trò
                                        </th>
                                        <th className="text-left py-5 px-6 text-sm font-semibold uppercase tracking-wider text-cream/40">
                                            Trạng thái
                                        </th>
                                        <th className="text-left py-5 px-6 text-sm font-semibold uppercase tracking-wider text-cream/40">
                                            Ngày tạo
                                        </th>
                                        <th className="text-right py-5 px-6 text-sm font-semibold uppercase tracking-wider text-cream/40">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((user) => {
                                        const roleStyle = getRoleStyle(user.role.name);
                                        const isMe = user.id === me?.id;
                                        return (
                                            <tr
                                                key={user.id}
                                                className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                                            >
                                                <td className="py-5 px-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold shrink-0 bg-gold/15 text-gold border border-gold/25">
                                                            {user.fullName[0]?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-base font-medium text-cream">
                                                                {user.fullName}
                                                                {isMe && <span className="ml-2 text-sm text-gold/70">(Bạn)</span>}
                                                            </p>
                                                            <p className="text-sm text-cream/40 mt-0.5">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-5 px-6">
                                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium border ${roleStyle.cls}`}>
                                                        {roleStyle.label}
                                                    </span>
                                                </td>
                                                <td className="py-5 px-6">
                                                    <span className="inline-flex items-center gap-2 text-sm">
                                                        <span className={`w-2.5 h-2.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-cream/30"}`} />
                                                        <span className={user.isActive ? "text-emerald-400" : "text-cream/40"}>
                                                            {user.isActive ? "Hoạt động" : "Tạm khoá"}
                                                        </span>
                                                    </span>
                                                </td>
                                                <td className="py-5 px-6 text-sm text-cream/45">
                                                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                                                </td>
                                                <td className="py-5 px-6">
                                                    <div className="flex items-center justify-end gap-3">
                                                        {hasClaim(CLAIMS.USER_UPDATE) && (
                                                            <button
                                                                onClick={() => setRoleEditUser(user)}
                                                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-cream/80 border border-white/15 hover:bg-white/5 hover:text-cream transition-colors"
                                                            >
                                                                <Eye size={18} /> Quyền
                                                            </button>
                                                        )}
                                                        {hasClaim(CLAIMS.USER_DISABLE) && !isMe && (
                                                            <button
                                                                onClick={() => handleToggleActive(user)}
                                                                disabled={disableUser.isPending || enableUser.isPending}
                                                                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                                                    user.isActive
                                                                        ? "text-red-400 border border-red-500/30 hover:bg-red-500/10"
                                                                        : "text-cream/80 border border-white/15 hover:bg-white/5 hover:text-cream"
                                                                }`}
                                                            >
                                                                {user.isActive ? <><UserX size={18} /> Khoá</> : <><UserCheck size={18} /> Mở</>}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {filtered.length === 0 && (
                            <div className="py-20 text-center">
                                <UsersIcon size={48} className="mx-auto mb-5 text-cream/20" />
                                <p className="text-base text-cream/40">Không tìm thấy nhân viên</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {createOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setCreateOpen(false)}>
                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-charcoal shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                            <div>
                                <h3 className="text-xl font-semibold text-cream">Tạo tài khoản nhân viên</h3>
                                <p className="mt-1 text-base text-cream/50">Thêm nhân viên mới vào hệ thống</p>
                            </div>
                            <button onClick={() => setCreateOpen(false)} className="p-2 rounded-lg text-cream/50 hover:bg-white/5 hover:text-cream transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit(onCreateSubmit)} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-cream/70 mb-2">Họ và tên *</label>
                                <input
                                    {...register("fullName")}
                                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-cream placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40"
                                    placeholder="Nguyễn Văn A"
                                />
                                {errors.fullName && <p className="mt-1 text-sm text-red-400">{errors.fullName.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-cream/70 mb-2">Email *</label>
                                <input
                                    {...register("email")}
                                    type="email"
                                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-cream placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40"
                                    placeholder="nhanvien@restaurant.com"
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-cream/70 mb-2">Mật khẩu *</label>
                                <input
                                    {...register("password")}
                                    type="password"
                                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-cream placeholder:text-cream/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40"
                                    placeholder="Tối thiểu 6 ký tự"
                                />
                                {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-cream/70 mb-2">Vai trò *</label>
                                <select
                                    {...register("roleId")}
                                    className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-base text-cream focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40"
                                >
                                    <option value="">-- Chọn vai trò --</option>
                                    {roles
                                        .filter((r) => r.name !== "Admin")
                                        .map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {getRoleStyle(r.name).label} ({r.name})
                                            </option>
                                        ))}
                                </select>
                                {errors.roleId && <p className="mt-1 text-sm text-red-400">{errors.roleId.message}</p>}
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setCreateOpen(false); reset(); }}
                                    className="flex-1 py-3 rounded-xl border border-white/15 text-cream/80 text-base font-medium hover:bg-white/5 transition-colors"
                                >
                                    Huỷ
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || createUser.isPending}
                                    className="flex-1 py-3 rounded-xl bg-gold text-charcoal text-base font-medium hover:bg-gold-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting || createUser.isPending ? <><Loader2 size={18} className="animate-spin" /> Đang tạo...</> : "Tạo tài khoản"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal đổi vai trò — admin có thể thay đổi quyền (vai trò) người đó */}
            {roleEditUser && (
                <RoleEditModal
                    user={roleEditUser}
                    roles={roles}
                    getRoleStyle={getRoleStyle}
                    onClose={() => setRoleEditUser(null)}
                    onSave={async (newRoleId) => {
                        try {
                            await updateUser.mutateAsync({ id: roleEditUser.id, roleId: newRoleId });
                            toast.success(`Đã đổi vai trò của ${roleEditUser.fullName}`);
                            setRoleEditUser(null);
                        } catch (err) {
                            toast.error(err instanceof Error ? err.message : "Đổi vai trò thất bại");
                        }
                    }}
                    isSaving={updateUser.isPending}
                />
            )}
        </DashboardLayout>
    );
}
