"use client";

import { useState } from "react";
import {
    AdminHeader,
    StatCard,
    RecentOrdersTable,
    LowStockAlerts,
    type RecentOrder,
    type LowStockItem,
} from "@/components/admin";
import { Button } from "@/components/ui/button";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2 } from "lucide-react";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    BarChart,
    Bar,
} from "recharts";

// Chart configs
const salesChartConfig = {
    revenue: {
        label: "Revenue",
        color: "hsl(var(--primary))",
    },
} satisfies ChartConfig;

const statusChartConfig = {
    count: {
        label: "Orders",
        color: "hsl(var(--primary))",
    },
    pending: { label: "Pending", color: "hsl(35, 90%, 55%)" },
    processing: { label: "Processing", color: "hsl(210, 80%, 55%)" },
    shipped: { label: "Shipped", color: "hsl(260, 70%, 60%)" },
    delivered: { label: "Delivered", color: "hsl(145, 65%, 42%)" },
    cancelled: { label: "Cancelled", color: "hsl(0, 0%, 55%)" },
    returned: { label: "Returned", color: "hsl(0, 70%, 55%)" },
} satisfies ChartConfig;

const STATUS_COLORS: Record<string, string> = {
    pending: "hsl(35, 90%, 55%)",
    processing: "hsl(210, 80%, 55%)",
    shipped: "hsl(260, 70%, 60%)",
    delivered: "hsl(145, 65%, 42%)",
    cancelled: "hsl(0, 0%, 55%)",
    returned: "hsl(0, 70%, 55%)",
};

type ChartPeriod = 30 | 90 | 365;

export default function AdminDashboardPage() {
    const [chartPeriod, setChartPeriod] = useState<ChartPeriod>(30);

    // Backend queries
    const stats = useQuery(api.dashboard.getDashboardStats);
    const recentOrders = useQuery(api.dashboard.getRecentOrders);
    const lowStockProducts = useQuery(api.dashboard.getLowStockProducts);
    const salesData = useQuery(api.dashboard.getSalesChartData, { days: chartPeriod });
    const statusDistribution = useQuery(api.dashboard.getOrderStatusDistribution);

    const periodLabel: Record<ChartPeriod, string> = {
        30: "30 Days",
        90: "90 Days",
        365: "12 Months",
    };

    // Format currency
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);

    const formatCompactCurrency = (val: number) =>
        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(val);

    return (
        <>
            <AdminHeader />

            <div className="px-6 pb-8 flex flex-col gap-6 max-w-[1400px] mx-auto w-full">
                {/* KPI Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats ? (
                        <>
                            <StatCard
                                title="Total Revenue"
                                value={formatCurrency(stats.totalRevenue)}
                                changePercent={Math.abs(stats.revenueChange)}
                                isPositive={stats.revenueChange >= 0}
                            />
                            <StatCard
                                title="Total Orders"
                                value={stats.totalOrders.toLocaleString()}
                                changePercent={Math.abs(stats.ordersChange)}
                                isPositive={stats.ordersChange >= 0}
                            />
                            <StatCard
                                title="Active Users"
                                value={stats.totalUsers.toLocaleString()}
                                changePercent={Math.abs(stats.usersChange)}
                                isPositive={stats.usersChange >= 0}
                            />
                        </>
                    ) : (
                        <>
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-center h-[140px] rounded-xl bg-card border border-border shadow-sm"
                                >
                                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                                </div>
                            ))}
                        </>
                    )}
                </div>

                {/* Sales Trends Chart */}
                <div className="w-full rounded-xl bg-card border border-border shadow-sm p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                            <h2 className="text-foreground text-lg font-bold leading-tight">Sales Trends</h2>
                            <p className="text-muted-foreground text-sm mt-1">
                                Revenue performance over the last {periodLabel[chartPeriod].toLowerCase()}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {([30, 90, 365] as ChartPeriod[]).map((period) => (
                                <Button
                                    key={period}
                                    size="sm"
                                    variant={chartPeriod === period ? "secondary" : "ghost"}
                                    className={chartPeriod === period ? "text-primary" : ""}
                                    onClick={() => setChartPeriod(period)}
                                >
                                    {periodLabel[period]}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {salesData ? (
                        salesData.length > 0 ? (
                            <ChartContainer
                                config={salesChartConfig}
                                className="h-[240px] md:h-[300px] w-full"
                            >
                                <AreaChart
                                    data={salesData}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        tickFormatter={(value) => {
                                            const d = new Date(value + "T00:00:00");
                                            return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                        }}
                                        interval={chartPeriod === 30 ? 6 : chartPeriod === 90 ? 14 : 30}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
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
                                        stroke="var(--color-revenue)"
                                        strokeWidth={2}
                                        fill="url(#revenueGradient)"
                                    />
                                </AreaChart>
                            </ChartContainer>
                        ) : (
                            <div className="h-[240px] md:h-[300px] flex items-center justify-center text-muted-foreground">
                                No sales data for this period
                            </div>
                        )
                    ) : (
                        <div className="h-[240px] md:h-[300px] flex items-center justify-center">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        </div>
                    )}
                </div>

                {/* Order Status Distribution + Charts Row */}
                {statusDistribution && statusDistribution.length > 0 && (
                    <div className="w-full rounded-xl bg-card border border-border shadow-sm p-6">
                        <div className="mb-6">
                            <h2 className="text-foreground text-lg font-bold leading-tight">Order Status</h2>
                            <p className="text-muted-foreground text-sm mt-1">
                                Distribution of orders by current status
                            </p>
                        </div>
                        <ChartContainer
                            config={statusChartConfig}
                            className="h-[200px] md:h-[240px] w-full"
                        >
                            <BarChart
                                data={statusDistribution.map((d) => ({
                                    ...d,
                                    fill: STATUS_COLORS[d.status] || "hsl(var(--primary))",
                                }))}
                                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="status"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    tickFormatter={(v) => v.charAt(0).toUpperCase() + v.slice(1)}
                                />
                                <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent
                                            formatter={(value, name) =>
                                                `${value} order${(value as number) !== 1 ? "s" : ""}`
                                            }
                                        />
                                    }
                                />
                                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))">
                                    {statusDistribution.map((entry) => (
                                        <rect
                                            key={entry.status}
                                            fill={STATUS_COLORS[entry.status]}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </div>
                )}

                {/* Bottom Section Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {recentOrders ? (
                        <RecentOrdersTable orders={recentOrders as RecentOrder[]} />
                    ) : (
                        <div className="lg:col-span-2 rounded-xl bg-card border border-border shadow-sm flex items-center justify-center h-[300px]">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        </div>
                    )}
                    {lowStockProducts ? (
                        <LowStockAlerts items={lowStockProducts as LowStockItem[]} />
                    ) : (
                        <div className="rounded-xl bg-card border border-border shadow-sm flex items-center justify-center h-[300px]">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
