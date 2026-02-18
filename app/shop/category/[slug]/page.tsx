"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    Header,
    Footer,
    Breadcrumb,
    FilterSidebar,
    UtilityBar,
    ProductListGrid,
    type FilterState,
    type Category,
    type ProductListItem
} from "@/components/storefront";
import { Loader2 } from "lucide-react";

export default function CategoryPage() {
    const params = useParams();
    const slug = params.slug as string;

    // Fetch Category by Slug
    const category = useQuery(api.categories.getBySlug, { slug });

    // State for filters and view
    const [filters, setFilters] = useState<FilterState>({
        categories: [], // Will be populated or controlled by sidebar
        priceRange: [0, 500],
        sizes: [],
        colors: [],
        sortBy: "newest",
    });
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Fetch Products (Infinite Scroll / Pagination handled by Convex helper if used, or simple listActive)
    // Using listActive with limit for now as per previous context, or usePaginatedQuery if available for active.
    // The task list said "Implement product pagination with usePaginatedQuery" was completed. 
    // Let's check if there is a paginated active query. 
    // convex/products.ts usually has `listActive` which is a simple query, or `paginate` which might be admin only.
    // For now, I'll use `listActive` directly or a new paginated query if one exists.
    // Given the recursion complexity, `listActive` does the heavy lifting.

    const productsData = useQuery(api.products.listActive, {
        categorySlug: slug,
        limit: 50 // Fetch 50 for now
    });

    // We can also fetch all categories for the sidebar
    // Ideally we pass the tree or siblings.
    const allCategories = useQuery(api.categories.list);

    if (category === undefined) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="grow flex items-center justify-center">
                    <Loader2 className="size-8 animate-spin text-primary" />
                </main>
                <Footer />
            </div>
        );
    }

    if (category === null) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="grow flex flex-col items-center justify-center gap-4">
                    <h1 className="text-2xl font-bold">Category not found</h1>
                    <p className="text-muted-foreground">The category "{slug}" does not exist.</p>
                </main>
                <Footer />
            </div>
        );
    }

    const breadcrumbItems = [
        { label: "Home", href: "/" },
        { label: "Shop", href: "/shop" },
        { label: category.name },
    ];

    // Transform API products to Product
    const products: any[] = productsData ? productsData.map(p => ({
        id: p._id,
        name: p.name,
        category: p.categoryName || "Uncategorized",
        slug: p.slug,
        price: p.basePrice / 100,
        originalPrice: p.compareAtPrice ? p.compareAtPrice / 100 : undefined,
        image: p.images.find(img => img.isMain)?.url || p.images[0]?.url || "",
        badge: p.isFeatured ? "new" : undefined,
        rating: p.rating || 0,
        reviewCount: p.reviewCount || 0,
        defaultVariantId: p.defaultVariantId,
    })) : [];

    // Transform categories for sidebar (flattened or tree? FilterSidebar expects Category[])
    const sidebarCategories: Category[] = allCategories ? allCategories.map(c => ({
        id: c._id,
        name: c.name,
        slug: c.slug,
        count: 0 // Count not readily available without separate aggregation
    })) : [];

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="grow w-full max-w-[1440px] mx-auto px-4 md:px-8 py-5">
                <Breadcrumb items={breadcrumbItems} />

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-foreground text-4xl md:text-5xl font-black leading-tight tracking-tight">
                            {category.name}
                        </h1>
                        <p className="text-muted-foreground text-lg font-normal">
                            {category.description || `Browse our ${category.name} collection`}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Sidebar - Passing current category to potentially highlight or filter subcategories */}
                    {/* Note: FilterSidebar might need updates to handle real data properly, but passing mocks/basics for now */}
                    <FilterSidebar
                        categories={sidebarCategories}
                        colors={[]} // Populate from aggregations if available
                        sizes={[]}
                        filters={filters}
                        onFiltersChange={setFilters}
                        priceMin={0}
                        priceMax={1000}
                    />

                    <div className="flex-1 flex flex-col">
                        <UtilityBar
                            totalItems={products.length} // Should be total in DB ideally
                            showingItems={products.length}
                            sortBy={filters.sortBy}
                            onSortChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                        />

                        {!productsData ? (
                            <div className="py-12 flex justify-center">
                                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <ProductListGrid
                                products={products}
                                viewMode={viewMode}
                                onLoadMore={() => { }}
                                hasMore={false} // Pagination not implemented in this step
                                loading={false}
                            />
                        )}

                        {products.length === 0 && productsData && (
                            <div className="py-20 text-center text-muted-foreground">
                                <p>No products found in this category.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
