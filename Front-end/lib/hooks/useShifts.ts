import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, parseResponse } from "@/lib/api";

export interface CurrentShift {
    id: string;
    status: string;
    openedAt: string;
    shiftDateYmd: string;
    openingCash: string | number;
    openedBy: { id: string; fullName: string; email: string };
    expenses: Array<{
        id: string;
        amount: string | number;
        type: string;
        note: string | null;
        createdAt: string;
    }>;
}

export interface ClosePreview {
    shift: {
        id: string;
        openedAt: string;
        shiftDateYmd: string;
        openingCash: number;
        openedBy: { id: string; fullName: string };
    };
    cashSales: number;
    expensesTotal: number;
    expectedCash: number;
    expenses: Array<{
        id: string;
        amount: number;
        type: string;
        note: string | null;
        createdAt: string;
    }>;
    validation: {
        canClose: boolean;
        blockingOrders: Array<{ id: string; orderNumber: string; status: string }>;
        blockingCount: number;
        pendingPayments: number;
        messages: string[];
    };
}

export function useCurrentShift() {
    return useQuery<CurrentShift | null>({
        queryKey: ["shifts", "current"],
        queryFn: async () => {
            const res = await api.get("/shifts/current");
            const data = await parseResponse<CurrentShift | null>(res);
            return data;
        },
        refetchInterval: 20_000,
    });
}

export function useClosePreview(shiftId: string | undefined) {
    return useQuery<ClosePreview>({
        queryKey: ["shifts", "close-preview", shiftId],
        queryFn: async () => {
            const res = await api.get(`/shifts/${shiftId}/close-preview`);
            return parseResponse<ClosePreview>(res);
        },
        enabled: !!shiftId,
        refetchInterval: 15_000,
    });
}

export function useOpenShift() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (openingCash: number) => {
            const res = await api.post("/shifts/open", { openingCash });
            return parseResponse(res);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["shifts"] });
            qc.invalidateQueries({ queryKey: ["reports"] });
        },
    });
}

export function useAddShiftExpense(shiftId: string | undefined) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (body: { amount: number; type: string; note?: string }) => {
            if (!shiftId) throw new Error("No shift");
            const res = await api.post(`/shifts/${shiftId}/expenses`, body);
            return parseResponse(res);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["shifts"] });
        },
    });
}

export function useCloseShift(shiftId: string | undefined) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (body: {
            actualCash: number;
            differenceReason?: string;
            managerApproverId?: string;
        }) => {
            if (!shiftId) throw new Error("No shift");
            const res = await api.post(`/shifts/${shiftId}/close`, body);
            return parseResponse(res);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["shifts"] });
            qc.invalidateQueries({ queryKey: ["reports"] });
            qc.invalidateQueries({ queryKey: ["orders"] });
            qc.invalidateQueries({ queryKey: ["tables"] });
        },
    });
}
