"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ShoppingBag, ArrowRight, Clock, Building2, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header, Footer } from "@/components/storefront";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function CheckoutSuccessPage() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const orderId = searchParams.get("order_id");
    const paymentMethod = searchParams.get("method");
    const [isLoaded, setIsLoaded] = useState(false);

    // Fetch order by stripe session ID or skip
    const order = useQuery(api.orders.getOrderByStripeId, sessionId ? { stripeId: sessionId } : "skip");

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    const isBankTransfer = paymentMethod === "bank_transfer";
    const isCod = paymentMethod === "cod";
    const isOffline = isBankTransfer || isCod;

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />

            <main className="grow flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-sm">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        {isBankTransfer ? (
                            <div className="size-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Building2 className="size-10" />
                            </div>
                        ) : isCod ? (
                            <div className="size-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400">
                                <Banknote className="size-10" />
                            </div>
                        ) : (
                            <div className="size-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                                <CheckCircle2 className="size-10" />
                            </div>
                        )}
                    </div>

                    {/* Title & Message */}
                    <h1 className="text-3xl font-black tracking-tight mb-2">
                        {isBankTransfer ? "Order Placed!" : isCod ? "Order Confirmed!" : "Order Confirmed!"}
                    </h1>

                    {isBankTransfer ? (
                        <div className="text-muted-foreground mb-8 space-y-2">
                            <p>
                                Your order has been placed successfully. Please transfer the total
                                amount to our bank account.
                            </p>
                            <div className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
                                <Clock className="size-4" />
                                Awaiting your payment
                            </div>
                            <p className="text-xs">
                                Your order will be processed once payment is received and verified.
                                Check your order details for the bank information.
                            </p>
                        </div>
                    ) : isCod ? (
                        <div className="text-muted-foreground mb-8 space-y-2">
                            <p>
                                Your order has been confirmed. You will pay in cash when the order
                                is delivered to your address.
                            </p>
                            <div className="flex items-center justify-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                                <Banknote className="size-4" />
                                Pay on delivery
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground mb-8">
                            Thank you for your purchase. We have received your order and are processing it.
                            You will receive an email confirmation shortly.
                        </p>
                    )}

                    {/* Order reference */}
                    {(sessionId || orderId) && (
                        <div className="bg-secondary/50 rounded-lg p-4 mb-4 text-sm">
                            <span className="text-muted-foreground">Order Reference:</span>
                            <br />
                            <span className="font-mono font-bold text-foreground break-all">
                                {sessionId ? sessionId.slice(-8) : orderId ? orderId.slice(-8) : ""}
                            </span>
                        </div>
                    )}

                    <div className="space-y-6">
                        <Link className="" href="/account/orders">
                            <Button className="w-full gap-2" variant="outline">
                                <ShoppingBag className="size-4" />
                                View My Orders
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button className="w-full gap-2 mt-4">
                                Continue Shopping
                                <ArrowRight className="size-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
