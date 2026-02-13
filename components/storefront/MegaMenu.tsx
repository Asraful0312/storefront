"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface Category {
    _id: string;
    name: string;
    slug: string;
    children: Category[];
}

export function MegaMenu() {
    const categories = useQuery(api.categories.list, {}) as Category[] | undefined;
    const [activeCategory, setActiveCategory] = React.useState<string | null>(null);
    const [isOpen, setIsOpen] = React.useState(false);

    // Timeout to prevent flickering when moving between trigger and content
    const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsOpen(true);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false);
            setActiveCategory(null);
        }, 150); // Small delay
    };

    // Set initial active category when data loads or menu opens
    React.useEffect(() => {
        if (isOpen && categories && categories.length > 0 && !activeCategory) {
            setActiveCategory(categories[0]._id);
        }
    }, [isOpen, categories, activeCategory]);

    if (!categories) return null;

    const activeCategoryData = categories.find((c) => c._id === activeCategory);

    return (
        <div
            className=""
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Link
                href="/shop"
                className={cn(
                    "text-sm font-medium hover:text-primary transition-colors py-2 flex items-center gap-1",
                    isOpen && "text-primary"
                )}
            >
                Shop
            </Link>

            {/* Mega Menu Overlay */}
            {isOpen && (
                <div className="absolute top-full left-0 w-full z-50">
                    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-8 lg:px-12 xl:px-40 pt-2">
                        <div className="bg-card border border-border shadow-lg rounded-xl overflow-hidden flex min-h-[400px]">
                            {/* Sidebar - Level 1 Categories */}
                            <div className="w-64 bg-secondary/30 border-r border-border shrink-0 py-4">
                                {categories.map((category) => (
                                    <Link
                                        key={category._id}
                                        href={`/shop?category=${category.slug}`}
                                        className={cn(
                                            "flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors hover:bg-secondary/50",
                                            activeCategory === category._id
                                                ? "bg-secondary text-primary"
                                                : "text-foreground"
                                        )}
                                        onMouseEnter={() => setActiveCategory(category._id)}
                                    >
                                        {category.name}
                                        {category.children.length > 0 && (
                                            <ChevronRight className="size-4 opacity-50" />
                                        )}
                                    </Link>
                                ))}
                                <div className="mt-4 px-6 pt-4 border-t border-border">
                                    <Link
                                        href="/shop"
                                        className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                                    >
                                        Shop All Products
                                        <ChevronRight className="size-3" />
                                    </Link>
                                </div>
                            </div>

                            {/* Content Area - Level 2 & 3 Categories */}
                            <div className="flex-1 p-8 bg-card">
                                {activeCategoryData && (
                                    <div className="animate-fade-in space-y-8">
                                        <div className="flex items-end justify-between border-b border-border pb-4">
                                            <div>
                                                <h3 className="text-2xl font-bold text-foreground">
                                                    {activeCategoryData.name}
                                                </h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Browse all {activeCategoryData.name} products
                                                </p>
                                            </div>
                                            <Link
                                                href={`/shop?category=${activeCategoryData.slug}`}
                                                className="text-sm font-medium text-primary hover:underline"
                                            >
                                                View All
                                            </Link>
                                        </div>

                                        {activeCategoryData.children.length > 0 ? (
                                            <div className="grid grid-cols-3 gap-x-8 gap-y-10">
                                                {activeCategoryData.children.map((subCategory) => (
                                                    <div key={subCategory._id} className="space-y-3">
                                                        <Link
                                                            href={`/shop?category=${subCategory.slug}`}
                                                            className="block font-semibold text-foreground hover:text-primary transition-colors"
                                                        >
                                                            {subCategory.name}
                                                        </Link>
                                                        {subCategory.children.length > 0 && (
                                                            <ul className="space-y-2">
                                                                {subCategory.children.map((child) => (
                                                                    <li key={child._id}>
                                                                        <Link
                                                                            href={`/shop?category=${child.slug}`}
                                                                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                                                        >
                                                                            {child.name}
                                                                        </Link>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                                                <p>No subcategories found</p>
                                                <Link
                                                    href={`/shop?category=${activeCategoryData.slug}`}
                                                    className="mt-4 text-primary hover:underline"
                                                >
                                                    Browse Products
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export function MobileMenu({ onClose }: { onClose?: () => void }) {
    const categories = useQuery(api.categories.list, {}) as Category[] | undefined;
    const [expandedIds, setExpandedIds] = React.useState<string[]>([]);

    // Simple accordion logic
    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    if (!categories) return null;

    const renderCategory = (category: Category, level: number = 0) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedIds.includes(category._id);

        return (
            <div key={category._id} className="w-full">
                <div
                    className={cn(
                        "flex items-center justify-between w-full py-3 pr-4 group transition-colors",
                        level > 0 ? "pl-4 border-l border-border ml-2" : "px-4 hover:bg-secondary rounded-lg"
                    )}
                >
                    <Link
                        href={`/shop?category=${category.slug}`}
                        onClick={onClose}
                        className="flex-1 text-foreground font-medium"
                    >
                        {category.name}
                    </Link>
                    {hasChildren && (
                        <button
                            onClick={(e) => toggleExpand(category._id, e)}
                            className="p-1 hover:bg-black/5 rounded-md transition-colors"
                        >
                            <ChevronRight className={cn(
                                "size-4 text-muted-foreground transition-transform duration-200",
                                "transition-transform",
                                isExpanded && "rotate-90"
                            )} />
                        </button>
                    )}
                </div>

                {hasChildren && isExpanded && (
                    <div className="animate-fade-in-down overflow-hidden">
                        {category.children.map(child => renderCategory(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-1 w-full">
            <div
                className="px-4 py-3 rounded-lg hover:bg-secondary cursor-pointer transition-colors mb-2"
            >
                <Link href="/shop" onClick={onClose} className="block w-full font-bold">
                    Shop All
                </Link>
            </div>
            {categories.map(cat => renderCategory(cat))}
        </div>
    );
}
