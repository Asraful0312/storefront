import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { TableAggregate } from "@convex-dev/aggregate";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";

const couponStats = new TableAggregate<{
    Key: null;
    DataModel: DataModel;
    TableName: "coupons";
    Namespace: string;
}>(components.aggregate, {
    sortKey: (_doc) => null,
    sumValue: (doc) => doc.usageCount,
    namespace: (doc) => doc.isActive ? "v3_active" : "v3_inactive",
});

export const createCoupon = mutation({
    args: {
        code: v.string(),
        discountType: v.union(
            v.literal("percentage"),
            v.literal("fixed"),
            v.literal("shipping")
        ),
        discountValue: v.number(),
        minPurchaseAmount: v.optional(v.number()),
        applicableCategories: v.optional(v.array(v.string())),
        validFrom: v.optional(v.number()),
        validUntil: v.optional(v.number()),
        usageLimit: v.optional(v.number()),
        limitPerCustomer: v.optional(v.boolean()),
        isActive: v.boolean(),
    },
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
        const existing = await ctx.db
            .query("coupons")
            .withIndex("by_code", (q) => q.eq("code", args.code))
            .first();

        if (existing) {
            throw new Error("Coupon code already exists");
        }

        const stats = { ...args, usageCount: 0 };
        const couponId = await ctx.db.insert("coupons", stats);
        await couponStats.insert(ctx, { ...stats, _id: couponId, _creationTime: Date.now() });

        return couponId;
    },
});

export const updateCoupon = mutation({
    args: {
        id: v.id("coupons"),
        code: v.optional(v.string()),
        discountType: v.optional(
            v.union(v.literal("percentage"), v.literal("fixed"), v.literal("shipping"))
        ),
        discountValue: v.optional(v.number()),
        minPurchaseAmount: v.optional(v.number()),
        applicableCategories: v.optional(v.array(v.string())),
        validFrom: v.optional(v.number()),
        validUntil: v.optional(v.number()),
        usageLimit: v.optional(v.number()),
        limitPerCustomer: v.optional(v.boolean()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
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

        if (updates.code) {
            const existing = await ctx.db
                .query("coupons")
                .withIndex("by_code", (q) => q.eq("code", updates.code!))
                .first();

            if (existing && existing._id !== id) {
                throw new Error("Coupon code already exists");
            }
        }

        const oldDoc = await ctx.db.get(id);
        if (!oldDoc) throw new Error("Coupon not found");

        await ctx.db.patch(id, updates);
        const newDoc = await ctx.db.get(id);

        await couponStats.replace(ctx, oldDoc, newDoc!);
    },
});

export const deleteCoupon = mutation({
    args: { id: v.id("coupons") },
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

        const oldDoc = await ctx.db.get(args.id);
        if (!oldDoc) return;

        await ctx.db.delete(args.id);
        await couponStats.delete(ctx, oldDoc);
    },
});

export const getCoupon = query({
    args: { code: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("coupons")
            .withIndex("by_code", (q) => q.eq("code", args.code))
            .first();
    },
});

export const getCouponById = query({
    args: { id: v.id("coupons") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const listCoupons = query({
    args: { paginationOpts: paginationOptsValidator },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("coupons")
            .order("desc")
            .paginate(args.paginationOpts);
    },
});

export const searchCoupons = query({
    args: { query: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("coupons")
            .withSearchIndex("search_code", (q) => q.search("code", args.query))
            .take(20);
    },
});

export const getMarketingStats = query({
    args: {},
    handler: async (ctx) => {
        const activeCount = await couponStats.count(ctx, { namespace: "v3_active" });

        // Sum across both namespaces (active and inactive) to get total redemptions
        const sumActive = await couponStats.sum(ctx, { namespace: "v3_active" });
        const sumInactive = await couponStats.sum(ctx, { namespace: "v3_inactive" });
        const totalRedemptions = sumActive + sumInactive;

        // Efficiently get the most used coupon using the index
        const mostUsedCoupon = await ctx.db
            .query("coupons")
            .withIndex("by_usageCount")
            .order("desc")
            .first();

        return {
            activeCount,
            totalRedemptions,
            mostUsedCoupon: mostUsedCoupon ? {
                code: mostUsedCoupon.code,
                usageCount: mostUsedCoupon.usageCount
            } : null
        };
    },
});

export const backfillCouponStats = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user.role !== "admin") throw new Error("Unauthorized");

        const allCoupons = await ctx.db.query("coupons").collect();
        let processed = 0;

        for (const coupon of allCoupons) {
            // We can check if it exists in aggregate but aggregate.insert throws if key exists?
            // Actually TableAggregate doesn't have a check method easily, but if we changed namespace, it's empty!
            // So we can just insert everything.
            // Wait, inserts need key. Our key is `null` (since Key: null in definition).
            // But TableAggregate with Key:null usually implies one entry per namespace?
            // NO. `Key: null` means the aggregate doesn't use a secondary key for grouping WITHIN the namespace.
            // BUT `TableAggregate` stores one entry PER DOCUMENT (tracked by _id).
            // So we just call `insert` for every document.
            // If we already called insert for v2 namespace, it might fail?
            // Since we just renamed, v2 is empty. Safe to insert all.
            try {
                // Check if already in aggregate? No easy way. 
                // Just try insert. If it fails, capture error.
                await couponStats.insert(ctx, coupon);
                processed++;
            } catch (e) {
                // Ignore if already there (idempotency if we re-run)
            }
        }
        return `Backfilled ${processed} coupons`;
    }
});


