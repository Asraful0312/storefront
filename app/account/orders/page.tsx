"use client";

import { useState } from "react";
import { ChevronDown, Filter } from "lucide-react";
import { Header, Footer, Breadcrumb } from "@/components/storefront";
import { AccountSidebar, OrderCard, Pagination } from "@/components/account";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDate } from "@/lib/utils";

export default function OrderHistoryPage() {
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [dateRange, setDateRange] = useState<string>("all");

    // Pagination
    const { results, status, loadMore } = usePaginatedQuery(
        api.orders.listUserOrdersPaginated,
        { status: filterStatus === "all" ? undefined : (filterStatus as any) },
        { initialNumItems: 5 }
    );

    const breadcrumbItems = [
        { label: "Home", href: "/" },
        { label: "My Account", href: "/account" },
        { label: "Order History" },
    ];

    const handleReorder = (orderId: string) => {
        console.log("Reordering:", orderId);
        // Implement reorder logic here (e.g., add items to cart)
    };

    // Client-side filtering if backend filtering isn't perfect yet,
    // although we are passing status to backend, our backend implementation
    // currently ignores it for pagination reasons (as noted in comments).
    // So we filter here for display.
    const filteredOrders = (results || []).filter(order =>
        filterStatus === "all" || order?.status === filterStatus
    );

    return (
        <>
            <Header />

            <div className="grow w-full max-w-7xl mx-auto px-4 md:px-10 py-8">
                {/* Breadcrumbs */}
                <div className="mb-6">
                    <Breadcrumb items={breadcrumbItems} />
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
                    {/* Sidebar */}
                    <AccountSidebar userName="User" />

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        {/* Page Header & Filters */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight mb-2">Order History</h2>
                                <p className="text-muted-foreground">Track, return, or buy things again</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="gap-2" variant="outline">
                                            {filterStatus === "all" ? "All Orders" : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                                            <ChevronDown className="size-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                                            All Orders
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setFilterStatus("delivered")}>
                                            Delivered
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setFilterStatus("shipped")}>
                                            Shipped
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setFilterStatus("processing")}>
                                            Processing
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setFilterStatus("returned")}>
                                            Returned
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setFilterStatus("cancelled")}>
                                            Cancelled
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Date Range - Filtering not implemented yet for MVP */}
                                <Button variant="outline" onClick={() => setDateRange("30days")} className="hidden md:flex">
                                    Last 30 Days
                                </Button>
                            </div>
                        </div>

                        {/* Orders Grid */}
                        {status === "LoadingFirstPage" ? (
                            <div className="py-20 text-center">Loading orders...</div>
                        ) : filteredOrders.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredOrders.map((order) => (
                                    <OrderCard
                                        key={order._id}
                                        order={{
                                            id: order._id,
                                            orderId: order.orderNumber,
                                            date: formatDate(order._creationTime),
                                            status: order.status as any,
                                            total: order.total,
                                            items: order.items.map((item: any) => ({
                                                id: item.productId,
                                                name: item.name,
                                                image: item.image || "",
                                                // Assuming OrderCard types might need adjustment if it strictly requires exact properties
                                                // Looking at OrderCard usage, it uses id, name, image.
                                            }))
                                        }}
                                        onReorder={handleReorder}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16">
                                <div className="text-6xl mb-4">📦</div>
                                <h3 className="text-xl font-bold mb-2">No orders found</h3>
                                <p className="text-muted-foreground">
                                    You don't have any orders matching this filter.
                                </p>
                            </div>
                        )}

                        {/* Load More Button */}
                        {status === "CanLoadMore" && (
                            <div className="mt-10 flex justify-center">
                                <Button
                                    variant="outline"
                                    onClick={() => loadMore(5)}
                                    className="min-w-[200px]"
                                >
                                    Load More
                                </Button>
                            </div>
                        )}
                        {status === "LoadingMore" && (
                            <div className="mt-10 flex justify-center text-muted-foreground">
                                Loading more...
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <Footer />
        </>
    );
}
