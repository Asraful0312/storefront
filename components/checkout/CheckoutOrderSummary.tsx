"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { CheckoutItem } from "./types";

interface CheckoutOrderSummaryProps {
    items: CheckoutItem[];
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    discountAmount?: number;
    couponCode?: string;
    couponError?: string;
    isValidating?: boolean;
    onApplyDiscount?: (code: string) => void;
    onPlaceOrder: () => void;
    loading?: boolean;
    hideButton?: boolean;
}

export function CheckoutOrderSummary({
    items,
    subtotal,
    shipping,
    tax,
    total,
    discountAmount = 0,
    couponCode,
    couponError,
    isValidating,
    onApplyDiscount,
    onPlaceOrder,
    loading,
    hideButton,
}: CheckoutOrderSummaryProps) {
    const [discountInput, setDiscountInput] = useState("");

    const handleApplyDiscount = () => {
        if (discountInput.trim() && onApplyDiscount) {
            onApplyDiscount(discountInput.trim());
        }
    };

    return (
        <div className="lg:sticky lg:top-24 flex flex-col gap-6">
            <div className="rounded-xl border border-border bg-card shadow-sm p-6">
                <h2 className="text-lg font-bold mb-6">Order Summary</h2>

                {/* Items */}
                <div className="flex flex-col gap-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                    {items.map((item) => (
                        <div key={item.id} className="flex gap-4 items-start">
                            <div className="size-16 rounded-lg bg-secondary shrink-0 overflow-hidden relative">
                                <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                                <span className="absolute -top-1 -right-1 bg-muted-foreground text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center">
                                    {item.quantity}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-foreground truncate">
                                    {item.name}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1">{item.variant}</p>
                            </div>
                            <span className="text-sm font-medium">
                                ${(item.price * item.quantity).toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Discount Code */}
                <div className="flex flex-col gap-2 mb-6">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Discount code"
                            value={discountInput}
                            onChange={(e) => setDiscountInput(e.target.value)}
                            className="flex-1 h-10 text-sm"
                            disabled={isValidating}
                            onKeyDown={(e) => e.key === "Enter" && handleApplyDiscount()}
                        />
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={handleApplyDiscount}
                            disabled={isValidating || !discountInput.trim()}
                        >
                            {isValidating ? "..." : "Apply"}
                        </Button>
                    </div>
                    {couponError && (
                        <p className="text-xs text-destructive font-medium">{couponError}</p>
                    )}
                    {couponCode && !couponError && (
                        <div className="flex items-center justify-between bg-green-500/10 text-green-600 px-3 py-2 rounded text-xs font-medium border border-green-500/20">
                            <span>Coupon applied: {couponCode}</span>
                        </div>
                    )}
                </div>

                {/* Calculations */}
                <div className="flex flex-col gap-3 pt-6 border-t border-dashed border-border">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Shipping</span>
                        <span className={shipping === 0 ? "text-green-600 font-medium" : "font-medium text-foreground"}>
                            {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Tax (estimated)</span>
                        <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
                    </div>

                    {discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600 font-medium">
                            <span>Discount</span>
                            <span>-${discountAmount.toFixed(2)}</span>
                        </div>
                    )}

                    <Separator className="my-2" />

                    <div className="flex justify-between items-center">
                        <span className="text-base font-bold">Total</span>
                        <div className="flex items-end gap-2">
                            <span className="text-xs text-muted-foreground mb-1">USD</span>
                            <span className="text-xl font-black tracking-tight text-primary">
                                ${(total < 0 ? 0 : total).toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Place Order Button */}
                {!loading && !hideButton && (
                    <Button
                        size="lg"
                        className="w-full mt-6 h-14 bg-primary hover:bg-orange-700 text-white font-bold shadow-lg gap-2 group"
                        onClick={onPlaceOrder}
                        disabled={loading}
                    >
                        Place Order
                        <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                )}

                {loading && !hideButton && (
                    <Button
                        size="lg"
                        className="w-full mt-6 h-14 bg-primary hover:bg-orange-700 text-white font-bold shadow-lg gap-2 group"
                        onClick={onPlaceOrder}
                        disabled={loading}
                    >
                        Processing...
                    </Button>
                )}

                {/* Trust Badges */}
                <div className="mt-4 flex justify-center gap-4 opacity-50">
                    <div className="h-6 w-10 bg-muted rounded" />
                    <div className="h-6 w-10 bg-muted rounded" />
                    <div className="h-6 w-10 bg-muted rounded" />
                </div>
            </div>

            {/* Help */}
            <div className="text-center">
                <p className="text-sm text-muted-foreground">
                    Need help?{" "}
                    <a href="#" className="text-primary underline underline-offset-2">
                        Contact Support
                    </a>
                </p>
            </div>
        </div>
    );
}
