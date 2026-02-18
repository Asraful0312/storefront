"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Mail, Phone, MapPin, Star, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

const statusConfig = {
    shipped: { label: "Shipped", className: "bg-blue-100 text-blue-700" },
    delivered: { label: "Delivered", className: "bg-green-100 text-green-700" },
    processing: { label: "Processing", className: "bg-orange-100 text-orange-700" },
    pending: { label: "Pending", className: "bg-gray-100 text-gray-700" },
    cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700" },
    returned: { label: "Returned", className: "bg-gray-200 text-gray-700" },
};

export default function CustomerDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = use(params);
    const userId = resolvedParams.id as Id<"users">;

    // Fetch data from Convex
    const customer = useQuery(api.users.getUserById, { userId });
    const orders = useQuery(api.orders.getOrdersForUser, { userId, limit: 10 });
    const addresses = useQuery(api.addresses.getAddressesForUser, { userId });

    // Mutations
    const updateUserAdminInfo = useMutation(api.users.updateUserAdminInfo);

    // Local state for notes
    const [notes, setNotes] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);

    // Update notes when customer data loads
    if (customer?.notes && notes === "") {
        setNotes(customer.notes);
    }

    const handleSaveNotes = async () => {
        setIsSaving(true);
        try {
            await updateUserAdminInfo({
                userId,
                notes,
                tags: customer?.tags,
            });
        } catch (error) {
            console.error("Failed to save notes:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Loading state
    if (customer === undefined) {
        return (
            <main className="flex-1 px-6 md:px-12 lg:px-40 py-8">
                <div className="max-w-[1200px] mx-auto">
                    <div className="flex flex-wrap gap-2 pb-4">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-5 w-4" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                    <div className="flex bg-card rounded-xl p-6 border border-border mb-6">
                        <Skeleton className="h-32 w-32 rounded-xl" />
                        <div className="ml-6 space-y-2">
                            <Skeleton className="h-8 w-48" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                    </div>
                    <Skeleton className="h-64 w-full" />
                </div>
            </main>
        );
    }

    // Not found
    if (customer === null) {
        return (
            <main className="flex-1 px-6 md:px-12 lg:px-40 py-8">
                <div className="max-w-[1200px] mx-auto text-center py-16">
                    <h1 className="text-2xl font-bold mb-4">Customer Not Found</h1>
                    <Button asChild>
                        <Link href="/admin/customers">
                            <ArrowLeft className="size-4 mr-2" />
                            Back to Customers
                        </Link>
                    </Button>
                </div>
            </main>
        );
    }

    const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Unknown";
    const isVip = customer.tags?.includes("VIP") ?? false;
    const defaultAddress = addresses?.find((a) => a.isDefault);
    const formattedAddress = defaultAddress
        ? `${defaultAddress.street}\n${defaultAddress.city}, ${defaultAddress.state} ${defaultAddress.zipCode}`
        : "No address on file";

    // Calculate stats from orders
    const lifetimeValue = (orders ?? []).reduce((sum, o) => sum + o.total, 0);
    const avgOrderValue = orders && orders.length > 0 ? lifetimeValue / orders.length : 0;
    const totalItems = (orders ?? []).reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

    return (
        <main className="flex-1 px-6 md:px-12 lg:px-40 py-8">
            <div className="max-w-[1200px] mx-auto">
                {/* Breadcrumbs */}
                <div className="flex flex-wrap gap-2 pb-4">
                    <Link href="/admin/customers" className="text-muted-foreground text-sm font-medium hover:underline">
                        Customers
                    </Link>
                    <span className="text-muted-foreground text-sm font-medium">/</span>
                    <span className="text-foreground text-sm font-medium">{fullName}</span>
                </div>

                {/* Profile Header */}
                <div className="flex bg-card rounded-xl p-6 border border-border mb-6">
                    <div className="flex w-full flex-col gap-6 md:flex-row md:justify-between md:items-center">
                        <div className="flex gap-6">
                            <div
                                className="bg-center bg-no-repeat aspect-square bg-cover rounded-xl min-h-32 w-32 shadow-sm bg-primary/10 flex items-center justify-center text-primary text-4xl font-bold"
                                style={customer.avatarUrl ? { backgroundImage: `url('${customer.avatarUrl}')` } : {}}
                            >
                                {!customer.avatarUrl && (fullName.charAt(0) || "?")}
                            </div>
                            <div className="flex flex-col justify-center">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-foreground text-2xl md:text-[28px] font-bold leading-tight tracking-tight">
                                        {fullName}
                                    </h1>
                                    {isVip && (
                                        <span className="px-3 py-1 bg-amber-500/10 text-amber-600 text-xs font-bold uppercase tracking-wider rounded-full border border-amber-500/30 flex items-center gap-1">
                                            <Star className="size-3 fill-current" />
                                            VIP
                                        </span>
                                    )}
                                </div>
                                <p className="text-muted-foreground text-base font-normal mt-1">
                                    Customer since {new Date(customer._creationTime).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="size-2 rounded-full bg-green-500" />
                                    <span className="text-green-600 text-sm font-medium capitalize">{customer.role}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button variant="secondary" asChild>
                                <Link href={`/admin/customers/${userId}/edit`}>Edit Profile</Link>
                            </Button>
                            <Button className="gap-2 shadow-lg shadow-primary/20">
                                <Mail className="size-4" />
                                Send Email
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Layout Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column: Order History */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="bg-card rounded-xl border border-border overflow-hidden">
                            <div className="px-6 py-5 border-b border-border flex justify-between items-center">
                                <h2 className="text-foreground text-xl font-bold">Order History</h2>
                                <button className="text-primary text-sm font-bold hover:underline">View All</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-secondary/50">
                                            <th className="px-6 py-3 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                                                Order ID
                                            </th>
                                            <th className="px-6 py-3 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-muted-foreground text-xs font-bold uppercase tracking-wider text-right">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {(orders ?? []).length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                                    No orders yet
                                                </td>
                                            </tr>
                                        ) : (
                                            (orders ?? []).map((order) => {
                                                const status = statusConfig[order.status];
                                                return (
                                                    <tr key={order._id} className="hover:bg-secondary/30 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-foreground">
                                                            #{order.orderNumber.substring(0, 16)}
                                                        </td>
                                                        <td className="px-6 py-4 text-muted-foreground text-sm">
                                                            {new Date(order._creationTime).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${status.className}`}>
                                                                {status.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-semibold">
                                                            ${(order.total / 100).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Notes Section */}
                        <div className="bg-card rounded-xl border border-border p-6">
                            <h2 className="text-foreground text-xl font-bold mb-4">Internal Admin Notes</h2>
                            <Textarea
                                className="min-h-32 bg-secondary/50"
                                placeholder="Add a note about this customer for the team..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                            <div className="flex justify-end mt-4">
                                <Button
                                    variant="secondary"
                                    className="hover:bg-primary hover:text-white"
                                    onClick={handleSaveNotes}
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="size-4 mr-2 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        "Save Note"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Stats & Contact */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="flex flex-col gap-2 rounded-xl p-6 bg-card border border-border shadow-sm">
                                <div className="flex justify-between items-start">
                                    <p className="text-muted-foreground text-sm font-medium">Lifetime Value</p>
                                </div>
                                <p className="text-foreground text-2xl font-bold">${(lifetimeValue / 100).toFixed(2)}</p>
                            </div>
                            <div className="flex flex-col gap-2 rounded-xl p-6 bg-card border border-border shadow-sm">
                                <div className="flex justify-between items-start">
                                    <p className="text-muted-foreground text-sm font-medium">Avg Order Value</p>
                                </div>
                                <p className="text-foreground text-2xl font-bold">${(avgOrderValue / 100).toFixed(2)}</p>
                            </div>
                            <div className="flex flex-col gap-2 rounded-xl p-6 bg-card border border-border shadow-sm">
                                <div className="flex justify-between items-start">
                                    <p className="text-muted-foreground text-sm font-medium">Total Items</p>
                                </div>
                                <p className="text-foreground text-2xl font-bold">{totalItems}</p>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                            <h3 className="text-foreground text-lg font-bold mb-4">Contact Information</h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Mail className="size-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Email Address</p>
                                        <p className="text-sm font-medium text-primary">{customer.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="size-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Phone Number</p>
                                        <p className="text-sm font-medium">{customer.phone || "Not provided"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 pt-4 border-t border-border">
                                    <MapPin className="size-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wide">Shipping Address</p>
                                        <p className="text-sm font-medium leading-relaxed whitespace-pre-line">{formattedAddress}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Marketing Preferences */}
                        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                            <h3 className="text-foreground text-lg font-bold mb-4">Marketing Prefs</h3>
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Email Newsletter</span>
                                    <span className={customer.marketingPrefs?.emailNewsletter ? "text-green-600 font-bold" : "text-muted-foreground"}>
                                        {customer.marketingPrefs?.emailNewsletter ? "Subscribed" : "Unsubscribed"}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">SMS Notifications</span>
                                    <span className={customer.marketingPrefs?.smsNotifications ? "text-green-600 font-bold" : "text-muted-foreground"}>
                                        {customer.marketingPrefs?.smsNotifications ? "Enabled" : "Disabled"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
