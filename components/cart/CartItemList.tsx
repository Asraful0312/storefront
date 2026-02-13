"use client";

import type { CartItemData } from "./types";
import { CartItem } from "./CartItem";

interface CartItemListProps {
    items: CartItemData[];
    onQuantityChange: (id: string, quantity: number) => void;
    onRemove: (id: string) => void;
}

export function CartItemList({ items, onQuantityChange, onRemove }: CartItemListProps) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-xl font-bold text-foreground mb-2">Your cart is empty</h3>
                <p className="text-muted-foreground">
                    Looks like you haven't added anything to your cart yet.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Table Header (Desktop only) */}
            <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-border text-sm font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-6">Product</div>
                <div className="col-span-3 text-center">Quantity</div>
                <div className="col-span-3 text-right">Price</div>
            </div>

            {/* Cart Items */}
            {items.map((item) => (
                <CartItem
                    key={item.id}
                    item={item}
                    onQuantityChange={onQuantityChange}
                    onRemove={onRemove}
                />
            ))}
        </div>
    );
}
