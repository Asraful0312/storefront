"use client";

import { useState } from "react";
import { Download, CreditCard, TrendingUp, MapPin, Package, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2 } from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from "recharts";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";

const timeRanges = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
] as const;

type TimeRange = "daily" | "weekly" | "monthly";

// Chart Configs
const revenueChartConfig = {
    revenue: {
        label: "Revenue",
        color: "hsl(var(--primary))",
    },
} satisfies ChartConfig;

const categoryChartConfig = {
    revenue: {
        label: "Revenue",
    },
    // Dynamic colors will be assigned in component
} satisfies ChartConfig;

// COLORS for Pie Chart
const COLORS = [
    "hsl(var(--primary))",
    "hsl(210, 80%, 55%)",
    "hsl(145, 65%, 42%)",
    "hsl(35, 90%, 55%)",
    "hsl(0, 70%, 55%)",
];

export default function AdminAnalyticsPage() {
    const [activeRange, setActiveRange] = useState<TimeRange>("monthly");
    
    // Fetch analytics data
    const data = useQuery(api.dashboard.getAnalytics, { range: activeRange });

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

    const formatCompactCurrency = (val: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(val);

    return (
        <main className="flex-1 flex flex-col overflow-y-auto">
            <div className="p-8 space-y-8 max-w-[1600px] mx-auto w-full">
                {/* Page Heading */}
                <div className="flex flex-wrap justify-between items-end gap-4">
                    <div className="space-y-1">
                        <h3 className="text-3xl font-black tracking-tight text-foreground leading-tight">
                            Financial Performance
                        </h3>
                        <p className="text-muted-foreground text-base">
                            Real-time revenue and expense tracking across channels
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-card p-1 rounded-xl shadow-sm border border-border">
                        {timeRanges.map((range) => (
                            <button
                                key={range.value}
                                onClick={() => setActiveRange(range.value)}
                                className={cn(
                                    "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                                    activeRange === range.value
                                        ? "bg-primary text-white shadow-md"
                                        : "hover:bg-secondary"
                                )}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                    <Button className="gap-2 shadow-lg shadow-primary/20">
                        <Download className="size-4" />
                        Export Report
                    </Button>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Large Main Chart & KPIs */}
                    <div className="col-span-12 lg:col-span-9 space-y-6">
                        {/* Revenue Chart */}
                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                                    {data ? (
                                        <div className="flex items-center gap-3">
                                            <h4 className="text-3xl font-black text-foreground">
                                                {formatCurrency(data.totalRevenue)}
                                            </h4>
                                            <span
                                                className={cn(
                                                    "text-sm font-bold flex items-center px-2 py-0.5 rounded",
                                                    data.revenueChange >= 0
                                                        ? "text-green-600 bg-green-500/10"
                                                        : "text-red-600 bg-red-500/10"
                                                )}
                                            >
                                                {data.revenueChange >= 0 ? "+" : ""}
                                                {data.revenueChange.toFixed(1)}%
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="h-9 w-32 bg-secondary animate-pulse rounded mt-1" />
                                    )}
                                </div>
                            </div>
                            
                            <div className="h-80 w-full">
                                {data ? (
                                    <ChartContainer config={revenueChartConfig} className="h-full w-full">
                                        <AreaChart
                                            data={data.chartData}
                                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                        >
                                            <defs>
                                                <linearGradient id="analyticsRevenueParams" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={10}
                                                tickFormatter={(value) => {
                                                    if (activeRange === "daily") return value; 
                                                    const d = new Date(value);
                                                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                                }}
                                                minTickGap={30}
                                            />
                                            <YAxis
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={10}
                                                tickFormatter={(v) => formatCompactCurrency(v)}
                                            />
                                            <ChartTooltip
                                                content={
                                                    <ChartTooltipContent
                                                        formatter={(value) => formatCurrency(value as number)}
                                                    />
                                                }
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke="hsl(var(--primary))"
                                                strokeWidth={3}
                                                fill="url(#analyticsRevenueParams)"
                                            />
                                        </AreaChart>
                                    </ChartContainer>
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                        <Loader2 className="size-8 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* KPI Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Conversion Card */}
                            <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                                    <BarChart3 className="size-5 text-primary" />
                                </div>
                                <div className="flex items-end justify-between">
                                    {data ? (
                                        <div>
                                            <h5 className="text-2xl font-bold text-foreground">
                                                {data.conversionRate.toFixed(2)}%
                                            </h5>
                                            <p
                                                className={cn(
                                                    "text-[10px] font-bold",
                                                    data.conversionChange >= 0 ? "text-green-600" : "text-red-600"
                                                )}
                                            >
                                                {data.conversionChange >= 0 ? "+" : ""}
                                                {data.conversionChange.toFixed(2)}% from prev period
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="h-8 w-24 bg-secondary animate-pulse rounded" />
                                            <div className="h-3 w-32 bg-secondary animate-pulse rounded" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* AOV Card */}
                            <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-sm font-medium text-muted-foreground">Avg. Order Value</p>
                                    <CreditCard className="size-5 text-amber-400" />
                                </div>
                                <div className="flex items-end justify-between">
                                    {data ? (
                                        <div>
                                            <h5 className="text-2xl font-bold text-foreground">
                                                {formatCurrency(data.aov)}
                                            </h5>
                                            <p
                                                className={cn(
                                                    "text-[10px] font-bold",
                                                    data.aovChange >= 0 ? "text-green-600" : "text-red-600"
                                                )}
                                            >
                                                {data.aovChange >= 0 ? "+" : ""}
                                                {data.aovChange.toFixed(1)}% vs prev period
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <div className="h-8 w-24 bg-secondary animate-pulse rounded" />
                                            <div className="h-3 w-32 bg-secondary animate-pulse rounded" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Top Categories Donut */}
                            <div className="bg-card p-5 rounded-xl border border-border shadow-sm flex flex-col">
                                <p className="text-sm font-medium text-muted-foreground mb-3">Top Categories</p>
                                {data ? (
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="h-24 w-24 relative">
                                            <ChartContainer config={categoryChartConfig} className="h-full w-full">
                                                <PieChart>
                                                    <Pie
                                                        data={data.categoryData}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={25}
                                                        outerRadius={40}
                                                        paddingAngle={5}
                                                    >
                                                        {data.categoryData.map((entry, index) => (
                                                            <Cell
                                                                key={`cell-${index}`}
                                                                fill={COLORS[index % COLORS.length]}
                                                            />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip 
                                                        formatter={(value: number) => formatCurrency(value)}
                                                        content={<ChartTooltipContent hideLabel />}
                                                    />
                                                </PieChart>
                                            </ChartContainer>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            {data.categoryData.slice(0, 3).map((cat, idx) => (
                                                <div key={cat.name} className="flex justify-between text-[10px] font-bold">
                                                    <div className="flex items-center gap-1.5">
                                                        <div 
                                                            className="size-2 rounded-full" 
                                                            style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                                                        />
                                                        <span className="truncate max-w-[80px]">{cat.name}</span>
                                                    </div>
                                                    <span>
                                                        {((cat.value / data.totalRevenue) * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-24">
                                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar Content */}
                    <div className="col-span-12 lg:col-span-3 space-y-6">
                        {/* Sales by Region */}
                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h5 className="text-sm font-bold">Sales by Region</h5>
                                <MapPin className="size-4 text-muted-foreground" />
                            </div>
                            
                            {data ? (
                                <div className="space-y-4">
                                    {data.regionData.length > 0 ? (
                                        data.regionData.slice(0, 5).map((region, idx) => (
                                            <div key={region.name} className="space-y-1">
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="font-medium">{region.name}</span>
                                                    <span className="font-bold">
                                                        {((region.value / data.totalRevenue) * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${(region.value / data.totalRevenue) * 100}%`,
                                                            backgroundColor: COLORS[idx % COLORS.length],
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-muted-foreground text-center py-4">No regional data available</p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between">
                                                <div className="h-3 w-16 bg-secondary animate-pulse rounded" />
                                                <div className="h-3 w-8 bg-secondary animate-pulse rounded" />
                                            </div>
                                            <div className="h-1.5 w-full bg-secondary animate-pulse rounded-full" />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Top Products */}
                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h5 className="text-sm font-bold">Top Products</h5>
                                <Package className="size-4 text-muted-foreground" />
                            </div>
                            
                            {data ? (
                                <div className="space-y-4">
                                    {data.topProducts.map((product) => (
                                        <div key={product.id} className="flex items-center gap-3">
                                            <div
                                                className="size-10 rounded-lg bg-cover bg-center bg-secondary border border-border shrink-0"
                                                style={{ backgroundImage: `url('${product.image || ""}')` }}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold truncate">{product.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{product.units} units sold</p>
                                            </div>
                                            <p className="text-xs font-bold">{formatCompactCurrency(product.revenue)}</p>
                                        </div>
                                    ))}
                                    {data.topProducts.length === 0 && (
                                        <p className="text-xs text-muted-foreground text-center py-4">No products found for this period</p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="size-10 bg-secondary animate-pulse rounded-lg" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 w-3/4 bg-secondary animate-pulse rounded" />
                                                <div className="h-2 w-1/2 bg-secondary animate-pulse rounded" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
