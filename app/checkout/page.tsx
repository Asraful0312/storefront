"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Store, CreditCard, Banknote, Building2, Copy, Check, MapPin, Plus } from "lucide-react";
import {
    ShippingAddressForm,
    CheckoutOrderSummary,
    type ShippingAddress,
    type CheckoutStep,
} from "@/components/checkout";
import { useQuery, useAction, useMutation, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { countries, getStatesOfCountry } from "@/lib/country";

type PaymentMethodType = "stripe" | "cod" | "bank_transfer";

export default function CheckoutPage() {
    const router = useRouter();
    const addresses = useQuery(api.addresses.listAddresses);
    const cartItems = useQuery(api.cart.get);
    const storedCoupon = useQuery(api.cart.getAppliedCoupon);
    const paymentSettings = useQuery(api.paymentSettings.get);
    const addAddress = useMutation(api.addresses.addAddress);

    // Actions
    const createCheckoutSession = useAction(api.payments.createCheckoutSession);
    const placeOfflineOrder = useAction(api.payments.placeOfflineOrder);

    // Address selector state
    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [useNewAddress, setUseNewAddress] = useState(false);

    // Form states for new address
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

    // When addresses load, select the default one
    useEffect(() => {
        if (addresses && addresses.length > 0 && !selectedAddressId && !useNewAddress) {
            const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
            setSelectedAddressId(defaultAddr._id);
            populateFromSavedAddress(defaultAddr);
        } else if (addresses && addresses.length === 0) {
            setUseNewAddress(true);
        }
    }, [addresses]);

    const populateFromSavedAddress = (addr: any) => {
        const names = (addr.recipientName || "").split(" ");
        let countryCode = addr.country || "US";
        if (countryCode.length > 2) {
            const found = countries.find(c => c.name.toLowerCase() === countryCode.toLowerCase());
            if (found) countryCode = found.code;
        }

        let stateCode = addr.state || "";
        if (countryCode && stateCode) {
            const availableStates = getStatesOfCountry(countryCode);
            if (availableStates.length > 0) {
                const exactMatch = availableStates.find(s => s.code === stateCode);
                if (!exactMatch) {
                    const nameMatch = availableStates.find(s =>
                        s.name.toLowerCase().trim() === stateCode.toLowerCase().trim()
                    );
                    if (nameMatch) stateCode = nameMatch.code;
                }
            }
        }

        setAddress({
            firstName: names[0] || "",
            lastName: names.slice(1).join(" ") || "",
            address: addr.street,
            apartment: addr.apartment || "",
            city: addr.city,
            state: stateCode,
            zipCode: addr.zipCode,
            country: countryCode,
        });
    };

    const handleSelectAddress = (addrId: string) => {
        setSelectedAddressId(addrId);
        setUseNewAddress(false);
        const addr = addresses?.find(a => a._id === addrId);
        if (addr) populateFromSavedAddress(addr);
    };

    const handleUseNewAddress = () => {
        setSelectedAddressId(null);
        setUseNewAddress(true);
        setAddress({
            firstName: "",
            lastName: "",
            address: "",
            apartment: "",
            city: "",
            state: "",
            zipCode: "",
            country: "US",
        });
    };

    // Step states
    const [openStep, setOpenStep] = useState<CheckoutStep>("address");
    const [completedSteps, setCompletedSteps] = useState<CheckoutStep[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Payment method selection
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>("stripe");
    const [copiedField, setCopiedField] = useState<string | null>(null);

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

    // Default to first available method
    useEffect(() => {
        if (paymentSettings) {
            if (paymentSettings.stripeEnabled) {
                setSelectedPaymentMethod("stripe");
            } else if (paymentSettings.bankTransferEnabled) {
                setSelectedPaymentMethod("bank_transfer");
            } else if (paymentSettings.codEnabled && !isAllDigital) {
                setSelectedPaymentMethod("cod");
            }
        }
    }, [paymentSettings, isAllDigital]);

    const handleContinueToPayment = async () => {
        // If using new address, save it
        if (useNewAddress && address.address && address.city && address.zipCode) {
            try {
                await addAddress({
                    label: "Shipping Address",
                    type: "home",
                    recipientName: `${address.firstName} ${address.lastName}`.trim(),
                    street: address.address,
                    apartment: address.apartment || undefined,
                    city: address.city,
                    state: address.state,
                    zipCode: address.zipCode,
                    country: address.country || "US",
                    isDefault: !addresses || addresses.length === 0,
                });
            } catch (err) {
                console.error("Failed to save address:", err);
                // Continue anyway — we have the address data
            }
        }

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
                purchaseAmount: subtotal,
            });

            if (result.valid && result.coupon) {
                setCouponCode(result.coupon.code);

                let discount = 0;
                if (result.coupon.discountType === "percentage") {
                    discount = (subtotal * result.coupon.discountValue) / 100;
                } else if (result.coupon.discountType === "fixed") {
                    discount = result.coupon.discountValue;
                } else if (result.coupon.discountType === "shipping") {
                    discount = 0;
                }
                setDiscountAmount(discount);

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

    const handleCopyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
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
            if (selectedPaymentMethod === "stripe") {
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
            } else {
                const orderId = await placeOfflineOrder({
                    paymentMethod: selectedPaymentMethod,
                    shippingAddress: isAllDigital ? undefined : {
                        street: address.address,
                        city: address.city,
                        state: address.state,
                        zipCode: address.zipCode,
                        country: address.country as string,
                    },
                    couponCode: couponCode,
                });

                if (orderId) {
                    router.push(`/checkout/success?order_id=${orderId}&method=${selectedPaymentMethod}`);
                }
            }
        } catch (error: any) {
            console.error("Checkout failed:", error);
            alert(error.message || "Failed to start checkout. Please try again.");
            setIsProcessing(false);
        }
    };

    if (!cartItems || paymentSettings === undefined) return <div className="p-10 flex justify-center">Loading checkout...</div>;
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
        price: item.product.price / 100
    }));

    // Available methods — COD hidden for carts that contain ANY digital products
    const hasDigitalItems = cartItems.some(item => {
        const pType = (item.product as any).productType;
        return pType === "digital" || pType === "gift_card";
    });

    const availableMethods: { id: PaymentMethodType; label: string; icon: React.ReactNode; description: string }[] = [];
    if (paymentSettings.stripeEnabled) {
        availableMethods.push({
            id: "stripe",
            label: "Credit / Debit Card",
            icon: <CreditCard className="size-5" />,
            description: "Pay securely via Stripe. Cards, Apple Pay, Google Pay.",
        });
    }
    if (paymentSettings.bankTransferEnabled) {
        availableMethods.push({
            id: "bank_transfer",
            label: "Bank Transfer",
            icon: <Building2 className="size-5" />,
            description: "Transfer funds directly to our bank account.",
        });
    }
    if (paymentSettings.codEnabled && !hasDigitalItems) {
        availableMethods.push({
            id: "cod",
            label: "Cash on Delivery",
            icon: <Banknote className="size-5" />,
            description: "Pay in cash when your order is delivered.",
        });
    }

    // Button text
    const getButtonText = () => {
        if (isProcessing) {
            return selectedPaymentMethod === "stripe" ? "Redirecting..." : "Placing Order...";
        }
        if (selectedPaymentMethod === "stripe") return "Proceed to Payment";
        if (selectedPaymentMethod === "cod") return "Place Order (Pay on Delivery)";
        return "Place Order (Bank Transfer)";
    };

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

                            {/* Step 1: Shipping Address */}
                            {isAllDigital ? (
                                <div className="rounded-xl border bg-card transition-all duration-300">
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
                                <div className={`rounded-xl border bg-card transition-all duration-300 ${openStep === "address" ? "ring-2 ring-primary ring-offset-2 shadow-lg" : "hover:border-primary/50"}`}>
                                    <div
                                        className="flex items-center justify-between p-6 cursor-pointer"
                                        onClick={() => setOpenStep("address")}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`flex items-center justify-center size-8 rounded-full text-sm font-bold transition-colors ${
                                                completedSteps.includes("address") ? "bg-primary text-primary-foreground" : openStep === "address" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                                            }`}>
                                                {completedSteps.includes("address") ? "✓" : "1"}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold">Shipping Address</h3>
                                                {completedSteps.includes("address") && !useNewAddress && selectedAddressId && addresses && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {(() => {
                                                            const a = addresses.find(x => x._id === selectedAddressId);
                                                            return a ? `${a.recipientName} — ${a.street}, ${a.city}` : "";
                                                        })()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {openStep === "address" && (
                                        <div className="px-6 pb-6 pt-2 border-t border-border animate-in slide-in-from-top-2 fade-in duration-300">
                                            {/* Saved Address Selector */}
                                            {addresses && addresses.length > 0 && (
                                                <div className="mb-6">
                                                    <p className="text-sm font-medium text-muted-foreground mb-3">Select a saved address</p>
                                                    <div className="space-y-2">
                                                        {addresses
                                                            .filter(a => a.label !== "Order Address")
                                                            .map((addr) => (
                                                            <label
                                                                key={addr._id}
                                                                className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                                                    selectedAddressId === addr._id && !useNewAddress
                                                                        ? "border-primary bg-primary/5"
                                                                        : "border-border hover:border-primary/30"
                                                                }`}
                                                                onClick={() => handleSelectAddress(addr._id)}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name="saved_address"
                                                                    className="sr-only"
                                                                    checked={selectedAddressId === addr._id && !useNewAddress}
                                                                    readOnly
                                                                />
                                                                <div className={`flex items-center justify-center size-10 rounded-lg shrink-0 ${
                                                                    selectedAddressId === addr._id && !useNewAddress
                                                                        ? "bg-primary text-primary-foreground"
                                                                        : "bg-secondary text-muted-foreground"
                                                                }`}>
                                                                    <MapPin className="size-5" />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-sm font-bold text-foreground">{addr.recipientName}</p>
                                                                        {addr.isDefault && (
                                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                                                Default
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                                        {addr.street}
                                                                        {addr.apartment ? `, ${addr.apartment}` : ""}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {addr.city}, {addr.state} {addr.zipCode} — {addr.country}
                                                                    </p>
                                                                </div>
                                                                <div className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                                                                    selectedAddressId === addr._id && !useNewAddress
                                                                        ? "border-primary"
                                                                        : "border-muted-foreground/30"
                                                                }`}>
                                                                    {selectedAddressId === addr._id && !useNewAddress && (
                                                                        <div className="size-2.5 rounded-full bg-primary" />
                                                                    )}
                                                                </div>
                                                            </label>
                                                        ))}

                                                        {/* Use a new address option */}
                                                        <label
                                                            className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                                                useNewAddress
                                                                    ? "border-primary bg-primary/5"
                                                                    : "border-border hover:border-primary/30"
                                                            }`}
                                                            onClick={handleUseNewAddress}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name="saved_address"
                                                                className="sr-only"
                                                                checked={useNewAddress}
                                                                readOnly
                                                            />
                                                            <div className={`flex items-center justify-center size-10 rounded-lg shrink-0 ${
                                                                useNewAddress
                                                                    ? "bg-primary text-primary-foreground"
                                                                    : "bg-secondary text-muted-foreground"
                                                            }`}>
                                                                <Plus className="size-5" />
                                                            </div>
                                                            <p className="text-sm font-bold text-foreground">Use a new address</p>
                                                            <div className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-auto ${
                                                                useNewAddress
                                                                    ? "border-primary"
                                                                    : "border-muted-foreground/30"
                                                            }`}>
                                                                {useNewAddress && (
                                                                    <div className="size-2.5 rounded-full bg-primary" />
                                                                )}
                                                            </div>
                                                        </label>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Show form when new address is selected OR when no saved addresses */}
                                            {(useNewAddress || !addresses || addresses.length === 0) && (
                                                <ShippingAddressForm
                                                    address={address}
                                                    onChange={setAddress}
                                                    onContinue={handleContinueToPayment}
                                                    stepNumber={1}
                                                    isOpen={true}
                                                    onToggle={() => {}}
                                                    isCompleted={false}
                                                />
                                            )}

                                            {/* Continue button for saved address selection */}
                                            {!useNewAddress && selectedAddressId && addresses && addresses.length > 0 && (
                                                <div className="mt-4 flex justify-end">
                                                    <Button onClick={handleContinueToPayment} className="px-8">
                                                        Continue to Payment
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
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
                                        {/* Payment method selection */}
                                        {availableMethods.length > 1 && (
                                            <div className="space-y-3 mb-6">
                                                <p className="text-sm font-medium text-muted-foreground">Choose payment method</p>
                                                {availableMethods.map((method) => (
                                                    <label
                                                        key={method.id}
                                                        className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                                            selectedPaymentMethod === method.id
                                                                ? "border-primary bg-primary/5"
                                                                : "border-border hover:border-primary/30"
                                                        }`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="payment_method"
                                                            className="sr-only"
                                                            checked={selectedPaymentMethod === method.id}
                                                            onChange={() => setSelectedPaymentMethod(method.id)}
                                                        />
                                                        <div className={`flex items-center justify-center size-10 rounded-lg shrink-0 ${
                                                            selectedPaymentMethod === method.id
                                                                ? "bg-primary text-primary-foreground"
                                                                : "bg-secondary text-muted-foreground"
                                                        }`}>
                                                            {method.icon}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-foreground">{method.label}</p>
                                                            <p className="text-xs text-muted-foreground">{method.description}</p>
                                                        </div>
                                                        <div className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                                            selectedPaymentMethod === method.id
                                                                ? "border-primary"
                                                                : "border-muted-foreground/30"
                                                        }`}>
                                                            {selectedPaymentMethod === method.id && (
                                                                <div className="size-2.5 rounded-full bg-primary" />
                                                            )}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {/* Method-specific content */}
                                        {selectedPaymentMethod === "stripe" && (
                                            <p className="text-muted-foreground mb-6 text-sm">
                                                You will be redirected to Stripe to securely complete your payment.
                                            </p>
                                        )}

                                        {selectedPaymentMethod === "bank_transfer" && paymentSettings && (
                                            <div className="mb-6 rounded-lg border border-border bg-secondary/30 p-5 space-y-4">
                                                <p className="text-sm font-bold text-foreground">Transfer to the following bank account:</p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {paymentSettings.bankName && (
                                                        <BankDetailRow label="Bank Name" value={paymentSettings.bankName} onCopy={handleCopyToClipboard} copiedField={copiedField} />
                                                    )}
                                                    {paymentSettings.accountHolder && (
                                                        <BankDetailRow label="Account Holder" value={paymentSettings.accountHolder} onCopy={handleCopyToClipboard} copiedField={copiedField} />
                                                    )}
                                                    {paymentSettings.accountNumber && (
                                                        <BankDetailRow label="Account / IBAN" value={paymentSettings.accountNumber} onCopy={handleCopyToClipboard} copiedField={copiedField} />
                                                    )}
                                                    {paymentSettings.routingNumber && (
                                                        <BankDetailRow label="Routing Number" value={paymentSettings.routingNumber} onCopy={handleCopyToClipboard} copiedField={copiedField} />
                                                    )}
                                                    {paymentSettings.swiftCode && (
                                                        <BankDetailRow label="SWIFT / BIC" value={paymentSettings.swiftCode} onCopy={handleCopyToClipboard} copiedField={copiedField} />
                                                    )}
                                                </div>
                                                {paymentSettings.bankInstructions && (
                                                    <p className="text-xs text-muted-foreground border-t border-border pt-3 mt-3">
                                                        {paymentSettings.bankInstructions}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        {selectedPaymentMethod === "cod" && (
                                            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 p-5">
                                                <div className="flex items-start gap-3">
                                                    <Banknote className="size-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-bold text-green-800 dark:text-green-300">Cash on Delivery</p>
                                                        <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                                                            {paymentSettings?.codInstructions ||
                                                                "You will pay in cash when the order is delivered to your address. Please have the exact amount ready."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <Button
                                            size="lg"
                                            className="w-full font-bold text-lg h-12"
                                            onClick={handlePlaceOrder}
                                            disabled={isProcessing}
                                        >
                                            {getButtonText()}
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
                                shipping={0}
                                tax={0}
                                onPlaceOrder={handlePlaceOrder}
                                onApplyDiscount={handleApplyDiscount}
                                hideButton={true}
                                discountAmount={discountAmount / 100}
                                couponCode={couponCode}
                                couponError={couponError}
                                isValidating={isValidatingCoupon}
                                total={(subtotal - discountAmount) / 100}
                            />
                            <p className="text-xs text-center text-muted-foreground mt-4">
                                Shipping &amp; Taxes calculated at payment.
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

/** Small re-usable component for bank detail rows with copy */
function BankDetailRow({
    label,
    value,
    onCopy,
    copiedField,
}: {
    label: string;
    value: string;
    onCopy: (text: string, field: string) => void;
    copiedField: string | null;
}) {
    return (
        <div className="flex items-center justify-between bg-background rounded-md px-3 py-2 border border-border">
            <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</p>
                <p className="text-sm font-mono font-medium text-foreground truncate">{value}</p>
            </div>
            <button
                type="button"
                onClick={() => onCopy(value, label)}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-2"
                title="Copy"
            >
                {copiedField === label ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
            </button>
        </div>
    );
}
