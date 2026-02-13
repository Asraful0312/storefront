import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all slides (admin)
export const list = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("heroSlides").order("desc").collect();
    },
});

// Get single slide
export const get = query({
    args: { id: v.id("heroSlides") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// List active slides (public)
export const listActive = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("heroSlides")
            .withIndex("by_isActive", (q) => q.eq("isActive", true))
            .collect();
    },
});

// Create slide
export const create = mutation({
    args: {
        title: v.string(),
        description: v.optional(v.string()),
        imageUrl: v.string(),
        ctaText: v.string(),
        ctaHref: v.string(),
        isActive: v.boolean(),
        sortOrder: v.optional(v.number()),
        location: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user.role !== "admin") throw new Error("Unauthorized");

        let sortOrder = args.sortOrder;
        if (sortOrder === undefined) {
            const all = await ctx.db.query("heroSlides").collect();
            sortOrder = all.length;
        }

        return await ctx.db.insert("heroSlides", { ...args, sortOrder });
    },
});

// Update slide
export const update = mutation({
    args: {
        id: v.id("heroSlides"),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        ctaText: v.optional(v.string()),
        ctaHref: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
        sortOrder: v.optional(v.number()),
        location: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user.role !== "admin") throw new Error("Unauthorized");

        await ctx.db.patch(id, updates);
    },
});

// Delete slide
export const remove = mutation({
    args: { id: v.id("heroSlides") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user.role !== "admin") throw new Error("Unauthorized");

        await ctx.db.delete(args.id);
    },
});
