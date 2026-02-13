"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Header, Footer } from "@/components/storefront";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function CheckoutSuccessPage() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const [isLoaded, setIsLoaded] = useState(false);

    // Optionally fetch order details if we wanted to show them,
    // but for now just showing a static success message is a huge improvement over 404.

    // We can try to look up the order by the stripe session ID
    const order = useQuery(api.orders.getOrderByStripeId, sessionId ? { stripeId: sessionId } : "skip");

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <Header />

            <main className="grow flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-sm">
                    <div className="flex justify-center mb-6">
                        <div className="size-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                            <CheckCircle2 className="size-10" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-black tracking-tight mb-2">Order Confirmed!</h1>
                    <p className="text-muted-foreground mb-8">
                        Thank you for your purchase. We have received your order and are processing it.
                        You will receive an email confirmation shortly.
                    </p>

                    {sessionId && (
                        <div className="bg-secondary/50 rounded-lg p-4 mb-4 text-sm">
                            <span className="text-muted-foreground">Order Reference:</span>
                            <br />
                            <span className="font-mono font-bold text-foreground break-all">{sessionId.slice(-8)}</span>
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
