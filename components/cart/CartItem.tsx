"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CartItemData } from "./types";
import { useCurrency } from "@/lib/currency-context";

interface CartItemProps {
    item: CartItemData;
    onQuantityChange: (id: string, quantity: number) => void;
    onRemove: (id: string) => void;
}

export function CartItem({ item, onQuantityChange, onRemove }: CartItemProps) {
    const { formatDollarPrice } = useCurrency();
    const handleDecrease = () => {
        if (item.quantity > 1) {
            onQuantityChange(item.id, item.quantity - 1);
        }
    };

    const handleIncrease = () => {
        onQuantityChange(item.id, item.quantity + 1);
    };

    const lineTotal = item.price * item.quantity;

    return (
        <div className="group flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-6 items-center bg-card p-4 rounded-xl shadow-sm border border-transparent hover:border-border transition-all">
            {/* Product Info */}
            <div className="col-span-6 flex items-center gap-4 md:gap-6 w-full">
                {/* Image */}
                <div className="shrink-0 relative overflow-hidden rounded-lg w-20 h-20 md:w-24 md:h-24 bg-secondary">
                    <div
                        className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                        style={{ backgroundImage: `url('${item.image}')` }}
                    />
                </div>

                {/* Details */}
                <div className="flex flex-col gap-1 min-w-0">
                    <h3 className="font-bold text-base md:text-lg text-foreground truncate">
                        {item.name}
                    </h3>
                    {item.color && (
                        <p className="text-sm text-muted-foreground">Color: {item.color}</p>
                    )}
                    {item.size && (
                        <p className="text-sm text-muted-foreground">Size: {item.size}</p>
                    )}
                    {item.variant && (
                        <p className="text-sm text-muted-foreground">{item.variant}</p>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-1 text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 flex items-center gap-1 w-fit h-auto p-1"
                        onClick={() => onRemove(item.id)}
                    >
                        <Trash2 className="size-3.5" />
                        Remove
                    </Button>
                </div>
            </div>

            {/* Quantity */}
            <div className="col-span-3 flex justify-center w-full md:w-auto">
                <div className="flex items-center border border-border rounded-lg overflow-hidden h-10">
                    <button
                        className="w-10 h-full flex items-center justify-center hover:bg-secondary text-muted-foreground transition-colors"
                        onClick={handleDecrease}
                        disabled={item.quantity <= 1}
                    >
                        <Minus className="size-4" />
                    </button>
                    <input
                        type="text"
                        readOnly
                        value={item.quantity}
                        className="w-12 h-full text-center border-none bg-transparent focus:ring-0 text-foreground font-medium"
                    />
                    <button
                        className="w-10 h-full flex items-center justify-center hover:bg-secondary text-muted-foreground transition-colors"
                        onClick={handleIncrease}
                    >
                        <Plus className="size-4" />
                    </button>
                </div>
            </div>

            {/* Price */}
            <div className="col-span-3 text-right w-full md:w-auto flex justify-between md:block">
                <span className="md:hidden text-muted-foreground">Price:</span>
                <div className="flex flex-col md:items-end">
                    <span className="font-bold text-lg text-foreground">
                        {formatDollarPrice(lineTotal)}
                    </span>
                    {item.quantity > 1 && (
                        <span className="text-xs text-muted-foreground">
                            {formatDollarPrice(item.price)} each
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
