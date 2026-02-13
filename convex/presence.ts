import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const TIMEOUT = 60 * 1000; // 1 minute considered "online"

/**
 * Update presence for the current user
 * Client should call this periodically (e.g. every 20s)
 */
export const heartbeat = mutation({
    args: {
        data: v.optional(v.any()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) return null;

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) return null;

        const existing = await ctx.db
            .query("presence")
            .withIndex("by_userId", q => q.eq("userId", user._id))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, { updated: Date.now(), data: args.data });
        } else {
            await ctx.db.insert("presence", { userId: user._id, updated: Date.now(), data: args.data });
        }
    }
});

/**
 * Get count of online users
 */
export const getOnlineUsers = query({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();

        // Query users updated recently
        const online = await ctx.db
            .query("presence")
            .withIndex("by_updated", q => q.gt("updated", now - TIMEOUT))
            .collect();

        return online.length;
    }
});
