"use client";

import { X, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { WishlistItem } from "./wishlist-types";

interface WishlistItemCardProps {
    item: WishlistItem;
    onRemove: (id: string) => void;
    onMoveToCart: (id: string) => void;
}

const stockBadgeConfig = {
    "in-stock": {
        label: "In Stock",
        className: "bg-white/90 dark:bg-background/90 text-green-700 dark:text-green-400",
    },
    "low-stock": {
        label: "Low Stock",
        className: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
    },
    "out-of-stock": {
        label: "Out of Stock",
        className: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
    },
};

export function WishlistItemCard({ item, onRemove, onMoveToCart }: WishlistItemCardProps) {
    const stockConfig = stockBadgeConfig[item.stockStatus];
    const hasDiscount = item.originalPrice && item.originalPrice > item.price;

    return (
        <div className="flex flex-col gap-4 group">
            {/* Image */}
            <div className="relative w-full aspect-4/5 bg-secondary rounded-xl overflow-hidden">
                <div
                    className="w-full h-full bg-center bg-no-repeat bg-cover transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${item.image}')` }}
                />

                {/* Remove Button */}
                <button
                    aria-label="Remove item"
                    onClick={() => onRemove(item.id)}
                    className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white text-foreground rounded-full shadow-sm backdrop-blur-sm transition-all hover:text-red-600 z-10"
                >
                    <X className="size-5" />
                </button>

                {/* Stock Badge */}
                {item.stockStatus !== "out-of-stock" && (
                    <Badge
                        className={cn(
                            "absolute bottom-3 left-3 backdrop-blur-sm text-xs font-bold",
                            item.onSale ? "bg-primary/90 text-white" : stockConfig.className
                        )}
                    >
                        {item.onSale ? "On Sale" : stockConfig.label}
                    </Badge>
                )}

                {item.stockStatus === "out-of-stock" && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Badge className={stockConfig.className}>{stockConfig.label}</Badge>
                    </div>
                )}
            </div>

            {/* Details */}
            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-start">
                    <h3 className="text-foreground text-lg font-bold leading-normal">{item.name}</h3>
                    <div className="flex flex-col items-end">
                        <p
                            className={cn(
                                "text-lg font-bold leading-normal",
                                hasDiscount ? "text-primary" : "text-foreground"
                            )}
                        >
                            ${item.price.toFixed(2)}
                        </p>
                        {hasDiscount && (
                            <p className="text-muted-foreground text-xs line-through">
                                ${item.originalPrice!.toFixed(2)}
                            </p>
                        )}
                    </div>
                </div>
                <p className="text-muted-foreground text-sm">{item.category}</p>

                {/* Move to Cart Button */}
                <Button
                    onClick={() => onMoveToCart(item.id)}
                    disabled={item.stockStatus === "out-of-stock"}
                    className="mt-2 w-full gap-2"
                >
                    <ShoppingCart className="size-4" />
                    Move to Cart
                </Button>
            </div>
        </div>
    );
}
