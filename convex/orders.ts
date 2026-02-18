import { v } from "convex/values";
import { query, mutation, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Validators
// Validators
const orderItemValidator = v.object({
    productId: v.id("products"),
    variantId: v.optional(v.id("productVariants")),
    name: v.string(),
    sku: v.optional(v.string()),
    quantity: v.number(),
    price: v.number(),
    image: v.optional(v.string()),
    // Digital fields
    productType: v.optional(v.string()), // Added productType
    digitalFileUrl: v.optional(v.string()), // Added
    digitalFileName: v.optional(v.string()), // Added
    giftCardCode: v.optional(v.string()), // Added
    downloadCount: v.optional(v.number()), // Number of times downloaded
    maxDownloads: v.optional(v.number()), // Limit from product at time of purchase
});

const orderStatusValidator = v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("shipped"),
    v.literal("delivered"),
    v.literal("cancelled"),
    v.literal("returned")
);

const orderValidator = v.object({
    _id: v.id("orders"),
    _creationTime: v.number(),
    userId: v.id("users"),
    orderNumber: v.string(),
    status: orderStatusValidator,
    items: v.array(orderItemValidator),
    subtotal: v.number(),
    tax: v.number(),
    shipping: v.number(),
    total: v.number(),
    shippingAddressId: v.optional(v.id("addresses")),
    paymentMethod: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
    customerEmail: v.optional(v.string()), // Added customerEmail
});

/**
 * Get the current user's orders
 */
/**
 * Get the current user's orders (Paginated)
 */
export const listUserOrdersPaginated = query({
    args: {
        paginationOpts: v.any(), // paginationOpts is an object
        status: v.optional(orderStatusValidator),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            // Return empty pagination result if not logged in
            return { page: [], isDone: true, continueCursor: "" };
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) {
            return { page: [], isDone: true, continueCursor: "" };
        }

        let ordersQuery = ctx.db
            .query("orders")
            .withIndex("by_userId", (q) => q.eq("userId", user._id));

        // Note: Filtering by status in memory or using a composite index would be better
        // But since we are indexing by userId, we can filter in memory for now if the user doesn't have thousands of orders.
        // Or if we want to be strict, we'd need a by_userId_status index.
        // For now, let's paginate *then* filter? No, standard Convex pagination works best on the index.
        // If status is provided, and we don't have a composite index, we can't efficiently filter AND sort by creation time AND paginate.
        // To keep it simple and performant for now:
        // We will just paginate on the userId index. Client-side filtering might be weird with pagination.
        // Let's rely on client-side filtering of the page OR assume the "Filter" is just a visual thing for now.
        //
        // ACTUALLY: The requirement is "add pagination".
        // Let's support pagination on the core list.

        return await ordersQuery
            .order("desc")
            .paginate(args.paginationOpts);
    },
});

/**
 * Get the current user's orders (Legacy/Simple)
 */
export const listUserOrders = query({
    args: {
        limit: v.optional(v.number()),
    },
    returns: v.array(orderValidator),
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) {
            return [];
        }

        const limit = args.limit ?? 20;
        const orders = await ctx.db
            .query("orders")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .order("desc")
            .take(limit);

        return orders;
    },
});

/**
 * Get orders for a specific user (admin)
 */
export const getOrdersForUser = query({
    args: { userId: v.id("users"), limit: v.optional(v.number()) },
    returns: v.array(orderValidator),
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser || currentUser.role !== "admin") {
            return []; // Or throw Error
        }

        const limit = args.limit ?? 20;
        const orders = await ctx.db
            .query("orders")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .take(limit);

        return orders;
    },
});

/**
 * Get a single order by ID
 */
/**
 * Get a single order by ID with details
 */
export const getOrder = query({
    args: { orderId: v.id("orders") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const order = await ctx.db.get(args.orderId);
        if (!order) return null;

        // Verify ownership (or admin)
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return null;

        if (order.userId !== user._id && user.role !== "admin") {
            // Return null or throw generic error to hide existence
            return null;
        }

        let shippingAddress = null;
        if (order.shippingAddressId) {
            shippingAddress = await ctx.db.get(order.shippingAddressId);
        }

        // Enrich items with digital file availability status
        const itemsWithFileStatus = await Promise.all(
            order.items.map(async (item) => {
                let hasFile = false;
                if (item.productType === "digital") {
                    const product = await ctx.db.get(item.productId);
                    hasFile = !!(product?.digitalFiles && product.digitalFiles.length > 0);
                }
                return {
                    ...item,
                    hasFile,
                };
            })
        );

        return {
            ...order,
            items: itemsWithFileStatus,
            shippingAddress,
        };
    },
});

/**
 * List all orders (admin)
 */
export const listAllOrders = query({
    args: {
        limit: v.optional(v.number()),
        status: v.optional(orderStatusValidator),
    },
    returns: v.array(orderValidator),
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser || currentUser.role !== "admin") {
            return [];
        }

        const limit = args.limit ?? 50;

        if (args.status) {
            const orders = await ctx.db
                .query("orders")
                .withIndex("by_status", (q) => q.eq("status", args.status!))
                .order("desc")
                .take(limit);
            return orders;
        }

        const orders = await ctx.db.query("orders").order("desc").take(limit);
        return orders;
    },
});

/**
 * Get order counts by status (for admin dashboard)
 */
import { TableAggregate } from "@convex-dev/aggregate";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";

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

/**
 * Get order counts and revenue by status (for admin dashboard)
 */
export const getOrderStats = query({
    args: {},
    returns: v.object({
        totalRevenue: v.number(),
        totalOrders: v.number(),
        pending: v.number(),
        processing: v.number(),
        shipped: v.number(),
        delivered: v.number(),
        cancelled: v.number(),
        returned: v.number(),
    }),
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return {
                totalRevenue: 0,
                totalOrders: 0,
                pending: 0,
                processing: 0,
                shipped: 0,
                delivered: 0,
                cancelled: 0,
                returned: 0,
            };
        }

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser || currentUser.role !== "admin") {
            return {
                totalRevenue: 0,
                totalOrders: 0,
                pending: 0,
                processing: 0,
                shipped: 0,
                delivered: 0,
                cancelled: 0,
                returned: 0,
            };
        }

        // Parallelize aggregate queries
        const [
            totalOrders,
            totalRevenue,
            pending,
            processing,
            shipped,
            delivered,
            cancelled,
            returned
        ] = await Promise.all([
            orderStats.count(ctx, { namespace: "v1" }),
            orderStats.sum(ctx, { namespace: "v1" }),
            orderStats.count(ctx, { namespace: "v1", bounds: { prefix: ["pending"] } }),
            orderStats.count(ctx, { namespace: "v1", bounds: { prefix: ["processing"] } }),
            orderStats.count(ctx, { namespace: "v1", bounds: { prefix: ["shipped"] } }),
            orderStats.count(ctx, { namespace: "v1", bounds: { prefix: ["delivered"] } }),
            orderStats.count(ctx, { namespace: "v1", bounds: { prefix: ["cancelled"] } }),
            orderStats.count(ctx, { namespace: "v1", bounds: { prefix: ["returned"] } }),
        ]);

        return {
            totalRevenue,
            totalOrders,
            pending,
            processing,
            shipped,
            delivered,
            cancelled,
            returned,
        };
    },
});

/**
 * Update order status (admin)
 */
export const updateOrderStatus = mutation({
    args: {
        orderId: v.id("orders"),
        status: orderStatusValidator,
        trackingNumber: v.optional(v.string()),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        // Check if current user is admin
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser || currentUser.role !== "admin") {
            throw new Error("Only admins can update order status");
        }

        const oldOrder = await ctx.db.get(args.orderId);
        if (!oldOrder) throw new Error("Order not found");

        await ctx.db.patch(args.orderId, {
            status: args.status,
            ...(args.trackingNumber ? { trackingNumber: args.trackingNumber } : {}),
        });

        const newOrder = await ctx.db.get(args.orderId);
        
        try {
            await orderStats.replace(ctx, oldOrder, newOrder!);
        } catch (error: any) {
            // If the key was missing from the aggregate (sync issue), insert it instead
            // The error from @convex-dev/aggregate is DELETE_MISSING_KEY
            if (error.data?.code === "DELETE_MISSING_KEY" || String(error).includes("DELETE_MISSING_KEY")) {
                console.log("Recovering from DELETE_MISSING_KEY in orderStats by inserting");
                await orderStats.insert(ctx, newOrder!);
            } else {
                throw error;
            }
        }

        return null;
    },
});

/**
 * Create order (internal, usually called from checkout flow)
 */
export const createOrder = internalMutation({
    args: {
        userId: v.id("users"),
        items: v.array(orderItemValidator),
        subtotal: v.number(),
        tax: v.number(),
        shipping: v.number(),
        total: v.number(),
        shippingAddressId: v.optional(v.id("addresses")),
        paymentMethod: v.optional(v.string()),
    },
    returns: v.id("orders"),
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        // Generate order number
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const orderNumber = `ORD-${timestamp}-${random}`;

        const orderId = await ctx.db.insert("orders", {
            userId: args.userId,
            orderNumber,
            status: "pending",
            items: args.items,
            subtotal: args.subtotal,
            tax: args.tax,
            shipping: args.shipping,
            total: args.total,
            shippingAddressId: args.shippingAddressId,
            paymentMethod: args.paymentMethod,
        });

        await orderStats.insert(ctx, {
            _id: orderId,
            _creationTime: Date.now(), // approximation, or use real time if available
            userId: args.userId,
            orderNumber,
            status: "pending",
            items: args.items,
            subtotal: args.subtotal,
            tax: args.tax,
            shipping: args.shipping,
            total: args.total,
            shippingAddressId: args.shippingAddressId,
            paymentMethod: args.paymentMethod,
        });

        return orderId;
    },
});

/**
 * Get order by Stripe Session ID (for success page)
 */
export const getOrderByStripeId = query({
    args: { stripeId: v.string() },
    returns: v.union(v.object({
        _id: v.id("orders"),
        status: v.string(),
        total: v.number(),
    }), v.null()),
    handler: async (ctx, args) => {
        const order = await ctx.db.query("orders")
            .withIndex("by_orderNumber", q => q.eq("orderNumber", args.stripeId))
            .first();

        if (!order) return null;

        return {
            _id: order._id,
            status: order.status,
            total: order.total,
        };
    }
});

/**
 * List all orders paginated (admin)
 */
export const listAllOrdersPaginated = query({
    args: {
        paginationOpts: v.any(),
        status: v.optional(orderStatusValidator),
        search: v.optional(v.string()),
        dateRange: v.optional(v.object({ start: v.number(), end: v.number() })),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return { page: [], isDone: true, continueCursor: "" };
        }

        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!currentUser || currentUser.role !== "admin") {
            return { page: [], isDone: true, continueCursor: "" };
        }

        const paginationResult = await (async () => {
            // 1. Search Query (Priority)
            if (args.search) {
                return await ctx.db
                    .query("orders")
                    .withSearchIndex("search_orderNumber", (q) => q.search("orderNumber", args.search!))
                    .filter((q) => {
                        const conditions = [];
                        if (args.status) {
                            conditions.push(q.eq(q.field("status"), args.status));
                        }
                        if (args.dateRange) {
                            conditions.push(q.gte(q.field("_creationTime"), args.dateRange.start));
                            conditions.push(q.lte(q.field("_creationTime"), args.dateRange.end));
                        }
                        return conditions.length > 0 ? q.and(...conditions) : true;
                    })
                    .paginate(args.paginationOpts);
            }

            // 2. Status Filter
            if (args.status) {
                let query = ctx.db
                    .query("orders")
                    .withIndex("by_status", (q) => q.eq("status", args.status!))
                    .order("desc");

                if (args.dateRange) {
                    return await query
                        .filter((q) =>
                            q.and(
                                q.gte(q.field("_creationTime"), args.dateRange!.start),
                                q.lte(q.field("_creationTime"), args.dateRange!.end)
                            )
                        )
                        .paginate(args.paginationOpts);
                }

                return await query.paginate(args.paginationOpts);
            }

            // 3. Date Range Filter (No Status, No Search)
            if (args.dateRange) {
                return await ctx.db
                    .query("orders")
                    .filter((q) =>
                        q.and(
                            q.gte(q.field("_creationTime"), args.dateRange!.start),
                            q.lte(q.field("_creationTime"), args.dateRange!.end)
                        )
                    )
                    .order("desc")
                    .paginate(args.paginationOpts);
            }

            // 4. Default: All Orders
            return await ctx.db
                .query("orders")
                .order("desc")
                .paginate(args.paginationOpts);
        })();

        const enrichedPage = await Promise.all(
            paginationResult.page.map(async (order) => {
                const [user, shippingAddress] = await Promise.all([
                    ctx.db.get(order.userId),
                    order.shippingAddressId ? ctx.db.get(order.shippingAddressId) : null,
                ]);

                return {
                    ...order,
                    shippingAddress,
                    customer: user
                        ? {
                            name: [user.firstName, user.lastName].filter(Boolean).join(" ") || "Unknown",
                            email: user.email,
                            avatar: user.avatarUrl,
                            phone: user.phone,
                        }
                        : {
                            name: "Unknown",
                            email: "N/A",
                            avatar: undefined,
                            phone: undefined,
                        },
                };
            })
        );

        return {
            ...paginationResult,
            page: enrichedPage,
        };
    },
});

/**
 * Delete an order (admin only)
 */
export const deleteOrder = mutation({
    args: { id: v.id("orders") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const order = await ctx.db.get(args.id);
        if (!order) return;

        await ctx.db.delete(args.id);
        await orderStats.delete(ctx, order);
    },
});

export const backfillOrderStats = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user.role !== "admin") throw new Error("Unauthorized");

        const allOrders = await ctx.db.query("orders").collect();
        let processed = 0;

        for (const order of allOrders) {
            try {
                await orderStats.insert(ctx, order);
                processed++;
            } catch (e) {
                // Ignore if already exists
            }
        }
        return `Backfilled ${processed} orders`;
    }
});

// Deliver gift card code to a specific order item (admin only)
export const deliverGiftCode = mutation({
    args: {
        orderId: v.id("orders"),
        itemIndex: v.number(),
        giftCardCode: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user.role !== "admin") throw new Error("Unauthorized");

        const order = await ctx.db.get(args.orderId);
        if (!order) throw new Error("Order not found");

        if (args.itemIndex < 0 || args.itemIndex >= order.items.length) {
            throw new Error("Invalid item index");
        }

        const item = order.items[args.itemIndex];
        if (item.productType !== "gift_card") {
            throw new Error("Item is not a gift card");
        }

        // Update the specific item's gift card code
        const updatedItems = [...order.items];
        updatedItems[args.itemIndex] = {
            ...updatedItems[args.itemIndex],
            giftCardCode: args.giftCardCode,
        };

        // Check if all items are now delivered (all digital items have their files/codes)
        const allDelivered = updatedItems.every((item) => {
            if (item.productType === "gift_card") return !!item.giftCardCode;
            if (item.productType === "digital") return !!item.digitalFileUrl;
            return true; // physical items don't block digital delivery
        });

        const oldOrder = order;
        const newStatus = allDelivered ? "delivered" as const : order.status;

        await ctx.db.patch(args.orderId, {
            items: updatedItems,
            status: newStatus,
        });

        if (newStatus !== order.status) {
            const newOrder = await ctx.db.get(args.orderId);
            try {
                await orderStats.replace(ctx, oldOrder, newOrder!);
            } catch (error: any) {
                if (error.data?.code === "DELETE_MISSING_KEY" || String(error).includes("DELETE_MISSING_KEY")) {
                    await orderStats.insert(ctx, newOrder!);
                } else {
                    throw error;
                }
            }
        }

        return null;
    },
});

// Track download and enforce download limits
// Securely get download URL and track usage
export const getDownloadUrl = mutation({
    args: {
        orderId: v.id("orders"),
        productId: v.id("products"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        const order = await ctx.db.get(args.orderId);
        if (!order) throw new Error("Order not found");

        if (order.userId !== user._id) throw new Error("Unauthorized access to order");

        // Find the item
        const itemIndex = order.items.findIndex(i => i.productId === args.productId);
        if (itemIndex === -1) throw new Error("Item not found in order");
        const item = order.items[itemIndex];

        // Check limits
        if (item.maxDownloads !== undefined) {
            const currentDownloads = item.downloadCount || 0;
            if (currentDownloads >= item.maxDownloads) {
                throw new Error("Download limit reached");
            }
        }

        // Get the product to retrieve the file URL
        const product = await ctx.db.get(args.productId);
        if (!product || !product.digitalFiles || product.digitalFiles.length === 0) {
            throw new Error("File not found or product no longer available");
        }

        // Increment count
        const updatedItems = [...order.items];
        updatedItems[itemIndex] = {
            ...item,
            downloadCount: (item.downloadCount || 0) + 1,
        };

        await ctx.db.patch(args.orderId, { items: updatedItems });

        return {
            url: product.digitalFiles[0].url,
            remaining: item.maxDownloads !== undefined ? item.maxDownloads - ((item.downloadCount || 0) + 1) : undefined
        };
    }
});
