"use client";

import { CreditCard, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentCard {
    id: string;
    type: "visa" | "mastercard" | "amex";
    lastFour: string;
    holderName: string;
    expiryDate: string;
    isDefault?: boolean;
}

interface PaymentMethodCardProps {
    card?: PaymentCard;
    onAddNew: () => void;
    onManage: () => void;
}

export function PaymentMethodDisplayCard({ card, onAddNew, onManage }: PaymentMethodCardProps) {
    return (
        <section className="bg-card rounded-xl shadow-sm border border-border flex flex-col h-full">
            <div className="px-6 py-5 border-b border-border flex justify-between items-center">
                <h2 className="text-lg font-bold text-foreground">Default Payment</h2>
                <Button variant="ghost" size="sm" onClick={onManage}>
                    Manage
                </Button>
            </div>
            <div className="p-6 flex flex-col items-center justify-center flex-1">
                {card ? (
                    <>
                        {/* Credit Card Visual */}
                        <div className="w-full max-w-sm aspect-[1.586/1] rounded-xl bg-linear-to-br from-primary to-orange-800 shadow-lg relative overflow-hidden p-6 text-white mb-6 transform hover:scale-[1.02] transition-transform duration-300 cursor-pointer group">
                            {/* Decorative circles */}
                            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-white/10 blur-xl" />
                            <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 rounded-full bg-black/10 blur-xl" />

                            <div className="flex flex-col justify-between h-full relative z-10">
                                <div className="flex justify-between items-start">
                                    <Wifi className="size-8 opacity-80" />
                                    <span className="text-lg font-bold italic opacity-90 uppercase">
                                        {card.type}
                                    </span>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        {[1, 2, 3].map((group) => (
                                            <div key={group} className="flex gap-1">
                                                {[1, 2, 3, 4].map((dot) => (
                                                    <div key={dot} className="w-1.5 h-1.5 rounded-full bg-white/80" />
                                                ))}
                                            </div>
                                        ))}
                                        <span className="font-mono text-lg tracking-widest">{card.lastFour}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase opacity-70 mb-0.5">Card Holder</span>
                                            <span className="font-medium tracking-wide uppercase text-sm">
                                                {card.holderName}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] uppercase opacity-70 mb-0.5">Expires</span>
                                            <span className="font-medium tracking-wide text-sm">{card.expiryDate}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8">
                        <CreditCard className="size-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">No payment method added</p>
                    </div>
                )}

                <Button variant="outline" className="w-full gap-2" onClick={onAddNew}>
                    <CreditCard className="size-4" />
                    Add Payment Method
                </Button>
            </div>
        </section>
    );
}
