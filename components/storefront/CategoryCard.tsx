"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
    href: string;
    icon?: LucideIcon;
    imageUrl?: string;
    title: string;
    subtitle?: string;
    className?: string;
}

export function CategoryCard({
    href,
    icon: Icon,
    imageUrl,
    title,
    subtitle,
    className,
}: CategoryCardProps) {
    return (
        <Link
            href={href}
            className={cn(
                "group flex flex-col items-center gap-3 sm:gap-4 p-6 sm:p-8 rounded-xl",
                "bg-card border border-border",
                "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
                "transition-all duration-300",
                className
            )}
        >
            <div className="size-14 sm:size-16 rounded-full bg-accent flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300 overflow-hidden relative">
                {imageUrl ? (
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url('${imageUrl}')` }}
                    />
                ) : Icon ? (
                    <Icon className="size-7 sm:size-8" />
                ) : null}
            </div>
            <div className="text-center">
                <h3 className="font-bold text-base sm:text-lg text-foreground">{title}</h3>
                {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
            </div>
        </Link>
    );
}

interface CategorySectionProps {
    title?: string;
    viewAllHref?: string;
    children: React.ReactNode;
}

export function CategorySection({
    title = "Shop by Category",
    viewAllHref = "/categories",
    children,
}: CategorySectionProps) {
    return (
        <section>
            <div className="flex items-end justify-between pb-4 sm:pb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    {title}
                </h2>
                <Link
                    href={viewAllHref}
                    className="text-primary font-semibold text-sm hover:underline flex items-center gap-1"
                >
                    View all categories
                    <svg
                        className="size-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {children}
            </div>
        </section>
    );
}
