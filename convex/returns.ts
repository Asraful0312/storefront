import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper to check if admin
async function checkAdmin(ctx: any) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
        .unique();

    if (!user || user.role !== "admin") throw new Error("Unauthorized");
    return user;
}

// User: Request a return
export const requestReturn = mutation({
    args: {
        orderId: v.id("orders"),
        items: v.array(v.object({
            itemId: v.string(), // productId
            quantity: v.number(),
            reason: v.string(),
            condition: v.optional(v.string()),
        })),
        reason: v.string(), // Main reason
        refundMethod: v.union(
            v.literal("original_payment"),
            v.literal("store_credit"),
            v.literal("exchange")
        ),
        images: v.optional(v.array(v.string())),
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

        // Validate order status (must be delivered to be returned)
        if (order.status !== "delivered") {
             throw new Error("Order must be delivered before it can be returned");
        }

        // Check if already returned/requested? (Optional logic for now)

        const returnId = await ctx.db.insert("returnRequests", {
            orderId: args.orderId,
            userId: user._id,
            status: "pending",
            reason: args.reason,
            items: args.items,
            refundMethod: args.refundMethod,
            images: args.images,
            submissionDate: Date.now(),
            lastUpdated: Date.now(),
        });

        // Optionally update order status to 'return_requested'?
        // Keeping it simple for now, status stays 'delivered' until return is approved?
        // Or we could update it. Let's stick to the order having its own status and return request having its own.

        return returnId;
    },
});

// User: List my returns
export const listMyReturns = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return [];

        const returns = await ctx.db
            .query("returnRequests")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .order("desc")
            .collect();
            
        // Enrich with order number?
        // Optimization: For list view, maybe we don't need full order details yet.
        // Enrich with order details and item details
        const enrichedReturns = await Promise.all(returns.map(async (r) => {
            const order = await ctx.db.get(r.orderId);
            const itemsWithDetails = r.items.map((item) => {
                const orderItem = order?.items.find((oi) => oi.productId === item.itemId);
                return {
                    id: item.itemId,
                    name: orderItem?.name || "Unknown Item",
                    image: orderItem?.image || "",
                    quantity: item.quantity,
                    price: orderItem?.price || 0,
                };
            });
            
            return {
                ...r,
                orderDate: order?._creationTime,
                items: itemsWithDetails,
            };
        }));

        return enrichedReturns;
    },
});

// User/Admin: Get specific return details
export const getReturn = query({
    args: { returnId: v.id("returnRequests") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const returnReq = await ctx.db.get(args.returnId);
        if (!returnReq) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return null;

        // Allow if owner OR admin
        if (returnReq.userId !== user._id && user.role !== "admin") {
            return null;
        }

        // Fetch order details for context
        const order = await ctx.db.get(returnReq.orderId);

        // Enrich items with details from order
        const itemsWithDetails = returnReq.items.map((item) => {
            const orderItem = order?.items.find((oi) => oi.productId === item.itemId);
            return {
                ...item,
                name: orderItem?.name || "Unknown Item",
                image: orderItem?.image || "",
            };
        });

        return {
            ...returnReq,
            items: itemsWithDetails,
            orderNumber: order?.orderNumber,
            orderDate: order?._creationTime,
            orderTotal: order?.total,
        };
    },
});

// Admin: List all returns
export const listAllReturns = query({
    args: { 
        status: v.optional(v.string()),
        limit: v.optional(v.number()) 
    },
    handler: async (ctx, args) => {
        await checkAdmin(ctx);

        let returns;
        
        if (args.status && args.status !== "all") {
            returns = await ctx.db
                .query("returnRequests")
                .withIndex("by_status", (q) => q.eq("status", args.status as any))
                .take(args.limit || 50);
        } else {
             returns = await ctx.db
                .query("returnRequests")
                .order("desc") // Default to newest
                .take(args.limit || 50);
        }
        
        // Enrich with user names and item details
        const enrichedReturns = await Promise.all(returns.map(async (r) => {
            const user = await ctx.db.get(r.userId);
            const order = await ctx.db.get(r.orderId);
            
            // Enrich items with details from order
            const itemsWithDetails = r.items.map((item) => {
                const orderItem = order?.items.find((oi) => oi.productId === item.itemId);
                return {
                    ...item,
                    name: orderItem?.name || "Unknown Item",
                    image: orderItem?.image || "",
                };
            });

            return {
                ...r,
                items: itemsWithDetails,
                userName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Unknown",
                userEmail: user?.email,
                orderNumber: order?.orderNumber,
            };
        }));

        return enrichedReturns;
    },
});

// Admin: Update return status
export const updateReturnStatus = mutation({
    args: {
        returnId: v.id("returnRequests"),
        status: v.union(
            v.literal("approved"),
            v.literal("rejected"),
            v.literal("refunded"),
            v.literal("completed")
        ),
        adminNotes: v.optional(v.string()),
        rejectionReason: v.optional(v.string()),
        refundAmount: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        await checkAdmin(ctx);
        
        const returnReq = await ctx.db.get(args.returnId);
        if (!returnReq) throw new Error("Return request not found");

        await ctx.db.patch(args.returnId, {
            status: args.status,
            ...(args.adminNotes ? { adminNotes: args.adminNotes } : {}),
            ...(args.rejectionReason ? { rejectionReason: args.rejectionReason } : {}),
            ...(args.refundAmount ? { refundAmount: args.refundAmount } : {}),
            lastUpdated: Date.now(),
        });

        // Loop back to update Order status if needed
        // e.g. if Refunded -> update Order to 'returned' or partial?
        // For now, let's keep Order status separate or maybe just update it if full return?
        
        if (args.status === "refunded" || args.status === "completed") {
             // Maybe update order status to 'returned' if it was a full return?
             // Not implementing complex logic yet.
        }
    },
});

// Admin: Get return stats
export const getReturnStats = query({
    args: {},
    handler: async (ctx) => {
        await checkAdmin(ctx);

        const pending = await ctx.db
            .query("returnRequests")
            .withIndex("by_status", (q) => q.eq("status", "pending"))
            .collect();
        
        const approved = await ctx.db
            .query("returnRequests")
            .withIndex("by_status", (q) => q.eq("status", "approved"))
            .collect();

        const completed = await ctx.db
            .query("returnRequests")
            .withIndex("by_status", (q) => q.eq("status", "completed"))
            .collect();
        
        const all = await ctx.db.query("returnRequests").collect();

        return {
            pending: pending.length,
            approved: approved.length,
            completed: completed.length,
            total: all.length,
        };
    },
});
