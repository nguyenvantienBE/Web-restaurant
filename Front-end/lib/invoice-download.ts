import { api } from "@/lib/api";

/** Khách QR — PDF không cần đăng nhập (đúng mã bàn). */
export async function downloadPublicOrderInvoicePdf(tableCode: string, orderId: string): Promise<void> {
    const { blob, filename } = await api.publicGetBlob(
        `/public/tables/${encodeURIComponent(tableCode)}/orders/${orderId}/invoice.pdf`,
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

/** Tải PDF hóa đơn từ API (Bearer — nhân viên). */
export async function downloadOrderInvoicePdf(orderId: string): Promise<void> {
    const { blob, filename } = await api.getBlob(`/invoices/orders/${orderId}/pdf`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}
