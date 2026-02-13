"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Header,
    Footer,
    Breadcrumb,
    FilterSidebar,
    UtilityBar,
    ProductListGrid,
    type FilterState,
    type ProductListItem,
    type Category,
} from "@/components/storefront";
import { Loader2 } from "lucide-react";

// Static definitions until we have dynamic color management
const COLORS = [
    { id: "red", name: "Red", hex: "#EF4444" },
    { id: "blue", name: "Blue", hex: "#3B82F6" },
    { id: "green", name: "Green", hex: "#22C55E" },
    { id: "black", name: "Black", hex: "#000000" },
    { id: "white", name: "White", hex: "#FFFFFF" },
    { id: "yellow", name: "Yellow", hex: "#EAB308" },
    { id: "orange", name: "Orange", hex: "#F97316" },
    { id: "purple", name: "Purple", hex: "#A855F7" },
    { id: "pink", name: "Pink", hex: "#EC4899" },
    { id: "gray", name: "Gray", hex: "#6B7280" },
];

export default function ShopPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Parse Search Params with Defaults
    const categorySlug = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : 0;
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : 1000;
    const colors = searchParams.get("colors")?.split(",") || undefined;
    const sizes = searchParams.get("sizes")?.split(",") || undefined;
    const sortBy = searchParams.get("sort") || "newest";

    const [limit, setLimit] = useState(20);

    // Data Fetching
    const data = useQuery(api.products.getFilteredProducts, {
        categorySlug,
        search,
        minPrice: minPrice * 100, // Convert to cents
        maxPrice: maxPrice * 100,
        colors,
        sizes,
        sortBy,
        limit,
        page: 1
    });

    const categoriesData = useQuery(api.categories.list);

    // Filter State (UI State)
    const filters: FilterState = {
        categories: categorySlug ? [categorySlug] : ["all"],
        priceRange: [minPrice, maxPrice],
        sizes: sizes || [],
        colors: colors || [],
        sortBy: sortBy,
    };

    // Update URL on filter change
    const handleFiltersChange = (newFilters: FilterState) => {
        const params = new URLSearchParams(searchParams.toString());

        // Category
        if (newFilters.categories.length > 0 && newFilters.categories[0] !== "all") {
            params.set("category", newFilters.categories[0]);
        } else {
            params.delete("category");
        }

        // Price (Only set if different from bounds)
        if (newFilters.priceRange[0] > 0) {
            params.set("minPrice", newFilters.priceRange[0].toString());
        } else {
            params.delete("minPrice");
        }

        if (newFilters.priceRange[1] < 1000) {
            params.set("maxPrice", newFilters.priceRange[1].toString());
        } else {
            params.delete("maxPrice");
        }

        // Sizes
        if (newFilters.sizes.length > 0) {
            params.set("sizes", newFilters.sizes.join(","));
        } else {
            params.delete("sizes");
        }

        // Colors
        if (newFilters.colors.length > 0) {
            params.set("colors", newFilters.colors.join(","));
        } else {
            params.delete("colors");
        }

        // Sort
        if (newFilters.sortBy && newFilters.sortBy !== "newest") {
            params.set("sort", newFilters.sortBy);
        } else {
            params.delete("sort");
        }

        // Reset limit on filter change
        setLimit(20);

        router.push(`/shop?${params.toString()}`, { scroll: false });
    };

    const handleSortChange = (value: string) => {
        handleFiltersChange({ ...filters, sortBy: value });
    };

    const products: ProductListItem[] = data?.products.map(p => ({
        id: p._id,
        name: p.name,
        price: p.basePrice / 100,
        originalPrice: p.compareAtPrice ? p.compareAtPrice / 100 : undefined,
        image: p.images.find(img => img.isMain)?.url || p.images[0]?.url || "",
        badge: p.isFeatured ? "new" : undefined,
        rating: p.rating || 0,
        reviewCount: p.reviewCount || 0,
        slug: p.slug,
        defaultVariantId: p.defaultVariantId,
    })) || [];

    // Recursive helper to map categories for sidebar (converting _id to id/slug use)
    const mapCategoryForSidebar = (cat: any): Category => ({
        id: cat.slug,
        name: cat.name,
        slug: cat.slug,
        count: 0,
        children: cat.children ? cat.children.map(mapCategoryForSidebar) : undefined
    });

    const sidebarCategories: Category[] = categoriesData ? categoriesData.map(mapCategoryForSidebar) : [];

    const breadcrumbItems = [
        { label: "Home", href: "/" },
        { label: "Shop" },
    ];

    if (categorySlug) {
        const catName = sidebarCategories.find(c => c.slug === categorySlug)?.name;
        if (catName) breadcrumbItems.push({ label: catName });
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="grow w-full max-w-[1440px] mx-auto px-4 md:px-8 py-5">
                <Breadcrumb items={breadcrumbItems} />

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-foreground text-4xl md:text-5xl font-black leading-tight tracking-tight">
                            {categorySlug
                                ? sidebarCategories.find(c => c.slug === categorySlug)?.name || "Category"
                                : "All Products"
                            }
                        </h1>
                        <p className="text-muted-foreground text-lg font-normal">
                            Explore our complete collection
                        </p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-10">
                    <FilterSidebar
                        categories={sidebarCategories}
                        colors={COLORS}
                        sizes={["XXS", "XS", "S", "M", "L", "XL", "2XL", "3XL"]}
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        priceMin={0}
                        priceMax={1000}
                    />

                    <div className="flex-1 flex flex-col">
                        <UtilityBar
                            totalItems={data?.totalItems || 0}
                            showingItems={products.length}
                            sortBy={filters.sortBy}
                            onSortChange={handleSortChange}
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                        />

                        {!data ? (
                            <div className="py-12 flex justify-center">
                                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <ProductListGrid
                                products={products}
                                viewMode={viewMode}
                                onLoadMore={() => setLimit(prev => prev + 20)}
                                hasMore={data.hasMore}
                                loading={false}
                            />
                        )}

                        {products.length === 0 && data && (
                            <div className="py-20 text-center text-muted-foreground">
                                <p>No products found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
