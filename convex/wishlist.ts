import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Validator for wishlist item
const wishlistItemValidator = v.object({
    _id: v.id("wishlist"),
    _creationTime: v.number(),
    userId: v.id("users"),
    productId: v.id("products"),
    addedAt: v.number(),
});

/**
 * Get the current user's wishlist
 */
// Helper to populate product data
// Helper to populate product data
const populateProduct = async (ctx: any, productId: any) => {
    const product = await ctx.db.get(productId);
    if (!product) return null;

    const variants = await ctx.db
        .query("productVariants")
        .withIndex("by_productId", (q: any) => q.eq("productId", product._id))
        .collect();

    const defaultVariant = variants.find((v: any) => v.isDefault) || variants[0];

    return {
        ...product,
        // Ensure image format matches frontend expectation if needed,
        // though usually Cloudinary URL is directly on product.images[0].url
        image: product.images?.[0]?.url || product.featuredImage || "",
        defaultVariantId: defaultVariant?._id,
    };
};

/**
 * Get the current user's wishlist with populated product details
 */
export const getWishlist = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return [];

        const wishlistItems = await ctx.db
            .query("wishlist")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .collect();

        // Populate products
        const products = await Promise.all(
            wishlistItems.map(async (item) => {
                const product = await populateProduct(ctx, item.productId);
                if (!product) return null;
                return {
                    ...item,
                    product,
                };
            })
        );

        return products.filter(Boolean);
    },
});

/**
 * Get just the list of product IDs in the wishlist (for efficient checking)
 */
export const getWishlistIds = query({
    args: {},
    returns: v.array(v.id("products")),
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return [];

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return [];

        const wishlist = await ctx.db
            .query("wishlist")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .collect();

        return wishlist.map(w => w.productId);
    }
});

/**
 * Get wishlist count for the current user
 */
export const getWishlistCount = query({
    args: {},
    returns: v.number(),
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return 0;
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) {
            return 0;
        }

        const wishlist = await ctx.db
            .query("wishlist")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .collect();

        return wishlist.length;
    },
});

/**
 * Check if a product is in the current user's wishlist
 */
export const isInWishlist = query({
    args: { productId: v.id("products") },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return false;
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) {
            return false;
        }

        const item = await ctx.db
            .query("wishlist")
            .withIndex("by_userId_and_productId", (q) =>
                q.eq("userId", user._id).eq("productId", args.productId)
            )
            .unique();

        return item !== null;
    },
});

/**
 * Add a product to the current user's wishlist
 */
export const addToWishlist = mutation({
    args: { productId: v.id("products") },
    returns: v.union(v.id("wishlist"), v.null()),
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) {
            return null;
        }

        // Check if already in wishlist
        const existing = await ctx.db
            .query("wishlist")
            .withIndex("by_userId_and_productId", (q) =>
                q.eq("userId", user._id).eq("productId", args.productId)
            )
            .unique();

        if (existing) {
            return existing._id;
        }

        const wishlistId = await ctx.db.insert("wishlist", {
            userId: user._id,
            productId: args.productId,
            addedAt: Date.now(),
        });

        return wishlistId;
    },
});

/**
 * Remove a product from the current user's wishlist
 */
export const removeFromWishlist = mutation({
    args: { productId: v.id("products") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) {
            return null;
        }

        const item = await ctx.db
            .query("wishlist")
            .withIndex("by_userId_and_productId", (q) =>
                q.eq("userId", user._id).eq("productId", args.productId)
            )
            .unique();

        if (item) {
            await ctx.db.delete(item._id);
        }

        return null;
    },
});

/**
 * Toggle wishlist (add if not in, remove if in)
 */
export const toggleWishlist = mutation({
    args: { productId: v.id("products") },
    returns: v.object({
        action: v.union(v.literal("added"), v.literal("removed")),
    }),
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Not authenticated");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) {
            throw new Error("User not found");
        }

        const existing = await ctx.db
            .query("wishlist")
            .withIndex("by_userId_and_productId", (q) =>
                q.eq("userId", user._id).eq("productId", args.productId)
            )
            .unique();

        if (existing) {
            await ctx.db.delete(existing._id);
            return { action: "removed" as const };
        } else {
            await ctx.db.insert("wishlist", {
                userId: user._id,
                productId: args.productId,
                addedAt: Date.now(),
            });
            return { action: "added" as const };
        }
    },
});
