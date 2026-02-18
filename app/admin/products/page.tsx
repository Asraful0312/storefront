"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ChevronDown, Plus, Loader2, X } from "lucide-react";
import { ProductsTable, type AdminProduct } from "@/components/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useDebounce } from "@/hooks/useDebounce";

type StatusFilter = "all" | "active" | "draft" | "archived";
type StockFilter = "all" | "in-stock" | "low-stock" | "out-of-stock";

export default function AdminProductsPage() {
    const router = useRouter();

    // Filter states
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [stockFilter, setStockFilter] = useState<StockFilter>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // Fetch categories for filter dropdown
    const categories = useQuery(api.categories.list);

    // 1. Pagination Data (used when NOT searching)
    const {
        results: paginatedResults,
        status,
        loadMore,
        isLoading: isPaginationLoading,

    } = usePaginatedQuery(
        api.products.paginatedList,
        {
            status: statusFilter === "all" ? undefined : statusFilter,
            categoryId: categoryFilter === "all" ? undefined : categoryFilter as Id<"categories">,
        },
        { initialNumItems: 50 }
    );

    // 2. Search Data (used when searching)
    // Only switch to search mode if there is a debounced query
    const isSearching = debouncedSearchQuery.trim().length > 0;
    const searchResults = useQuery(api.products.search, isSearching ? {
        query: debouncedSearchQuery,
        status: statusFilter === "all" ? undefined : statusFilter,
        categoryId: categoryFilter === "all" ? undefined : categoryFilter as Id<"categories">,
    } : "skip");

    // 3. Total Count (for footer)
    const totalCount = useQuery(api.products.getProductCount, {
        status: statusFilter === "all" ? undefined : statusFilter,
        categoryId: categoryFilter === "all" ? undefined : categoryFilter as Id<"categories">,
        search: debouncedSearchQuery.trim() || undefined
    });

    const archiveProduct = useMutation(api.products.archive);

    // Unified Results Logic
    // If waiting for debounce (searchQuery exists but isSearching is false/debouncing), 
    // we technically want to show "Searching..." or keep old results?
    // Current logic: keeps pagination view until debounce finishes.
    const isLoading = isSearching ? searchResults === undefined : isPaginationLoading;

    // Determine source
    let displayProducts = isSearching ? (searchResults || []) : (paginatedResults || []);

    // Apply Stock Filter (Client-side)
    if (stockFilter !== "all" && displayProducts) {
        displayProducts = displayProducts.filter((p: any) => p.stockStatus === stockFilter);
    }

    // Transform to AdminProduct interface
    const products: AdminProduct[] = (displayProducts || []).map((p: any) => ({
        id: p._id,
        name: p.name,
        image: p.featuredImage || "",
        sku: p.sku || "—",
        category: p.categoryName || "Uncategorized",
        price: p.basePrice,
        stockLevel: p.totalStock,
        stockStatus: p.stockStatus,
        status: p.status,
        productType: p.productType,
    }));

    const handleEdit = (id: string) => {
        router.push(`/admin/products/${id}/edit`);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to archive this product?")) {
            try {
                await archiveProduct({ id: id as Id<"products"> });
            } catch (error) {
                console.error("Failed to archive product:", error);
                alert("Failed to archive product");
            }
        }
    };

    // Flatten categories for dropdown
    const flattenCategories = (
        cats: any[],
        depth: number = 0
    ): { id: string; name: string; depth: number }[] => {
        const result: { id: string; name: string; depth: number }[] = [];
        for (const cat of cats) {
            result.push({ id: cat._id, name: cat.name, depth });
            if (cat.children && cat.children.length > 0) {
                result.push(...flattenCategories(cat.children, depth + 1));
            }
        }
        return result;
    };

    const flatCategories = categories ? flattenCategories(categories) : [];

    // Get display labels
    const statusLabel = statusFilter === "all" ? "All Status" : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
    const categoryLabel = categoryFilter === "all"
        ? "All Categories"
        : flatCategories.find(c => c.id === categoryFilter)?.name || "Category";
    const stockLabel = stockFilter === "all" ? "All Stock" : stockFilter.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase());

    // Clear all filters
    const hasActiveFilters = statusFilter !== "all" || categoryFilter !== "all" || stockFilter !== "all" || searchQuery.trim();
    const clearFilters = () => {
        setStatusFilter("all");
        setCategoryFilter("all");
        setStockFilter("all");
        setSearchQuery("");
    };

    return (
        <>
            {/* Header */}
            <header className="flex-none px-6 py-6 md:px-10 bg-card border-b border-border">
                <div className="flex flex-wrap justify-between items-center gap-4 max-w-7xl mx-auto w-full">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-foreground text-3xl font-black leading-tight tracking-tight">
                            Product Management
                        </h2>
                        <p className="text-muted-foreground text-base font-normal">
                            Manage your store's inventory, pricing, and product details
                        </p>
                    </div>
                    <Link href="/admin/products/new">
                        <Button className="gap-2 shadow-sm">
                            <Plus className="size-5" />
                            Add New Product
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 md:px-10">
                <div className="max-w-7xl mx-auto flex flex-col gap-6">
                    {/* Controls Row: Search & Filters */}
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        {/* Search */}
                        <div className="w-full md:max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                                <Input
                                    placeholder="Search by product name..."
                                    className="pl-10 h-11"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <button
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setSearchQuery("")}
                                    >
                                        <X className="size-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter Dropdowns */}
                        <div className="flex flex-wrap gap-2 items-center">
                            {/* Status Filter */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" size="sm" className="gap-2">
                                        Status: {statusLabel}
                                        <ChevronDown className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                                        All Status
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                                        Active
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter("draft")}>
                                        Draft
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStatusFilter("archived")}>
                                        Archived
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Category Filter */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" size="sm" className="gap-2">
                                        Category: {categoryLabel}
                                        <ChevronDown className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
                                    <DropdownMenuItem onClick={() => setCategoryFilter("all")}>
                                        All Categories
                                    </DropdownMenuItem>
                                    {flatCategories.map((cat) => (
                                        <DropdownMenuItem
                                            key={cat.id}
                                            onClick={() => setCategoryFilter(cat.id)}
                                        >
                                            {"—".repeat(cat.depth)} {cat.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Stock Status Filter */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" size="sm" className="gap-2">
                                        Stock: {stockLabel}
                                        <ChevronDown className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setStockFilter("all")}>
                                        All Stock
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStockFilter("in-stock")}>
                                        In Stock
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStockFilter("low-stock")}>
                                        Low Stock
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setStockFilter("out-of-stock")}>
                                        Out of Stock
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Clear Filters */}
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1 text-muted-foreground hover:text-foreground"
                                    onClick={clearFilters}
                                >
                                    <X className="size-3" />
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Data Table */}
                    {isLoading ? (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="size-8 animate-spin text-primary" />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-12 bg-card rounded-xl border border-border">
                            <p className="text-muted-foreground">
                                {hasActiveFilters
                                    ? "No products match your filters."
                                    : "No products found. Add your first product!"}
                            </p>
                            {hasActiveFilters && (
                                <Button variant="link" onClick={clearFilters} className="mt-2">
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <ProductsTable
                                products={products}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                totalCount={stockFilter === 'all' ? totalCount : undefined}
                                filteredCount={products.length}
                            />

                            {/* Pagination Controls - Only show if NOT searching */}
                            {!isSearching && status === "CanLoadMore" && (
                                <div className="flex justify-center pt-4">
                                    <Button variant="outline" onClick={() => loadMore(50)}>
                                        Load More
                                    </Button>
                                </div>
                            )}
                            {!isSearching && status === "LoadingMore" && ( // Note: usePaginatedQuery loading status might differ, using simple check
                                <div className="flex justify-center pt-4">
                                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                                </div>
                            )}
                            {isSearching && searchResults && searchResults.length >= 50 && (
                                <div className="text-center text-sm text-muted-foreground pt-4">
                                    Search results are limited to top 50 matches.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
