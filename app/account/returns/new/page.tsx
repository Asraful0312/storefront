"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Package, AlertCircle } from "lucide-react";
import { Header, Footer, Breadcrumb } from "@/components/storefront";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

export default function StartReturnPage() {
    const router = useRouter();
    const returnableOrders = useQuery(api.orders.listReturnableOrders);
    const requestReturn = useMutation(api.returns.requestReturn);

    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Select Order, 2: Select Items, 3: Reason & Submit
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Record<string, number>>({}); // itemId -> quantity
    const [returnReason, setReturnReason] = useState<string>("");
    const [detailedReason, setDetailedReason] = useState<string>("");
    const [refundMethod, setRefundMethod] = useState<"original_payment" | "store_credit">("original_payment");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const selectedOrder = returnableOrders?.find((o) => o._id === selectedOrderId);

    const breadcrumbItems = [
        { label: "Home", href: "/" },
        { label: "My Account", href: "/account" },
        { label: "Returns", href: "/account/returns" },
        { label: "Start Return" },
    ];

    const handleOrderSelect = (orderId: string) => {
        setSelectedOrderId(orderId);
        setStep(2);
        setSelectedItems({});
    };

    const handleItemToggle = (itemId: string, maxQty: number) => {
        if (selectedItems[itemId]) {
            const newItems = { ...selectedItems };
            delete newItems[itemId];
            setSelectedItems(newItems);
        } else {
            setSelectedItems({ ...selectedItems, [itemId]: 1 });
        }
    };

    const handleQuantityChange = (itemId: string, qty: number) => {
        if (qty > 0) {
            setSelectedItems({ ...selectedItems, [itemId]: qty });
        }
    };

    const handleSubmit = async () => {
        if (!selectedOrderId || !selectedOrder) return;
        if (!returnReason) {
            toast.error("Please select a reason for return");
            return;
        }

        setIsSubmitting(true);
        try {
            const itemsToReturn = Object.entries(selectedItems).map(([itemId, qty]) => {
                const originalItem = selectedOrder.items.find(i => i.productId === itemId);
                return {
                    itemId,
                    quantity: qty,
                    reason: returnReason,
                    condition: "Opened", // Default for now
                };
            });

            await requestReturn({
                orderId: selectedOrder._id,
                items: itemsToReturn,
                reason: detailedReason ? `${returnReason} - ${detailedReason}` : returnReason,
                refundMethod,
            });

            toast.success("Return request submitted successfully");
            router.push("/account/returns");
        } catch (error: any) {
            console.error("Failed to submit return:", error);
            toast.error(error.message || "Failed to submit return request");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (returnableOrders === undefined) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                Loading...
            </div>
        );
    }

    return (
        <>
            <Header />

            <div className="grow w-full max-w-4xl mx-auto px-4 md:px-10 py-8">
                <div className="mb-6">
                    <Breadcrumb items={breadcrumbItems} />
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-black tracking-tight mb-2">Start a Return</h1>
                    <p className="text-muted-foreground">
                        Select the order and items you wish to return.
                    </p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-4 mb-8">
                    <div className={`flex items-center gap-2 ${step >= 1 ? "text-primary" : "text-muted-foreground"}`}>
                        <div className={`size-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${step >= 1 ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground"}`}>1</div>
                        <span className="font-medium hidden sm:inline">Select Order</span>
                    </div>
                    <div className={`w-12 h-0.5 ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
                    <div className={`flex items-center gap-2 ${step >= 2 ? "text-primary" : "text-muted-foreground"}`}>
                        <div className={`size-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${step >= 2 ? "border-primary bg-primary text-primary-foreground" : "border-muted"}`}>2</div>
                        <span className="font-medium hidden sm:inline">Select Items</span>
                    </div>
                    <div className={`w-12 h-0.5 ${step >= 3 ? "bg-primary" : "bg-muted"}`} />
                    <div className={`flex items-center gap-2 ${step >= 3 ? "text-primary" : "text-muted-foreground"}`}>
                        <div className={`size-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${step >= 3 ? "border-primary bg-primary text-primary-foreground" : "border-muted"}`}>3</div>
                        <span className="font-medium hidden sm:inline">Details</span>
                    </div>
                </div>

                {/* Step 1: Select Order */}
                {step === 1 && (
                    <div className="space-y-6">
                        {returnableOrders.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                    <Package className="size-16 text-muted-foreground mb-4 opacity-50" />
                                    <h3 className="text-lg font-bold">No eligible orders found</h3>
                                    <p className="text-muted-foreground mt-2 max-w-md">
                                        Only delivered orders can be returned. If you recently received an order, please wait for the status to update.
                                    </p>
                                    <Link href="/account/orders" className="mt-6">
                                        <Button variant="outline">View All Orders</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4">
                                {returnableOrders.map((order) => (
                                    <Card
                                        key={order._id}
                                        className="cursor-pointer hover:border-primary transition-all group"
                                        onClick={() => handleOrderSelect(order._id)}
                                    >
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-base font-bold">
                                                Order #{order.orderNumber}
                                            </CardTitle>
                                            <span className="text-sm text-muted-foreground">
                                                {formatDate(order._creationTime)}
                                            </span>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between">
                                                <div className="text-sm text-muted-foreground">
                                                    {order.items.length} items • Total: ${order.total / 100}
                                                </div>
                                                <Button size="sm" variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground">
                                                    Select Order
                                                </Button>
                                            </div>
                                            <div className="mt-4 flex gap-2 overflow-hidden">
                                                {order.items.slice(0, 5).map((item, idx) => (
                                                    <div key={idx} className="size-10 rounded-md bg-secondary bg-cover bg-center border border-border shrink-0"
                                                        style={{ backgroundImage: `url('${item.image}')` }}
                                                    />
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Select Items */}
                {step === 2 && selectedOrder && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <Card>
                            <CardHeader>
                                <CardTitle>Select items to return</CardTitle>
                                <CardDescription>
                                    Choose the items from Order #{selectedOrder.orderNumber} you want to return.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="divide-y divide-border">
                                {selectedOrder.items.map((item) => (
                                    <div key={item.productId} className="py-4 flex items-start gap-4">
                                        <Checkbox
                                            id={item.productId}
                                            checked={!!selectedItems[item.productId]}
                                            onCheckedChange={() => handleItemToggle(item.productId, item.quantity)}
                                            className="mt-1"
                                        />
                                        <div className="size-16 rounded-md bg-secondary bg-cover bg-center border border-border shrink-0"
                                            style={{ backgroundImage: `url('${item.image}')` }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <label
                                                htmlFor={item.productId}
                                                className="text-base font-medium text-foreground cursor-pointer block truncate"
                                            >
                                                {item.name}
                                            </label>
                                            <p className="text-sm text-muted-foreground">
                                                Qty Purchased: {item.quantity} • ${item.price / 100}
                                            </p>
                                        </div>
                                        {selectedItems[item.productId] && (
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor={`qty-${item.productId}`} className="text-xs">Return Qty:</Label>
                                                <Select
                                                    value={selectedItems[item.productId].toString()}
                                                    onValueChange={(v) => handleQuantityChange(item.productId, parseInt(v))}
                                                >
                                                    <SelectTrigger className="w-16 h-8">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from({ length: item.quantity }, (_, i) => i + 1).map((n) => (
                                                            <SelectItem key={n} value={n.toString()}>
                                                                {n}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                            <CardFooter className="flex justify-between border-t bg-secondary/20 pt-6">
                                <Button variant="ghost" onClick={() => setStep(1)}>
                                    <ArrowLeft className="mr-2 size-4" /> Change Order
                                </Button>
                                <Button
                                    onClick={() => setStep(3)}
                                    disabled={Object.keys(selectedItems).length === 0}
                                >
                                    Continue
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                )}

                {/* Step 3: Reason & Details */}
                {step === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <Card>
                            <CardHeader>
                                <CardTitle>Return Details</CardTitle>
                                <CardDescription>Plese tell us why you are returning these items.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label>Reason for Return</Label>
                                    <Select value={returnReason} onValueChange={setReturnReason}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a reason" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Damaged / Defective">Damaged / Defective</SelectItem>
                                            <SelectItem value="Wrong Item Received">Wrong Item Received</SelectItem>
                                            <SelectItem value="No Longer Needed">No Longer Needed</SelectItem>
                                            <SelectItem value="Better Price Available">Better Price Available</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Additional Comments</Label>
                                    <Textarea
                                        placeholder="Please provide more details about the issue..."
                                        value={detailedReason}
                                        onChange={(e) => setDetailedReason(e.target.value)}
                                        rows={3}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <Label>Refund Method</Label>
                                    <RadioGroup value={refundMethod} onValueChange={(v) => setRefundMethod(v as any)}>
                                        <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-secondary/50">
                                            <RadioGroupItem value="original_payment" id="r1" />
                                            <Label htmlFor="r1" className="flex-1 cursor-pointer">
                                                <span className="font-medium block">Original Payment Method</span>
                                                <span className="text-xs text-muted-foreground">Refund to your card/bank account</span>
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2 border rounded-lg p-4 cursor-pointer hover:bg-secondary/50">
                                            <RadioGroupItem value="store_credit" id="r2" />
                                            <Label htmlFor="r2" className="flex-1 cursor-pointer">
                                                <span className="font-medium block">Store Credit</span>
                                                <span className="text-xs text-muted-foreground">Get instant credit to your account</span>
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t bg-secondary/20 pt-6">
                                <Button variant="ghost" onClick={() => setStep(2)}>
                                    <ArrowLeft className="mr-2 size-4" /> Back to Items
                                </Button>
                                <Button onClick={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? "Submitting..." : "Submit Return Request"}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                )}
            </div>

            <Footer />
        </>
    );
}
