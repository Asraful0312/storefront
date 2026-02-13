"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Search,
    ShoppingCart,
    User,
    X,
    Trash2,
    Plus,
    CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface OrderItem {
    id: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    image: string;
}

const initialItems: OrderItem[] = [
    {
        id: "1",
        name: "Minimalist Terracotta Vase",
        sku: "HOME-042",
        price: 45.0,
        quantity: 2,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC1hqFunR52zJtNbTa8i4MV3W7Axa5KtpXRgyi-jPE6fm2mCx9WupB6hl29jQBw9hWPVap9u7IpsH2JU7VUM8lNtMVRrYKZrN79UhBN8syTFMHL21izkrIhqh0_tY1qbqcNoxX3xkZCXSOgK-KyNDwpfFdv-elaiqAsN6bSjRfCWZjCAjAAI37Flbjy4h1pouFZFc8D2xTdbcEVbZUJbN3axRYtC7MUUORPwvfriWiRkXT5ZbW_qKocQ6FDpTLXIZUEXsnuK04wbPM",
    },
    {
        id: "2",
        name: "Linen Napkins (Set of 4)",
        sku: "DINE-019",
        price: 24.0,
        quantity: 1,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAS175m2QtKr_dOAg_x_sw2dWDRfUspEZiUDjaOxP88aKk4eSIuqbxwXcKTiGfV5QMP4Nwv9TkjgJoviOfQNZVwuNoWckPTjtUYrKyvM4oLPDWyXP-H6pah0cqsLzXeXR2zjB_tISFwIOM3R6HEM09xypzwcfm-r1h7FQF1mPS0E9g1jSqTJYrqyL-atFbRZKzi02oYl6Yw73CREDFI9_JWaThKfuJ0FAk6ZnJusVIVVWwxVObye3ed9GCAbyS_f3pZcyzpEackJw0",
    },
];

export default function CreateOrderPage() {
    const [items, setItems] = useState<OrderItem[]>(initialItems);
    const [selectedCustomer, setSelectedCustomer] = useState({
        name: "Marcus Holloway",
        email: "marcus.h@example.com",
        phone: "+1 (555) 012-3456",
    });
    const [paymentAction, setPaymentAction] = useState<"paid" | "invoice">("paid");

    const updateQuantity = (id: string, quantity: number) => {
        setItems(items.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item)));
    };

    const removeItem = (id: string) => {
        setItems(items.filter((item) => item.id !== id));
    };

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const shipping = 10.0;
    const tax = subtotal * 0.08;
    const total = subtotal + shipping + tax;

    return (
        <main className="flex-1 flex flex-col items-center py-8">
            <div className="max-w-[1200px] w-full px-6 flex flex-col gap-6">
                {/* Breadcrumbs & Heading */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm">
                        <Link href="/admin/orders" className="text-muted-foreground hover:underline">
                            Orders
                        </Link>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-foreground font-medium">Create New Order</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-black tracking-tight">Create New Order</h1>
                        <div className="flex gap-3">
                            <Button variant="secondary">Save Draft</Button>
                            <Button className="shadow-sm">Place Order</Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left Section: Customer and Products */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Customer Selection */}
                        <section className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                            <div className="p-5 border-b border-border flex justify-between items-center">
                                <h2 className="text-lg font-bold">Customer Information</h2>
                                <button className="text-primary text-sm font-semibold hover:underline">
                                    Create New Customer
                                </button>
                            </div>
                            <div className="p-5 flex flex-col gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Search existing customer</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                        <Input
                                            className="pl-10 h-12"
                                            placeholder="Name, email, or phone number..."
                                        />
                                    </div>
                                </div>
                                {/* Selected Customer */}
                                {selectedCustomer && (
                                    <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                                        <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                            <User className="size-6" />
                                        </div>
                                        <div className="flex flex-col">
                                            <p className="font-bold text-foreground">{selectedCustomer.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {selectedCustomer.email} • {selectedCustomer.phone}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setSelectedCustomer(null as any)}
                                            className="ml-auto text-muted-foreground hover:text-red-500"
                                        >
                                            <X className="size-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Product Selection */}
                        <section className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                            <div className="p-5 border-b border-border">
                                <h2 className="text-lg font-bold">Order Items</h2>
                            </div>
                            <div className="p-5">
                                <div className="relative mb-6">
                                    <ShoppingCart className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        className="pl-10 h-12"
                                        placeholder="Search products to add..."
                                    />
                                </div>
                                {/* Items Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="text-sm font-semibold text-muted-foreground border-b border-border">
                                                <th className="pb-3 pt-0 px-2">Product</th>
                                                <th className="pb-3 pt-0 px-2">SKU</th>
                                                <th className="pb-3 pt-0 px-2 text-right">Price</th>
                                                <th className="pb-3 pt-0 px-2 text-center">Qty</th>
                                                <th className="pb-3 pt-0 px-2 text-right">Total</th>
                                                <th className="pb-3 pt-0 px-2" />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {items.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="py-4 px-2">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className="size-12 rounded bg-cover bg-center bg-secondary"
                                                                style={{ backgroundImage: `url('${item.image}')` }}
                                                            />
                                                            <span className="font-medium text-sm">{item.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-2 text-sm text-muted-foreground">{item.sku}</td>
                                                    <td className="py-4 px-2 text-sm text-right">${item.price.toFixed(2)}</td>
                                                    <td className="py-4 px-2">
                                                        <div className="flex items-center justify-center">
                                                            <Input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                                                className="w-16 h-8 text-center text-sm"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-2 text-sm font-bold text-right">
                                                        ${(item.price * item.quantity).toFixed(2)}
                                                    </td>
                                                    <td className="py-4 px-2 text-right">
                                                        <button
                                                            onClick={() => removeItem(item.id)}
                                                            className="text-muted-foreground hover:text-red-500"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button className="flex items-center gap-2 text-primary font-bold text-sm hover:opacity-80">
                                        <Plus className="size-4" />
                                        Add Custom Item
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Section: Order Summary & Payment */}
                    <aside className="flex flex-col gap-6 sticky top-24">
                        {/* Order Summary Card */}
                        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                            <div className="p-5 border-b border-border">
                                <h2 className="text-lg font-bold">Order Summary</h2>
                            </div>
                            <div className="p-5 flex flex-col gap-4">
                                {/* Calculations */}
                                <div className="flex flex-col gap-2 pb-4 border-b border-border">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
                                        <span className="font-medium">${subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Discount</span>
                                        <div className="flex items-center gap-2">
                                            <Input className="w-24 h-8 text-right text-sm px-2" placeholder="0.00" />
                                            <Select defaultValue="$">
                                                <SelectTrigger className="h-8 w-14 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="$">$</SelectItem>
                                                    <SelectItem value="%">%</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <Select defaultValue="standard">
                                            <SelectTrigger className="h-8 w-40 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="standard">Standard ($10.00)</SelectItem>
                                                <SelectItem value="express">Express ($25.00)</SelectItem>
                                                <SelectItem value="free">Free Shipping</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Estimated Tax</span>
                                        <span className="font-medium">${tax.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-lg font-bold">Total</span>
                                    <span className="text-2xl font-black text-primary">${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions & Payment Status */}
                        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                            <div className="p-5 flex flex-col gap-6">
                                <div className="flex flex-col gap-3">
                                    <span className="text-sm font-bold">Payment Action</span>
                                    <div className="flex bg-secondary p-1 rounded-lg">
                                        <button
                                            onClick={() => setPaymentAction("paid")}
                                            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${paymentAction === "paid"
                                                    ? "bg-card shadow-sm text-primary"
                                                    : "text-muted-foreground"
                                                }`}
                                        >
                                            Mark as Paid
                                        </button>
                                        <button
                                            onClick={() => setPaymentAction("invoice")}
                                            className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${paymentAction === "invoice"
                                                    ? "bg-card shadow-sm text-primary"
                                                    : "text-muted-foreground"
                                                }`}
                                        >
                                            Send Invoice
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <span className="text-sm font-bold">Notes (Internal)</span>
                                    <Textarea
                                        className="h-24 text-sm"
                                        placeholder="Add a private note for staff..."
                                    />
                                </div>
                                <Button className="w-full py-6 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 gap-2">
                                    <CheckCircle className="size-5" />
                                    Complete Order
                                </Button>
                                <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-bold">
                                    Confirmed by Admin: JS-901
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <footer className="mt-auto py-8 text-center text-muted-foreground text-sm">
                <p>© 2024 Store Admin Platform. All rights reserved.</p>
            </footer>
        </main>
    );
}
