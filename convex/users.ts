import { v } from "convex/values";
import {
    query,
    mutation,
    internalMutation,
    internalQuery,
    internalAction,
    action,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { Id, DataModel } from "./_generated/dataModel";
import { TableAggregate } from "@convex-dev/aggregate";
import { components } from "./_generated/api";



/**
 * Get the current authenticated user's profile
 */
export const getCurrentUser = query({
    args: {},
    returns: v.union(
        v.object({
            _id: v.id("users"),
            _creationTime: v.number(),
            clerkId: v.string(),
            email: v.string(),
            firstName: v.optional(v.string()),
            lastName: v.optional(v.string()),
            phone: v.optional(v.string()),
            avatarUrl: v.optional(v.string()),
            role: v.union(v.literal("customer"), v.literal("admin")),
            tags: v.optional(v.array(v.string())),
            notes: v.optional(v.string()),
            marketingPrefs: v.optional(
                v.object({
                    emailNewsletter: v.boolean(),
                    smsNotifications: v.boolean(),
                })
            ),
        }),
        v.null()
    ),
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        return user;
    },
});

/**
 * Get a user by ID (for admin viewing customer details)
 */
export const getUserById = query({
    args: { userId: v.id("users") },
    returns: v.union(
        v.object({
            _id: v.id("users"),
            _creationTime: v.number(),
            clerkId: v.string(),
            email: v.string(),
            firstName: v.optional(v.string()),
            lastName: v.optional(v.string()),
            phone: v.optional(v.string()),
            avatarUrl: v.optional(v.string()),
            role: v.union(v.literal("customer"), v.literal("admin")),
            tags: v.optional(v.array(v.string())),
            notes: v.optional(v.string()),
            marketingPrefs: v.optional(
                v.object({
                    emailNewsletter: v.boolean(),
                    smsNotifications: v.boolean(),
                })
            ),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return null;
        }

        const user = await ctx.db.get(args.userId);
        return user;
    },
});

/**
 * List all users with pagination (admin only)
 */
export const listUsers = query({
    args: {
        limit: v.optional(v.number()),
        cursor: v.optional(v.string()),
    },
    returns: v.object({
        users: v.array(
            v.object({
                _id: v.id("users"),
                _creationTime: v.number(),
                clerkId: v.string(),
                email: v.string(),
                firstName: v.optional(v.string()),
                lastName: v.optional(v.string()),
                phone: v.optional(v.string()),
                avatarUrl: v.optional(v.string()),
                role: v.union(v.literal("customer"), v.literal("admin")),
                tags: v.optional(v.array(v.string())),
                notes: v.optional(v.string()),
                marketingPrefs: v.optional(
                    v.object({
                        emailNewsletter: v.boolean(),
                        smsNotifications: v.boolean(),
                    })
                ),
            })
        ),
        totalCount: v.number(),
    }),
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

        const limit = args.limit ?? 50;
        const users = await ctx.db.query("users").order("desc").take(limit);

        // Get total count (for pagination info)
        const allUsers = await ctx.db.query("users").collect();
        const totalCount = allUsers.length;

        return { users, totalCount };
    },
});



const userStats = new TableAggregate<{
    Key: number;
    DataModel: DataModel;
    TableName: "users";
    Namespace: string;
}>(components.aggregate, {
    sortKey: (doc) => doc._creationTime,
    namespace: (doc) => doc.role,
});



/**
 * List customers with their order stats (for admin dashboard)
 */
export const listCustomersWithStats = query({
    args: {
        limit: v.optional(v.number()),
        cursor: v.optional(v.string()),
        search: v.optional(v.string()),
    },
    returns: v.object({
        users: v.array(
            v.object({
                _id: v.id("users"),
                _creationTime: v.number(),
                clerkId: v.string(),
                email: v.string(),
                firstName: v.optional(v.string()),
                lastName: v.optional(v.string()),
                phone: v.optional(v.string()),
                avatarUrl: v.optional(v.string()),
                role: v.union(v.literal("customer"), v.literal("admin")),
                tags: v.optional(v.array(v.string())),
                notes: v.optional(v.string()),
                marketingPrefs: v.optional(
                    v.object({
                        emailNewsletter: v.boolean(),
                        smsNotifications: v.boolean(),
                    })
                ),
                // Dynamic stats
                totalOrders: v.number(),
                totalSpent: v.number(),
                lastOrderDate: v.optional(v.number()),
            })
        ),
        totalCount: v.number(),
        newThisMonth: v.number(),
    }),
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

        const limit = args.limit ?? 50;
        let users;

        if (args.search) {
            // Search is still heavy, but result set is limited.
            // Ideally use dedicated search index or external search service for heavy scale.
            // Convex text search is good.
            const allUsersStream = ctx.db.query("users").order("desc");
            const allDocs = await allUsersStream.collect();

            const query = args.search.toLowerCase();
            users = allDocs.filter(u =>
                (u.firstName?.toLowerCase().includes(query)) ||
                (u.lastName?.toLowerCase().includes(query)) ||
                (u.email.toLowerCase().includes(query))
            ).slice(0, limit);
        } else {
            users = await ctx.db.query("users").order("desc").take(limit);
        }

        // Get stats for each user
        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                const orders = await ctx.db
                    .query("orders")
                    .withIndex("by_userId", (q) => q.eq("userId", user._id))
                    .collect();

                const totalOrders = orders.length;
                const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
                const lastOrderDate =
                    orders.length > 0
                        ? Math.max(...orders.map((o) => o._creationTime))
                        : undefined;

                return {
                    ...user,
                    totalOrders,
                    totalSpent,
                    lastOrderDate,
                };
            })
        );

        // Get total count using Aggregate
        const totalCount = await userStats.count(ctx, { namespace: "customer" });

        // Get new this month count using Aggregate
        const now = Date.now();
        const startOfMonth = new Date(now);
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const startOfMonthTime = startOfMonth.getTime();

        const newThisMonth = await userStats.count(ctx, {
            namespace: "customer",
            bounds: { lower: { key: startOfMonthTime, inclusive: true } }
        });

        return { users: usersWithStats, totalCount, newThisMonth };
    },
});


/**
 * Update the current user's profile
 */
export const updateProfile = mutation({
    args: {
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        phone: v.optional(v.string()),
    },
    returns: v.union(v.id("users"), v.null()),
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

        await ctx.db.patch(user._id, {
            firstName: args.firstName,
            lastName: args.lastName,
            phone: args.phone,
        });

        return user._id;
    },
});

/**
 * Update user's marketing preferences
 */
export const updateMarketingPrefs = mutation({
    args: {
        emailNewsletter: v.boolean(),
        smsNotifications: v.boolean(),
    },
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

        await ctx.db.patch(user._id, {
            marketingPrefs: {
                emailNewsletter: args.emailNewsletter,
                smsNotifications: args.smsNotifications,
            },
        });

        return null;
    },
});

/**
 * Admin: Update a user's role
 */
export const updateUserRole = mutation({
    args: {
        userId: v.id("users"),
        role: v.union(v.literal("customer"), v.literal("admin")),
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
            throw new Error("Only admins can update user roles");
        }

        const oldDoc = await ctx.db.get(args.userId);
        if (!oldDoc) throw new Error("User not found");

        await ctx.db.patch(args.userId, { role: args.role });
        const newDoc = await ctx.db.get(args.userId);

        await userStats.replace(ctx, oldDoc, newDoc!);

        return null;
    },
});

// ... (updateUserAdminInfo - no aggregation change needed)

/**
 * Create or update user from Clerk webhook
 */
export const upsertFromClerk = internalMutation({
    args: {
        clerkId: v.string(),
        email: v.string(),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
    },
    returns: v.id("users"),
    handler: async (ctx, args) => {
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();

        if (existingUser) {
            await ctx.db.patch(existingUser._id, {
                email: args.email,
                firstName: args.firstName,
                lastName: args.lastName,
                avatarUrl: args.avatarUrl,
            });
            // Role matches, creationTime matches -> No aggregate update needed technically.
            // But good practice could be to replace if we tracked more than keys.
            return existingUser._id;
        }

        // Create new user
        const userData = {
            clerkId: args.clerkId,
            email: args.email,
            firstName: args.firstName,
            lastName: args.lastName,
            avatarUrl: args.avatarUrl,
            role: "customer" as const, // Default role
        };
        const userId = await ctx.db.insert("users", userData);

        await userStats.insert(ctx, { ...userData, _id: userId, _creationTime: Date.now() });

        return userId;
    },
});

/**
 * Delete user from Clerk webhook
 */
export const deleteFromClerk = internalMutation({
    args: {
        clerkId: v.string(),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();

        if (user) {
            // ... (delete related data logic unchanged) ...

            // Re-fetch or reuse logic from original file for deletes
            const addresses = await ctx.db
                .query("addresses")
                .withIndex("by_userId", (q) => q.eq("userId", user._id))
                .collect();
            for (const address of addresses) await ctx.db.delete(address._id);

            const wishlistItems = await ctx.db
                .query("wishlist")
                .withIndex("by_userId", (q) => q.eq("userId", user._id))
                .collect();
            for (const item of wishlistItems) await ctx.db.delete(item._id);

            await ctx.db.delete(user._id);
            await userStats.delete(ctx, user);
        }

        return null;
    },
});

/**
 * Admin create user (public mutation, called after Clerk user is created)
 * Requires admin role to call
 */
export const adminCreateUser = mutation({
    args: {
        clerkId: v.string(),
        email: v.string(),
        firstName: v.optional(v.string()),
        lastName: v.optional(v.string()),
        phone: v.optional(v.string()),
        role: v.optional(v.union(v.literal("customer"), v.literal("admin"))),
        tags: v.optional(v.array(v.string())),
        notes: v.optional(v.string()),
    },
    returns: v.id("users"),
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

        const userData = {
            clerkId: args.clerkId,
            email: args.email,
            firstName: args.firstName,
            lastName: args.lastName,
            phone: args.phone,
            role: args.role ?? "customer",
            tags: args.tags,
            notes: args.notes,
        };
        const userId = await ctx.db.insert("users", userData);
        await userStats.insert(ctx, { ...userData, _id: userId, _creationTime: Date.now() });

        return userId;
    },
});

/**
 * Admin: Delete a user
 */
export const adminDeleteUser = mutation({
    args: { userId: v.id("users") },
    returns: v.null(),
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

        const targetUser = await ctx.db.get(args.userId);
        if (!targetUser) {
            return null; // Already deleted
        }

        // ... (delete related data) ...
        const addresses = await ctx.db.query("addresses").withIndex("by_userId", (q) => q.eq("userId", args.userId)).collect();
        for (const address of addresses) await ctx.db.delete(address._id);

        const wishlistItems = await ctx.db.query("wishlist").withIndex("by_userId", (q) => q.eq("userId", args.userId)).collect();
        for (const item of wishlistItems) await ctx.db.delete(item._id);

        await ctx.db.delete(args.userId);
        await userStats.delete(ctx, targetUser);

        return null;
    },
});

export const backfillUserStats = internalMutation({
    args: {},
    handler: async (ctx) => {
        const allUsers = await ctx.db.query("users").collect();
        for (const user of allUsers) {
            try {
                await userStats.insert(ctx, user);
            } catch (e) {
                // Ignore if exists
            }
        }
    },
});

/**
 * Internal query to check if user exists by Clerk ID
 */
export const getUserByClerkId = internalQuery({
    args: { clerkId: v.string() },
    returns: v.union(v.object({ _id: v.id("users") }), v.null()),
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();

        return user ? { _id: user._id } : null;
    },
});



