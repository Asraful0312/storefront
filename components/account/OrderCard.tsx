"use client";

import Link from "next/link";
import { RefreshCw, Undo2, Gift, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus } from "./types";
import { useCurrency } from "@/lib/currency-context";

interface OrderCardProps {
    order: Order;
    onReorder?: (orderId: string) => void;
}

const statusConfig: Record<
    OrderStatus | "pending",
    { label: string; className: string; dotClass: string }
> = {
    delivered: {
        label: "Delivered",
        className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        dotClass: "bg-green-600 dark:bg-green-400",
    },
    shipped: {
        label: "Shipped",
        className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        dotClass: "bg-orange-500 animate-pulse",
    },
    processing: {
        label: "Processing",
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        dotClass: "bg-amber-600 dark:bg-amber-400",
    },
    pending: {
        label: "Processing", // Pending effectively means Processing for the user
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        dotClass: "bg-amber-600 dark:bg-amber-400",
    },
    returned: {
        label: "Returned",
        className: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
        dotClass: "",
    },
    cancelled: {
        label: "Cancelled",
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        dotClass: "bg-red-600 dark:bg-red-400",
    },
};

export function OrderCard({ order, onReorder }: OrderCardProps) {
    // Fallback status if unknown
    const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.processing;
    const isReturned = order.status === "returned";
    const showReorder = order.status === "delivered";
    const showTrack = order.status === "shipped";
    const remainingItems = order.items.length > 3 ? order.items.length - 2 : 0;

    const { formatPrice } = useCurrency();

    // Convert price from cents to dollars if it looks like cents (large number)
    // Actually, backend 'total' comes from Stripe 'amount_total' which is CENTS.
    // So we should always divide by 100.
    const displayTotal = formatPrice(order.total);

    // Truncate long order IDs (Stripe IDs are long)
    const displayId = order.orderId.length > 10
        ? `...${order.orderId.slice(-8)}`
        : order.orderId;

    return (
        <div
            className={cn(
                "group bg-card rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300 flex flex-col overflow-hidden",
                isReturned && "opacity-80 hover:opacity-100"
            )}
        >
            {/* Header */}
            <div className="px-5 py-4 border-b border-border bg-secondary/50 flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Order Placed
                    </span>
                    <span className="text-sm font-medium">{order.date}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Order ID
                    </span>
                    <span className="text-sm font-medium" title={order.orderId}>#{displayId}</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1">
                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary" className={cn("gap-1.5", status?.className)}>
                        {status?.dotClass ? (
                            <span className={cn("w-1.5 h-1.5 rounded-full", status?.dotClass)} />
                        ) : (
                            <Undo2 className="size-3" />
                        )}
                        {status?.label}
                    </Badge>
                    {order.statusDate && (
                        <span className="text-xs text-muted-foreground">{order?.statusDate}</span>
                    )}
                </div>

                {/* Product Thumbnails */}
                <div className="flex gap-3 mb-5 overflow-hidden">
                    {order.items.slice(0, 2).map((item) => (
                        <div
                            key={item.id}
                            className="relative w-16 h-16 rounded-lg bg-secondary overflow-hidden shrink-0 border border-border"
                        >
                            <img
                                src={item.image}
                                alt={item.name}
                                className={cn("w-full h-full object-cover", isReturned && "grayscale")}
                            />
                            {item.productType === "digital" && (
                                <div className="absolute top-0.5 right-0.5 p-0.5 bg-blue-600 rounded-full" title="Digital product">
                                    <FileDown className="size-2.5 text-white" />
                                </div>
                            )}
                            {item.productType === "gift_card" && (
                                <div className="absolute top-0.5 right-0.5 p-0.5 bg-purple-600 rounded-full" title="Gift card">
                                    <Gift className="size-2.5 text-white" />
                                </div>
                            )}
                        </div>
                    ))}
                    {remainingItems > 0 && (
                        <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden shrink-0 border border-border flex items-center justify-center text-muted-foreground text-xs font-medium">
                            +{remainingItems}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-2">
                    <span
                        className={cn(
                            "text-lg font-bold",
                            isReturned
                                ? "text-muted-foreground line-through decoration-1"
                                : "text-foreground"
                        )}
                    >
                        {displayTotal}
                    </span>
                    <div className="flex gap-2">
                        {showTrack && (
                            <Link href={`/account/orders/${order.id}`}>
                                <Button variant="outline" size="sm">
                                    Track Order
                                </Button>
                            </Link>
                        )}
                        <Link href={`/account/orders/${order.id}`}>
                            <Button variant="outline" size="sm">
                                {isReturned ? "Return Status" : "View Details"}
                            </Button>
                        </Link>
                        {showReorder && onReorder && (
                            <Button size="sm" onClick={() => onReorder(order.id)} className="gap-1">
                                <RefreshCw className="size-3.5" />
                                Reorder
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
