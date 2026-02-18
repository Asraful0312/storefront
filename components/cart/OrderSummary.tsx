"use client";

import { useState } from "react";
import { Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { OrderSummaryData } from "./types";
import { useCurrency } from "@/lib/currency-context";

interface OrderSummaryProps {
    summary: OrderSummaryData;
    onCheckout?: () => void;
}

export function OrderSummary({ summary, onCheckout }: OrderSummaryProps) {
    const { formatDollarPrice } = useCurrency();


    return (
        <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border">
                <h2 className="text-xl font-bold text-foreground">Order Summary</h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
                {/* Cost Breakdown */}
                <div className="space-y-3">
                    <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="font-medium text-foreground">
                            {formatDollarPrice(summary.subtotal)}
                        </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Shipping estimate</span>
                        <span className="font-medium text-foreground">
                            {formatDollarPrice(summary.shipping)}
                        </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Tax estimate</span>
                        <span className="font-medium text-foreground">
                            {formatDollarPrice(summary.tax)}
                        </span>
                    </div>
                    {summary.promoDiscount && summary.promoDiscount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Promo discount</span>
                            <span className="font-medium">-{formatDollarPrice(summary.promoDiscount)}</span>
                        </div>
                    )}
                </div>



                <Separator />

                {/* Total */}
                <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-foreground">Order Total</span>
                    <span className="text-2xl font-black text-foreground">
                        {formatDollarPrice(summary.total)}
                    </span>
                </div>

                {/* Checkout Button */}
                <Button
                    size="lg"
                    className="w-full h-14 bg-primary hover:bg-orange-700 text-white text-lg font-bold shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99] gap-2"
                    onClick={onCheckout}
                >
                    <Lock className="size-5" />
                    Proceed to Checkout
                </Button>

                {/* Security Badge */}
                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                    <ShieldCheck className="size-3.5" />
                    Secure Checkout - SSL Encrypted
                </p>
            </div>
        </div>
    );
}
