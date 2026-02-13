"use client";

import { useState } from "react";
import { ChevronDown, Lock, CreditCard, Wallet, ShieldCheck, HelpCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { PaymentInfo } from "./types";

interface PaymentFormProps {
    payment: PaymentInfo;
    onChange: (payment: PaymentInfo) => void;
    stepNumber: number;
    isOpen: boolean;
    onToggle: () => void;
    isCompleted?: boolean;
}

export function PaymentForm({
    payment,
    onChange,
    stepNumber,
    isOpen,
    onToggle,
    isCompleted,
}: PaymentFormProps) {
    const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");

    const updateField = (field: keyof PaymentInfo, value: string) => {
        onChange({ ...payment, [field]: value });
    };

    // Format card number with spaces
    const formatCardNumber = (value: string) => {
        const cleaned = value.replace(/\D/g, "");
        const chunks = cleaned.match(/.{1,4}/g) || [];
        return chunks.join(" ").substring(0, 19);
    };

    // Format expiry date as MM/YY
    const formatExpiryDate = (value: string) => {
        const cleaned = value.replace(/\D/g, "");
        if (cleaned.length >= 2) {
            return `${cleaned.substring(0, 2)}/${cleaned.substring(2, 4)}`;
        }
        return cleaned;
    };

    return (
        <Collapsible open={isOpen} onOpenChange={onToggle}>
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 md:p-6 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-4">
                        <span
                            className={cn(
                                "flex items-center justify-center size-8 rounded-full font-bold text-sm",
                                isCompleted || isOpen
                                    ? "bg-primary/10 text-primary"
                                    : "border border-muted-foreground/30 text-muted-foreground"
                            )}
                        >
                            {stepNumber}
                        </span>
                        <h3 className={cn("text-lg font-bold", !isOpen && !isCompleted && "text-muted-foreground")}>
                            Payment Information
                        </h3>
                    </div>
                    <ChevronDown
                        className={cn(
                            "size-5 text-muted-foreground transition-transform",
                            isOpen && "rotate-180"
                        )}
                    />
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <div className="px-6 pb-8 border-t border-border pt-6">
                        {/* Payment Method Tabs */}
                        <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "card" | "paypal")} className="w-full">
                            <TabsList className="w-full justify-start gap-4 h-auto p-0 bg-transparent border-b border-border rounded-none mb-6">
                                <TabsTrigger
                                    value="card"
                                    className="flex items-center gap-2 pb-3 px-0 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent"
                                >
                                    <CreditCard className="size-4" />
                                    Credit Card
                                </TabsTrigger>
                                <TabsTrigger
                                    value="paypal"
                                    className="flex items-center gap-2 pb-3 px-0 data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none bg-transparent"
                                >
                                    <Wallet className="size-4" />
                                    PayPal
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="card">
                                <div className="bg-secondary/50 rounded-lg p-5 border border-border">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="cardNumber">Card Number</Label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                                <Input
                                                    id="cardNumber"
                                                    placeholder="0000 0000 0000 0000"
                                                    value={formatCardNumber(payment.cardNumber)}
                                                    onChange={(e) =>
                                                        updateField("cardNumber", e.target.value.replace(/\D/g, ""))
                                                    }
                                                    className="h-12 pl-10 pr-20"
                                                    maxLength={19}
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                                                    <div className="h-5 w-8 bg-muted rounded" />
                                                    <div className="h-5 w-8 bg-muted rounded" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="expiryDate">Expiration Date</Label>
                                            <Input
                                                id="expiryDate"
                                                placeholder="MM / YY"
                                                value={formatExpiryDate(payment.expiryDate)}
                                                onChange={(e) =>
                                                    updateField("expiryDate", e.target.value.replace(/\D/g, ""))
                                                }
                                                className="h-12"
                                                maxLength={7}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cvc">CVC</Label>
                                            <div className="relative">
                                                <Input
                                                    id="cvc"
                                                    placeholder="123"
                                                    value={payment.cvc}
                                                    onChange={(e) =>
                                                        updateField("cvc", e.target.value.replace(/\D/g, "").substring(0, 4))
                                                    }
                                                    className="h-12 pr-10"
                                                    maxLength={4}
                                                />
                                                <HelpCircle className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground cursor-help" />
                                            </div>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="cardholderName">Cardholder Name</Label>
                                            <Input
                                                id="cardholderName"
                                                placeholder="Name on card"
                                                value={payment.cardholderName}
                                                onChange={(e) => updateField("cardholderName", e.target.value)}
                                                className="h-12"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                                    <ShieldCheck className="size-4 text-green-600" />
                                    Your payment information is encrypted and secure.
                                </div>
                            </TabsContent>

                            <TabsContent value="paypal">
                                <div className="bg-secondary/50 rounded-lg p-8 border border-border text-center">
                                    <Wallet className="size-12 mx-auto text-primary mb-4" />
                                    <p className="text-muted-foreground mb-4">
                                        You will be redirected to PayPal to complete your purchase.
                                    </p>
                                    <Button variant="outline" className="gap-2">
                                        <Wallet className="size-4" />
                                        Connect with PayPal
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}
