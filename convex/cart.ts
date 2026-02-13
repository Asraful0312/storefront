
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Get cart items with details
export const get = query({
    handler: async (ctx) => {
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

        const cartItems = await ctx.db
            .query("cartItems")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .collect();

        // Enrich items
        const enrichedItems = await Promise.all(
            cartItems.map(async (item) => {
                const product = await ctx.db.get(item.productId);
                if (!product) return null; // Product deleted?

                let variant = null;
                if (item.variantId) {
                    variant = await ctx.db.get(item.variantId);
                }

                return {
                    _id: item._id,
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    product: {
                        name: product.name,
                        price: variant ? (product.basePrice + (variant.priceAdjustment || 0)) : product.basePrice,
                        image: variant?.imageUrl || product.images[0]?.url,
                        slug: product.slug,
                        // Shipping & Tax Fields
                        weight: product.weight || 0,
                        dimensions: product.dimensions,
                        shippingRateOverride: product.shippingRateOverride,
                        isFreeShipping: product.isFreeShipping,
                        isTaxable: product.isTaxable,
                        taxRateOverride: product.taxRateOverride,
                    },
                    variant: variant ? {
                        name: `${variant.colorId ? variant.colorId : ""} ${variant.size ? variant.size : ""}`.trim(),
                        colorId: variant.colorId,
                        size: variant.size,
                    } : null
                };
            })
        );

        return enrichedItems.filter((i) => i !== null);
    },
});

// Get guest cart details
export const getGuest = query({
    args: {
        items: v.array(
            v.object({
                productId: v.id("products"),
                variantId: v.optional(v.id("productVariants")), // or string if local items use string
                quantity: v.number(),
            })
        ),
    },
    handler: async (ctx, args) => {
        // Enrich items
        const enrichedItems = await Promise.all(
            args.items.map(async (item) => {
                const product = await ctx.db.get(item.productId);
                if (!product) return null;

                let variant = null;
                if (item.variantId) {
                    variant = await ctx.db.get(item.variantId);
                }

                return {
                    // Generate a temp ID or use combination
                    _id: `guest-${item.productId}-${item.variantId || "base"}`,
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                    product: {
                        name: product.name,
                        price: variant ? (product.basePrice + (variant.priceAdjustment || 0)) : product.basePrice,
                        image: variant?.imageUrl || product.images[0]?.url,
                        slug: product.slug,
                        // Shipping & Tax Fields
                        weight: product.weight || 0,
                        dimensions: product.dimensions,
                        shippingRateOverride: product.shippingRateOverride,
                        isFreeShipping: product.isFreeShipping,
                        isTaxable: product.isTaxable,
                        taxRateOverride: product.taxRateOverride,
                    },
                    variant: variant ? {
                        name: `${variant.colorId ? variant.colorId : ""} ${variant.size ? variant.size : ""}`.trim(),
                        colorId: variant.colorId,
                        size: variant.size,
                    } : null
                };
            })
        );

        return enrichedItems.filter((i) => i !== null);
    },
});

// Add item to cart
export const add = mutation({
    args: {
        productId: v.id("products"),
        variantId: v.optional(v.id("productVariants")),
        quantity: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        // Check if item exists
        const existingItems = await ctx.db
            .query("cartItems")
            .withIndex("by_userId_and_productId", (q) =>
                q.eq("userId", user._id).eq("productId", args.productId)
            )
            .collect();

        const duplicate = existingItems.find(
            (item) => item.variantId === args.variantId // match exact variant (including undefined === undefined)
        );

        if (duplicate) {
            await ctx.db.patch(duplicate._id, {
                quantity: duplicate.quantity + args.quantity,
            });
            return duplicate._id;
        } else {
            const newItem = await ctx.db.insert("cartItems", {
                userId: user._id,
                productId: args.productId,
                variantId: args.variantId,
                quantity: args.quantity,
            });
            return newItem;
        }
    },
});

// Remove item
export const remove = mutation({
    args: {
        cartItemId: v.id("cartItems"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        // Verify ownership handled implicitly by query, but explicit is better?
        // Basic authorized check is done.
        // We could fetch item and check userId, but assuming typical app security for now.
        // Let's do it right.
        const item = await ctx.db.get(args.cartItemId);
        if (!item) return;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user._id !== item.userId) {
            throw new Error("Unauthorized access to cart item");
        }

        await ctx.db.delete(args.cartItemId);
    },
});

// Update quantity
export const updateQuantity = mutation({
    args: {
        cartItemId: v.id("cartItems"),
        quantity: v.number(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const item = await ctx.db.get(args.cartItemId);
        if (!item) throw new Error("Item not found");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user._id !== item.userId) throw new Error("Unauthorized");

        if (args.quantity <= 0) {
            await ctx.db.delete(args.cartItemId);
        } else {
            await ctx.db.patch(args.cartItemId, { quantity: args.quantity });
        }
    },
});

// Sync local storage items to DB
export const sync = mutation({
    args: {
        items: v.array(
            v.object({
                productId: v.id("products"),
                variantId: v.optional(v.id("productVariants")),
                quantity: v.number(),
            })
        ),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthorized");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) throw new Error("User not found");

        // Loop through items and merge
        for (const item of args.items) {
            const existingItems = await ctx.db
                .query("cartItems")
                .withIndex("by_userId_and_productId", (q) =>
                    q.eq("userId", user._id).eq("productId", item.productId)
                )
                .collect();

            const duplicate = existingItems.find(
                (ex) => ex.variantId === item.variantId
            );

            if (duplicate) {
                // If exists, stick with DB version or Add? 
                // Usually sync happens once on login. Add makes sense.
                // Or max?
                // "also check it to not add duplicates" -> User meant merge logic?
                // If I have 5 in cart, and local has 2 (same item), user probably expects 7.
                // Or maybe user meant "don't create a second row".
                // My logic handles "don't create second row".
                await ctx.db.patch(duplicate._id, {
                    quantity: duplicate.quantity + item.quantity
                });
            } else {
                await ctx.db.insert("cartItems", {
                    userId: user._id,
                    productId: item.productId,
                    variantId: item.variantId,
                    quantity: item.quantity,
                });
            }
        }
    },
});
