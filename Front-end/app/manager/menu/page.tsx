"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Modal } from "@/components/ui/Modal";
import {
    useMenuItems, useCategories, useCreateMenuItem,
    useUpdateMenuItem, useDeleteMenuItem, ApiMenuItem,
} from "@/lib/hooks/useMenu";
import { useForm, useWatch, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { CLAIMS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MENU_ITEM_TAG_IDS, type MenuItemTagId, isMenuItemTagId } from "@/lib/menuItemTags";
import { Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, UtensilsCrossed, Loader2 } from "lucide-react";
import { toast } from "sonner";

function ImagePreview({ control }: { control: Control<MenuItemForm> }) {
    const url = useWatch({ control, name: "imageUrl" });
    if (!url) return null;
    return (
        <div className="mt-2 relative w-full h-32 bg-white/5 border border-white/10 overflow-hidden rounded">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Preview" className="w-full h-full object-cover"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        </div>
    );
}

const menuItemSchema = z.object({
    name: z.string().min(1, "Tên món bắt buộc"),
    description: z.string().optional(),
    categoryId: z.string().min(1, "Chọn danh mục"),
    price: z.coerce.number().min(1000, "Giá tối thiểu 1.000đ"),
    preparationTime: z.coerce.number().optional(),
    // Cho phép bất kỳ string để lưu data URL (base64) hoặc URL bình thường
    imageUrl: z.string().optional().or(z.literal("")),
    tags: z.array(z.enum(["BEST_SELLER", "RECOMMENDED", "CHEFS_PICK", "NEW"])).optional(),
});
type MenuItemForm = z.infer<typeof menuItemSchema>;

const formatPrice = (p: number | string) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(p));

const CATEGORY_LABELS_VI: Record<string, string> = {
    "Appetizers": "Khai vị",
    "Main Course": "Món chính",
    "Desserts": "Món tráng miệng",
    "Beverages": "Đồ uống",
    "Món Việt": "Món Việt",
};

function getCategoryLabel(name: string, lang: string) {
    return lang === "vi" ? (CATEGORY_LABELS_VI[name] ?? name) : name;
}

const MAX_IMAGE_WIDTH = 640;
const IMAGE_QUALITY = 0.72;

function compressImageFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            const canvas = document.createElement("canvas");
            let { width, height } = img;
            if (width > MAX_IMAGE_WIDTH) {
                height = Math.round((height * MAX_IMAGE_WIDTH) / width);
                width = MAX_IMAGE_WIDTH;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Canvas not supported"));
                return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Không đọc được ảnh"));
        };
        img.src = url;
    });
}

export default function ManagerMenuPage() {
    const { hasClaim } = useAuth();
    const { t, i18n } = useTranslation();
    const lang = i18n.language === "vi" ? "vi" : "en";
    const { data: items = [], isLoading: itemsLoading } = useMenuItems();
    const { data: categories = [], isLoading: catsLoading } = useCategories();
    const createItem = useCreateMenuItem();
    const updateItem = useUpdateMenuItem();
    const deleteItem = useDeleteMenuItem();

    const [search, setSearch] = useState("");
    const [catFilter, setCatFilter] = useState<"all" | string>("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<ApiMenuItem | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<ApiMenuItem | null>(null);
    const [imageCompressing, setImageCompressing] = useState(false);

    const { register, handleSubmit, reset, control, setValue, watch, formState: { errors, isSubmitting } } = useForm<MenuItemForm>({
        resolver: zodResolver(menuItemSchema) as never,
        defaultValues: { tags: [] },
    });
    const selectedTags = watch("tags") ?? [];

    const uniqueCategories = Array.from(new Map(categories.map((c) => [c.name, c])).values());
    const filtered = items.filter((i) => {
        const q = search.toLowerCase();
        const matchSearch = i.name.toLowerCase().includes(q) ||
            (i.description ?? "").toLowerCase().includes(q);
        const itemCatName = categories.find((c) => c.id === i.categoryId)?.name;
        const matchCat = catFilter === "all" || itemCatName === catFilter;
        return matchSearch && matchCat;
    });

    const openCreate = () => { setEditItem(null); reset({ tags: [] }); setModalOpen(true); };
    const openEdit = (item: ApiMenuItem) => {
        setEditItem(item);
        const raw = item.tags ?? [];
        const tags = raw.filter((t): t is MenuItemTagId =>
            (MENU_ITEM_TAG_IDS as readonly string[]).includes(t)
        );
        reset({
            name: item.name,
            description: item.description ?? "",
            categoryId: item.categoryId,
            price: Number(item.price),
            preparationTime: item.preparationTime ?? undefined,
            imageUrl: item.imageUrl ?? "",
            tags,
        });
        setModalOpen(true);
    };

    const toggleTag = (id: MenuItemTagId) => {
        const cur = watch("tags") ?? [];
        const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
        setValue("tags", next, { shouldValidate: true, shouldDirty: true });
    };

    const onSubmit = async (data: MenuItemForm) => {
        const { preparationTime: _skip, ...payload } = data;
        const body = { ...payload, tags: payload.tags ?? [] };
        try {
            if (editItem) {
                await updateItem.mutateAsync({ id: editItem.id, ...body });
                toast.success("Đã cập nhật món ăn!");
            } else {
                await createItem.mutateAsync(body);
                toast.success("Đã thêm món ăn mới!");
            }
            setModalOpen(false);
            reset();
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Thao tác thất bại");
        }
    };

    const handleToggleAvailable = async (item: ApiMenuItem) => {
        try {
            await updateItem.mutateAsync({ id: item.id, isAvailable: !item.isAvailable });
            toast.success(item.isAvailable ? "Đã tắt món" : "Đã bật món");
        } catch {
            toast.error("Cập nhật thất bại");
        }
    };

    const handleDelete = async (item: ApiMenuItem) => {
        try {
            await deleteItem.mutateAsync(item.id);
            toast.success(`Đã xoá "${item.name}"`);
            setDeleteConfirm(null);
        } catch {
            toast.error("Xoá thất bại");
        }
    };

    const isLoading = itemsLoading || catsLoading;
    const availableCount = items.filter((i) => i.isAvailable).length;
    const outOfStockCount = items.filter((i) => !i.isAvailable).length;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="font-serif text-cream text-2xl sm:text-3xl tracking-tight">Quản lý thực đơn</h1>
                        <p className="text-cream/50 text-sm mt-1">
                            {isLoading ? "Đang tải..." : `${items.length} món · ${availableCount} có sẵn · ${outOfStockCount} hết hàng`}
                        </p>
                    </div>
                    {hasClaim(CLAIMS.MENU_CREATE) && (
                        <button
                            onClick={openCreate}
                            className="flex items-center justify-center gap-2 bg-gold text-charcoal px-5 py-3 text-sm font-semibold rounded-xl hover:bg-gold-light transition-all shadow-lg shadow-gold/10 hover:shadow-gold/20"
                        >
                            <Plus size={18} /> Thêm món
                        </button>
                    )}
                </div>

                {/* Search + Category filter */}
                <div className="glass-card rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex items-center flex-1 bg-white/5 border border-white/10 rounded-xl focus-within:border-gold/40 focus-within:ring-1 focus-within:ring-gold/20 px-4 gap-3 transition-all">
                            <Search size={18} className="text-cream/40 shrink-0" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm món ăn theo tên hoặc mô tả..."
                                className="flex-1 bg-transparent text-cream placeholder-cream/30 py-3 text-sm focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setCatFilter("all")}
                            className={cn(
                                "px-4 py-2 text-sm font-medium rounded-full transition-all",
                                catFilter === "all"
                                    ? "bg-gold/25 text-gold border border-gold/50 shadow-sm"
                                    : "bg-white/5 border border-white/10 text-cream/60 hover:text-cream hover:bg-white/8"
                            )}
                        >
                            Tất cả
                        </button>
                        {uniqueCategories.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setCatFilter(cat.name)}
                                className={cn(
                                    "px-4 py-2 text-sm font-medium rounded-full transition-all",
                                    catFilter === cat.name
                                        ? "bg-gold/25 text-gold border border-gold/50 shadow-sm"
                                        : "bg-white/5 border border-white/10 text-cream/60 hover:text-cream hover:bg-white/8"
                                )}
                            >
                                {getCategoryLabel(cat.name, lang)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="flex justify-center py-20">
                        <Loader2 size={32} className="animate-spin text-gold" />
                    </div>
                )}

                {/* Menu table */}
                {!isLoading && (
                    <div className="glass-card rounded-2xl overflow-hidden">
                        {filtered.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10 bg-white/[0.06]">
                                        <th className="text-left text-cream/60 text-xs font-semibold tracking-wider uppercase px-5 py-4">Món ăn</th>
                                        <th className="text-left text-cream/60 text-xs font-semibold tracking-wider uppercase px-5 py-4 hidden sm:table-cell">Danh mục</th>
                                        <th className="text-right text-cream/60 text-xs font-semibold tracking-wider uppercase px-5 py-4">Giá</th>
                                        <th className="text-center text-cream/60 text-xs font-semibold tracking-wider uppercase px-5 py-4 w-24">Tình trạng</th>
                                        {(hasClaim(CLAIMS.MENU_UPDATE) || hasClaim(CLAIMS.MENU_DELETE)) && <th className="w-24 px-5 py-4" />}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((item) => {
                                        const cat = categories.find((c) => c.id === item.categoryId);
                                        return (
                                            <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-4">
                                                        {item.imageUrl ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={item.imageUrl} alt="" className="w-12 h-12 object-cover rounded-lg shrink-0 ring-1 ring-white/10" />
                                                        ) : (
                                                            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center shrink-0 border border-white/10">
                                                                <UtensilsCrossed size={18} className="text-cream/40" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-cream font-medium">{item.name}</p>
                                                            {item.preparationTime && (
                                                                <p className="text-cream/40 text-xs mt-0.5">{item.preparationTime} phút</p>
                                                            )}
                                                            {item.tags && item.tags.some(isMenuItemTagId) && (
                                                                <div className="flex flex-wrap gap-1 mt-1.5 max-w-[220px]">
                                                                    {item.tags.filter(isMenuItemTagId).map((tag) => (
                                                                        <span
                                                                            key={tag}
                                                                            className="text-[9px] tracking-wide uppercase px-1.5 py-0.5 rounded bg-gold/12 text-gold/90 border border-gold/25"
                                                                        >
                                                                            {t(`menu.item_tags.${tag}`)}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-cream/60 text-sm hidden sm:table-cell">
                                                    {cat ? getCategoryLabel(cat.name, lang) : "—"}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <span className="text-gold font-semibold">{formatPrice(item.price)}</span>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    {hasClaim(CLAIMS.MENU_UPDATE) ? (
                                                        <button
                                                            onClick={() => handleToggleAvailable(item)}
                                                            disabled={updateItem.isPending}
                                                            title="Bấm để đổi tình trạng"
                                                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-cream/50 hover:text-cream hover:bg-white/5 transition-colors"
                                                        >
                                                            {item.isAvailable
                                                                ? <ToggleRight size={22} className="text-emerald-400" />
                                                                : <ToggleLeft size={22} className="text-cream/40" />}
                                                        </button>
                                                    ) : (
                                                        <span className={item.isAvailable ? "text-emerald-400 text-xs font-medium" : "text-cream/40 text-xs"}>
                                                            {item.isAvailable ? "Còn" : "Hết"}
                                                        </span>
                                                    )}
                                                </td>
                                                {(hasClaim(CLAIMS.MENU_UPDATE) || hasClaim(CLAIMS.MENU_DELETE)) && (
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-1 justify-end">
                                                            {hasClaim(CLAIMS.MENU_UPDATE) && (
                                                                <button
                                                                    onClick={() => openEdit(item)}
                                                                    className="p-2 rounded-lg text-cream/40 hover:text-gold hover:bg-gold/10 transition-colors"
                                                                    title="Sửa"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                            )}
                                                            {hasClaim(CLAIMS.MENU_DELETE) && (
                                                                <button
                                                                    onClick={() => setDeleteConfirm(item)}
                                                                    className="p-2 rounded-lg text-cream/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                                    title="Xoá"
                                                                >
                                                                    <Trash2 size={16} />
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
                        ) : (
                            <div className="py-20 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                                    <UtensilsCrossed size={28} className="text-cream/30" />
                                </div>
                                <p className="text-cream/50 text-sm">
                                    {items.length === 0 ? "Chưa có món nào trong menu" : "Không tìm thấy món phù hợp"}
                                </p>
                                {items.length === 0 && hasClaim(CLAIMS.MENU_CREATE) && (
                                    <button
                                        onClick={openCreate}
                                        className="mt-5 inline-flex items-center gap-2 bg-gold/20 text-gold border border-gold/40 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gold/30 transition-colors"
                                    >
                                        <Plus size={16} /> Thêm món đầu tiên
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            <Modal open={modalOpen} onClose={() => { setModalOpen(false); reset(); }}
                title={editItem ? "Sửa món ăn" : "Thêm món ăn mới"} size="lg"
                footer={
                    <div className="flex gap-2">
                        <button onClick={() => { setModalOpen(false); reset(); }} className="btn-ghost flex-1">Huỷ</button>
                        <button onClick={handleSubmit(onSubmit)}
                            disabled={isSubmitting || createItem.isPending || updateItem.isPending}
                            className="btn-gold flex-1 justify-center">
                            {(isSubmitting || createItem.isPending || updateItem.isPending)
                                ? <><Loader2 size={13} className="animate-spin" /> Đang lưu...</>
                                : editItem ? "Cập nhật" : "Thêm món"}
                        </button>
                    </div>
                }
            >
                <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-cream/60 text-xs uppercase tracking-[0.18em] mb-1.5">Tên món *</label>
                                <input
                                    {...register("name")}
                                    className="w-full bg-white/5 border border-white/10 text-cream px-3.5 py-2.5 text-sm rounded-md focus:outline-none focus:border-gold/60"
                                />
                                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-cream/60 text-xs uppercase tracking-[0.18em] mb-1.5">Danh mục *</label>
                                    <select
                                        {...register("categoryId")}
                                        className="w-full bg-white/5 border border-white/10 text-cream px-3.5 py-2.5 text-sm rounded-md focus:outline-none focus:border-gold/60"
                                    >
                                        <option value="">Chọn danh mục</option>
                                        {uniqueCategories.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {getCategoryLabel(c.name, lang)}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.categoryId && <p className="text-red-400 text-xs mt-1">{errors.categoryId.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-cream/60 text-xs uppercase tracking-[0.18em] mb-1.5">Giá (VND) *</label>
                                    <input
                                        {...register("price")}
                                        type="number"
                                        className="w-full bg-white/5 border border-white/10 text-cream px-3.5 py-2.5 text-sm rounded-md focus:outline-none focus:border-gold/60"
                                    />
                                    {errors.price && <p className="text-red-400 text-xs mt-1">{errors.price.message}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-cream/60 text-xs uppercase tracking-[0.18em] mb-1.5">Mô tả</label>
                                <textarea
                                    {...register("description")}
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 text-cream px-3.5 py-2.5 text-sm rounded-md focus:outline-none focus:border-gold/60 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-cream/60 text-xs uppercase tracking-[0.18em] mb-1.5">Thời gian làm (phút)</label>
                                <input
                                    {...register("preparationTime")}
                                    type="number"
                                    className="w-full bg-white/5 border border-white/10 text-cream px-3.5 py-2.5 text-sm rounded-md focus:outline-none focus:border-gold/60"
                                />
                            </div>
                            <div>
                                <label className="block text-cream/60 text-xs uppercase tracking-[0.18em] mb-2">Tag trên menu (khách xem)</label>
                                <div className="flex flex-wrap gap-x-4 gap-y-2">
                                    {MENU_ITEM_TAG_IDS.map((id) => (
                                        <label key={id} className="flex items-center gap-2 cursor-pointer text-cream/85 text-sm select-none">
                                            <input
                                                type="checkbox"
                                                className="rounded border-white/20 bg-white/5 text-gold focus:ring-gold/40"
                                                checked={selectedTags.includes(id)}
                                                onChange={() => toggleTag(id)}
                                            />
                                            {t(`menu.item_tags.${id}`)}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="block text-cream/60 text-xs uppercase tracking-[0.18em] mb-1.5">Ảnh món ăn</label>
                            <input
                                {...register("imageUrl")}
                                placeholder="https://... (có thể để trống nếu chọn file)"
                                className="w-full bg-white/5 border border-white/10 text-cream placeholder-cream/20 px-3.5 py-2.5 text-sm rounded-md focus:outline-none focus:border-gold/60 mb-2"
                            />
                            <div className="flex items-center gap-3 flex-wrap">
                                <input
                                    type="file"
                                    accept="image/*"
                                    disabled={imageCompressing}
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setImageCompressing(true);
                                        try {
                                            const dataUrl = await compressImageFile(file);
                                            setValue("imageUrl", dataUrl, { shouldValidate: true });
                                            toast.success("Đã nén ảnh, bấm Cập nhật để lưu");
                                        } catch {
                                            toast.error("Không xử lý được ảnh. Thử ảnh khác hoặc dán URL.");
                                        } finally {
                                            setImageCompressing(false);
                                            e.target.value = "";
                                        }
                                    }}
                                    className="text-xs text-cream/80 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gold file:text-charcoal hover:file:bg-gold-light cursor-pointer disabled:opacity-50"
                                />
                                {imageCompressing && (
                                    <span className="text-gold/80 text-xs inline-flex items-center gap-1">
                                        <Loader2 size={12} className="animate-spin" /> Đang nén ảnh...
                                    </span>
                                )}
                                <span className="text-cream/40 text-xs leading-snug">
                                    Chọn ảnh (tự nén để lưu nhanh) hoặc nhập URL.
                                </span>
                            </div>
                            <ImagePreview control={control} />
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirm Modal */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-box max-w-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 text-center space-y-4">
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                                <Trash2 size={20} className="text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-serif text-lg text-cream">Xác nhận xoá</h3>
                                <p className="text-cream/40 text-sm mt-1">Xoá món <strong className="text-cream">{deleteConfirm.name}</strong>?<br />Hành động này không thể hoàn tác.</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setDeleteConfirm(null)} className="btn-ghost flex-1">Huỷ</button>
                                <button onClick={() => handleDelete(deleteConfirm)}
                                    disabled={deleteItem.isPending}
                                    className="flex-1 bg-red-500/80 hover:bg-red-500 text-white text-sm py-2 transition-colors font-medium">
                                    {deleteItem.isPending ? "Đang xoá..." : "Xoá món"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
