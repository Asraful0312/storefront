"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string;
    changePercent: number;
    isPositive?: boolean;
}

export function StatCard({ title, value, changePercent, isPositive = true }: StatCardProps) {
    return (
        <div className="flex flex-col justify-between gap-4 rounded-xl p-5 bg-card border border-border shadow-sm relative overflow-hidden group hover:border-primary/30 transition-colors">
            <div className="flex justify-between items-start z-10">
                <div>
                    <p className="text-muted-foreground text-sm font-medium leading-normal">{title}</p>
                    <p className="text-foreground tracking-tight text-3xl font-bold leading-tight mt-1">
                        {value}
                    </p>
                </div>
                <div
                    className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded text-xs font-bold",
                        isPositive
                            ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                            : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                    )}
                >
                    {isPositive ? (
                        <TrendingUp className="size-3.5" />
                    ) : (
                        <TrendingDown className="size-3.5" />
                    )}
                    {Math.abs(changePercent)}%
                </div>
            </div>

            {/* Sparkline SVG */}
            <div className="h-12 w-full mt-2 relative opacity-60">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 40">
                    <defs>
                        <linearGradient id="sparklineGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path
                        d="M0 35 Q 10 30, 20 32 T 40 25 T 60 15 T 80 20 T 100 5"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                    />
                    <path
                        d="M0 35 Q 10 30, 20 32 T 40 25 T 60 15 T 80 20 T 100 5 V 40 H 0 Z"
                        fill="url(#sparklineGradient)"
                        opacity="0.2"
                    />
                </svg>
            </div>
        </div>
    );
}
