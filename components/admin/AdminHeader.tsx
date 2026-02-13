"use client";

import { Search, Bell, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AdminHeaderProps {
    showAddProduct?: boolean;
    title?: string
    description?: string
}

export function AdminHeader({ showAddProduct = true, title, description }: AdminHeaderProps) {
    return (
        <header className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between px-6 py-5 sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-transparent">
            {/* Search */}
            <div className="w-full md:max-w-[480px]">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                    <Input
                        placeholder="Search products, orders, or customers..."
                        className="pl-10 h-11 shadow-sm"
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 shrink-0">
                <Button variant="outline" size="icon" className="size-10 rounded-full">
                    <Bell className="size-5" />
                </Button>
                {showAddProduct && (
                    <Link href="/admin/products/new">
                        <Button className="gap-2 shadow-md shadow-primary/20">
                            <Plus className="size-5" />
                            <span className="whitespace-nowrap">Add Product</span>
                        </Button>
                    </Link>
                )}
            </div>
        </header>
    );
}
