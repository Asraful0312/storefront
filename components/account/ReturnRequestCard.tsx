"use client";

import Link from "next/link";
import { Package, RotateCcw, Clock, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReturnRequest, ReturnStatus } from "./returns-types";

interface ReturnRequestCardProps {
    returnRequest: ReturnRequest;
    onViewDetails: (id: string) => void;
}

const statusConfig: Record<
    ReturnStatus,
    { label: string; icon: React.ElementType; className: string; dotClass: string }
> = {
    pending: {
        label: "Pending Review",
        icon: Clock,
        className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        dotClass: "bg-amber-600 dark:bg-amber-400",
    },
    approved: {
        label: "Approved",
        icon: CheckCircle,
        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        dotClass: "bg-blue-600 dark:bg-blue-400",
    },
    processing: {
        label: "Processing",
        icon: RotateCcw,
        className: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        dotClass: "bg-orange-500 animate-pulse",
    },
    completed: {
        label: "Refunded",
        icon: CheckCircle,
        className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        dotClass: "bg-green-600 dark:bg-green-400",
    },
    rejected: {
        label: "Rejected",
        icon: XCircle,
        className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        dotClass: "bg-red-600 dark:bg-red-400",
    },
};

export function ReturnRequestCard({ returnRequest, onViewDetails }: ReturnRequestCardProps) {
    const status = statusConfig[returnRequest.status];
    const StatusIcon = status.icon;
    const isCompleted = returnRequest.status === "completed";
    const isRejected = returnRequest.status === "rejected";

    return (
        <div
            className={cn(
                "group bg-card rounded-xl border border-border shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-300 flex flex-col overflow-hidden",
                (isCompleted || isRejected) && "opacity-80 hover:opacity-100"
            )}
        >
            {/* Header */}
            <div className="px-5 py-4 border-b border-border bg-secondary/50 flex justify-between items-center">
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Return Requested
                    </span>
                    <span className="text-sm font-medium">{returnRequest.returnDate}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Order ID
                    </span>
                    <span className="text-sm font-medium">#{returnRequest.orderId}</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1">
                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary" className={cn("gap-1.5", status.className)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", status.dotClass)} />
                        {status.label}
                    </Badge>
                </div>

                {/* Product Thumbnails */}
                <div className="flex gap-3 mb-4 overflow-hidden">
                    {returnRequest.items.slice(0, 3).map((item) => (
                        <div
                            key={item.id}
                            className="w-14 h-14 rounded-lg bg-secondary overflow-hidden shrink-0 border border-border"
                        >
                            <img
                                src={item.image}
                                alt={item.name}
                                className={cn("w-full h-full object-cover", isRejected && "grayscale")}
                            />
                        </div>
                    ))}
                    {returnRequest.items.length > 3 && (
                        <div className="w-14 h-14 rounded-lg bg-secondary overflow-hidden shrink-0 border border-border flex items-center justify-center text-muted-foreground text-xs font-medium">
                            +{returnRequest.items.length - 3}
                        </div>
                    )}
                </div>

                {/* Reason */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    Reason: {returnRequest.reason}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Refund Amount</span>
                        <span
                            className={cn(
                                "text-lg font-bold",
                                isRejected ? "text-muted-foreground line-through" : "text-foreground"
                            )}
                        >
                            ${returnRequest.refundAmount.toFixed(2)}
                        </span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(returnRequest.id)}
                        className="gap-1"
                    >
                        View Details
                        <ArrowRight className="size-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
