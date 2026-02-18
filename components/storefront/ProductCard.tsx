"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, ChevronLeft, ChevronRight, Star, StarHalf } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/lib/currency-context";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCart } from "@/hooks/useCart";
import { Id } from "@/convex/_generated/dataModel";
import StarRating from "./StartRating";

export interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    originalPrice?: number;
    image: string;
    badge?: "new" | "sale";
    slug: string;
    href?: string;
    defaultVariantId?: string; // or Id<"productVariants">
    rating: number;
    reviewCount: number;
}

interface ProductCardProps {
    product: Product;
    className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
    const { addItem } = useCart();
    const { formatDollarPrice } = useCurrency();

    // Check if in wishlist (returns boolean or undefined if loading/not logged in)
    const isInWishlist = useQuery(api.wishlist.isInWishlist, { productId: product.id as any });
    const toggleWishlist = useMutation(api.wishlist.toggleWishlist);

    // Local state for optimistic UI, sync with backend when loaded
    const [isHovered, setIsHovered] = useState(false);
    const [localWishlistState, setLocalWishlistState] = useState<boolean | null>(null);

    // Effect to sync local state with backend once loaded
    // If local state is set (user interaction), prioritize it. 
    // Otherwise use backend state.
    const isWishlisted = localWishlistState !== null ? localWishlistState : (isInWishlist || false);

    const setIsWishlisted = (val: boolean) => setLocalWishlistState(val);

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPercent = hasDiscount
        ? Math.round((1 - product.price / product.originalPrice!) * 100)
        : 0;



    return (
        <div
            className={cn("group flex flex-col gap-3", className)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative aspect-4/5 bg-secondary rounded-lg overflow-hidden">
                {/* Badge */}
                {product.badge && (
                    <Badge
                        className={cn(
                            "absolute top-3 left-3 z-10 text-xs font-bold px-2 py-1",
                            product.badge === "new"
                                ? "bg-primary text-white hover:bg-primary"
                                : "bg-red-500 text-white hover:bg-red-500"
                        )}
                    >
                        {product.badge === "new" ? "New" : `Sale -${discountPercent}%`}
                    </Badge>
                )}

                {/* Wishlist Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "absolute top-3 right-3 z-10 size-8 bg-white rounded-full",
                        "text-gray-400 hover:text-red-500 hover:bg-red-50",
                        "shadow-sm transition-all duration-200",
                        isHovered || isWishlisted ? "opacity-100" : "opacity-0",
                        isWishlisted && "text-red-500 bg-red-50"
                    )}
                    onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Optimistic update
                        const newState = !isWishlisted;
                        setIsWishlisted(newState);

                        try {
                            const result = await toggleWishlist({ productId: product.id as any });
                            // If user not authenticated, it throws.
                            // We could check result.action to confirm.
                            if (result.action === "added") setIsWishlisted(true);
                            else setIsWishlisted(false);
                        } catch (err) {
                            console.error("Wishlist error", err);
                            // Revert on error (e.g. not logged in)
                            setIsWishlisted(!newState);
                            // Ideally show toast here: "Please login to add to wishlist"
                        }
                    }}
                >
                    <Heart className={cn("size-4", isWishlisted && "fill-current")} />
                </Button>

                {/* Product Image */}
                <Link href={product.href || `/product/${product.slug}`}>
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url('${product.image}')` }}
                    />
                </Link>

                {/* Quick Add Button */}
                <div
                    className={cn(
                        "absolute inset-x-0 bottom-0 p-4",
                        "transition-transform duration-300",
                        isHovered ? "translate-y-0" : "translate-y-full"
                    )}
                >
                    <Button
                        className="w-full h-10 bg-white/90 backdrop-blur text-foreground font-bold text-sm rounded hover:bg-primary hover:text-white transition-colors shadow-lg"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addItem(product.id as Id<"products">, product.defaultVariantId, 1);
                        }}
                    >
                        Quick Add
                    </Button>
                </div>
            </div>

            {/* Product Info */}
            <div>
                <Link href={product.href || `/product/${product.slug}`}>
                    <h3 className="font-medium text-foreground hover:text-primary cursor-pointer truncate transition-colors">
                        {product.name}
                    </h3>
                </Link>
                <div className="mt-2">
                    <StarRating rating={product.rating} reviewCount={product.reviewCount} />
                </div>
                <p className="text-muted-foreground text-sm mt-0.5">{product.category}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span
                        className={cn(
                            "font-bold",
                            hasDiscount ? "text-primary" : "text-foreground"
                        )}
                    >
                        {formatDollarPrice(product.price)}
                    </span>
                    {hasDiscount && (
                        <span className="text-sm text-muted-foreground line-through">
                            {formatDollarPrice(product.originalPrice!)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

interface ProductGridProps {
    title?: string;
    products: Product[];
    showNavigation?: boolean;
    onLoadMore?: () => void;
    hasMore?: boolean;
}

export function ProductGrid({
    title = "New Arrivals",
    products,
    showNavigation = true,
    onLoadMore,
    hasMore = false,
}: ProductGridProps) {
    return (
        <section>
            <div className="flex items-center justify-between pb-4 sm:pb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    {title}
                </h2>
                {showNavigation && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-full border-border hover:bg-secondary"
                        >
                            <ChevronLeft className="size-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8 rounded-full border-border hover:bg-secondary"
                        >
                            <ChevronRight className="size-5" />
                        </Button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>

            {onLoadMore && hasMore && (
                <div className="flex justify-center mt-8 sm:mt-10">
                    <Button
                        variant="outline"
                        className="h-10 px-8 rounded-full border-border bg-card hover:bg-secondary font-medium"
                        onClick={onLoadMore}
                    >
                        Load More Products
                    </Button>
                </div>
            )}
        </section>
    );
}
