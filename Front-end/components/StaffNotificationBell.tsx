"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { getSocket } from "@/lib/socket";
import { useStaffNotifications } from "@/lib/hooks/useStaffNotifications";
import { playSound } from "@/lib/sound";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "staffNotifSeenAt";

export function StaffNotificationBell() {
    const { user } = useAuth();
    const qc = useQueryClient();
    const { data: items = [] } = useStaffNotifications(!!user);
    const [open, setOpen] = useState(false);
    const [seenAt, setSeenAt] = useState(() => {
        if (typeof window === "undefined") return "1970-01-01T00:00:00.000Z";
        return localStorage.getItem(STORAGE_KEY) || "1970-01-01T00:00:00.000Z";
    });

    useEffect(() => {
        if (!user) return;
        const s = getSocket();
        s.connect();
        const onNew = () => {
            playSound("newOrder");
            qc.invalidateQueries({ queryKey: ["staff-notifications"] });
            qc.invalidateQueries({ queryKey: ["reservations"] });
        };
        const onUpd = () => {
            qc.invalidateQueries({ queryKey: ["staff-notifications"] });
            qc.invalidateQueries({ queryKey: ["reservations"] });
        };
        s.on("reservation:new", onNew);
        s.on("reservation:updated", onUpd);
        return () => {
            s.off("reservation:new", onNew);
            s.off("reservation:updated", onUpd);
        };
    }, [user, qc]);

    const unread = useMemo(() => {
        const t = new Date(seenAt).getTime();
        return items.filter((n) => new Date(n.createdAt).getTime() > t).length;
    }, [items, seenAt]);

    const markSeen = () => {
        const now = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, now);
        setSeenAt(now);
    };

    if (!user) return null;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => {
                    setOpen((prev) => {
                        if (!prev) markSeen();
                        return !prev;
                    });
                }}
                className="relative p-2.5 rounded-xl border border-white/10 bg-white/5 text-cream/70 hover:text-cream hover:border-gold/30 transition-colors"
                aria-label="Thông báo"
            >
                <Bell size={18} />
                {unread > 0 && (
                    <span
                        className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-charcoal"
                    >
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>
            {open && (
                <div
                    className={cn(
                        "absolute right-0 top-full mt-2 w-[min(100vw-2rem,22rem)] max-h-[min(70vh,24rem)] overflow-y-auto rounded-xl border border-white/10 bg-[#141414] shadow-2xl z-[200] py-2",
                    )}
                >
                    <p className="px-3 pb-2 text-[10px] uppercase tracking-widest text-cream/40">Thông báo nội bộ</p>
                    {items.length === 0 ? (
                        <p className="px-3 py-6 text-sm text-cream/35 text-center">Chưa có thông báo</p>
                    ) : (
                        <ul className="space-y-0">
                            {items.map((n) => (
                                <li
                                    key={n.id}
                                    className="px-3 py-2.5 border-t border-white/5 first:border-t-0 hover:bg-white/[0.04]"
                                >
                                    <p className="text-xs font-medium text-cream/90">{n.title}</p>
                                    <p className="text-xs text-cream/50 mt-0.5 leading-relaxed">{n.body}</p>
                                    <p className="text-[10px] text-cream/25 mt-1">
                                        {new Date(n.createdAt).toLocaleString("vi-VN")}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
