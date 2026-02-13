"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AdminOrderStatus = "shipped" | "pending" | "processing" | "cancelled" | "delivered";

export interface RecentOrder {
    id: string;
    orderId: string;
    customer: string;
    status: AdminOrderStatus;
    total: number;
}

interface RecentOrdersTableProps {
    orders: RecentOrder[];
}

const statusConfig: Record<AdminOrderStatus, { label: string; className: string }> = {
    shipped: {
        label: "Shipped",
        className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    },
    pending: {
        label: "Pending",
        className: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
    },
    processing: {
        label: "Processing",
        className: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    },
    cancelled: {
        label: "Cancelled",
        className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
    },
    delivered: {
        label: "Delivered",
        className: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    },
};

export function RecentOrdersTable({ orders }: RecentOrdersTableProps) {
    return (
        <div className="lg:col-span-2 rounded-xl bg-card border border-border shadow-sm flex flex-col">
            <div className="p-5 flex justify-between items-center border-b border-border">
                <h3 className="text-foreground text-lg font-bold">Recent Orders</h3>
                <Link href="/admin/orders" className="text-primary text-sm font-semibold hover:text-primary/80">
                    View All
                </Link>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-secondary/50">
                        <tr>
                            <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Order ID
                            </th>
                            <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Customer
                            </th>
                            <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                Status
                            </th>
                            <th className="p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">
                                Total
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {orders.map((order) => {
                            const status = statusConfig[order.status];
                            return (
                                <tr key={order.id} className="hover:bg-secondary/30 transition-colors">
                                    <td className="p-4 text-sm text-foreground font-medium">#{order.orderId}</td>
                                    <td className="p-4 text-sm text-foreground">{order.customer}</td>
                                    <td className="p-4">
                                        <Badge className={cn("text-xs", status.className)}>{status.label}</Badge>
                                    </td>
                                    <td className="p-4 text-sm text-foreground font-medium text-right">
                                        ${order.total.toFixed(2)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
