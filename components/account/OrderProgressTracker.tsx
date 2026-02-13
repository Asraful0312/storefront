"use client";

import { Check, Package, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export type OrderTrackingStatus = "ordered" | "processed" | "shipped" | "delivered";

interface TrackingStep {
    status: OrderTrackingStatus;
    label: string;
    date: string;
    isCurrent?: boolean;
    isCompleted?: boolean;
}

interface OrderProgressTrackerProps {
    steps: TrackingStep[];
}

const statusIcons: Record<OrderTrackingStatus, React.ReactNode> = {
    ordered: <Check className="size-5" />,
    processed: <Check className="size-5" />,
    shipped: <Truck className="size-5" />,
    delivered: <Package className="size-5" />,
};

export function OrderProgressTracker({ steps }: OrderProgressTrackerProps) {
    const completedCount = steps.filter((s) => s.isCompleted).length;
    const progressWidth = `${(completedCount / (steps.length - 1)) * 100}%`;

    return (
        <div className="w-full mb-12 overflow-x-auto pb-4 md:pb-0">
            <div className="min-w-[600px] flex items-center justify-between relative">
                {/* Background Line */}
                <div className="absolute left-0 top-5 w-full h-[2px] bg-border -z-10" />

                {/* Progress Line */}
                <div
                    className="absolute left-0 top-5 h-[2px] bg-primary -z-10 transition-all duration-500"
                    style={{ width: progressWidth }}
                />

                {/* Steps */}
                {steps.map((step, index) => (
                    <div
                        key={step.status}
                        className="flex flex-col items-center gap-3 bg-background px-2 z-10"
                    >
                        <div
                            className={cn(
                                "size-10 rounded-full flex items-center justify-center ring-4 ring-background transition-all",
                                step.isCompleted || step.isCurrent
                                    ? "bg-primary text-white shadow-md"
                                    : "bg-card border-2 border-border text-muted-foreground",
                                step.isCurrent && "shadow-lg shadow-primary/20 animate-pulse"
                            )}
                        >
                            {statusIcons[step.status]}
                        </div>
                        <span
                            className={cn(
                                "text-sm font-bold",
                                step.isCompleted || step.isCurrent ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            {step.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{step.date}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
