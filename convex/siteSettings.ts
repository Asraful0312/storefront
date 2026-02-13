import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const get = query({
    args: {},
    handler: async (ctx) => {
        const settings = await ctx.db.query("siteSettings").first();
        return settings;
    },
});

export const update = mutation({
    args: {
        storeName: v.string(),
        storeUrl: v.string(),
        logoUrl: v.optional(v.string()),
        logoPublicId: v.optional(v.string()),
        contactEmail: v.string(),
        supportPhone: v.optional(v.string()),
        socialLinks: v.optional(v.object({
            facebook: v.optional(v.string()),
            twitter: v.optional(v.string()),
            instagram: v.optional(v.string()),
            linkedin: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("siteSettings").first();
        if (existing) {
            await ctx.db.patch(existing._id, args);
        } else {
            await ctx.db.insert("siteSettings", args);
        }
    },
});
