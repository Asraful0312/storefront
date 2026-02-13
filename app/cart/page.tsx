

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, ShoppingBag } from "lucide-react";
import { Header, Footer } from "@/components/storefront";
import {
    CartItemList,
    OrderSummary,
    type CartItemData,
    type OrderSummaryData,
} from "@/components/cart";
import { useCart } from "@/hooks/useCart";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function CartPage() {
    const { items, updateQuantity, removeItem, isLoading, count } = useCart();

    // Fetch settings
    const shippingSettings = useQuery(api.shippingSettings.get);
    const taxSettings = useQuery(api.tax.get);
    const addresses = useQuery(api.addresses.listAddresses);

    // Local state for promo (mock)
    const [promoCode, setPromoCode] = useState<string | undefined>();
    const [promoDiscount, setPromoDiscount] = useState(0);

    // Map hook items to CartItemData
    const cartItems: CartItemData[] = useMemo(() => {
        return items.map((item) => ({
            id: item._id,
            name: item.product.name,
            price: item.product.price / 100, // Convert cents to dollars
            quantity: item.quantity,
            image: item.product.image || "",
            color: item.variant?.colorId || item.variant?.name?.split(" ")[0], // Fallback parsing or just use variant details
            size: item.variant?.size,
            variant: item.variant?.name,
        }));
    }, [items]);

    // Calculate totals
    const subtotal = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }, [cartItems]);

    // Determine country for calculation (Default address > "US")
    const defaultAddress = addresses?.find(a => a.isDefault) || addresses?.[0];
    const countryCode = defaultAddress?.country || "US";

    // Prepare items for backend calculation
    const shippingItems = useMemo(() => {
        return items.map((item) => {
            const product = item.product as any;
            return {
                weight: product.weight || 0,
                quantity: item.quantity,
                shippingRateOverride: product.shippingRateOverride,
                isFreeShipping: product.isFreeShipping,
                dimensions: product.dimensions,
            };
        });
    }, [items]);

    const taxItems = useMemo(() => {
        return items.map((item) => {
            const product = item.product as any;
            return {
                price: product.price, // cents
                quantity: item.quantity,
                isTaxable: product.isTaxable,
                taxRateOverride: product.taxRateOverride,
            };
        });
    }, [items]);

    // Backend Shipping Calculation
    const shippingCalc = useQuery(api.shippingSettings.calculateRate, {
        countryCode,
        items: shippingItems,
        subtotal: subtotal * 100, // Query expects cents
    });

    // Backend Tax Calculation
    const taxCalc = useQuery(api.tax.calculateTax, {
        countryCode,
        subtotal: subtotal * 100, // Cents
        shipping: shippingCalc?.rate || 0, // Cents
        items: taxItems,
    });

    const shippingCost = (shippingCalc?.rate || 0) / 100; // Convert to Dollars
    const taxCost = (taxCalc?.amount || 0) / 100; // Convert to Dollars

    const total = subtotal + shippingCost + taxCost - promoDiscount;

    const summary: OrderSummaryData = {
        subtotal,
        shipping: shippingCost,
        tax: taxCost,
        total,
        promoCode,
        promoDiscount: promoDiscount > 0 ? promoDiscount : undefined,
    };

    const handleApplyPromo = (code: string) => {
        // Simple promo code logic - in real app this would validate with backend
        if (code.toUpperCase() === "SAVE10") {
            setPromoCode(code);
            setPromoDiscount(subtotal * 0.1);
        } else if (code.toUpperCase() === "SAVE20") {
            setPromoCode(code);
            setPromoDiscount(subtotal * 0.2);
        } else {
            setPromoCode(undefined);
            setPromoDiscount(0);
        }
    };

    const handleCheckout = () => {
        window.location.href = "/checkout";
    };

    if (isLoading) {
        return (
            <>
                <Header />
                <main className="grow w-full flex items-center justify-center min-h-[50vh]">
                    <Loader2 className="size-8 animate-spin text-primary" />
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />

            <main className="grow px-4 md:px-6 py-10 w-full flex justify-center">
                <div className="w-full max-w-[1280px]">
                    {/* Page Heading */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mb-2">
                                Shopping Cart
                            </h1>
                            <p className="text-muted-foreground">
                                You have {count} {count === 1 ? "item" : "items"} in
                                your cart
                            </p>
                        </div>
                        <Link
                            href="/shop"
                            className="text-primary font-medium hover:underline flex items-center gap-1 group"
                        >
                            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
                            Continue Shopping
                        </Link>
                    </div>

                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-6 py-20 text-center border rounded-xl bg-card">
                            <div className="size-20 bg-secondary rounded-full flex items-center justify-center">
                                <ShoppingBag className="size-10 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold">Your cart is empty</h2>
                                <p className="text-muted-foreground max-w-sm">
                                    Looks like you haven't added anything to your cart yet.
                                    Browse our products to find something you love.
                                </p>
                            </div>
                            <Link
                                href="/shop"
                                className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                Start Shopping
                            </Link>
                        </div>
                    ) : (
                        /* Main Content Grid */
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
                            {/* Left Column: Cart Items */}
                            <div className="lg:col-span-8">
                                <CartItemList
                                    items={cartItems}
                                    onQuantityChange={updateQuantity}
                                    onRemove={removeItem}
                                />
                            </div>

                            {/* Right Column: Order Summary */}
                            <div className="lg:col-span-4 lg:sticky lg:top-24">
                                <OrderSummary
                                    summary={summary}
                                    onApplyPromo={handleApplyPromo}
                                    onCheckout={handleCheckout}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}
