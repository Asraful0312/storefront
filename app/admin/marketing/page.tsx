"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Plus,
    Search,
    Filter,
    Edit,
    ToggleLeft,
    ToggleRight,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Megaphone,
    CreditCard,
    Star,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { usePaginatedQuery, useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useDebounce } from "@/lib/hooks";

const typeConfig = {
    percentage: { label: "Percentage", className: "bg-blue-100 text-blue-700" },
    fixed: { label: "Fixed", className: "bg-purple-100 text-purple-700" },
    shipping: { label: "Shipping", className: "bg-green-100 text-green-700" },
};

const statusConfig = {
    true: { label: "Active", dotClass: "bg-green-500", textClass: "text-green-700" },
    false: { label: "Inactive", dotClass: "bg-red-500", textClass: "text-red-700" },
};

type TabType = "all" | "active" | "scheduled" | "expired";



export default function MarketingPage() {
    const [activeTab, setActiveTab] = useState<TabType>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearch = useDebounce(searchQuery, 300);

    const { results, status, loadMore } = usePaginatedQuery(
        api.coupons.listCoupons,
        {},
        { initialNumItems: 10 }
    );

    // Search query
    const searchResults = useQuery(api.coupons.searchCoupons,
        debouncedSearch ? { query: debouncedSearch } : "skip"
    );

    const stats = useQuery(api.coupons.getMarketingStats);

    const updateCoupon = useMutation(api.coupons.updateCoupon);
    const deleteCoupon = useMutation(api.coupons.deleteCoupon);

    // Determine which coupons to show
    // If we have a search term, use searchResults. Otherwise use paginated results.
    const allCoupons = debouncedSearch ? (searchResults || []) : results;

    // Filter search results or paginated results by tab
    const filteredCoupons = activeTab === "all"
        ? allCoupons
        : allCoupons.filter((c) => {
            if (activeTab === "active") return c.isActive;
            // "scheduled" logic
            if (activeTab === "scheduled") return c.validFrom && c.validFrom > Date.now();
            // "expired"
            if (activeTab === "expired") return (c.validUntil && c.validUntil < Date.now()) || (c.usageLimit && c.usageCount >= c.usageLimit);
            return true;
        });

    const toggleStatus = async (id: Id<"coupons">, currentStatus: boolean) => {
        await updateCoupon({ id, isActive: !currentStatus });
    };

    const handleDelete = async (id: Id<"coupons">) => {
        if (confirm("Are you sure you want to delete this coupon?")) {
            await deleteCoupon({ id });
        }
    };

    const formatValue = (c: any) => {
        if (c.discountType === "percentage") return `${c.discountValue}% OFF`;
        if (c.discountType === "fixed") return `$${c.discountValue.toFixed(2)} OFF`;
        if (c.discountType === "shipping") return "Free Shipping";
        return "";
    };

    const formatUsage = (c: any) => {
        if (!c.usageLimit) return "Unlimited";
        return `${c.usageCount} / ${c.usageLimit}`;
    };

    const formatDate = (ts?: number) => {
        if (!ts) return "Never";
        return new Date(ts).toLocaleDateString();
    };

    return (
        <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Page Header */}
            <header className="p-8 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-6 max-w-6xl mx-auto">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-foreground text-3xl font-black tracking-tight">Promotions & Discounts</h2>
                        <p className="text-muted-foreground text-base">
                            Manage and monitor your e-commerce coupon codes and marketing campaigns.
                        </p>
                    </div>
                    <Link href="/admin/marketing/new" className={buttonVariants({ className: "gap-2 shadow-xl shadow-primary/20" })}>
                        <Plus className="size-4" />
                        Create New Coupon
                    </Link>
                </div>
            </header>

            {/* KPI Section */}
            <section className="px-8 py-4 max-w-6xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card flex flex-col gap-3 rounded-xl p-6 border border-border shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Active Promotions</p>
                            <Megaphone className="size-5 text-primary/40" />
                        </div>
                        <div className="flex items-end gap-3">
                            <p className="text-foreground text-3xl font-bold leading-none">{stats?.activeCount ?? 0}</p>
                            {/* <span className="text-green-600 text-sm font-bold flex items-center mb-1">
                                ↑ 5%
                            </span> */}
                        </div>
                    </div>
                    <div className="bg-card flex flex-col gap-3 rounded-xl p-6 border border-border shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Total Redemptions</p>
                            <CreditCard className="size-5 text-amber-500/40" />
                        </div>
                        <div className="flex items-end gap-3">
                            <p className="text-foreground text-3xl font-bold leading-none">{stats?.totalRedemptions ?? 0}</p>
                            {/* <span className="text-red-500 text-sm font-bold flex items-center mb-1">
                                ↓ 2%
                            </span> */}
                        </div>
                    </div>
                    <div className="bg-card flex flex-col gap-3 rounded-xl p-6 border border-border shadow-sm border-l-4 border-l-amber-500">
                        <div className="flex items-center justify-between">
                            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Most Used Coupon</p>
                            <Star className="size-5 text-amber-500" />
                        </div>
                        <div className="flex flex-col">
                            <p className="text-amber-600 text-2xl font-black leading-none">{stats?.mostUsedCoupon?.code ?? "---"}</p>
                            <p className="text-muted-foreground text-sm mt-1">{stats?.mostUsedCoupon?.usageCount ?? 0} redemptions</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Coupon List Section */}
            <section className="px-8 pb-12 max-w-6xl mx-auto w-full">
                <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col">
                    <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-4">
                        {/* Tabs */}
                        <div className="flex bg-secondary/50 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab("all")}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-sm font-bold transition-all",
                                    activeTab === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setActiveTab("active")}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-sm font-bold transition-all",
                                    activeTab === "active" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Active
                            </button>
                            <button
                                onClick={() => setActiveTab("scheduled")}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-sm font-bold transition-all",
                                    activeTab === "scheduled" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Scheduled
                            </button>
                            <button
                                onClick={() => setActiveTab("expired")}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-sm font-bold transition-all",
                                    activeTab === "expired" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                Expired
                            </button>
                        </div>

                        {/* Search & Filter */}
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    className="pl-9 w-64 h-9 bg-background"
                                    placeholder="Search coupons..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon" className="size-9">
                                <Filter className="size-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-secondary/50">
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Coupon Code
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Value</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Usage Limit
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Expiry Date
                                    </th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredCoupons?.map((coupon) => {
                                    const type = typeConfig[coupon.discountType as keyof typeof typeConfig] || typeConfig.percentage;
                                    const status = statusConfig[coupon.isActive ? "true" : "false"];

                                    // Override UI status if expired
                                    const isExpired = coupon.validUntil && coupon.validUntil < Date.now();
                                    const finalStatus = isExpired ? { label: "Expired", dotClass: "bg-gray-500", textClass: "text-gray-500" } : status;

                                    return (
                                        <tr
                                            key={coupon._id}
                                            className={cn(
                                                "hover:bg-primary/5 transition-colors group",
                                                !coupon.isActive && "opacity-60"
                                            )}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-black text-foreground">{coupon.code}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${type.className}`}>
                                                    {type.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium">{formatValue(coupon)}</td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">{formatUsage(coupon)}</td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(coupon.validUntil)}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${finalStatus.textClass}`}>
                                                    <span className={`h-2 w-2 rounded-full ${finalStatus.dotClass}`} />
                                                    {finalStatus.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-muted-foreground hover:text-primary"
                                                        asChild
                                                    >
                                                        <Link href={`/admin/marketing/${coupon._id}/edit`}>
                                                            <Edit className="size-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-muted-foreground hover:text-orange-500"
                                                        onClick={() => toggleStatus(coupon._id, coupon.isActive)}
                                                    >
                                                        {coupon.isActive ? (
                                                            <ToggleRight className="size-4" />
                                                        ) : (
                                                            <ToggleLeft className="size-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-muted-foreground hover:text-red-500"
                                                        onClick={() => handleDelete(coupon._id)}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div >

                    {/* Pagination - Load More */}
                    < div className="px-6 py-4 border-t border-border flex items-center justify-between" >
                        <p className="text-sm text-muted-foreground">
                            {status === "LoadingMore" ? "Loading more..." : `Showing ${results.length} coupons`}
                        </p>
                        <div className="flex items-center gap-2">
                            {status === "CanLoadMore" && (
                                <Button
                                    variant="outline"
                                    onClick={() => loadMore(5)}
                                >
                                    Load More
                                </Button>
                            )}
                        </div>
                    </div >
                </div >
            </section >
        </div >
    );
}
