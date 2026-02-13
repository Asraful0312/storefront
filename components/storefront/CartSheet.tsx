
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingBag, X, Plus, Minus, Trash2, Loader2 } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import Image from "next/image";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
// import { formatPrice } from "@/lib/utils"; // Removed as defined locally or utility doesn't exist yet

export function CartSheet() {
    const { items, count, isLoading, removeItem, updateQuantity } = useCart();
    const [isOpen, setIsOpen] = useState(false);

    const subtotal = items.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

    // Format price helper if not imported
    const format = (price: number) => `$${(price / 100).toFixed(2)}`;

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <ShoppingBag className="size-5" />
                    {count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center">
                            {count}
                        </span>
                    )}
                    <span className="sr-only">Open Cart</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md flex flex-col p-0 bg-background/95 backdrop-blur-md">
                <SheetHeader className="px-6 py-4 border-b border-border">
                    <SheetTitle className="flex items-center gap-2">
                        <ShoppingBag className="size-5" />
                        Summaries ({count})
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 p-6">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="size-8 animate-spin text-primary" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-4 py-8 text-muted-foreground">
                            <ShoppingBag className="size-16 opacity-20" />
                            <p>Your cart is empty.</p>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>
                                Continue Shopping
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {items.map((item) => (
                                <div key={item._id} className="flex gap-4">
                                    <div className="relative size-20 rounded-md overflow-hidden bg-secondary border border-border shrink-0">
                                        {item.product.image && (
                                            <Image
                                                src={item.product.image}
                                                alt={item.product.name}
                                                fill
                                                className="object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="flex flex-col flex-1 gap-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-sm line-clamp-2 pr-2">
                                                    {item.product.name}
                                                </h4>
                                                {item.variant && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.variant.name}
                                                    </p>
                                                )}
                                            </div>
                                            <p className="font-bold text-sm">
                                                {format(item.product.price * item.quantity)}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between mt-auto">
                                            <div className="flex items-center border border-border rounded-md h-8 bg-card">
                                                <button
                                                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                                    className="size-8 flex items-center justify-center hover:text-primary transition-colors disabled:opacity-50"
                                                    disabled={item.quantity <= 1} // Actually allow removing if 1? logic in hook handles <=0
                                                >
                                                    <Minus className="size-3" />
                                                </button>
                                                <span className="w-8 text-center text-xs font-bold">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                    className="size-8 flex items-center justify-center hover:text-primary transition-colors"
                                                >
                                                    <Plus className="size-3" />
                                                </button>
                                            </div>
                                            <button
                                                onClick={() => removeItem(item._id)}
                                                className="text-xs text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1"
                                            >
                                                <Trash2 className="size-3" />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {items.length > 0 && (
                    <div className="border-t border-border p-6 bg-card">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="text-xl font-bold">{format(subtotal)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4 text-center">
                            Shipping and taxes calculated at checkout.
                        </p>
                        <Button className="w-full text-base font-bold h-12" asChild>
                            <Link href="/checkout" onClick={() => setIsOpen(false)}>
                                Checkout
                            </Link>
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
