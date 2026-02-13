"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Share2, ArrowLeft } from "lucide-react";
import { Header, Footer, Breadcrumb } from "@/components/storefront";
import { AccountSidebar } from "@/components/account";
import {
    WishlistItemCard,
    WishlistFilters,
    type WishlistItem,
    type WishlistFilter,
    type WishlistSort,
} from "@/components/account";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useCart } from "@/hooks/useCart";

export default function WishlistPage() {
    const rawWishlist = useQuery(api.wishlist.getWishlist);
    const toggleWishlist = useMutation(api.wishlist.toggleWishlist);

    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);

    // Map backend data to frontend model
    useEffect(() => {
        if (rawWishlist) {
            const items: WishlistItem[] = rawWishlist.map((item: any) => ({
                id: item.productId,
                name: item.product.name,
                image: item.product.image,
                price: item.product.basePrice / 100, // DB stores cents
                originalPrice: item.product.compareAtPrice ? item.product.compareAtPrice / 100 : undefined,
                category: "All", // We might want to populate category name if needed, or just leave generic
                stockStatus: "in-stock", // Logic for stock checking
                onSale: !!item.product.compareAtPrice,
                defaultVariantId: item.product.defaultVariantId,
            }));
            setWishlistItems(items);
        }
    }, [rawWishlist]);

    const [activeFilter, setActiveFilter] = useState<WishlistFilter>("all");
    const [sortBy, setSortBy] = useState<WishlistSort>("date-added");

    const { addItem } = useCart();

    const breadcrumbItems = [
        { label: "Home", href: "/" },
        { label: "My Account", href: "/account" },
        { label: "Wishlist" },
    ];

    const handleRemove = async (id: string) => {
        // Optimistic remove
        setWishlistItems((items) => items.filter((item) => item.id !== id));
        await toggleWishlist({ productId: id as Id<"products"> });
    };

    const handleMoveToCart = async (id: string) => {
        // Add to cart
        const item = wishlistItems.find((i) => i.id === id);
        await addItem(id as Id<"products">, item?.defaultVariantId, 1);
        // Remove from wishlist
        await handleRemove(id);
    };

    const handleShareWishlist = () => {
        // Simple clipboard copy
        navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
    };

    // Filter items
    let filteredItems = wishlistItems;
    if (activeFilter === "in-stock") {
        filteredItems = wishlistItems.filter((item) => item.stockStatus === "in-stock");
    } else if (activeFilter === "on-sale") {
        filteredItems = wishlistItems.filter((item) => item.onSale);
    }

    // Sort items
    const sortedItems = [...filteredItems].sort((a, b) => {
        switch (sortBy) {
            case "price-low":
                return a.price - b.price;
            case "price-high":
                return b.price - a.price;
            case "name":
                return a.name.localeCompare(b.name);
            default:
                return 0; // date-added (keep original order)
        }
    });

    return (
        <>
            <Header />

            <div className="grow w-full max-w-7xl mx-auto px-4 md:px-10 py-8">
                {/* Breadcrumbs */}
                <div className="mb-6">
                    <Breadcrumb items={breadcrumbItems} />
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
                    {/* Sidebar */}
                    <AccountSidebar userName="Alex" />

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        {/* Page Heading & Actions */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
                                My Wishlist{" "}
                                <span className="text-xl font-medium text-muted-foreground align-middle ml-2">
                                    ({wishlistItems.length} items)
                                </span>
                            </h1>
                            <Button
                                variant="secondary"
                                onClick={handleShareWishlist}
                                className="gap-2 w-full md:w-auto"
                            >
                                <Share2 className="size-4" />
                                Share Wishlist
                            </Button>
                        </div>

                        {/* Filter Chips */}
                        <div className="mb-6">
                            <WishlistFilters
                                activeFilter={activeFilter}
                                onFilterChange={setActiveFilter}
                                sortBy={sortBy}
                                onSortChange={setSortBy}
                            />
                        </div>

                        {/* Product Grid */}
                        {sortedItems.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {sortedItems.map((item) => (
                                    <WishlistItemCard
                                        key={item.id}
                                        item={item}
                                        onRemove={handleRemove}
                                        onMoveToCart={handleMoveToCart}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="text-6xl mb-4">💜</div>
                                <h3 className="text-xl font-bold text-foreground mb-2">
                                    Your wishlist is empty
                                </h3>
                                <p className="text-muted-foreground mb-6">
                                    Start adding items you love!
                                </p>
                                <Link href="/shop">
                                    <Button>Browse Products</Button>
                                </Link>
                            </div>
                        )}

                        {/* Continue Shopping */}
                        {sortedItems.length > 0 && (
                            <div className="flex justify-center mt-12 pb-8">
                                <Link
                                    href="/shop"
                                    className="flex items-center gap-2 text-muted-foreground hover:text-primary font-medium transition-colors"
                                >
                                    <ArrowLeft className="size-4" />
                                    Continue Shopping
                                </Link>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <Footer />
        </>
    );
}
