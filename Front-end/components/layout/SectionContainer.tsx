import { cn } from "@/lib/utils";

/** Khung nội dung căn giữa viewport (marketing pages). */
export function SectionContainer({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("flex w-full justify-center", className)}>
            <div className="w-full max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16">{children}</div>
        </div>
    );
}
