"use client";

import { useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { mockSystemConfig } from "@/lib/mock/data";
import { CLAIMS } from "@/lib/types";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Save, Info, Mail, Clock, DollarSign, Store, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useRestaurantSettingsQuery, useUpdateRestaurantSettings } from "@/lib/hooks/useRestaurantSettings";

type RestaurantForm = {
    restaurantName: string;
    hotline: string;
    address: string;
    website: string;
    emailFrom: string;
    emailTemplatePlain: string;
    emailTemplatePdf: string;
    operationsOpenTime: string;
    operationsCloseTime: string;
};

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="bg-white/5 border border-white/10 p-5">
            <h3 className="text-cream font-medium flex items-center gap-2 mb-4">
                <span className="text-gold">{icon}</span> {title}
            </h3>
            <div className="space-y-4">{children}</div>
        </div>
    );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-cream/50 text-xs tracking-widest uppercase mb-1">{label}</label>
            {children}
            {hint && <p className="text-cream/30 text-xs mt-1">{hint}</p>}
        </div>
    );
}

export default function AdminSettingsPage() {
    const { hasClaim } = useAuth();
    const canManage = hasClaim(CLAIMS.SETTINGS_MANAGE);
    const { data: apiSettings, isLoading, isError, error } = useRestaurantSettingsQuery(canManage);
    const updateSettings = useUpdateRestaurantSettings();

    const config = mockSystemConfig;

    const {
        register,
        handleSubmit,
        reset,
        formState: { isSubmitting },
    } = useForm<RestaurantForm>({
        defaultValues: {
            restaurantName: "",
            hotline: "",
            address: "",
            website: "",
            emailFrom: "",
            emailTemplatePlain: "",
            emailTemplatePdf: "",
            operationsOpenTime: "10:00",
            operationsCloseTime: "23:00",
        },
    });

    useEffect(() => {
        if (!apiSettings) return;
        reset({
            restaurantName: apiSettings.restaurantName ?? "",
            hotline: apiSettings.hotline ?? "",
            address: apiSettings.address ?? "",
            website: apiSettings.website ?? "",
            emailFrom: apiSettings.emailFrom ?? "",
            emailTemplatePlain: apiSettings.emailTemplatePlain ?? "",
            emailTemplatePdf: apiSettings.emailTemplatePdf ?? "",
            operationsOpenTime: (apiSettings.operationsOpenTime ?? "10:00").slice(0, 5),
            operationsCloseTime: (apiSettings.operationsCloseTime ?? "23:00").slice(0, 5),
        });
    }, [apiSettings, reset]);

    const onSubmit = async (data: RestaurantForm) => {
        try {
            await updateSettings.mutateAsync({
                restaurantName: data.restaurantName,
                hotline: data.hotline || undefined,
                address: data.address || undefined,
                website: data.website || undefined,
                emailFrom: data.emailFrom || undefined,
                emailTemplatePlain: data.emailTemplatePlain,
                emailTemplatePdf: data.emailTemplatePdf,
                operationsOpenTime: data.operationsOpenTime,
                operationsCloseTime: data.operationsCloseTime,
            });
            toast.success("Đã lưu cấu hình nhà hàng và template email hóa đơn.");
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Lưu thất bại");
        }
    };

    const inputClass =
        "w-full bg-white/5 border border-white/10 text-cream placeholder-cream/20 px-3 py-2.5 text-sm focus:outline-none focus:border-gold/50";
    const textareaClass = `${inputClass} font-mono text-xs leading-relaxed min-h-[220px]`;

    if (!canManage) {
        return (
            <DashboardLayout>
                <p className="text-cream/60 text-sm">Bạn không có quyền quản lý cài đặt nhà hàng (SETTINGS_MANAGE).</p>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="font-serif text-cream text-2xl">Cài đặt hệ thống</h1>
                            <p className="text-cream/40 text-sm">Thông tin nhà hàng, template email hóa đơn (Handlebars)</p>
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting || updateSettings.isPending || isLoading}
                            className="flex items-center gap-2 bg-gold text-charcoal px-4 py-2 text-sm font-semibold hover:bg-gold-light transition-colors disabled:opacity-50"
                        >
                            {isSubmitting || updateSettings.isPending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}{" "}
                            {isSubmitting || updateSettings.isPending ? "Đang lưu..." : "Lưu cài đặt"}
                        </button>
                    </div>

                    {isLoading && (
                        <p className="text-cream/50 text-sm flex items-center gap-2">
                            <Loader2 size={14} className="animate-spin" /> Đang tải cấu hình...
                        </p>
                    )}
                    {isError && (
                        <p className="text-red-400 text-sm">{error instanceof Error ? error.message : "Không tải được cấu hình"}</p>
                    )}

                    <SectionCard title="Thông tin nhà hàng" icon={<Store size={16} />}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Tên nhà hàng">
                                <input {...register("restaurantName", { required: true })} className={inputClass} />
                            </Field>
                            <Field label="Hotline">
                                <input {...register("hotline")} className={inputClass} />
                            </Field>
                            <Field label="Địa chỉ" hint="Hiển thị trên email và footer PDF">
                                <input {...register("address")} className={inputClass} />
                            </Field>
                            <Field label="Website">
                                <input {...register("website")} className={inputClass} />
                            </Field>
                        </div>
                    </SectionCard>

                    <SectionCard title="Hóa đơn & Email" icon={<Mail size={16} />}>
                        <Field label="Email gửi hóa đơn (From)" hint="Khớp SMTP trong .env (SPF/DKIM)">
                            <input {...register("emailFrom")} type="email" className={inputClass} />
                        </Field>
                        <Field
                            label="Template email — nội dung chi tiết (không đính PDF)"
                            hint="Biến: {{customer_name}}, {{restaurant_name}}, {{invoice_number}}, {{date}}, {{#each items}}...{{/each}}, {{subtotal}}, {{tax}}, {{total_amount}}, {{payment_method}}, {{hotline}}, {{address}}, {{website}}"
                        >
                            <textarea {...register("emailTemplatePlain")} className={textareaClass} />
                        </Field>
                        <Field
                            label="Template email — khi đính kèm PDF"
                            hint="Dùng khi gửi hóa đơn kèm file PDF; nội dung ngắn gọn, chi tiết trong file đính kèm."
                        >
                            <textarea {...register("emailTemplatePdf")} className={textareaClass} />
                        </Field>
                        <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-3 flex gap-2">
                            <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-blue-300 text-xs">
                                PDF in-house (pdfmake) dùng logo tên nhà hàng từ bảng trên; bố cục PDF cố định trong mã nguồn. Nội dung email hai
                                khối trên do admin chỉnh tại đây.
                            </p>
                        </div>
                    </SectionCard>

                    <SectionCard title="Giờ vận hành & ca" icon={<Clock size={16} />}>
                        <div className="grid grid-cols-2 gap-4">
                            <Field
                                label="Mở cửa (HH:mm)"
                                hint="Giờ Việt Nam. Trong khung này, nếu chưa ai mở ca thủ công, hệ thống tự tạo ca khi có đơn."
                            >
                                <input type="time" step={60} {...register("operationsOpenTime", { required: true })} className={inputClass} />
                            </Field>
                            <Field label="Đóng cửa (HH:mm)" hint="Ngoài khung này — cần mở ca tại quầy hoặc chờ ngày hôm sau.">
                                <input type="time" step={60} {...register("operationsCloseTime", { required: true })} className={inputClass} />
                            </Field>
                        </div>
                    </SectionCard>

                    <SectionCard title="Thuế & Phí (xem trước — chưa API)" icon={<DollarSign size={16} />}>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Thuế VAT (%)">
                                <input type="number" readOnly defaultValue={(config.taxRate * 100).toString()} className={inputClass} />
                            </Field>
                            <Field label="Phí dịch vụ (%)">
                                <input
                                    type="number"
                                    readOnly
                                    defaultValue={(config.serviceChargeRate * 100).toString()}
                                    className={inputClass}
                                />
                            </Field>
                        </div>
                    </SectionCard>

                    <SectionCard title="Cấu hình hiện tại (tóm tắt)" icon={<Info size={16} />}>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            {(
                                [
                                    ["Nhà hàng", apiSettings?.restaurantName ?? "—"],
                                    ["Hotline", apiSettings?.hotline ?? "—"],
                                    ["Địa chỉ", apiSettings?.address ?? "—"],
                                    ["Email From", apiSettings?.emailFrom ?? "—"],
                                    ["Giờ vận hành", `${apiSettings?.operationsOpenTime ?? "—"} – ${apiSettings?.operationsCloseTime ?? "—"}`],
                                ] as const
                            ).map(([k, v]) => (
                                <div key={k}>
                                    <p className="text-cream/40 text-xs">{k}</p>
                                    <p className="text-cream text-sm truncate">{v}</p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>
            </form>
        </DashboardLayout>
    );
}
