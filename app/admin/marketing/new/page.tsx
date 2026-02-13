"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Info,
    ListChecks,
    CalendarCheck,
    Receipt,
    CheckCircle,
    RefreshCw,
    X,
    Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";

export default function CreateCouponPage() {
    const [couponCode, setCouponCode] = useState("");
    const [discountType, setDiscountType] = useState("percentage");
    const [discountValue, setDiscountValue] = useState("15");
    const [minRequirement, setMinRequirement] = useState("none");
    const [minPurchaseValue, setMinPurchaseValue] = useState("50");
    const [categories, setCategories] = useState(["Electronics", "Accessories"]);
    const [categoryInput, setCategoryInput] = useState("");
    const [limitTotalUse, setLimitTotalUse] = useState(false);
    const [usageLimitValue, setUsageLimitValue] = useState("100");
    const [limitPerCustomer, setLimitPerCustomer] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createCoupon = useMutation(api.coupons.createCoupon);
    const router = useRouter();

    const handleCreateCoupon = async () => {
        if (!couponCode) {
            alert("Please enter a coupon code");
            return;
        }

        setIsSubmitting(true);
        try {
            await createCoupon({
                code: couponCode,
                discountType: discountType as "percentage" | "fixed" | "shipping",
                discountValue: parseFloat(discountValue) || 0,
                minPurchaseAmount: minRequirement === "amount" ? parseFloat(minPurchaseValue) : undefined,
                applicableCategories: categories.length > 0 ? categories : undefined,
                validFrom: startDate ? new Date(startDate).getTime() : undefined,
                validUntil: endDate ? new Date(endDate).getTime() : undefined,
                usageLimit: limitTotalUse ? parseInt(usageLimitValue) : undefined,
                limitPerCustomer: limitPerCustomer,
                isActive: true,
            });
            router.push("/admin/marketing");
        } catch (error) {
            console.error(error);
            alert("Failed to create coupon: " + (error as any).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const generateCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCouponCode(code);
    };

    const handleAddCategory = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && categoryInput.trim()) {
            e.preventDefault();
            if (!categories.includes(categoryInput.trim())) {
                setCategories([...categories, categoryInput.trim()]);
            }
            setCategoryInput("");
        }
    };

    const removeCategory = (cat: string) => {
        setCategories(categories.filter((c) => c !== cat));
    };

    const getValueSuffix = () => {
        if (discountType === "percentage") return "%";
        if (discountType === "fixed") return "$";
        return "";
    };

    const getSummaryValue = () => {
        if (discountType === "percentage") return `${discountValue || "0"}% Off`;
        if (discountType === "fixed") return `$${discountValue || "0"} Off`;
        if (discountType === "shipping") return "Free Shipping";
        return "---";
    };

    return (
        <main className="flex-1 overflow-y-auto pb-20">
            <div className="max-w-[1024px] mx-auto px-6 lg:px-10 py-8">
                {/* Breadcrumbs */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <Link href="/admin" className="text-muted-foreground text-sm font-medium hover:text-primary">
                        Home
                    </Link>
                    <span className="text-muted-foreground text-sm font-medium">/</span>
                    <Link href="/admin/marketing" className="text-muted-foreground text-sm font-medium hover:text-primary">
                        Marketing
                    </Link>
                    <span className="text-muted-foreground text-sm font-medium">/</span>
                    <span className="text-foreground text-sm font-medium">Create Coupon</span>
                </div>

                {/* Page Heading */}
                <div className="flex flex-wrap justify-between items-end gap-3 mb-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-foreground text-4xl font-black leading-tight tracking-tight">
                            Create New Discount Code
                        </h1>
                        <p className="text-muted-foreground text-base font-normal">
                            Configure your discount rules and customer incentives.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Form Section */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Information Section */}
                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                            <h2 className="text-foreground text-xl font-bold mb-6 flex items-center gap-2">
                                <Info className="size-5 text-primary" />
                                Basic Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">Coupon Code</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                className="flex-1 h-12 uppercase font-mono tracking-wider"
                                                placeholder="e.g. SUMMER24"
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            />
                                            <Button
                                                variant="outline"
                                                onClick={generateCode}
                                                className="gap-2 border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
                                            >
                                                <RefreshCw className="size-4" />
                                                Generate
                                            </Button>
                                        </div>
                                        <p className="text-muted-foreground text-xs">Customers will enter this code at checkout.</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Discount Type</Label>
                                    <Select value={discountType} onValueChange={setDiscountType}>
                                        <SelectTrigger className="h-12">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                                            <SelectItem value="shipping">Free Shipping</SelectItem>
                                            <SelectItem value="bogo">Buy X Get Y</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Discount Value</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            className="h-12 pr-10"
                                            placeholder="15"
                                            value={discountValue}
                                            onChange={(e) => setDiscountValue(e.target.value)}
                                            disabled={discountType === "shipping"}
                                        />
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground font-bold">
                                            {getValueSuffix()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Requirements & Categories */}
                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                            <h2 className="text-foreground text-xl font-bold mb-6 flex items-center gap-2">
                                <ListChecks className="size-5 text-primary" />
                                Requirements
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-foreground text-sm font-semibold mb-3">Minimum Purchase Requirement</p>
                                    <RadioGroup value={minRequirement} onValueChange={setMinRequirement} className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <RadioGroupItem value="none" id="req-none" />
                                            <Label htmlFor="req-none" className="text-sm cursor-pointer">
                                                No minimum requirement
                                            </Label>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <RadioGroupItem value="amount" id="req-amount" />
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="req-amount" className="text-sm cursor-pointer">
                                                    Minimum purchase amount ($)
                                                </Label>
                                                <Input
                                                    className="h-8 w-24 text-xs"
                                                    placeholder="50.00"
                                                    disabled={minRequirement !== "amount"}
                                                    value={minPurchaseValue}
                                                    onChange={(e) => setMinPurchaseValue(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </RadioGroup>
                                </div>
                                <div className="pt-4 border-t border-border">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold">Apply to Specific Categories</Label>
                                        <div className="flex flex-wrap gap-2 p-3 border border-border rounded-lg bg-card min-h-[48px] items-center">
                                            {categories.map((cat) => (
                                                <span
                                                    key={cat}
                                                    className="flex items-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded"
                                                >
                                                    {cat}
                                                    <button onClick={() => removeCategory(cat)}>
                                                        <X className="size-3 cursor-pointer" />
                                                    </button>
                                                </span>
                                            ))}
                                            <input
                                                className="flex-1 outline-none border-none bg-transparent p-0 text-sm placeholder:text-muted-foreground min-w-[120px]"
                                                placeholder="Search categories..."
                                                value={categoryInput}
                                                onChange={(e) => setCategoryInput(e.target.value)}
                                                onKeyDown={handleAddCategory}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Availability & Limits */}
                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                            <h2 className="text-foreground text-xl font-bold mb-6 flex items-center gap-2">
                                <CalendarCheck className="size-5 text-primary" />
                                Availability & Limits
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">Start Date</Label>
                                    <Input
                                        type="date"
                                        className="h-12"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold">End Date (Optional)</Label>
                                    <Input
                                        type="date"
                                        className="h-12"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-2 space-y-4 pt-2">
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            id="limit-total"
                                            checked={limitTotalUse}
                                            onCheckedChange={(checked) => setLimitTotalUse(checked as boolean)}
                                            className="mt-1"
                                        />
                                        <div className="flex flex-col gap-2">
                                            <Label htmlFor="limit-total" className="text-sm font-medium cursor-pointer">
                                                Limit total number of times this code can be used
                                            </Label>
                                            <Input
                                                type="number"
                                                className="h-10 w-32"
                                                placeholder="100"
                                                disabled={!limitTotalUse}
                                                value={usageLimitValue}
                                                onChange={(e) => setUsageLimitValue(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="limit-customer"
                                            checked={limitPerCustomer}
                                            onCheckedChange={(checked) => setLimitPerCustomer(checked as boolean)}
                                        />
                                        <Label htmlFor="limit-customer" className="text-sm font-medium cursor-pointer">
                                            Limit to one use per customer
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-6">
                            <div className="bg-primary/5 p-6 rounded-xl border-2 border-dashed border-primary/30">
                                <h3 className="text-primary text-lg font-bold mb-4 flex items-center gap-2">
                                    <Receipt className="size-5" />
                                    Summary
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Code</span>
                                        <span className="font-bold tracking-wider">{couponCode || "---"}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Type</span>
                                        <span className="font-medium capitalize">{discountType}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Value</span>
                                        <span className="font-bold text-primary">{getSummaryValue()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Applies to</span>
                                        <span className="text-right">
                                            {categories.length > 0 ? "Selected Categories" : "All Products"}
                                        </span>
                                    </div>
                                    <div className="pt-4 border-t border-primary/20">
                                        <p className="text-xs text-muted-foreground leading-relaxed italic">
                                            "A {discountValue || "0"}% discount will be applied to items in{" "}
                                            {categories.length > 0 ? categories.join(" and ") : "all"} categories
                                            {minRequirement === "none" ? " with no minimum purchase requirement" : ""}.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <Button
                                    className="w-full py-6 rounded-xl font-black text-lg shadow-lg shadow-primary/30 gap-2"
                                    onClick={handleCreateCoupon}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <RefreshCw className="size-5 animate-spin" />
                                    ) : (
                                        <CheckCircle className="size-5" />
                                    )}
                                    Create Discount
                                </Button>
                                <Button variant="outline" className="w-full py-4 rounded-xl font-bold" asChild>
                                    <Link href="/admin/marketing">Discard Changes</Link>
                                </Button>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex gap-3">
                                <Lightbulb className="size-5 text-amber-600 shrink-0" />
                                <p className="text-xs text-amber-800 leading-tight">
                                    <strong>Tip:</strong> Percentage discounts are most effective for seasonal sales. Try 10-20% to
                                    boost conversion.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
