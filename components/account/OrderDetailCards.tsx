"use client";

import { MapPin, CreditCard, HelpCircle, Download, Gift, FileDown, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface OrderDetailItem {
    id: string;
    name: string;
    image: string;
    variant: string;
    quantity: number;
    price: number;
    // Digital product fields
    productType?: string;
    hasFile?: boolean;
    digitalFileUrl?: string; // Legacy/Fallback
    digitalFileName?: string; // Legacy/Fallback
    giftCardCode?: string;
    downloadCount?: number;
    maxDownloads?: number;
}

interface OrderItemsListProps {
    items: OrderDetailItem[];
    onDownload?: (itemIndex: number) => Promise<{ allowed: boolean; fileUrl?: string; remainingDownloads?: number }>;
    isPendingOfflinePayment?: boolean;
}

export function OrderItemsList({ items, onDownload, isPendingOfflinePayment }: OrderItemsListProps) {
    const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);

    const handleDownload = async (idx: number, item: OrderDetailItem) => {
        if (onDownload) {
            setDownloadingIndex(idx);
            try {
                const result = await onDownload(idx);
                if (result.allowed && result.fileUrl) {
                    window.open(result.fileUrl, "_blank");
                }
            } finally {
                setDownloadingIndex(null);
            }
        } else if (item.digitalFileUrl) {
            window.open(item.digitalFileUrl, "_blank");
        }
    };

    return (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-secondary/30">
                <h3 className="font-bold text-lg text-foreground">
                    Items Purchased ({items.length})
                </h3>
            </div>
            <div className="divide-y divide-border">
                {items.map((item, idx) => (
                    <div
                        key={`${item.id}-${idx}`}
                        className="p-6 flex flex-col gap-3 hover:bg-secondary/30 transition-colors"
                    >
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <div
                                className="size-20 rounded-lg bg-cover bg-center shrink-0 border border-border"
                                style={{ backgroundImage: `url('${item.image}')` }}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-foreground text-lg truncate">{item.name}</h4>
                                    {item.productType === "digital" && (
                                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 border border-blue-200 shrink-0">
                                            Digital
                                        </span>
                                    )}
                                    {item.productType === "gift_card" && (
                                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 border border-purple-200 shrink-0">
                                            Gift Card
                                        </span>
                                    )}
                                </div>
                                <p className="text-muted-foreground text-sm">{item.variant}</p>
                            </div>
                            <div className="flex items-center gap-6 sm:gap-12 mt-2 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="text-sm font-medium text-muted-foreground">
                                    Qty: {item.quantity}
                                </div>
                                <div className="font-bold text-foreground text-lg">
                                    ${(item.price * item.quantity).toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Digital download section */}
                        {item.productType === "digital" && item.hasFile && (
                            isPendingOfflinePayment ? (
                                <div className="ml-0 sm:ml-24 flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 rounded-lg">
                                    <FileDown className="size-4 text-amber-600 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Download available after payment confirmation</p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400">Your order is awaiting payment verification.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="ml-0 sm:ml-24 flex items-center gap-3 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 rounded-lg">
                                    <FileDown className="size-4 text-blue-600 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{item.digitalFileName || "Download file"}</p>
                                        {item.maxDownloads && (
                                            <p className="text-xs text-muted-foreground">
                                                {(item.downloadCount || 0)} / {item.maxDownloads} downloads used
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5 shrink-0"
                                        disabled={downloadingIndex === idx || (item.maxDownloads !== undefined && (item.downloadCount || 0) >= item.maxDownloads)}
                                        onClick={() => handleDownload(idx, item)}
                                    >
                                        {downloadingIndex === idx ? (
                                            <Loader2 className="size-3.5 animate-spin" />
                                        ) : (
                                            <Download className="size-3.5" />
                                        )}
                                        Download
                                    </Button>
                                </div>
                            )
                        )}

                        {/* Gift card code display */}
                        {item.productType === "gift_card" && item.giftCardCode && (
                            <div className="ml-0 sm:ml-24 flex items-center gap-3 bg-green-50 dark:bg-green-950/30 px-4 py-3 rounded-lg">
                                <Gift className="size-4 text-green-600 shrink-0" />
                                <div className="flex-1">
                                    <p className="text-xs text-muted-foreground mb-0.5">Gift Card Code</p>
                                    <p className="font-mono font-bold text-green-700 dark:text-green-400 tracking-wider">{item.giftCardCode}</p>
                                </div>
                            </div>
                        )}

                        {/* Gift card pending */}
                        {item.productType === "gift_card" && !item.giftCardCode && (
                            <div className="ml-0 sm:ml-24 flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 rounded-lg">
                                <Gift className="size-4 text-amber-600 shrink-0" />
                                <p className="text-sm text-amber-700 dark:text-amber-400">
                                    {isPendingOfflinePayment
                                        ? "Gift card code will be generated after payment is confirmed."
                                        : "Gift card code will be delivered shortly"}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Shipping Address Card
interface ShippingAddressCardProps {
    name: string;
    address: string[];
}

export function ShippingAddressCard({ name, address }: ShippingAddressCardProps) {
    return (
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <div className="flex items-center gap-3 mb-4 text-foreground">
                <div className="p-2 bg-secondary rounded-lg">
                    <MapPin className="size-5" />
                </div>
                <h3 className="font-bold text-lg">Shipping Address</h3>
            </div>
            <div className="text-muted-foreground leading-relaxed pl-2 border-l-2 border-primary/20">
                <p className="font-bold text-foreground">{name}</p>
                {address.map((line, index) => (
                    <p key={index}>{line}</p>
                ))}
            </div>
        </div>
    );
}

// Payment Method Card
interface PaymentMethodCardProps {
    cardType: string;
    lastFour: string;
    expiryDate: string;
}

export function PaymentMethodCard({
    cardType,
    lastFour,
    expiryDate,
}: PaymentMethodCardProps) {
    return (
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <div className="flex items-center gap-3 mb-4 text-foreground">
                <div className="p-2 bg-secondary rounded-lg">
                    <CreditCard className="size-5" />
                </div>
                <h3 className="font-bold text-lg">Payment Method</h3>
            </div>
            <div className="flex items-center gap-3 pl-2">
                <div className="h-8 w-12 bg-secondary rounded flex items-center justify-center text-xs font-bold text-muted-foreground">
                    {cardType.toUpperCase().slice(0, 4)}
                </div>
                <div>
                    <p className="font-medium text-foreground">
                        {cardType} ending in {lastFour}
                    </p>
                    <p className="text-xs text-muted-foreground">Expires {expiryDate}</p>
                </div>
            </div>
        </div>
    );
}

// Price Breakdown Card
interface PriceBreakdownCardProps {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
}

export function PriceBreakdownCard({
    subtotal,
    shipping,
    tax,
    total,
}: PriceBreakdownCardProps) {
    return (
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
            <h3 className="font-bold text-lg text-foreground mb-6">Price Breakdown</h3>
            <div className="space-y-3 pb-6 border-b border-border">
                <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-medium text-foreground">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="font-medium text-foreground">${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                    <span>Tax</span>
                    <span className="font-medium text-foreground">${tax.toFixed(2)}</span>
                </div>
            </div>
            <div className="pt-6 flex justify-between items-end">
                <span className="text-muted-foreground font-medium">Total Paid</span>
                <span className="text-3xl font-black text-primary">${total.toFixed(2)}</span>
            </div>
        </div>
    );
}

// Help Link
export function OrderHelpLink() {
    return (
        <div className="text-center mt-2">
            <a
                href="#"
                className="text-muted-foreground text-sm hover:text-primary transition-colors flex items-center justify-center gap-1"
            >
                <HelpCircle className="size-4" />
                Need help with this order?
            </a>
        </div>
    );
}
