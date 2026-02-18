"use client";

import Link from "next/link";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { Header, Footer, Breadcrumb } from "@/components/storefront";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    OrderProgressTracker,
    OrderItemsList,
    ShippingAddressCard,
    PaymentMethodCard,
    PriceBreakdownCard,
    OrderHelpLink,
    type OrderTrackingStatus,
} from "@/components/account";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { formatDate } from "@/lib/utils";
import { use, useState } from "react";
import { toast } from "sonner";

const statusBadgeColors: Record<string, string> = {
    shipped: "bg-primary/10 text-primary",
    delivered: "bg-green-100 text-green-700",
    processing: "bg-amber-100 text-amber-800",
    pending: "bg-amber-100 text-amber-800",
    cancelled: "bg-red-100 text-red-700",
    returned: "bg-gray-200 text-gray-700",
};

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
    // Determine orderId from params
    const { id: orderId }: any = use(params as any);

    const order = useQuery(api.orders.getOrder, { orderId });
    const getDownloadUrl = useMutation(api.orders.getDownloadUrl);
    const [copied, setCopied] = useState(false);

    const handleCopyOrderId = () => {
        if (!order) return;
        navigator.clipboard.writeText(order.orderNumber);
        setCopied(true);
        toast.success("Order ID copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    if (order === undefined) {
        return (
            <>
                <Header />
                <main className="grow w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                    Loading order details...
                </main>
                <Footer />
            </>
        );
    }

    if (order === null) {
        return (
            <>
                <Header />
                <main className="grow w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                    <h2 className="text-2xl font-bold mb-4">Order Not Found</h2>
                    <p className="text-muted-foreground mb-6">The order you are looking for does not exist or you do not have permission to view it.</p>
                    <Link href="/account/orders">
                        <Button>Return to Orders</Button>
                    </Link>
                </main>
                <Footer />
            </>
        );
    }

    const breadcrumbItems = [
        { label: "Home", href: "/" },
        { label: "My Account", href: "/account" },
        { label: "Orders", href: "/account/orders" },
        { label: `Order #${order.orderNumber}` },
    ];

    // Detect if order is all digital
    const isAllDigital = order.items.every((item: any) => {
        const pt = item.productType;
        return pt === "digital" || pt === "gift_card";
    });

    // Map status to tracking steps — different flow for digital orders
    const trackingSteps: { status: OrderTrackingStatus; label: string; date: string; isCompleted: boolean; isCurrent?: boolean }[] = isAllDigital
        ? [
            {
                status: "ordered",
                label: "Ordered",
                date: formatDate(order._creationTime),
                isCompleted: true
            },
            {
                status: "processed",
                label: "Confirmed",
                date: order.status !== "pending" ? "..." : "",
                isCompleted: order.status !== "pending" && order.status !== "cancelled",
                isCurrent: order.status === "processing"
            },
            {
                status: "delivered",
                label: "Delivered",
                date: "",
                isCompleted: order.status === "delivered",
                isCurrent: order.status === "delivered"
            },
        ]
        : [
            {
                status: "ordered",
                label: "Ordered",
                date: formatDate(order._creationTime),
                isCompleted: true
            },
            {
                status: "processed",
                label: "Processed",
                date: order.status !== "pending" ? "..." : "",
                isCompleted: order.status !== "pending" && order.status !== "cancelled",
                isCurrent: order.status === "processing"
            },
            {
                status: "shipped",
                label: "Shipped",
                date: "",
                isCompleted: order.status === "shipped" || order.status === "delivered",
                isCurrent: order.status === "shipped"
            },
            {
                status: "delivered",
                label: "Delivered",
                date: "",
                isCompleted: order.status === "delivered",
                isCurrent: order.status === "delivered"
            },
        ];

    const displayOrderId = order.orderNumber.length > 20
        ? `...${order.orderNumber.slice(-8)}`
        : order.orderNumber;

    return (
        <>
            <Header />

            <main className="grow w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Link & Breadcrumbs */}
                <div className="mb-6">
                    <Breadcrumb items={breadcrumbItems} />
                </div>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <Link
                                href="/account/orders"
                                className="text-muted-foreground hover:text-primary transition-colors mr-2"
                            >
                                <ArrowLeft className="size-5" />
                            </Link>
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground flex items-center gap-2">
                                Order #{displayOrderId}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 ml-1"
                                    onClick={handleCopyOrderId}
                                    title="Copy Order ID"
                                >
                                    {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
                                </Button>
                            </h2>
                            <Badge className={statusBadgeColors[order.status] || "bg-secondary"}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-base">
                            Placed on {formatDate(order._creationTime)}
                        </p>
                    </div>
                </div>

                {/* Progress Tracker */}
                {order.status !== "cancelled" && order.status !== "returned" && (
                    <OrderProgressTracker steps={trackingSteps} />
                )}

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Items List */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <OrderItemsList
                            items={order.items.map((item: any) => ({
                                id: item.productId,
                                name: item.name,
                                image: item.image || "",
                                variant: "",
                                quantity: item.quantity,
                                price: item.price / 100,
                                productType: item.productType,
                                hasFile: item.hasFile,
                                // digitalFileUrl: item.digitalFileUrl, // No longer on item, fetched on demand
                                // digitalFileName: item.digitalFileName,
                                giftCardCode: item.giftCardCode,
                                downloadCount: item.downloadCount,
                                maxDownloads: item.maxDownloads,
                            }))}
                            onDownload={async (itemIndex) => {
                                try {
                                    const item = order.items[itemIndex];
                                    if (!item) return { allowed: false };
                                    
                                    const result = await getDownloadUrl({
                                        orderId: order._id,
                                        productId: item.productId,
                                    });
                                    if (result.url) {
                                        window.open(result.url, "_blank");
                                    }
                                    return { 
                                        allowed: true, 
                                        remainingDownloads: result.remaining 
                                    };
                                } catch (e: any) {
                                    toast.error(e.message || "Download failed");
                                    return { allowed: false };
                                }
                            }}
                        />
                    </div>

                    {/* Right Column: Details & Summary */}
                    <div className="flex flex-col gap-6">
                        {order.shippingAddress && (
                            <ShippingAddressCard
                                name={order.shippingAddress.recipientName}
                                address={[
                                    order.shippingAddress.street,
                                    order.shippingAddress.apartment,
                                    `${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}`,
                                    order.shippingAddress.country
                                ].filter(Boolean) as string[]}
                            />
                        )}

                        <PaymentMethodCard
                            cardType={order.paymentMethod || "Card"}
                            lastFour="****"
                            expiryDate=""
                        />

                        <PriceBreakdownCard
                            subtotal={order.subtotal / 100}
                            shipping={order.shipping / 100}
                            tax={order.tax / 100}
                            total={order.total / 100}
                        />
                        <OrderHelpLink />
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}
