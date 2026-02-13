import { v } from "convex/values";
import { mutation, query } from "./_generated/server";


// Get variants for a product
export const getByProductId = query({
    args: { productId: v.id("products") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("productVariants")
            .withIndex("by_productId", (q) => q.eq("productId", args.productId))
            .collect();
    },
});

// Get variant by SKU
export const getBySku = query({
    args: { sku: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("productVariants")
            .withIndex("by_sku", (q) => q.eq("sku", args.sku))
            .first();
    },
});

// Get variant by ID
export const getById = query({
    args: { id: v.id("productVariants") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});


// Create variant
export const create = mutation({
    args: {
        productId: v.id("products"),
        colorId: v.optional(v.string()),
        size: v.optional(v.string()),
        sku: v.string(),
        stockCount: v.number(),
        lowStockThreshold: v.optional(v.number()),
        priceAdjustment: v.optional(v.number()),
        weight: v.optional(v.number()),
        dimensions: v.optional(
            v.object({
                length: v.number(),
                width: v.number(),
                height: v.number(),
            })
        ),
        imageUrl: v.optional(v.string()),
        isDefault: v.boolean(),
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
        // Check for duplicate SKU
        const existing = await ctx.db
            .query("productVariants")
            .withIndex("by_sku", (q) => q.eq("sku", args.sku))
            .first();

        if (existing) {
            throw new Error(`SKU "${args.sku}" already exists`);
        }

        // If this is default, unset other defaults for this product
        if (args.isDefault) {
            const variants = await ctx.db
                .query("productVariants")
                .withIndex("by_productId", (q) => q.eq("productId", args.productId))
                .collect();

            for (const variant of variants) {
                if (variant.isDefault) {
                    await ctx.db.patch(variant._id, { isDefault: false });
                }
            }
        }

        return await ctx.db.insert("productVariants", args);
    },
});

// Bulk create variants (for variant matrix)
export const createBulk = mutation({
    args: {
        productId: v.id("products"),
        variants: v.array(
            v.object({
                colorId: v.optional(v.string()),
                size: v.optional(v.string()),
                sku: v.string(),
                stockCount: v.number(),
                lowStockThreshold: v.optional(v.number()),
                priceAdjustment: v.optional(v.number()),
                weight: v.optional(v.number()),
                dimensions: v.optional(
                    v.object({
                        length: v.number(),
                        width: v.number(),
                        height: v.number(),
                    })
                ),
                imageUrl: v.optional(v.string()),
                isDefault: v.boolean(),
            })
        ),
    },
    handler: async (ctx, args) => {
        const createdIds = [];

        for (let i = 0; i < args.variants.length; i++) {
            const variant = args.variants[i];

            // Check for duplicate SKU
            const existing = await ctx.db
                .query("productVariants")
                .withIndex("by_sku", (q) => q.eq("sku", variant.sku))
                .first();

            if (existing) {
                throw new Error(`SKU "${variant.sku}" already exists`);
            }

            const id = await ctx.db.insert("productVariants", {
                productId: args.productId,
                ...variant,
            });

            createdIds.push(id);
        }

        return createdIds;
    },
});

// Replace all variants (bulk update for edit page)
export const replace = mutation({
    args: {
        productId: v.id("products"),
        variants: v.array(
            v.object({
                colorId: v.optional(v.string()),
                size: v.optional(v.string()),
                sku: v.string(),
                stockCount: v.number(),
                lowStockThreshold: v.optional(v.number()),
                priceAdjustment: v.optional(v.number()),
                weight: v.optional(v.number()),
                dimensions: v.optional(
                    v.object({
                        length: v.number(),
                        width: v.number(),
                        height: v.number(),
                    })
                ),
                imageUrl: v.optional(v.string()),
                isDefault: v.boolean(),
            })
        ),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user.role !== "admin") throw new Error("Unauthorized");

        // Delete existing variants
        const existing = await ctx.db
            .query("productVariants")
            .withIndex("by_productId", (q) => q.eq("productId", args.productId))
            .collect();

        for (const v of existing) {
            await ctx.db.delete(v._id);
        }

        // Create new variants
        const createdIds = [];
        for (const variant of args.variants) {
            const id = await ctx.db.insert("productVariants", {
                productId: args.productId,
                ...variant,
            });
            createdIds.push(id);
        }

        return createdIds;
    },
});

// Update variant
export const update = mutation({
    args: {
        id: v.id("productVariants"),
        colorId: v.optional(v.string()),
        size: v.optional(v.string()),
        sku: v.optional(v.string()),
        stockCount: v.optional(v.number()),
        lowStockThreshold: v.optional(v.number()),
        priceAdjustment: v.optional(v.number()),
        weight: v.optional(v.number()),
        dimensions: v.optional(
            v.object({
                length: v.number(),
                width: v.number(),
                height: v.number(),
            })
        ),
        imageUrl: v.optional(v.string()),
        isDefault: v.optional(v.boolean()),
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

        const variant = await ctx.db.get(id);
        if (!variant) throw new Error("Variant not found");

        // Check for SKU uniqueness if changing SKU
        if (updates.sku && updates.sku !== variant.sku) {
            const existing = await ctx.db
                .query("productVariants")
                .withIndex("by_sku", (q) => q.eq("sku", updates.sku!))
                .first();

            if (existing) {
                throw new Error(`SKU "${updates.sku}" already exists`);
            }
        }

        // If setting as default, unset others
        if (updates.isDefault) {
            const variants = await ctx.db
                .query("productVariants")
                .withIndex("by_productId", (q) => q.eq("productId", variant.productId))
                .collect();

            for (const v of variants) {
                if (v._id !== id && v.isDefault) {
                    await ctx.db.patch(v._id, { isDefault: false });
                }
            }
        }

        await ctx.db.patch(id, updates);
        return id;
    },
});

// Update stock
export const updateStock = mutation({
    args: {
        id: v.id("productVariants"),
        adjustment: v.number(), // positive to add, negative to subtract
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
        const variant = await ctx.db.get(args.id);
        if (!variant) throw new Error("Variant not found");

        const newStock = Math.max(0, variant.stockCount + args.adjustment);
        await ctx.db.patch(args.id, { stockCount: newStock });

        return newStock;
    },
});

// Delete variant
export const remove = mutation({
    args: { id: v.id("productVariants") },
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
        await ctx.db.delete(args.id);
    },
});

// Delete all variants for a product
export const removeByProduct = mutation({
    args: { productId: v.id("products") },
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
        const variants = await ctx.db
            .query("productVariants")
            .withIndex("by_productId", (q) => q.eq("productId", args.productId))
            .collect();

        for (const variant of variants) {
            await ctx.db.delete(variant._id);
        }

        return variants.length;
    },
});
