"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LowStockItem {
    id: string;
    name: string;
    image: string;
    productId: string;
    stockLeft: number;
}

interface LowStockAlertsProps {
    items: LowStockItem[];
}

export function LowStockAlerts({ items }: LowStockAlertsProps) {
    return (
        <div className="rounded-xl bg-card border border-border shadow-sm flex flex-col">
            <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="text-foreground text-lg font-bold">Low Stock Alerts</h3>
                <AlertTriangle className="size-5 text-red-500" />
            </div>
            <div className="flex flex-col p-2">
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group"
                    >
                        <div
                            className="size-12 rounded-lg bg-secondary bg-cover bg-center border border-border shrink-0"
                            style={{ backgroundImage: `url('${item.image}')` }}
                        />
                        <div className="flex flex-col flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">ID: {item.productId}</p>
                        </div>
                        <div className="text-right">
                            <p
                                className={cn(
                                    "text-sm font-bold",
                                    item.stockLeft <= 5
                                        ? "text-red-600 dark:text-red-400"
                                        : "text-orange-600 dark:text-orange-400"
                                )}
                            >
                                {item.stockLeft} left
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                                {item.stockLeft <= 5 ? "Reorder Now" : "Low Stock"}
                            </p>
                        </div>
                    </div>
                ))}
                <Button
                    variant="outline"
                    className="mt-2 w-full border-dashed text-xs font-semibold text-muted-foreground hover:text-primary hover:border-primary/50"
                >
                    View Inventory Report
                </Button>
            </div>
        </div>
    );
}
