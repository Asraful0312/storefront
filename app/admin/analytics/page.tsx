"use client";

import { useState } from "react";
import { Download, BarChart3, CreditCard, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const timeRanges = ["Daily", "Weekly", "Monthly"];

const topProducts = [
    {
        id: "1",
        name: "Wireless ANC Headphones",
        units: 842,
        revenue: "$24.1k",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA2-AaV2J0uzsS7pAPCUDtV81vMOSlCJkLsVdpVX8PMeb__s0tGGRRCve3pJ1jEiaE8yWxfNByELefHnzpQsCyfjGqi5THnHmUDwabirIygyefH_zev8bqUy1kr-FOa-HAb7i-4em7e6Du9pW4hYExKuHrBDKahm2rqZU8xjjhJIYVchggqZlmWIXEng_B_YEWTEh6cKLqa5qOwQu7PZEZ9ySWoP4W09PuiUW2oov35nBXID2VM7Ar8_4Gp6Ws3tVm8ey8tStGMqnw",
    },
    {
        id: "2",
        name: "Ultra Sport Smartwatch",
        units: 615,
        revenue: "$18.4k",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAb1ZyE6iHQRlVMpd8M_7P1bO4zNVX2gzlcKiCy3YpQ-UWp_oEgs47zIaIoTM5NNj_Xfr9ti3W_H08jR0EhIq_3HeX0Qw5mtPrznIWJEfyFOZbz5oD0DVnvllsvPJXZm7MFQzlfLweVNz87f8_kVqSm7p5x-an3RZm6zmA1NHJ1WcbOwFCyTPMfoMN626YEwM87_CjnsYlNx_ECgjhq8d55Z3jPlTJ0_yV69StSTcW7H50Ve1ROvSR5XRa5otNNhk4dgralVDSzJQ0",
    },
    {
        id: "3",
        name: "Minimalist Desk Lamp",
        units: 520,
        revenue: "$12.9k",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCiaFXsLB3JB6x4VWzeWcv3E-Jp7ntQh8YoIKH3oHzV4x6tmK5XhHLJ7YJ-UJyxDXjX2hZSEnyMZ6MlCszzgSd0kMBNe2G9kTZ3Bpk56DYZQG9oGtpf7nLprQKRT5tzBaGjLsrR0LfYqpIRHoDxZ9mug1i0PveY_KrX9oCpUMHHSJQwPviaHv1EWl5KMYPhT8QMNWMiAQfG6Vkuy9Kcy3B7w0a95Nd7EPV1_wDJFEqoDRWK-GKeCKcIxmRF0xgcqrVYi_mbRBUTMI4",
    },
    {
        id: "4",
        name: "ErgoHome Office Chair",
        units: 114,
        revenue: "$9.2k",
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA5M-ivs3O5am1aZ3NghU5Ju35U89X4TQs_o-4yX6IocYkZ8A-jEzjZbjO7R5CEjnxKCq7fiiErWaSUKmhl3LaO-Ci9WJsxVQlrI_AhToTPFWjud81DTRIlYvUN4TwgfC9LIJNSmQF6j6ZHP4b1sovgfP_7-LaFja-kKgNtFpQGOr_iNbHtL3B3SjEjvHS4U0-v7Q5Mbg9v_y8fGjc71vR7aM-uEUAFgfpIWdnpVvF1LEGFFzU1qXc_Lx4oqcYSD0r-Pc7debi9rKk",
    },
];

export default function AdminAnalyticsPage() {
    const [activeRange, setActiveRange] = useState("Weekly");

    return (
        <main className="flex-1 flex flex-col overflow-y-auto">
            <div className="p-8 space-y-8">
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
                                key={range}
                                onClick={() => setActiveRange(range)}
                                className={cn(
                                    "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                                    activeRange === range
                                        ? "bg-primary text-white shadow-md"
                                        : "hover:bg-secondary"
                                )}
                            >
                                {range}
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
                    {/* Large Main Chart */}
                    <div className="col-span-12 lg:col-span-9 space-y-6">
                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-3xl font-black text-foreground">$124,500.00</h4>
                                        <span className="text-green-600 text-sm font-bold flex items-center bg-green-500/10 px-2 py-0.5 rounded">
                                            +12.5%
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <span className="size-3 rounded-full bg-primary" />
                                        <span className="text-xs font-medium opacity-70">Revenue</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="size-3 rounded-full bg-amber-400" />
                                        <span className="text-xs font-medium opacity-70">Expenses</span>
                                    </div>
                                </div>
                            </div>
                            <div className="h-80 w-full relative">
                                <svg className="w-full h-full" viewBox="0 0 1000 300" preserveAspectRatio="none">
                                    <defs>
                                        <linearGradient id="grad-revenue" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    {/* Grid lines */}
                                    <line x1="0" x2="1000" y1="50" y2="50" stroke="currentColor" strokeOpacity="0.05" />
                                    <line x1="0" x2="1000" y1="150" y2="150" stroke="currentColor" strokeOpacity="0.05" />
                                    <line x1="0" x2="1000" y1="250" y2="250" stroke="currentColor" strokeOpacity="0.05" />
                                    {/* Area */}
                                    <path
                                        d="M0,250 L100,220 L200,235 L300,160 L400,180 L500,110 L600,140 L700,60 L800,90 L900,40 L1000,70 L1000,300 L0,300 Z"
                                        fill="url(#grad-revenue)"
                                    />
                                    {/* Revenue Line */}
                                    <path
                                        d="M0,250 L100,220 L200,235 L300,160 L400,180 L500,110 L600,140 L700,60 L800,90 L900,40 L1000,70"
                                        fill="none"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                    />
                                    {/* Expense Line */}
                                    <path
                                        d="M0,280 L100,260 L200,270 L300,220 L400,240 L500,190 L600,210 L700,160 L800,180 L900,140 L1000,160"
                                        fill="none"
                                        stroke="#e5b45d"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeDasharray="6,4"
                                    />
                                </svg>
                                <div className="flex justify-between mt-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    <span>Mon</span>
                                    <span>Tue</span>
                                    <span>Wed</span>
                                    <span>Thu</span>
                                    <span>Fri</span>
                                    <span>Sat</span>
                                    <span>Sun</span>
                                </div>
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
                                    <div>
                                        <h5 className="text-2xl font-bold text-foreground">3.48%</h5>
                                        <p className="text-[10px] font-bold text-green-600">+0.2% from last week</p>
                                    </div>
                                    <div className="w-16 h-8">
                                        <svg className="w-full h-full" viewBox="0 0 100 40">
                                            <path
                                                d="M0,35 Q25,30 40,20 T80,10 T100,5"
                                                fill="none"
                                                stroke="#86a687"
                                                strokeWidth="3"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* AOV Card */}
                            <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-sm font-medium text-muted-foreground">Avg. Order Value</p>
                                    <CreditCard className="size-5 text-amber-400" />
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <h5 className="text-2xl font-bold text-foreground">$84.20</h5>
                                        <p className="text-[10px] font-bold text-green-600">+$4.12 vs last month</p>
                                    </div>
                                    <div className="flex gap-1 items-end h-8">
                                        <div className="w-1.5 h-4 bg-amber-400/20 rounded-full" />
                                        <div className="w-1.5 h-6 bg-amber-400/40 rounded-full" />
                                        <div className="w-1.5 h-3 bg-amber-400/60 rounded-full" />
                                        <div className="w-1.5 h-8 bg-amber-400 rounded-full" />
                                    </div>
                                </div>
                            </div>

                            {/* Categories Card */}
                            <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                                <p className="text-sm font-medium text-muted-foreground mb-3">Top Categories</p>
                                <div className="flex items-center gap-4">
                                    <div className="relative size-14">
                                        <svg className="size-full" viewBox="0 0 36 36">
                                            <path
                                                className="stroke-primary"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                strokeWidth="4"
                                                strokeDasharray="40, 100"
                                            />
                                            <path
                                                className="stroke-amber-400"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                strokeWidth="4"
                                                strokeDasharray="25, 100"
                                                strokeDashoffset="-40"
                                            />
                                            <path
                                                className="stroke-green-500"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                strokeWidth="4"
                                                strokeDasharray="35, 100"
                                                strokeDashoffset="-65"
                                            />
                                        </svg>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between text-[10px] font-bold">
                                            <span>Electronics</span>
                                            <span>40%</span>
                                        </div>
                                        <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                                            <span>Apparel</span>
                                            <span>35%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar Content */}
                    <div className="col-span-12 lg:col-span-3 space-y-6">
                        {/* Sales by Region */}
                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                            <h5 className="text-sm font-bold mb-4">Sales by Region</h5>
                            <div className="aspect-square bg-secondary rounded-lg mb-4 relative overflow-hidden">
                                {/* Mock map/heatmap visualization */}
                                <div
                                    className="absolute inset-0 opacity-40 bg-cover bg-center"
                                    style={{
                                        backgroundImage:
                                            "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD3X9CKueYJ9-A8Pabqj-T0x1V444HdKLy6B9sJsLZdC_KqnnMz1-W4jOU-f9XsFCz6it7pekHYsAUaFACvbeLu13xL2OgdWdrvffCUwCLiuMnEJe0wdNDxZi3rHQXft4qsKmXY2CT9c2TFlO9JLAu2EuPNqRc7zN4aROABY-ObLOJ2vP0FaNio61CITrOQG-TpFvKboQyrTQsc9PgfqMk-pkG48ApfeT6ldoRRThtnPIHLIQHRrp-lCitSxjT6oQO_27xkB9-u0xM')",
                                    }}
                                />
                                <div className="absolute top-1/4 left-1/3 size-6 bg-primary/40 rounded-full animate-pulse" />
                                <div className="absolute top-1/2 left-2/3 size-10 bg-primary/30 rounded-full" />
                                <div className="absolute bottom-1/3 left-1/4 size-8 bg-primary/20 rounded-full" />
                                <div className="absolute inset-0 bg-linear-to-t from-white/20 to-transparent" />
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-medium">North America</span>
                                    <span className="font-bold">42%</span>
                                </div>
                                <div className="w-full h-1.5 bg-secondary rounded-full">
                                    <div className="h-full bg-primary rounded-full" style={{ width: "42%" }} />
                                </div>
                                <div className="flex justify-between items-center text-xs mt-2">
                                    <span className="font-medium">Europe</span>
                                    <span className="font-bold">28%</span>
                                </div>
                                <div className="w-full h-1.5 bg-secondary rounded-full">
                                    <div className="h-full bg-amber-400 rounded-full" style={{ width: "28%" }} />
                                </div>
                            </div>
                        </div>

                        {/* Top Products */}
                        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h5 className="text-sm font-bold">Top Products</h5>
                                <button className="text-[10px] font-bold text-primary uppercase">View All</button>
                            </div>
                            <div className="space-y-4">
                                {topProducts.map((product) => (
                                    <div key={product.id} className="flex items-center gap-3">
                                        <div
                                            className="size-10 rounded-lg bg-cover bg-center"
                                            style={{ backgroundImage: `url('${product.image}')` }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold truncate">{product.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{product.units} units</p>
                                        </div>
                                        <p className="text-xs font-bold">{product.revenue}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
