import { v } from "convex/values";
import { query, mutation, action, internalMutation, internalQuery } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { TableAggregate } from "@convex-dev/aggregate";
import { components, internal, api } from "./_generated/api";
import { DataModel, Id } from "./_generated/dataModel";
import Stripe from "stripe";

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

// ==================== INTERNAL MUTATIONS (Must be defined before Actions) ====================

export const createCouponInternal = internalMutation({
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
        stripeCouponId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
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

export const updateCouponInternal = internalMutation({
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
        stripeCouponId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;

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

export const deleteCouponInternal = internalMutation({
    args: { id: v.id("coupons") },
    handler: async (ctx, args) => {
        const oldDoc = await ctx.db.get(args.id);
        if (!oldDoc) return;

        await ctx.db.delete(args.id);
        await couponStats.delete(ctx, oldDoc);
    },
});

// ==================== ACTIONS (Stripe Integration) ====================

export const createCoupon = action({
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
    handler: async (ctx, args): Promise<Id<"coupons">> => {
        const user = await ctx.runQuery(internal.users.getMeInternal);
        if (!user || user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        let stripeCouponId: string | undefined;

        if (args.discountType !== "shipping") {
            const stripe = new Stripe(process.env.STRIPE_KEY!, { apiVersion: "2026-01-28.clover" as any });
            const couponParams: Stripe.CouponCreateParams = {
                name: args.code,
                duration: "forever",
                currency: args.discountType === "fixed" ? "usd" : undefined,
            };

            if (args.discountType === "percentage") {
                couponParams.percent_off = args.discountValue;
            } else if (args.discountType === "fixed") {
                couponParams.amount_off = args.discountValue; 
            }

            if (args.usageLimit) {
                couponParams.max_redemptions = args.usageLimit;
            }
            if (args.validUntil) {
                couponParams.redeem_by = Math.floor(args.validUntil / 1000);
            }

            const stripeCoupon = await stripe.coupons.create(couponParams);
            stripeCouponId = stripeCoupon.id;
        }

        return await ctx.runMutation(internal.coupons.createCouponInternal, {
            ...args,
            stripeCouponId,
        });
    },
});

export const updateCoupon = action({
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
        const user = await ctx.runQuery(internal.users.getMeInternal);
        if (!user || user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const { id, ...updates } = args;
        const currentCoupon = await ctx.runQuery(api.coupons.getCouponById, { id });
        if (!currentCoupon) throw new Error("Coupon not found");

        let stripeCouponId = currentCoupon.stripeCouponId;

        // If discount details changed, we need to create a NEW Stripe coupon (immutable)
        const discountChanged = 
            (updates.discountType && updates.discountType !== currentCoupon.discountType) ||
            (updates.discountValue && updates.discountValue !== currentCoupon.discountValue) ||
            (updates.code && updates.code !== currentCoupon.code);

        if (discountChanged && updates.discountType !== "shipping") {
            const stripe = new Stripe(process.env.STRIPE_KEY!, { apiVersion: "2026-01-28.clover" as any });
            
            // Delete old if exists
            if (stripeCouponId) {
                try {
                    await stripe.coupons.del(stripeCouponId);
                } catch (e) { console.error("Failed to delete old stripe coupon", e); }
            }

            // Create new
            const finalCode = updates.code || currentCoupon.code;
            const finalType = updates.discountType || currentCoupon.discountType;
            const finalValue = updates.discountValue ?? currentCoupon.discountValue;

            if (finalType !== "shipping") {
                const couponParams: Stripe.CouponCreateParams = {
                    name: finalCode,
                    duration: "forever",
                    currency: finalType === "fixed" ? "usd" : undefined,
                };

                if (finalType === "percentage") {
                    couponParams.percent_off = finalValue;
                } else if (finalType === "fixed") {
                    couponParams.amount_off = finalValue;
                }
                
                const newStripeCoupon = await stripe.coupons.create(couponParams);
                stripeCouponId = newStripeCoupon.id;
            } else {
                stripeCouponId = undefined;
            }
        }

        await ctx.runMutation(internal.coupons.updateCouponInternal, {
            ...args,
            stripeCouponId,
        });
    },
});

export const deleteCoupon = action({
    args: { id: v.id("coupons") },
    handler: async (ctx, args) => {
        const user = await ctx.runQuery(internal.users.getMeInternal);
        if (!user || user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const coupon = await ctx.runQuery(api.coupons.getCouponById, { id: args.id });
        if (coupon?.stripeCouponId) {
            const stripe = new Stripe(process.env.STRIPE_KEY!, { apiVersion: "2026-01-28.clover" as any });
            try {
                await stripe.coupons.del(coupon.stripeCouponId);
            } catch (e) { console.error("Failed to delete stripe coupon", e); }
        }

        await ctx.runMutation(internal.coupons.deleteCouponInternal, args);
    }
});

// ==================== QUERIES & HELPERS ====================

export const validateCoupon = query({
    args: { 
        code: v.string(), 
        purchaseAmount: v.number(), // in cents
        userId: v.optional(v.id("users")) 
    },
    handler: async (ctx, args) => {
        const coupon = await ctx.db
            .query("coupons")
            .withIndex("by_code", (q) => q.eq("code", args.code))
            .first();

        if (!coupon) {
            return { valid: false, error: "Invalid coupon code" };
        }

        if (!coupon.isActive) {
            return { valid: false, error: "Coupon is inactive" };
        }

        const now = Date.now();
        if (coupon.validFrom && now < coupon.validFrom) {
             return { valid: false, error: "Coupon not yet valid" };
        }
        if (coupon.validUntil && now > coupon.validUntil) {
            return { valid: false, error: "Coupon expired" };
        }

        if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
            return { valid: false, error: "Coupon usage limit reached" };
        }

        if (coupon.minPurchaseAmount && args.purchaseAmount < coupon.minPurchaseAmount) {
            return { valid: false, error: `Minimum purchase of $${coupon.minPurchaseAmount / 100} required` };
        }

        // TODO: Check limitPerCustomer if we track per-user usage

        return { 
            valid: true, 
            coupon: {
                _id: coupon._id,
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                stripeCouponId: coupon.stripeCouponId,
                usageLimit: coupon.usageLimit,
                validUntil: coupon.validUntil, // for recreate
            }
        };
    }
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

        const sumActive = await couponStats.sum(ctx, { namespace: "v3_active" });
        const sumInactive = await couponStats.sum(ctx, { namespace: "v3_inactive" });
        const totalRedemptions = sumActive + sumInactive;

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
            try {
                await couponStats.insert(ctx, coupon);
                processed++;
            } catch (e) {
                // Ignore if already there
            }
        }
        return `Backfilled ${processed} coupons`;
    }
});
