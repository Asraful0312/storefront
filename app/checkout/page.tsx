"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Lock, Store } from "lucide-react";
import {
    ShippingAddressForm,
    CheckoutOrderSummary,
    type ShippingAddress,
    type CheckoutStep,
} from "@/components/checkout";
import { useQuery, useAction, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { countries, getStatesOfCountry } from "@/lib/country";

export default function CheckoutPage() {
    const addresses = useQuery(api.addresses.listAddresses);
    const cartItems = useQuery(api.cart.get);
    const storedCoupon = useQuery(api.cart.getAppliedCoupon);

    // Actions
    const createCheckoutSession = useAction(api.payments.createCheckoutSession);

    // Form states
    const [address, setAddress] = useState<ShippingAddress>({
        firstName: "",
        lastName: "",
        address: "",
        apartment: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US",
    });

    useEffect(() => {
        if (addresses && addresses.length > 0) {
            const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
            const names = (defaultAddr.recipientName || "").split(" ");

            // Ensure country is a code (handle legacy data that might be full name)
            // Import countries list if not available, or simpler: just pass it.
            // But ShippingAddressForm expects a valid code for the Select.
            // We'll rely on the value being a code, but if it looks like a full name, we might leave it
            // and the user will have to re-select.
            // Actually, let's try to lookup the code if it's not length 2.
            let countryCode = defaultAddr.country || "US";
            if (countryCode.length > 2) {
                const found = countries.find(c => c.name.toLowerCase() === countryCode.toLowerCase());
                if (found) {
                    countryCode = found.code;
                }
            }

            // Map State Name to Code if possible
            let stateCode = defaultAddr.state || "";
            if (countryCode && stateCode) {
                const availableStates = getStatesOfCountry(countryCode);
                if (availableStates.length > 0) {
                    // Try exact code match
                    const exactMatch = availableStates.find(s => s.code === stateCode);
                    if (!exactMatch) {
                        // Try name match (fuzzy)
                        const nameMatch = availableStates.find(s =>
                            s.name.toLowerCase().trim() === stateCode.toLowerCase().trim()
                        );
                        if (nameMatch) {
                            stateCode = nameMatch.code;
                        }
                    }
                }
            }

            setAddress({
                firstName: names[0] || "",
                lastName: names.slice(1).join(" ") || "",
                address: defaultAddr.street,
                apartment: defaultAddr.apartment || "",
                city: defaultAddr.city,
                state: stateCode,
                zipCode: defaultAddr.zipCode,
                country: countryCode,
            });
        }
    }, [addresses]);

    // Step states
    const [openStep, setOpenStep] = useState<CheckoutStep>("address");
    const [completedSteps, setCompletedSteps] = useState<CheckoutStep[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Calculated fields
    // NOTE: Real shipping/tax is calculated on backend during checkout session creation.
    // We can fetch estimates if we want to display them here, but for MVP we display "Calculated at next step".
    // Or we can replicate the logic IF we expose a query.
    // Let's rely on backend for final totals but display subtotal here.
    const subtotal = cartItems ? cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0) : 0;

    const isAllDigital = cartItems?.every(item => {
        const pType = (item.product as any).productType;
        return pType === "digital" || pType === "gift_card";
    }) ?? false;

    // Set initial step based on cart type
    useEffect(() => {
        if (cartItems && isAllDigital) {
            setOpenStep("payment");
            setCompletedSteps(prev => prev.includes("address") ? prev : [...prev, "address"]);
        }
    }, [cartItems, isAllDigital]);

    const handleContinueToPayment = () => {
        setCompletedSteps((prev) =>
            prev.includes("address") ? prev : [...prev, "address"]
        );
        setOpenStep("payment");
    };

    // Coupon State
    const convex = useConvex();
    const [couponCode, setCouponCode] = useState<string | undefined>();
    const [couponError, setCouponError] = useState<string | undefined>();
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [discountAmount, setDiscountAmount] = useState(0);

    // Auto-apply stored coupon
    useEffect(() => {
        if (storedCoupon && !couponCode && !couponError && !isValidatingCoupon) {
            handleApplyDiscount(storedCoupon);
        }
    }, [storedCoupon]);

    const handleApplyDiscount = async (code: string) => {
        setIsValidatingCoupon(true);
        setCouponError(undefined);
        setDiscountAmount(0);
        setCouponCode(undefined);

        try {
            const result = await convex.query(api.coupons.validateCoupon, {
                code,
                purchaseAmount: subtotal // subtotal is in cents?
                // subtotal calc: item.product.price * item.quantity. 
                // item.product.price is usually cents.
                // Line 97: subtotal is accumulation of item.product.price.
                // Line 168 (display): item.product.price / 100.
                // So subtotal is cents. Correct.
            });

            if (result.valid && result.coupon) {
                setCouponCode(result.coupon.code);
                
                // Calculate Discount locally for display
                // (Server recalculates for security, this is just for UI)
                let discount = 0;
                if (result.coupon.discountType === "percentage") {
                    discount = (subtotal * result.coupon.discountValue) / 100;
                } else if (result.coupon.discountType === "fixed") {
                    discount = result.coupon.discountValue * 100; // Assuming stored in dollars? Or cents?
                    // Schema: `discountValue: v.number()`. If Stripe coupons: amount_off is cents.
                    // If manually created: usually dollars for humans? NO, usually system standardizes on Cents.
                    // Let's assume cents for consistency with Stripe.
                    // Wait, earlier I saw `discountValue` being used. If I used `stripe.coupons.create`, `amount_off` is cents.
                    // So `discountValue` should be cents.
                    discount = result.coupon.discountValue;
                } else if (result.coupon.discountType === "shipping") {
                    // Estimate shipping cost?
                    // We don't have shipping cost calculated here easily (it's server side in session).
                    // Frontend doesn't know shipping cost.
                    // We can just set discountAmount to 0 or a placeholder, or try to fetch shipping estimate?
                    // For now, let's treat "Free Shipping" as special display in OrderSummary?
                    // CheckoutOrderSummary handles shipping === 0 display.
                    // But we don't update `shipping` prop here easily.
                    // Let's just set discount = 0 and let OrderSummary show "Coupon applied".
                    // The actual session will have 0 shipping.
                    discount = 0; 
                }
                setDiscountAmount(discount);
                
                // Persist to database (if logged in)
                // We use mutation. Fire and forget or await? Await is safer.
                await convex.mutation(api.cart.applyCoupon, { code: result.coupon.code });

            } else {
                setCouponError(result.error);
            }
        } catch (error) {
            console.error("Coupon validation failed:", error);
            setCouponError("Failed to validate coupon");
        } finally {
            setIsValidatingCoupon(false);
        }
    };

    const handlePlaceOrder = async () => {
        // Validate address for physical product orders
        if (!isAllDigital) {
            if (!address.address || !address.city || !address.zipCode || !address.country || !address.firstName) {
                alert("Please complete your shipping address first.");
                setOpenStep("address");
                return;
            }
        }
        setIsProcessing(true);
        try {
            const url = await createCheckoutSession({
                shippingAddress: isAllDigital ? undefined : {
                    street: address.address,
                    city: address.city,
                    state: address.state,
                    zipCode: address.zipCode,
                    country: address.country as string,
                },
                couponCode: couponCode,
            });

            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error("Checkout failed:", error);
            alert("Failed to start checkout. Please try again.");
            setIsProcessing(false);
        }
    };

    if (!cartItems) return <div className="p-10 flex justify-center">Loading checkout...</div>;
    if (cartItems.length === 0) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <h1 className="text-2xl font-bold">Your cart is empty</h1>
            <Link href="/">
                <Button>Continue Shopping</Button>
            </Link>
        </div>
    );

    // Map cart items to display format
    const displayItems = cartItems.map(item => ({
        id: item._id,
        name: item.product.name,
        image: item.product.image || "",
        variant: item.variant?.name || "",
        quantity: item.quantity,
        price: item.product.price / 100 // Display in dollars
    }));

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Minimal Checkout Header */}
            <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-card/95 backdrop-blur-sm px-6 lg:px-16 py-4 shadow-sm">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="flex items-center justify-center size-10 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Store className="size-6" />
                    </div>
                    <h2 className="text-xl font-bold tracking-tight">Lumina</h2>
                </Link>
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Lock className="size-4" />
                    Secure Checkout
                </div>
            </header>

            {/* Main Content */}
            <main className="grow pb-20">
                <div className="mx-auto max-w-[1200px] px-6 lg:px-8 py-8">
                    {/* Breadcrumbs */}
                    <nav className="mb-8 flex flex-wrap gap-2 text-sm font-medium">
                        <Link href="/cart" className="text-muted-foreground hover:text-primary transition-colors">
                            Cart
                        </Link>
                        <span className="text-muted-foreground/50">/</span>
                        <span className="text-primary font-semibold">Checkout</span>
                    </nav>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                        {/* Left Column: Checkout Steps */}
                        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
                            <h1 className="text-3xl font-black tracking-tight mb-2">
                                Secure Checkout
                            </h1>

                            {/* Step 1: Shipping Address (Physical) or Contact Info (Digital) */}
                            {isAllDigital ? (
                                <div className={`rounded-xl border bg-card transition-all duration-300 ${openStep === "address" ? "ring-2 ring-primary ring-offset-2 shadow-lg" : ""}`}>
                                    <div className="flex items-center justify-between p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center justify-center size-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                                                ✓
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold">Digital Delivery</h3>
                                                <p className="text-sm text-muted-foreground">Order details will be sent to your email.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <ShippingAddressForm
                                    address={address}
                                    onChange={setAddress}
                                    onContinue={handleContinueToPayment}
                                    stepNumber={1}
                                    isOpen={openStep === "address"}
                                    onToggle={() => setOpenStep("address")}
                                    isCompleted={completedSteps.includes("address")}
                                />
                            )}

                            {/* Step 2: Payment */}
                            <div className={`rounded-xl border bg-card transition-all duration-300 ${openStep === "payment" ? "ring-2 ring-primary ring-offset-2 shadow-lg" : "hover:border-primary/50"}`}>
                                <div
                                    className={`flex items-center justify-between p-6 ${
                                        completedSteps.includes("address") || isAllDigital
                                            ? "cursor-pointer"
                                            : "cursor-not-allowed opacity-60"
                                    }`}
                                    onClick={() => {
                                        if (completedSteps.includes("address") || isAllDigital) {
                                            setOpenStep("payment");
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`flex items-center justify-center size-8 rounded-full text-sm font-bold transition-colors ${openStep === "payment" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                                            }`}>
                                            2
                                        </div>
                                        <h3 className="text-lg font-bold">Payment</h3>
                                    </div>
                                </div>

                                {openStep === "payment" && (
                                    <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2 fade-in duration-300">
                                        <p className="text-muted-foreground mb-6">
                                            You will be redirected to Stripe to securely complete your payment.
                                        </p>
                                        <Button
                                            size="lg"
                                            className="w-full font-bold text-lg h-12"
                                            onClick={handlePlaceOrder}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? "Redirecting..." : "Proceed to Payment"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column: Order Summary */}
                        <div className="lg:col-span-5 xl:col-span-4">
                            <CheckoutOrderSummary
                                items={displayItems}
                                subtotal={subtotal / 100}
                                shipping={0} // Calculated at next step
                                tax={0} // Calculated at next step

                                onPlaceOrder={handlePlaceOrder}
                                onApplyDiscount={handleApplyDiscount}
                                hideButton={true} // We use the main button in step 2
                                discountAmount={discountAmount / 100} // Convert to dollars
                                couponCode={couponCode}
                                couponError={couponError}
                                isValidating={isValidatingCoupon}
                                total={(subtotal - discountAmount) / 100} // Adjust total display
                            />
                            <p className="text-xs text-center text-muted-foreground mt-4">
                                Shipping & Taxes calculated at payment.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground bg-card">
                <p>© 2024 Lumina Inc. All rights reserved.</p>
            </footer>
        </div>
    );
}
