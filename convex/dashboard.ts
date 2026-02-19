import { v } from "convex/values";
import { query } from "./_generated/server";
import { TableAggregate } from "@convex-dev/aggregate";
import { components } from "./_generated/api";
import { DataModel, Id, Doc } from "./_generated/dataModel";

// Re-use existing aggregate definitions (must match orders.ts and users.ts exactly)
const orderStats = new TableAggregate<{
    Key: [string];
    DataModel: DataModel;
    TableName: "orders";
    Namespace: string;
}>(components.aggregate, {
    sortKey: (doc) => [doc.status],
    sumValue: (doc) => doc.total,
    namespace: () => "v1",
});

const userStats = new TableAggregate<{
    Key: number;
    DataModel: DataModel;
    TableName: "users";
    Namespace: string;
}>(components.aggregate, {
    sortKey: (doc) => doc._creationTime,
    namespace: (doc) => doc.role,
});

// ==================== DASHBOARD QUERIES ====================

/**
 * Get KPI stats for the admin dashboard:
 * - Total Revenue, Total Orders, Active Users
 * - Month-over-month % change for each
 */
export const getDashboardStats = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser || currentUser.role !== "admin") return null;

        // Current month boundaries
        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();

        // Aggregate-based totals (O(1))
        const [totalOrders, totalRevenue, totalUsers] = await Promise.all([
            orderStats.count(ctx, { namespace: "v1" }),
            orderStats.sum(ctx, { namespace: "v1" }),
            userStats.count(ctx, { namespace: "customer" }),
        ]);

        // For month-over-month, we need to scan orders by creation time
        // Since orderStats is keyed by status (not time), we query DB directly
        const allRecentOrders = await ctx.db
            .query("orders")
            .order("desc")
            .collect();

        const currentMonthOrders = allRecentOrders.filter(
            (o) => o._creationTime >= startOfCurrentMonth
        );
        const previousMonthOrders = allRecentOrders.filter(
            (o) => o._creationTime >= startOfPreviousMonth && o._creationTime < startOfCurrentMonth
        );

        const currentMonthRevenue = currentMonthOrders.reduce((sum, o) => sum + o.total, 0);
        const previousMonthRevenue = previousMonthOrders.reduce((sum, o) => sum + o.total, 0);

        const currentMonthOrderCount = currentMonthOrders.length;
        const previousMonthOrderCount = previousMonthOrders.length;

        // User growth (use aggregate time bounds)
        const currentMonthUsers = await userStats.count(ctx, {
            namespace: "customer",
            bounds: { lower: { key: startOfCurrentMonth, inclusive: true } },
        });
        const previousMonthUsers = await userStats.count(ctx, {
            namespace: "customer",
            bounds: {
                lower: { key: startOfPreviousMonth, inclusive: true },
                upper: { key: startOfCurrentMonth, inclusive: false },
            },
        });

        // Calculate % change (guard against division by zero)
        const calcChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        return {
            totalRevenue: totalRevenue / 100, // Convert cents to dollars
            totalOrders,
            totalUsers,
            revenueChange: calcChange(currentMonthRevenue, previousMonthRevenue),
            ordersChange: calcChange(currentMonthOrderCount, previousMonthOrderCount),
            usersChange: calcChange(currentMonthUsers, previousMonthUsers),
        };
    },
});

/**
 * Get the 5 most recent orders with customer name
 */
export const getRecentOrders = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser || currentUser.role !== "admin") return [];

        const orders = await ctx.db.query("orders").order("desc").take(5);

        const ordersWithCustomer = await Promise.all(
            orders.map(async (order) => {
                const user = await ctx.db.get(order.userId);
                const customerName = user
                    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email
                    : "Unknown";

                return {
                    id: order._id,
                    orderId: order.orderNumber,
                    customer: customerName,
                    status: order.status as "shipped" | "pending" | "processing" | "cancelled" | "delivered",
                    total: order.total / 100, // cents to dollars
                };
            })
        );

        return ordersWithCustomer;
    },
});

/**
 * Get products with low stock (physical products only)
 */
export const getLowStockProducts = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser || currentUser.role !== "admin") return [];

        // Get active physical products
        const products = await ctx.db
            .query("products")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .collect();

        const lowStockItems: {
            id: string;
            name: string;
            productId: string;
            stockLeft: number;
            image: string;
        }[] = [];

        for (const product of products) {
            // Skip digital / gift card products
            if (product.productType === "digital" || product.productType === "gift_card") continue;

            const variants = await ctx.db
                .query("productVariants")
                .withIndex("by_productId", (q) => q.eq("productId", product._id))
                .collect();

            const totalStock = variants.reduce((sum, v) => sum + v.stockCount, 0);

            if (totalStock > 0 && totalStock < 10) {
                lowStockItems.push({
                    id: product._id,
                    name: product.name,
                    productId: product._id,
                    stockLeft: totalStock,
                    image: product.featuredImage || product.images?.[0]?.url || "",
                });
            }

            // Cap at 5 items for dashboard
            if (lowStockItems.length >= 5) break;
        }

        // Sort by lowest stock first
        lowStockItems.sort((a, b) => a.stockLeft - b.stockLeft);

        return lowStockItems;
    },
});

/**
 * Get daily sales data for the chart
 */
export const getSalesChartData = query({
    args: {
        days: v.optional(v.number()), // 30, 90, 365
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser || currentUser.role !== "admin") return [];

        const days = args.days || 30;
        const now = Date.now();
        const startTime = now - days * 24 * 60 * 60 * 1000;

        // Get orders in the time range
        const orders = await ctx.db
            .query("orders")
            .order("desc")
            .collect();

        const filteredOrders = orders.filter((o) => o._creationTime >= startTime);

        // Group by day
        const dailyMap = new Map<string, number>();

        // Pre-fill all days with 0
        for (let i = 0; i < days; i++) {
            const date = new Date(now - (days - 1 - i) * 24 * 60 * 60 * 1000);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            dailyMap.set(key, 0);
        }

        // Sum orders into daily buckets
        for (const order of filteredOrders) {
            // Only count non-cancelled orders for revenue
            if (order.status === "cancelled" || order.status === "returned") continue;

            const date = new Date(order._creationTime);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            const existing = dailyMap.get(key) || 0;
            dailyMap.set(key, existing + order.total);
        }

        // Convert to array
        return Array.from(dailyMap.entries()).map(([date, revenue]) => ({
            date,
            revenue: revenue / 100, // cents to dollars
        }));
    },
});

/**
 * Get order counts by status for distribution chart
 */
export const getOrderStatusDistribution = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser || currentUser.role !== "admin") return [];

        const statuses = ["pending", "processing", "shipped", "delivered", "cancelled", "returned"] as const;

        const counts = await Promise.all(
            statuses.map(async (status) => {
                const count = await orderStats.count(ctx, {
                    namespace: "v1",
                    bounds: { prefix: [status] },
                });
                return { status, count };
            })
        );

        // Only return statuses that have orders
        return counts.filter((c) => c.count > 0);
    },
});

/**
 * Get comprehensive analytics data
 */
export const getAnalytics = query({
    args: {
        range: v.union(v.literal("daily"), v.literal("weekly"), v.literal("monthly")),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();
        if (!currentUser || currentUser.role !== "admin") return null;

        const now = Date.now();
        let days = 30; // Default monthly
        if (args.range === "daily") days = 1; // Last 24h
        if (args.range === "weekly") days = 7;
        if (args.range === "monthly") days = 30;

        const startTime = now - days * 24 * 60 * 60 * 1000;
        const previousStartTime = now - (days * 2) * 24 * 60 * 60 * 1000;

        const orders = await ctx.db.query("orders").order("desc").collect();

        // Filter by date range
        const currentPeriodOrders = orders.filter(o => o._creationTime >= startTime);
        const previousPeriodOrders = orders.filter(o => o._creationTime >= previousStartTime && o._creationTime < startTime);

        // --- KPIs ---
        const calculateKPIs = (periodOrders: typeof orders) => {
            const validOrders = periodOrders.filter(o => o.status !== "cancelled" && o.status !== "returned");
            const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
            const totalOrders = validOrders.length;
            return { totalRevenue, totalOrders };
        };

        const currentKPIs = calculateKPIs(currentPeriodOrders);
        const previousKPIs = calculateKPIs(previousPeriodOrders);

        // AOV
        const currentAOV = currentKPIs.totalOrders > 0 ? currentKPIs.totalRevenue / currentKPIs.totalOrders : 0;
        const previousAOV = previousKPIs.totalOrders > 0 ? previousKPIs.totalRevenue / previousKPIs.totalOrders : 0;

        // Conversion Rate (Unique Buyers / Total Customers)
        // Note: This is an approximation as we only track known customers.
        const allCustomers = await userStats.count(ctx, { namespace: "customer" });
        const uniqueBuyers = new Set(currentPeriodOrders.map(o => o.userId)).size;
        const conversionRate = allCustomers > 0 ? (uniqueBuyers / allCustomers) * 100 : 0;
        
        // Previous conversion rate
        const prevUniqueBuyers = new Set(previousPeriodOrders.map(o => o.userId)).size;
        // Approximation: assume total customers was roughly same or use created time if needed. 
        // For simplicity, using current count to avoid complex history reconstruction.
        const prevConversionRate = allCustomers > 0 ? (prevUniqueBuyers / allCustomers) * 100 : 0;


        // --- Top Categories, Regions, Products ---
        const categoryRevenue = new Map<string, number>();
        const regionRevenue = new Map<string, number>();
        const productStats = new Map<string, { name: string; revenue: number; units: number; image?: string }>();

        // Helper to load referenced data
        const productCache = new Map<string, Doc<"products"> | null>();
        const categoryCache = new Map<string, string>(); // id -> name
        const addressCache = new Map<string, string>(); // id -> country

        // Process current period orders
        for (const order of currentPeriodOrders) {
            if (order.status === "cancelled" || order.status === "returned") continue;

            // Region
            let country = "Unknown";
            if (order.shippingAddressId) {
                if (!addressCache.has(order.shippingAddressId)) {
                    const addr = await ctx.db.get(order.shippingAddressId);
                    if (addr) addressCache.set(order.shippingAddressId, addr.country);
                }
                country = addressCache.get(order.shippingAddressId) || "Unknown";
            }
            regionRevenue.set(country, (regionRevenue.get(country) || 0) + order.total);

            // Products & Categories
            for (const item of order.items) {
                const pid = item.productId;
                
                // Product Stats
                if (!productStats.has(pid)) {
                    productStats.set(pid, { 
                        name: item.name, 
                        revenue: 0, 
                        units: 0, 
                        image: item.image 
                    });
                }
                const pStat = productStats.get(pid)!;
                pStat.revenue += item.price * item.quantity;
                pStat.units += item.quantity;

                // Category Stats
                if (!productCache.has(pid)) {
                    const p = await ctx.db.get(pid);
                    productCache.set(pid, p);
                }
                const product = productCache.get(pid);
                
                if (product && product.categoryId) {
                    if (!categoryCache.has(product.categoryId)) {
                        const cat = await ctx.db.get(product.categoryId as Id<"categories">);
                        if (cat) categoryCache.set(product.categoryId, cat.name);
                    }
                    const catName = categoryCache.get(product.categoryId) || "Uncategorized";
                    categoryRevenue.set(catName, (categoryRevenue.get(catName) || 0) + (item.price * item.quantity));
                } else {
                    categoryRevenue.set("Uncategorized", (categoryRevenue.get("Uncategorized") || 0) + (item.price * item.quantity));
                }
            }
        }

        // Format for frontend
        const topProducts = Array.from(productStats.entries())
            .map(([id, stats]) => ({
                id,
                ...stats,
                revenue: stats.revenue / 100,
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        const categoryData = Array.from(categoryRevenue.entries())
            .map(([name, value]) => ({ name, value: value / 100 }))
            .sort((a, b) => b.value - a.value);

        const regionData = Array.from(regionRevenue.entries())
            .map(([name, value]) => ({ name, value: value / 100 }))
            .sort((a, b) => b.value - a.value);

        // Chart Data (Area Chart)
        // Group by day for the selected range
        const chartMap = new Map<string, number>();
        const chartPoints = args.range === "daily" ? 24 : days; // Hourly for daily, daily otherwise
        
        for (let i = 0; i < chartPoints; i++) {
            let key;
            if (args.range === "daily") {
                 const d = new Date(now - (chartPoints - 1 - i) * 60 * 60 * 1000); // subtract hours
                 key = `${String(d.getHours()).padStart(2, '0')}:00`;
            } else {
                const d = new Date(now - (days - 1 - i) * 24 * 60 * 60 * 1000);
                key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            }
            chartMap.set(key, 0);
        }

        for (const order of currentPeriodOrders) {
            if (order.status === "cancelled" || order.status === "returned") continue;
            
            const d = new Date(order._creationTime);
            let key;
            if (args.range === "daily") {
                key = `${String(d.getHours()).padStart(2, '0')}:00`;
            } else {
                key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            }
            
            if (chartMap.has(key)) {
                chartMap.set(key, (chartMap.get(key) || 0) + order.total);
            }
        }

        const chartData = Array.from(chartMap.entries()).map(([date, revenue]) => ({
            date,
            revenue: revenue / 100, // cents to dollars
        }));


        return {
            totalRevenue: currentKPIs.totalRevenue / 100,
            revenueChange: currentKPIs.totalRevenue === 0 ? 0 : ((currentKPIs.totalRevenue - previousKPIs.totalRevenue) / previousKPIs.totalRevenue) * 100,
            
            aov: currentAOV / 100,
            aovChange: previousAOV === 0 ? 0 : ((currentAOV - previousAOV) / previousAOV) * 100,

            conversionRate,
            conversionChange: conversionRate - prevConversionRate, // Percentage point difference

            topProducts,
            categoryData,
            regionData,
            chartData
        };
    },
});
