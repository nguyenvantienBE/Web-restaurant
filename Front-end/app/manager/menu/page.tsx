"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { mockMenuItems, mockCategories } from "@/lib/mock/data";
import { MenuItem, Category } from "@/lib/types";
import { useForm, useWatch, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { CLAIMS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";

// Preview component: reads imageUrl input in real-time
function ImagePreview({ control }: { control: Control<MenuItemForm> }) {
    const url = useWatch({ control, name: "imageUrl" });
    if (!url) return null;
    return (
        <div className="mt-2 relative w-full h-32 bg-white/5 border border-white/10 overflow-hidden rounded">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={url}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
        </div>
    );
}

const menuItemSchema = z.object({
    name: z.string().min(1, "Tên món bắt buộc"),
    nameVi: z.string().min(1, "Tên Việt bắt buộc"),
    categoryId: z.string().min(1, "Chọn danh mục"),
    price: z.coerce.number().min(1000, "Giá tối thiểu 1,000₫"),
    description: z.string().optional(),
    descriptionVi: z.string().optional(),
    preparationTime: z.coerce.number().optional(),
    imageUrl: z.string().url("URL ảnh không hợp lệ").optional().or(z.literal("")),
});
type MenuItemForm = z.infer<typeof menuItemSchema>;

export default function ManagerMenuPage() {
    const { hasClaim } = useAuth();
    const [items, setItems] = useState<MenuItem[]>(mockMenuItems);
    const [categories] = useState<Category[]>(mockCategories);
    const [search, setSearch] = useState("");
    const [catFilter, setCatFilter] = useState("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<MenuItem | null>(null);

    const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<MenuItemForm>({
        resolver: zodResolver(menuItemSchema) as never,
    });

    const filtered = items.filter((i) => {
        const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.nameVi.includes(search);
        const matchCat = catFilter === "all" || i.categoryId === catFilter;
        return matchSearch && matchCat;
    });

    const openCreate = () => { setEditItem(null); reset({}); setModalOpen(true); };
    const openEdit = (item: MenuItem) => {
        setEditItem(item);
        reset({ name: item.name, nameVi: item.nameVi, categoryId: item.categoryId, price: item.price, description: item.description, descriptionVi: item.descriptionVi, preparationTime: item.preparationTime, imageUrl: item.imageUrl ?? "" });
        setModalOpen(true);
    };

    const onSubmit = async (data: MenuItemForm) => {
        await new Promise((r) => setTimeout(r, 300));
        if (editItem) {
            setItems((prev) => prev.map((i) => i.id === editItem.id ? { ...i, ...data } : i));
            toast.success("Đã cập nhật món ăn");
        } else {
            const newItem: MenuItem = { id: `m_${Date.now()}`, isAvailable: true, unit: "dish", ...data };
            setItems((prev) => [...prev, newItem]);
            toast.success("Đã thêm món ăn mới");
        }
        setModalOpen(false);
    };

    const toggleAvailable = (id: string) => {
        setItems((prev) => prev.map((i) => i.id === id ? { ...i, isAvailable: !i.isAvailable } : i));
        toast.success("Đã cập nhật tình trạng");
    };

    const deleteItem = (id: string) => {
        setItems((prev) => prev.filter((i) => i.id !== id));
        toast.success("Đã xoá món ăn");
    };

    const formatPrice = (p: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p);

    return (
        <DashboardLayout>
            <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="font-serif text-cream text-4xl">Quản lý thực đơn</h1>
                        <p className="text-cream/40 text-base mt-1">{items.length} món · {items.filter((i) => !i.isAvailable).length} hết hàng</p>
                    </div>
                    {hasClaim(CLAIMS.MENU_CREATE) && (
                        <button onClick={openCreate}
                            className="flex items-center gap-2.5 bg-gold text-charcoal px-6 py-3 text-base font-semibold hover:bg-gold-light transition-colors">
                            <Plus size={20} /> Thêm món
                        </button>
                    )}
                </div>

                {/* Search + Category filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center flex-1 bg-white/5 border border-white/10 focus-within:border-gold/50 px-4 gap-3">
                        <Search size={18} className="text-cream/30 shrink-0" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Tìm món ăn..."
                            className="flex-1 bg-transparent text-cream placeholder-cream/20 py-3 text-base focus:outline-none" />
                    </div>
                    <div className="flex gap-2.5 flex-wrap">
                        <button onClick={() => setCatFilter("all")}
                            className={cn("px-6 py-3 text-base font-medium border rounded-lg transition-colors",
                                catFilter === "all" ? "border-gold bg-gold/20 text-gold" : "border-white/10 text-cream/50 hover:text-cream hover:border-white/30")}>
                            Tất cả
                        </button>
                        {categories.map((cat) => (
                            <button key={cat.id} onClick={() => setCatFilter(cat.id)}
                                className={cn("px-6 py-3 text-base font-medium border rounded-lg transition-colors",
                                    catFilter === cat.id ? "border-gold bg-gold/20 text-gold" : "border-white/10 text-cream/50 hover:text-cream hover:border-white/30")}>
                                {cat.nameVi}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Menu table */}
                <div className="border border-white/10 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-white/5 border-b border-white/10">
                            <tr>
                                <th className="text-left text-cream/50 text-xs tracking-widest uppercase px-4 py-3">Món ăn</th>
                                <th className="text-left text-cream/50 text-xs tracking-widest uppercase px-4 py-3 hidden sm:table-cell">Danh mục</th>
                                <th className="text-right text-cream/50 text-xs tracking-widest uppercase px-4 py-3">Giá</th>
                                <th className="text-center text-cream/50 text-xs tracking-widest uppercase px-4 py-3">Tình trạng</th>
                                {(hasClaim(CLAIMS.MENU_UPDATE) || hasClaim(CLAIMS.MENU_DELETE)) && (
                                    <th className="px-4 py-3" />
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((item) => {
                                const cat = categories.find((c) => c.id === item.categoryId);
                                return (
                                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {item.imageUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={item.imageUrl} alt="" className="w-10 h-10 object-cover rounded shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center shrink-0">
                                                        <UtensilsCrossed size={14} className="text-cream/30" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-cream">{item.nameVi}</p>
                                                    <p className="text-cream/40 text-xs">{item.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-cream/60 text-xs hidden sm:table-cell">{cat?.nameVi}</td>
                                        <td className="px-4 py-3 text-right text-gold font-medium">{formatPrice(item.price)}</td>
                                        <td className="px-4 py-3 text-center">
                                            {hasClaim(CLAIMS.MENU_UPDATE) ? (
                                                <button onClick={() => toggleAvailable(item.id)} title="Bấm để đổi tình trạng">
                                                    {item.isAvailable
                                                        ? <ToggleRight size={22} className="text-emerald-400 mx-auto" />
                                                        : <ToggleLeft size={22} className="text-cream/30 mx-auto" />}
                                                </button>
                                            ) : (
                                                <span className={item.isAvailable ? "text-emerald-400 text-xs" : "text-cream/30 text-xs"}>
                                                    {item.isAvailable ? "Còn" : "Hết"}
                                                </span>
                                            )}
                                        </td>
                                        {(hasClaim(CLAIMS.MENU_UPDATE) || hasClaim(CLAIMS.MENU_DELETE)) && (
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 justify-end">
                                                    {hasClaim(CLAIMS.MENU_UPDATE) && (
                                                        <button onClick={() => openEdit(item)} className="text-cream/40 hover:text-cream transition-colors">
                                                            <Edit2 size={14} />
                                                        </button>
                                                    )}
                                                    {hasClaim(CLAIMS.MENU_DELETE) && (
                                                        <button onClick={() => deleteItem(item.id)} className="text-cream/40 hover:text-red-400 transition-colors">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editItem ? "Sửa món ăn" : "Thêm món ăn mới"}
                size="md"
                footer={
                    <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}
                        className="bg-gold text-charcoal px-5 py-2 text-sm font-semibold hover:bg-gold-light transition-colors disabled:opacity-50">
                        {isSubmitting ? "Đang lưu..." : editItem ? "Cập nhật" : "Thêm món"}
                    </button>
                }
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1">Tên (EN) *</label>
                            <input {...register("name")} className="w-full bg-white/5 border border-white/10 text-cream px-3 py-2 text-sm focus:outline-none focus:border-gold/50" />
                            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                        </div>
                        <div>
                            <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1">Tên (VI) *</label>
                            <input {...register("nameVi")} className="w-full bg-white/5 border border-white/10 text-cream px-3 py-2 text-sm focus:outline-none focus:border-gold/50" />
                            {errors.nameVi && <p className="text-red-400 text-xs mt-1">{errors.nameVi.message}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1">Danh mục *</label>
                            <select {...register("categoryId")} className="w-full bg-white/5 border border-white/10 text-cream px-3 py-2 text-sm focus:outline-none focus:border-gold/50">
                                <option value="">Chọn danh mục</option>
                                {categories.map((c) => <option key={c.id} value={c.id}>{c.nameVi}</option>)}
                            </select>
                            {errors.categoryId && <p className="text-red-400 text-xs mt-1">{errors.categoryId.message}</p>}
                        </div>
                        <div>
                            <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1">Giá (VND) *</label>
                            <input {...register("price")} type="number" className="w-full bg-white/5 border border-white/10 text-cream px-3 py-2 text-sm focus:outline-none focus:border-gold/50" />
                            {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price.message}</p>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1">Mô tả (EN)</label>
                        <textarea {...register("description")} rows={2} className="w-full bg-white/5 border border-white/10 text-cream px-3 py-2 text-sm focus:outline-none focus:border-gold/50 resize-none" />
                    </div>
                    <div>
                        <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1">Mô tả (VI)</label>
                        <textarea {...register("descriptionVi")} rows={2} className="w-full bg-white/5 border border-white/10 text-cream px-3 py-2 text-sm focus:outline-none focus:border-gold/50 resize-none" />
                    </div>
                    <div>
                        <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1">Thời gian làm (phút)</label>
                        <input {...register("preparationTime")} type="number" className="w-full bg-white/5 border border-white/10 text-cream px-3 py-2 text-sm focus:outline-none focus:border-gold/50" />
                    </div>
                    <div>
                        <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1">URL ảnh món ăn</label>
                        <input {...register("imageUrl")} placeholder="https://..." className="w-full bg-white/5 border border-white/10 text-cream placeholder-cream/20 px-3 py-2 text-sm focus:outline-none focus:border-gold/50" />
                        {errors.imageUrl && <p className="text-red-400 text-xs mt-1">{errors.imageUrl.message}</p>}
                        {/* Preview */}
                        <ImagePreview control={control} />
                    </div>
                </div>
            </Modal>
        </DashboardLayout>
    );
}
