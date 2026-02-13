"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav className="flex flex-wrap gap-2 py-4" aria-label="Breadcrumb">
            {items.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                    {index > 0 && (
                        <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                    {item.href ? (
                        <Link
                            href={item.href}
                            className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors"
                        >
                            {item.label}
                        </Link>
                    ) : (
                        <span className="text-foreground text-sm font-medium">
                            {item.label}
                        </span>
                    )}
                </div>
            ))}
        </nav>
    );
}
