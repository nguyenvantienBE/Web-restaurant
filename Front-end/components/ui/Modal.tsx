"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
    footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, size = "md", footer }: ModalProps) {
    if (!open) return null;

    const sizeClass = {
        sm: "max-w-sm",
        md: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
    }[size];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />
            {/* Panel */}
            <div
                className={cn(
                    "relative w-full mx-4 bg-[#1A1A1A] border border-white/10 shadow-2xl",
                    sizeClass
                )}
            >
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                        <h2 className="font-serif text-cream text-lg">{title}</h2>
                        <button
                            onClick={onClose}
                            className="text-cream/40 hover:text-cream transition-colors p-1"
                        >
                            <X size={18} />
                        </button>
                    </div>
                )}
                {/* Body */}
                <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
                {/* Footer */}
                {footer && (
                    <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
