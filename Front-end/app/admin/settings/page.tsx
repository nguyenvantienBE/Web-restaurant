"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { mockSystemConfig } from "@/lib/mock/data";
import { SystemConfig } from "@/lib/types";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Save, Info, Mail, Clock, DollarSign, Store } from "lucide-react";

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
    const [config, setConfig] = useState<SystemConfig>(mockSystemConfig);
    const { register, handleSubmit, formState: { isSubmitting } } = useForm<SystemConfig>({ defaultValues: config });

    const onSubmit = async (data: SystemConfig) => {
        await new Promise((r) => setTimeout(r, 400));
        setConfig(data);
        toast.success("Đã lưu cài đặt hệ thống!");
    };

    const inputClass = "w-full bg-white/5 border border-white/10 text-cream placeholder-cream/20 px-3 py-2.5 text-sm focus:outline-none focus:border-gold/50";

    return (
        <DashboardLayout>
            <form onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="font-serif text-cream text-2xl">Cài đặt hệ thống</h1>
                            <p className="text-cream/40 text-sm">Thông tin nhà hàng và cấu hình vận hành</p>
                        </div>
                        <button type="submit" disabled={isSubmitting}
                            className="flex items-center gap-2 bg-gold text-charcoal px-4 py-2 text-sm font-semibold hover:bg-gold-light transition-colors disabled:opacity-50">
                            <Save size={15} /> {isSubmitting ? "Đang lưu..." : "Lưu cài đặt"}
                        </button>
                    </div>

                    {/* Restaurant info */}
                    <SectionCard title="Thông tin nhà hàng" icon={<Store size={16} />}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Tên nhà hàng">
                                <input {...register("restaurantName")} className={inputClass} />
                            </Field>
                            <Field label="Số điện thoại">
                                <input {...register("phone")} className={inputClass} />
                            </Field>
                            <Field label="Địa chỉ" hint="Hiển thị trên hóa đơn và footer website">
                                <input {...register("restaurantAddress")} className={inputClass} />
                            </Field>
                            <Field label="Email nhà hàng">
                                <input {...register("email")} type="email" className={inputClass} />
                            </Field>
                        </div>
                    </SectionCard>

                    {/* Business hours */}
                    <SectionCard title="Giờ hoạt động" icon={<Clock size={16} />}>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Giờ mở cửa">
                                <input {...register("openTime")} type="time" className={inputClass} />
                            </Field>
                            <Field label="Giờ đóng cửa">
                                <input {...register("closeTime")} type="time" className={inputClass} />
                            </Field>
                        </div>
                    </SectionCard>

                    {/* Invoice & email */}
                    <SectionCard title="Hóa đơn & Email" icon={<Mail size={16} />}>
                        <Field label="Email gửi hóa đơn (From)" hint="Domain phải được cấu hình SPF/DKIM">
                            <input {...register("invoiceEmailFrom")} type="email" className={inputClass} />
                        </Field>
                        <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-3 flex gap-2">
                            <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
                            <p className="text-blue-300 text-xs">Hóa đơn PDF sẽ được tạo và gửi email tự động khi trạng thái Payment = PAID. Template sẽ bao gồm thông tin nhà hàng phía trên.</p>
                        </div>
                    </SectionCard>

                    {/* Tax & charges */}
                    <SectionCard title="Thuế & Phí dịch vụ" icon={<DollarSign size={16} />}>
                        <div className="grid grid-cols-2 gap-4">
                            <Field label="Thuế VAT (%)" hint="Nhập 10 tương đương 10%">
                                <input {...register("taxRate", { setValueAs: (v) => parseFloat(v) / 100 })}
                                    type="number" min={0} max={30} step={0.5}
                                    defaultValue={(config.taxRate * 100).toString()}
                                    className={inputClass} />
                            </Field>
                            <Field label="Phí dịch vụ (%)" hint="Nhập 5 tương đương 5%">
                                <input {...register("serviceChargeRate", { setValueAs: (v) => parseFloat(v) / 100 })}
                                    type="number" min={0} max={20} step={0.5}
                                    defaultValue={(config.serviceChargeRate * 100).toString()}
                                    className={inputClass} />
                            </Field>
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-3 flex gap-2">
                            <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-amber-300 text-xs">Thuế và phí dịch vụ sẽ được tính trên tổng `subtotal` và hiển thị rõ trên hóa đơn. Thay đổi chỉ áp dụng cho đơn mới.</p>
                        </div>
                    </SectionCard>

                    {/* Current config summary */}
                    <SectionCard title="Cấu hình hiện tại" icon={<Info size={16} />}>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            {([
                                ["Nhà hàng", config.restaurantName],
                                ["Địa chỉ", config.restaurantAddress],
                                ["Giờ phục vụ", `${config.openTime} – ${config.closeTime}`],
                                ["Email gửi HĐ", config.invoiceEmailFrom],
                                ["VAT", `${(config.taxRate * 100).toFixed(0)}%`],
                                ["Phí dịch vụ", `${(config.serviceChargeRate * 100).toFixed(0)}%`],
                            ] as const).map(([k, v]) => (
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
