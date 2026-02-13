"use client";

import {
    AdminHeader,
    StatCard,
    RecentOrdersTable,
    LowStockAlerts,
    type RecentOrder,
    type LowStockItem,
} from "@/components/admin";
import { Button } from "@/components/ui/button";

// Sample data
const recentOrders: RecentOrder[] = [
    { id: "1", orderId: "1023", customer: "Jane Doe", status: "shipped", total: 120.0 },
    { id: "2", orderId: "1024", customer: "John Smith", status: "pending", total: 45.0 },
    { id: "3", orderId: "1025", customer: "Robert Fox", status: "processing", total: 89.99 },
    { id: "4", orderId: "1026", customer: "Cody Fisher", status: "cancelled", total: 12.5 },
];

const lowStockItems: LowStockItem[] = [
    {
        id: "1",
        name: "Vintage Leather Bag",
        productId: "49201",
        stockLeft: 3,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBBf1mIfXT2ms7pgkpZKefymn65dyYFVE9SzLnUx4-QplmlRHLhsqrStRvtdxcwCYX7ckR5HyVDtriy7PLSFACf3yim6X0dOfyLPH12DyJ2ZTZdjWI4MMtaWnh-bXu7o8_OGl91tKC2QYza6f7kGfiv8K2Gl6RJGPe0OESSgkdhOBfAQ8yidrzCEAYBxheahkPdORoWaaQwRugi4wMP0xYDyD4-AxYvtILWO2sdT7fhtBO8fDFlznBBobEhEWF_bVehbStvm9njky0",
    },
    {
        id: "2",
        name: "Summer Canvas Hat",
        productId: "22019",
        stockLeft: 5,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuChJa7dn1jujpf8zUtkkhPhnmDeMGOaKwXro6ErEoeHn-xlWbIMA9BOmLmjCq9DlmzVqtUIOFOWGTVCyRNNcue20vTdS-K0rexKjzSi1vf36-S4yA2yXdB2AQTFUPNvU4gP88Y9vSqc5TNCRN4Pz4Gtcjgw2nyVgK5mPHd3YcdyrgGMTxrJJQaS6bAREA9kNAqSvG-afSRjgJ4wTpTiyoI8NurLCcgzz-N5-yuruD2JX6r7nMY89JAUdzHD2MGLbYMOmkmrgCzu7MA",
    },
    {
        id: "3",
        name: "Ceramic Coffee Mug",
        productId: "88102",
        stockLeft: 8,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA2-P_KZ7u2VMZ_RG7AIdnacVIdCkBNfO1_SYlNsBHO3KDoNzPN14HtSAcMtjNT_nIV53ZIWM5WufxBUIn_ErhspmvOFxNnls5FnPZxbUMrkGwzLlMliRR2EJjt9v6vwkrq6oiAj9R2xFs99IPgrz3jzmQ3AGABtnbxV0-_InytHX5_F1MvpqNazKopr4dCh9DgNwcHAqG1XrvEwJtoyIfXuONyhO5t3xDHnLAMBKq-MdxAiRunuHS4ubzQnUReXpbs12EsGf7hCSs",
    },
];

export default function AdminDashboardPage() {
    return (
        <>
            <AdminHeader />

            <div className="px-6 pb-8 flex flex-col gap-6 max-w-[1400px] mx-auto w-full">
                {/* KPI Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard title="Total Revenue" value="$24,500" changePercent={12} isPositive />
                    <StatCard title="Total Orders" value="156" changePercent={8} isPositive />
                    <StatCard title="Active Users" value="1,200" changePercent={5} isPositive />
                </div>

                {/* Main Chart Section */}
                <div className="w-full rounded-xl bg-card border border-border shadow-sm p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                            <h2 className="text-foreground text-lg font-bold leading-tight">Sales Trends</h2>
                            <p className="text-muted-foreground text-sm mt-1">
                                Revenue performance over the last 30 days
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="secondary" className="text-primary">
                                30 Days
                            </Button>
                            <Button size="sm" variant="ghost">
                                90 Days
                            </Button>
                            <Button size="sm" variant="ghost">
                                12 Months
                            </Button>
                        </div>
                    </div>

                    {/* Chart Placeholder */}
                    <div className="w-full h-[240px] md:h-[300px]">
                        <svg
                            className="overflow-visible"
                            fill="none"
                            height="100%"
                            preserveAspectRatio="none"
                            viewBox="0 0 478 150"
                            width="100%"
                        >
                            {/* Grid lines */}
                            <line
                                stroke="hsl(var(--border))"
                                strokeWidth="1"
                                x1="0"
                                x2="478"
                                y1="149"
                                y2="149"
                            />
                            <line
                                stroke="hsl(var(--border))"
                                strokeDasharray="4 4"
                                strokeWidth="1"
                                x1="0"
                                x2="478"
                                y1="109"
                                y2="109"
                            />
                            <line
                                stroke="hsl(var(--border))"
                                strokeDasharray="4 4"
                                strokeWidth="1"
                                x1="0"
                                x2="478"
                                y1="69"
                                y2="69"
                            />
                            <line
                                stroke="hsl(var(--border))"
                                strokeDasharray="4 4"
                                strokeWidth="1"
                                x1="0"
                                x2="478"
                                y1="29"
                                y2="29"
                            />
                            {/* Gradient Fill */}
                            <defs>
                                <linearGradient id="chartGradient" x1="239" x2="239" y1="0" y2="150" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                                    <stop offset="1" stopColor="hsl(var(--primary))" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M0 109C18.15 109 18.15 21 36.3 21C54.46 21 54.46 41 72.61 41C90.76 41 90.76 93 108.92 93C127.07 93 127.07 33 145.23 33C163.38 33 163.38 101 181.53 101C199.69 101 199.69 61 217.84 61C236 61 236 45 254.15 45C272.3 45 272.3 121 290.46 121C308.61 121 308.61 149 326.76 149C344.92 149 344.92 1 363.07 1C381.23 1 381.23 81 399.38 81C417.53 81 417.53 129 435.69 129C453.84 129 453.84 25 472 25V149H0V109Z"
                                fill="url(#chartGradient)"
                            />
                            {/* Stroke */}
                            <path
                                d="M0 109C18.15 109 18.15 21 36.3 21C54.46 21 54.46 41 72.61 41C90.76 41 90.76 93 108.92 93C127.07 93 127.07 33 145.23 33C163.38 33 163.38 101 181.53 101C199.69 101 199.69 61 217.84 61C236 61 236 45 254.15 45C272.3 45 272.3 121 290.46 121C308.61 121 308.61 149 326.76 149C344.92 149 344.92 1 363.07 1C381.23 1 381.23 81 399.38 81C417.53 81 417.53 129 435.69 129C453.84 129 453.84 25 472 25"
                                stroke="hsl(var(--primary))"
                                strokeLinecap="round"
                                strokeWidth="3"
                            />
                        </svg>
                    </div>
                    <div className="flex justify-between mt-4 px-2">
                        <p className="text-muted-foreground text-xs font-medium">Oct 1</p>
                        <p className="text-muted-foreground text-xs font-medium">Oct 8</p>
                        <p className="text-muted-foreground text-xs font-medium">Oct 15</p>
                        <p className="text-muted-foreground text-xs font-medium">Oct 22</p>
                        <p className="text-muted-foreground text-xs font-medium">Oct 29</p>
                    </div>
                </div>

                {/* Bottom Section Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <RecentOrdersTable orders={recentOrders} />
                    <LowStockAlerts items={lowStockItems} />
                </div>
            </div>
        </>
    );
}
