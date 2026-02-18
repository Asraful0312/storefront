"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, Star, StarHalf, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCart } from "@/hooks/useCart";
import { Id } from "@/convex/_generated/dataModel";
import { ProductCard } from "./ProductCard";
import { useCurrency } from "@/lib/currency-context";

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

interface ProductListCardProps {
    product: Product;
    viewMode?: "grid" | "list";
    className?: string;
}

// Star Rating Component
function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <div className="flex items-center gap-1">
            {[...Array(fullStars)].map((_, i) => (
                <Star
                    key={`full-${i}`}
                    className="size-4 fill-primary text-primary"
                />
            ))}
            {hasHalfStar && (
                <StarHalf className="size-4 fill-primary text-primary" />
            )}
            {[...Array(emptyStars)].map((_, i) => (
                <Star
                    key={`empty-${i}`}
                    className="size-4 text-border"
                />
            ))}
            <span className="text-xs text-muted-foreground ml-1">
                ({reviewCount})
            </span>
        </div>
    );
}

export function ProductListCard({
    product,
    viewMode = "grid",
    className,
}: ProductListCardProps) {
    const { addItem } = useCart();
    const { formatDollarPrice } = useCurrency();

    // Check if in wishlist (returns boolean or undefined if loading/not logged in)
    const isInWishlist = useQuery(api.wishlist.isInWishlist, { productId: product.id as any });
    const toggleWishlist = useMutation(api.wishlist.toggleWishlist);

    // Local state for optimistic UI, sync with backend when loaded
    const [localWishlistState, setLocalWishlistState] = useState<boolean | null>(null);

    const isWishlisted = localWishlistState !== null ? localWishlistState : (isInWishlist || false);
    const setIsWishlisted = (val: boolean) => setLocalWishlistState(val);

    const [isHovered, setIsHovered] = useState(false);

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPercent = hasDiscount
        ? Math.round((1 - product.price / product.originalPrice!) * 100)
        : 0;

    const getBadgeText = () => {
        if (product.badge === "new") return "New";
        if (product.badge === "sale") return `Sale -${discountPercent}%`;
        if (product.badge === "limited") return "Limited";
        return null;
    };

    const getBadgeColor = () => {
        if (product.badge === "new") return "bg-primary text-white hover:bg-primary";
        if (product.badge === "sale") return "bg-[#221810] text-white hover:bg-[#221810]";
        if (product.badge === "limited") return "bg-muted-foreground text-white hover:bg-muted-foreground";
        return "";
    };

    if (viewMode === "list") {
        return (
            <div
                className={cn(
                    "group flex gap-4 p-4 rounded-lg border border-border hover:shadow-md transition-shadow",
                    className
                )}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Image */}
                <div className="relative w-32 sm:w-40 aspect-3/4 shrink-0 overflow-hidden rounded-lg bg-secondary">
                    {product.badge && (
                        <Badge className={cn("absolute top-2 left-2 z-10 text-[10px] font-bold uppercase tracking-wider", getBadgeColor())}>
                            {getBadgeText()}
                        </Badge>
                    )}
                    <Link href={product.href || `/product/${product.slug}`}>
                        <img
                            src={product.image}
                            alt={product.name}
                            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                    </Link>
                </div>

                {/* Content */}
                <div className="flex flex-col justify-between flex-1 py-2">
                    <div>
                        <Link href={product.href || `/product/${product.slug}`}>
                            <h3 className="text-foreground text-base font-bold leading-tight group-hover:text-primary transition-colors cursor-pointer">
                                {product.name}
                            </h3>
                        </Link>
                        <div className="mt-2">
                            <StarRating rating={product.rating} reviewCount={product.reviewCount} />
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                            <span className={cn("font-bold", hasDiscount ? "text-primary" : "text-foreground")}>
                                {formatDollarPrice(product.price)}
                            </span>
                            {hasDiscount && (
                                <span className="text-muted-foreground text-sm line-through">
                                    {formatDollarPrice(product.originalPrice!)}
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "size-8 rounded-full",
                                    isWishlisted && "text-red-500"
                                )}
                                onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const newState = !isWishlisted;
                                    setIsWishlisted(newState);
                                    try {
                                        const result = await toggleWishlist({ productId: product.id as any });
                                        if (result.action === "added") setIsWishlisted(true);
                                        else setIsWishlisted(false);
                                    } catch (err) {
                                        console.error("Wishlist error", err);
                                        setIsWishlisted(!newState);
                                    }
                                }}
                            >
                                <Heart className={cn("size-4", isWishlisted && "fill-current")} />
                            </Button>
                            <Button size="sm" className="gap-2 rounded-full"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    addItem(product.id as Id<"products">, product.defaultVariantId, 1);
                                }}
                            >
                                <ShoppingCart className="size-4" />
                                Add to Cart
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Grid View
    return (
        <ProductCard product={product} />
    );
}

// Product Grid/List Container
interface ProductListGridProps {
    products: Product[];
    viewMode?: "grid" | "list";
    onLoadMore?: () => void;
    hasMore?: boolean;
    loading?: boolean;
}

export function ProductListGrid({
    products,
    viewMode = "grid",
    onLoadMore,
    hasMore = false,
    loading = false,
}: ProductListGridProps) {
    return (
        <div className="flex flex-col">
            <div
                className={cn(
                    viewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10"
                        : "flex flex-col gap-4"
                )}
            >
                {products.map((product) => (
                    <ProductListCard
                        key={product.id}
                        product={product}
                        viewMode={viewMode}
                    />
                ))}
            </div>

            {/* Load More */}
            {onLoadMore && hasMore && (
                <div className="flex justify-center mt-12 mb-8">
                    <Button
                        onClick={onLoadMore}
                        disabled={loading}
                        className="px-8 py-3 bg-primary text-white font-bold hover:bg-primary/90 shadow-md transition-transform hover:-translate-y-0.5"
                    >
                        {loading ? "Loading..." : "Load More Products"}
                    </Button>
                </div>
            )}
        </div>
    );
}
