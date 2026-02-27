"use client";

import { useSocket } from "@/hooks/useSocket";
import { useTranslation } from "react-i18next";
import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function LiveStatus() {
    const { data, connected } = useSocket();
    const { t } = useTranslation();

    const statusColor =
        data.status === "open"
            ? "bg-emerald-500"
            : data.status === "busy"
                ? "bg-amber-500"
                : "bg-red-500";

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <div className="glass-card bg-charcoal/90 border border-white/20 shadow-2xl p-4 min-w-[200px] backdrop-blur-md">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <span className="text-gold text-[10px] tracking-[0.2em] uppercase font-medium">
                        {t("live.realtime")}
                    </span>
                    {connected ? (
                        <Wifi size={12} className="text-emerald-400" />
                    ) : (
                        <WifiOff size={12} className="text-cream/30" />
                    )}
                </div>

                {/* Status dot + label */}
                <div className="flex items-center gap-2.5 mb-3">
                    <span className={cn("w-2 h-2 rounded-full animate-pulse", statusColor)} />
                    <span className="text-cream/80 text-xs font-medium">
                        {data.status === "open"
                            ? t("live.status_open")
                            : t("live.status_busy")}
                    </span>
                </div>

                {/* Table count */}
                <div className="border-t border-white/10 pt-3">
                    <span className="text-2xl font-serif text-gold font-semibold">
                        {data.tablesAvailable}
                    </span>
                    <span className="text-cream/40 text-xs ml-2">{t("live.tables")}</span>
                </div>
            </div>
        </div>
    );
}
