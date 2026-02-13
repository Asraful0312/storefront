"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Search,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Upload,
    Plus,
    MoreVertical,
    TrendingUp,
    TrendingDown,
    Truck,
    Package,
    Settings2,
    Download,
    Trash2,
    Loader2,
    ChevronUp,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn, formatDate } from "@/lib/utils";
import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
    processing: { label: "Processing", className: "bg-blue-100 text-blue-800 border-blue-200" },
    shipped: { label: "Shipped", className: "bg-indigo-100 text-indigo-800 border-indigo-200" },
    delivered: { label: "Delivered", className: "bg-green-100 text-green-800 border-green-200" },
    cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800 border-red-200" },
    returned: { label: "Returned", className: "bg-gray-100 text-gray-800 border-gray-200" },
};

const statusFilters = ["all", "pending", "processing", "shipped", "delivered", "cancelled", "returned"];

export default function AdminOrdersPage() {
    const [activeFilter, setActiveFilter] = useState("all");
    const [expandedOrderId, setExpandedOrderId] = useState<Id<"orders"> | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [dateRange, setDateRange] = useState<{ start: Date | undefined; end: Date | undefined }>({ start: undefined, end: undefined });

    // Simple debounce
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Correct debounce implementation inside component body requires useEffect
    // Using a custom hook or useEffect:
    // We'll just use useEffect.
    /* eslint-disable react-hooks/exhaustive-deps */
    // ignoring for brevity in replacement, but standard useEffect:

    const { results, status, loadMore, isLoading } = usePaginatedQuery(
        api.orders.listAllOrdersPaginated,
        {
            status: activeFilter === "all" ? undefined : (activeFilter as any),
            search: debouncedSearch || undefined,
            dateRange: (dateRange.start && dateRange.end)
                ? { start: dateRange.start.getTime(), end: dateRange.end.getTime() }
                : undefined,
        },
        { initialNumItems: 20 }
    );

    const updateOrderStatus = useMutation(api.orders.updateOrderStatus);
    const deleteOrder = useMutation(api.orders.deleteOrder);

    const toggleExpand = (orderId: Id<"orders">) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
    };

    const handleStatusUpdate = async (orderId: Id<"orders">, newStatus: OrderStatus) => {
        try {
            await updateOrderStatus({ orderId, status: newStatus as any });
            toast.success(`Order status updated to ${newStatus}`);
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error("Failed to update order status");
        }
    };

    const handleDeleteOrder = async (orderId: Id<"orders">) => {
        try {
            await deleteOrder({ id: orderId });
            toast.success("Order deleted successfully");
        } catch (error) {
            console.error("Failed to delete order:", error);
            toast.error("Failed to delete order");
        }
    };

    const stats = useQuery(api.orders.getOrderStats);

    return (
        <>
            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="px-6 md:px-10 py-8 max-w-[1400px] mx-auto flex flex-col gap-8">
                    {/* Page Heading & Actions */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div className="flex flex-col gap-2">
                            <h1 className="text-foreground text-3xl md:text-4xl font-black leading-tight tracking-tight">
                                Order Management
                            </h1>
                            <p className="text-muted-foreground text-base font-normal">
                                Track, process, and manage customer orders.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="gap-2">
                                <Upload className="size-4" />
                                Export CSV
                            </Button>
                            {/* Create Order is usually internal or checkout flow, but keeping button if manual creation needed later */}
                            <Link href="#" className={buttonVariants({ className: "gap-2 opacity-50 cursor-not-allowed" })}>
                                <Plus className="size-4" />
                                Create Order
                            </Link>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-3 rounded-xl p-6 bg-card border border-border shadow-sm relative overflow-hidden group">
                            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="text-6xl text-primary">💰</span>
                            </div>
                            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
                                Total Revenue
                            </p>
                            <div className="flex items-end gap-3">
                                <p className="text-foreground text-3xl font-bold leading-none">
                                    {stats ? `$${(stats.totalRevenue / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "--"}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 rounded-xl p-6 bg-card border border-border shadow-sm relative overflow-hidden group">
                            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="text-6xl text-primary">⏳</span>
                            </div>
                            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
                                Pending Orders
                            </p>
                            <div className="flex items-end gap-3">
                                <p className="text-foreground text-3xl font-bold leading-none">
                                    {stats ? stats.pending : "--"}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 rounded-xl p-6 bg-card border border-border shadow-sm relative overflow-hidden group">
                            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="text-6xl text-primary">📦</span>
                            </div>
                            <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
                                Total Orders
                            </p>
                            <div className="flex items-end gap-3">
                                <p className="text-foreground text-3xl font-bold leading-none">
                                    {stats ? stats.totalOrders : "--"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Main Order Table Card */}
                    <div className="flex flex-col bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        {/* Filters Toolbar */}
                        <div className="p-5 border-b border-border flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-card">
                            {/* Left: Status Chips */}
                            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto no-scrollbar">
                                {statusFilters.map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => setActiveFilter(filter)}
                                        className={cn(
                                            "whitespace-nowrap flex h-9 items-center justify-center gap-x-2 rounded-lg px-4 text-sm font-medium transition-colors",
                                            activeFilter === filter
                                                ? "bg-foreground text-background shadow-md"
                                                : "bg-secondary text-foreground hover:bg-primary/10 hover:text-primary"
                                        )}
                                    >
                                        {filter === "all" ? "All Orders" : statusConfig[filter as OrderStatus]?.label || filter}
                                    </button>
                                ))}
                            </div>

                            {/* Right: Search & Date */}
                            <div className="flex flex-col xl:flex-row gap-3 w-full lg:w-auto items-end">
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground absolute -top-3 left-1">Start Date</label>
                                        <Input
                                            type="date"
                                            className="h-10 w-[140px]"
                                            value={dateRange.start ? dateRange.start.toISOString().split('T')[0] : ""}
                                            onChange={(e) => {
                                                const date = e.target.value ? new Date(e.target.value) : undefined;
                                                if (date) date.setHours(0, 0, 0, 0);
                                                setDateRange(prev => ({ ...prev, start: date }));
                                            }}
                                        />
                                    </div>
                                    <div className="relative">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground absolute -top-3 left-1">End Date</label>
                                        <Input
                                            type="date"
                                            className="h-10 w-[140px]"
                                            value={dateRange.end ? dateRange.end.toISOString().split('T')[0] : ""}
                                            onChange={(e) => {
                                                const date = e.target.value ? new Date(e.target.value) : undefined;
                                                if (date) date.setHours(23, 59, 59, 999);
                                                setDateRange(prev => ({ ...prev, end: date }));
                                            }}
                                        />
                                    </div>
                                    {(dateRange.start || dateRange.end) && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setDateRange({ start: undefined, end: undefined })}
                                            className="h-10 w-10 text-muted-foreground hover:text-destructive"
                                            title="Clear Date Filter"
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    )}
                                </div>
                                <div className="relative min-w-[240px] flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Order #..."
                                        className="pl-10 h-10"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-border">
                                <thead className="bg-secondary/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            Order
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            Customer
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-card divide-y divide-border">
                                    {status === "LoadingFirstPage" ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                                <Loader2 className="size-6 animate-spin mx-auto mb-2" />
                                                Loading orders...
                                            </td>
                                        </tr>
                                    ) : results.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                                No orders found.
                                            </td>
                                        </tr>
                                    ) : (
                                        results.map((order) => {
                                            const isExpanded = expandedOrderId === order._id;
                                            const sConfig = statusConfig[order.status as OrderStatus] || { label: order.status, className: "bg-gray-100 text-gray-800" };

                                            return (
                                                <>
                                                    <tr
                                                        key={order._id}
                                                        className={cn(
                                                            "transition-colors cursor-pointer",
                                                            isExpanded
                                                                ? "bg-primary/5 border-l-4 border-l-primary"
                                                                : "hover:bg-primary/5"
                                                        )}
                                                        onClick={() => toggleExpand(order._id)}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-bold text-primary hover:underline">
                                                                #{order.orderNumber.substring(0, 10)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-foreground">{formatDate(order._creationTime)}</div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div
                                                                    className="h-8 w-8 rounded-full bg-cover bg-center shrink-0 bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground"
                                                                    style={order.customer.avatar ? { backgroundImage: `url('${order.customer.avatar}')` } : {}}
                                                                >
                                                                    {!order.customer.avatar && (order.customer.name.charAt(0) || "?")}
                                                                </div>
                                                                <div className="ml-3">
                                                                    <div className="text-sm font-medium text-foreground">
                                                                        {order.customer.name}
                                                                    </div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {order.customer.email}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span
                                                                className={cn(
                                                                    "px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border",
                                                                    sConfig.className
                                                                )}
                                                            >
                                                                {sConfig.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">
                                                            ${(order.total / 100).toFixed(2)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <button
                                                                className={cn(
                                                                    "text-muted-foreground hover:text-primary transition-colors",
                                                                    isExpanded && "text-primary "
                                                                )}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleExpand(order._id);
                                                                }}
                                                            >
                                                                {isExpanded ? (
                                                                    <ChevronUp className="size-5" />
                                                                ) : (
                                                                    <ChevronDown className="size-5" />
                                                                )}
                                                            </button>
                                                        </td>
                                                    </tr>

                                                    {/* Expanded Detail View */}
                                                    {isExpanded && (
                                                        <tr className="bg-primary/5">
                                                            <td className="px-6 py-6 border-b-2 border-primary/10" colSpan={6}>
                                                                <div className="flex flex-col lg:flex-row gap-8 cursor-default" onClick={(e) => e.stopPropagation()}>
                                                                    {/* Shipping Info */}
                                                                    <div className="flex-1 min-w-[200px]">
                                                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                                                            <Truck className="size-4" /> Shipping Details
                                                                        </h4>
                                                                        <div className="bg-card p-4 rounded-lg border border-border shadow-sm">
                                                                            {order.shippingAddress ? (
                                                                                <>
                                                                                    <p className="font-bold text-foreground mb-1">
                                                                                        {order.shippingAddress.recipientName}
                                                                                    </p>
                                                                                    <p className="text-sm text-muted-foreground mb-1">
                                                                                        {order.shippingAddress.street}
                                                                                        {order.shippingAddress.apartment && `, ${order.shippingAddress.apartment}`}
                                                                                    </p>
                                                                                    <p className="text-sm text-muted-foreground mb-1">
                                                                                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                                                                                    </p>
                                                                                    <p className="text-sm text-muted-foreground mb-1">
                                                                                        {order.shippingAddress.country}
                                                                                    </p>
                                                                                </>
                                                                            ) : (
                                                                                <p className="text-sm text-muted-foreground">No shipping address provided.</p>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Order Items */}
                                                                    <div className="flex-2 min-w-[300px]">
                                                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                                                            <Package className="size-4" /> Items ({order.items.length})
                                                                        </h4>
                                                                        <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
                                                                            {order.items.map((item: any, idx: number) => (
                                                                                <div
                                                                                    key={idx}
                                                                                    className={cn(
                                                                                        "flex items-center gap-4 p-3",
                                                                                        idx < order.items.length - 1 && "border-b border-border"
                                                                                    )}
                                                                                >
                                                                                    <div
                                                                                        className="h-12 w-12 rounded bg-cover bg-center shrink-0 bg-secondary"
                                                                                        style={item.image ? { backgroundImage: `url('${item.image}')` } : {}}
                                                                                    />
                                                                                    <div className="flex-1">
                                                                                        <p className="text-sm font-medium text-foreground">
                                                                                            {item.name}
                                                                                        </p>
                                                                                        <p className="text-xs text-muted-foreground">
                                                                                            SKU: {item.sku || "N/A"}
                                                                                        </p>
                                                                                    </div>
                                                                                    <div className="text-right">
                                                                                        <p className="text-sm font-bold text-foreground">
                                                                                            ${(item.price / 100).toFixed(2)}
                                                                                        </p>
                                                                                        <p className="text-xs text-muted-foreground">
                                                                                            Qty: {item.quantity}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    {/* Order Actions */}
                                                                    <div className="flex-1 min-w-[200px] mb-4">
                                                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                                                                            <Settings2 className="size-4" /> Actions
                                                                        </h4>
                                                                        <div className="bg-card p-4 rounded-lg border border-border shadow-sm h-full flex flex-col justify-between gap-4">
                                                                            <div className="space-y-3">
                                                                                <label className="block text-xs font-medium text-muted-foreground">
                                                                                    Update Status
                                                                                </label>
                                                                                <Select
                                                                                    defaultValue={order.status}
                                                                                    onValueChange={(val) => handleStatusUpdate(order._id, val as OrderStatus)}
                                                                                >
                                                                                    <SelectTrigger>
                                                                                        <SelectValue />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        <SelectItem value="pending">Pending</SelectItem>
                                                                                        <SelectItem value="processing">Processing</SelectItem>
                                                                                        <SelectItem value="shipped">Shipped</SelectItem>
                                                                                        <SelectItem value="delivered">Delivered</SelectItem>
                                                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                                                        <SelectItem value="returned">Returned</SelectItem>
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>

                                                                            <div className="pt-4 border-t border-border flex flex-col gap-2">
                                                                                <AlertDialog>
                                                                                    <AlertDialogTrigger asChild>
                                                                                        <Button variant="destructive" className="w-full gap-2">
                                                                                            <Trash2 className="size-4" /> Delete Order
                                                                                        </Button>
                                                                                    </AlertDialogTrigger>
                                                                                    <AlertDialogContent>
                                                                                        <AlertDialogHeader>
                                                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                                            <AlertDialogDescription>
                                                                                                This action cannot be undone. This will permanently delete the order record.
                                                                                            </AlertDialogDescription>
                                                                                        </AlertDialogHeader>
                                                                                        <AlertDialogFooter>
                                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                            <AlertDialogAction onClick={() => handleDeleteOrder(order._id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                                                                Delete
                                                                                            </AlertDialogAction>
                                                                                        </AlertDialogFooter>
                                                                                    </AlertDialogContent>
                                                                                </AlertDialog>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border sm:px-6">
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Showing <span className="font-medium text-foreground">{results.length}</span> results
                                    </p>
                                </div>
                                <div>
                                    {status === "CanLoadMore" && (
                                        <Button variant="outline" onClick={() => loadMore(20)} disabled={isLoading}>
                                            {isLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                                            Load More
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Mobile Pagination */}
                            <div className="flex items-center justify-center sm:hidden w-full">
                                {status === "CanLoadMore" && (
                                    <Button variant="outline" onClick={() => loadMore(20)} disabled={isLoading}>
                                        Load More
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
