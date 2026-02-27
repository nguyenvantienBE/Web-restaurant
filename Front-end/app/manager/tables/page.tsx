"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge, getTableBgColor } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { mockTables } from "@/lib/mock/data";
import { Table, TableArea } from "@/lib/types";
import { CLAIMS } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Plus, QrCode, Edit2, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

const tableSchema = z.object({
    tableCode: z.string().min(1, "Mã bàn bắt buộc"),
    area: z.enum(["indoor", "outdoor", "rooftop", "bar"] as const),
    capacity: z.coerce.number().int().min(1).max(20),
});
type TableForm = z.infer<typeof tableSchema>;

const AREA_LABELS: Record<TableArea, string> = {
    indoor: "Trong nhà", outdoor: "Ngoài trời", rooftop: "Sân thượng", bar: "Khu bar",
};

export default function ManagerTablesPage() {
    const { hasClaim } = useAuth();
    const [tables, setTables] = useState<Table[]>(mockTables);
    const [modalOpen, setModalOpen] = useState(false);
    const [qrModal, setQrModal] = useState<Table | null>(null);
    const [editTable, setEditTable] = useState<Table | null>(null);
    const [areaFilter, setAreaFilter] = useState<TableArea | "all">("all");

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TableForm>({
        resolver: zodResolver(tableSchema) as never, defaultValues: { area: "indoor", capacity: 4 },
    });

    const filtered = areaFilter === "all" ? tables : tables.filter((t) => t.area === areaFilter);

    const openCreate = () => { setEditTable(null); reset({ area: "indoor", capacity: 4 }); setModalOpen(true); };
    const openEdit = (t: Table) => {
        setEditTable(t);
        reset({ tableCode: t.tableCode, area: t.area, capacity: t.capacity });
        setModalOpen(true);
    };

    const onSubmit = async (data: TableForm) => {
        await new Promise((r) => setTimeout(r, 200));
        if (editTable) {
            setTables((prev) => prev.map((t) => t.id === editTable.id ? { ...t, ...data } : t));
            toast.success("Đã cập nhật bàn");
        } else {
            setTables((prev) => [...prev, { id: `t_${Date.now()}`, status: "EMPTY", ...data }]);
            toast.success("Đã thêm bàn mới");
        }
        setModalOpen(false);
    };

    const deleteTable = (id: string) => {
        setTables((prev) => prev.filter((t) => t.id !== id));
        toast.success("Đã xoá bàn");
    };

    const getQRValue = (table: Table) =>
        `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/order/${table.tableCode}`;

    return (
        <DashboardLayout>
            <div className="space-y-5">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="font-serif text-cream text-4xl">Quản lý bàn & QR</h1>
                        <p className="text-cream/40 text-base mt-1">{tables.length} bàn · {tables.filter((t) => t.status === "EMPTY").length} trống</p>
                    </div>
                    {hasClaim(CLAIMS.TABLE_CREATE) && (
                        <button onClick={openCreate}
                            className="flex items-center gap-2.5 bg-gold text-charcoal px-6 py-3 text-base font-semibold hover:bg-gold-light transition-colors">
                            <Plus size={20} /> Thêm bàn
                        </button>
                    )}
                </div>

                {/* Area filter */}
                <div className="flex gap-2.5 flex-wrap">
                    {(["all", "indoor", "outdoor", "rooftop", "bar"] as const).map((a) => (
                        <button key={a} onClick={() => setAreaFilter(a)}
                            className={cn("px-6 py-3 text-base font-medium border rounded-lg transition-colors",
                                areaFilter === a ? "border-gold bg-gold/20 text-gold" : "border-white/10 text-cream/50 hover:text-cream hover:border-white/30")}>
                            {a === "all" ? "Tất cả" : AREA_LABELS[a]}
                        </button>
                    ))}
                </div>

                {/* Table grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                    {filtered.map((table) => (
                        <div key={table.id}
                            className={cn("border rounded p-4 relative group transition-all", getTableBgColor(table.status))}>
                            <p className="text-cream font-bold text-lg">{table.tableCode}</p>
                            <p className="text-cream/50 text-xs flex items-center gap-1 mt-0.5">
                                <Users size={10} /> {table.capacity} người
                            </p>
                            <p className="text-cream/40 text-[10px] mt-0.5">{AREA_LABELS[table.area]}</p>
                            <div className="mt-2">
                                <StatusBadge type="table" status={table.status} size="sm" lang="vi" />
                            </div>
                            {/* Actions */}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {hasClaim(CLAIMS.QR_GENERATE) && (
                                    <button onClick={() => setQrModal(table)}
                                        className="w-6 h-6 bg-charcoal/80 text-gold flex items-center justify-center rounded" title="Xem QR">
                                        <QrCode size={12} />
                                    </button>
                                )}
                                {hasClaim(CLAIMS.TABLE_UPDATE) && (
                                    <button onClick={() => openEdit(table)}
                                        className="w-6 h-6 bg-charcoal/80 text-cream/60 flex items-center justify-center rounded">
                                        <Edit2 size={11} />
                                    </button>
                                )}
                                {hasClaim(CLAIMS.TABLE_DELETE) && (
                                    <button onClick={() => deleteTable(table.id)}
                                        className="w-6 h-6 bg-charcoal/80 text-red-400/60 hover:text-red-400 flex items-center justify-center rounded">
                                        <Trash2 size={11} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create/Edit Modal */}
            <Modal open={modalOpen} onClose={() => setModalOpen(false)}
                title={editTable ? "Sửa bàn" : "Thêm bàn mới"}
                footer={
                    <button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}
                        className="bg-gold text-charcoal px-5 py-2 text-sm font-semibold hover:bg-gold-light transition-colors disabled:opacity-50">
                        {editTable ? "Cập nhật" : "Thêm bàn"}
                    </button>
                }>
                <div className="space-y-4">
                    <div>
                        <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1">Mã bàn *</label>
                        <input {...register("tableCode")} placeholder="A1"
                            className="w-full bg-white/5 border border-white/10 text-cream px-3 py-2 text-sm focus:outline-none focus:border-gold/50" />
                        {errors.tableCode && <p className="text-red-400 text-xs mt-1">{errors.tableCode.message}</p>}
                    </div>
                    <div>
                        <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1">Khu vực *</label>
                        <select {...register("area")} className="w-full bg-[#1A1A1A] border border-white/10 text-cream px-3 py-2 text-sm focus:outline-none focus:border-gold/50">
                            {(["indoor", "outdoor", "rooftop", "bar"] as const).map((a) => (
                                <option key={a} value={a}>{AREA_LABELS[a]}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-cream/50 text-xs uppercase tracking-widest mb-1">Sức chứa *</label>
                        <input {...register("capacity")} type="number" min={1} max={20}
                            className="w-full bg-white/5 border border-white/10 text-cream px-3 py-2 text-sm focus:outline-none focus:border-gold/50" />
                    </div>
                </div>
            </Modal>

            {/* QR Code Modal */}
            <Modal open={!!qrModal} onClose={() => setQrModal(null)}
                title={`QR Code – Bàn ${qrModal?.tableCode}`}
                footer={
                    <button onClick={() => { window.print(); }} className="border border-white/10 text-cream/60 hover:text-cream px-4 py-2 text-sm">
                        🖨 In QR
                    </button>
                }>
                {qrModal && (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="bg-white p-6 rounded">
                            <QRCodeSVG value={getQRValue(qrModal)} size={200} />
                        </div>
                        <div className="text-center">
                            <p className="text-cream font-bold text-xl font-serif">Bàn {qrModal.tableCode}</p>
                            <p className="text-cream/50 text-xs mt-1">{AREA_LABELS[qrModal.area]} · {qrModal.capacity} người</p>
                            <p className="text-cream/30 text-xs mt-2 font-mono break-all">{getQRValue(qrModal)}</p>
                        </div>
                    </div>
                )}
            </Modal>
        </DashboardLayout>
    );
}
