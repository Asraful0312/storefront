"use client";

import { MapPin, CreditCard, HelpCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface OrderDetailItem {
    id: string;
    name: string;
    image: string;
    variant: string;
    quantity: number;
    price: number;
}

interface OrderItemsListProps {
    items: OrderDetailItem[];
}

export function OrderItemsList({ items }: OrderItemsListProps) {
    return (
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-secondary/30">
                <h3 className="font-bold text-lg text-foreground">
                    Items Purchased ({items.length})
                </h3>
            </div>
            <div className="divide-y divide-border">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:bg-secondary/30 transition-colors"
                    >
                        <div
                            className="size-20 rounded-lg bg-cover bg-center shrink-0 border border-border"
                            style={{ backgroundImage: `url('${item.image}')` }}
                        />
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-foreground text-lg truncate">{item.name}</h4>
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
