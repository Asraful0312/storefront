import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Validator for address document
const addressValidator = v.object({
    _id: v.id("addresses"),
    _creationTime: v.number(),
    userId: v.id("users"),
    label: v.string(),
    type: v.string(),
    recipientName: v.string(),
    phone: v.optional(v.string()),
    street: v.string(),
    apartment: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    country: v.string(),
    isDefault: v.boolean(),
});

/**
 * Get all addresses for the current user
 */
export const listAddresses = query({
    args: {},
    returns: v.array(addressValidator),
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

        const addresses = await ctx.db
            .query("addresses")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .collect();

        return addresses;
    },
});

/**
 * Get addresses for a specific user (admin)
 */
export const getAddressesForUser = query({
    args: { userId: v.id("users") },
    returns: v.array(addressValidator),
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            return [];
        }

        const addresses = await ctx.db
            .query("addresses")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .collect();

        return addresses;
    },
});

/**
 * Add a new address
 */
export const addAddress = mutation({
    args: {
        label: v.string(),
        type: v.string(),
        recipientName: v.string(),
        phone: v.optional(v.string()),
        street: v.string(),
        apartment: v.optional(v.string()),
        city: v.string(),
        state: v.string(),
        zipCode: v.string(),
        country: v.string(),
        isDefault: v.optional(v.boolean()),
    },
    returns: v.union(v.id("addresses"), v.null()),
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

        const isDefault = args.isDefault ?? false;

        // If this is being set as default, remove default from other addresses
        if (isDefault) {
            const existingAddresses = await ctx.db
                .query("addresses")
                .withIndex("by_userId", (q) => q.eq("userId", user._id))
                .collect();

            for (const addr of existingAddresses) {
                if (addr.isDefault) {
                    await ctx.db.patch(addr._id, { isDefault: false });
                }
            }
        }

        const addressId = await ctx.db.insert("addresses", {
            userId: user._id,
            label: args.label,
            type: args.type,
            recipientName: args.recipientName,
            phone: args.phone,
            street: args.street,
            apartment: args.apartment,
            city: args.city,
            state: args.state,
            zipCode: args.zipCode,
            country: args.country,
            isDefault,
        });

        return addressId;
    },
});

/**
 * Update an address
 */
export const updateAddress = mutation({
    args: {
        addressId: v.id("addresses"),
        label: v.optional(v.string()),
        type: v.optional(v.string()),
        recipientName: v.optional(v.string()),
        phone: v.optional(v.string()),
        street: v.optional(v.string()),
        apartment: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        zipCode: v.optional(v.string()),
        country: v.optional(v.string()),
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

        const address = await ctx.db.get(args.addressId);
        if (!address || address.userId !== user._id) {
            throw new Error("Address not found or unauthorized");
        }

        const { addressId, ...updates } = args;
        await ctx.db.patch(addressId, updates);
        return null;
    },
});

/**
 * Delete an address
 */
export const deleteAddress = mutation({
    args: { addressId: v.id("addresses") },
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

        const address = await ctx.db.get(args.addressId);
        if (!address || address.userId !== user._id) {
            throw new Error("Address not found or unauthorized");
        }

        await ctx.db.delete(args.addressId);
        return null;
    },
});

/**
 * Set an address as default
 */
export const setDefaultAddress = mutation({
    args: { addressId: v.id("addresses") },
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

        const address = await ctx.db.get(args.addressId);
        if (!address || address.userId !== user._id) {
            throw new Error("Address not found or unauthorized");
        }

        // Remove default from all other addresses
        const allAddresses = await ctx.db
            .query("addresses")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .collect();

        for (const addr of allAddresses) {
            if (addr.isDefault && addr._id !== args.addressId) {
                await ctx.db.patch(addr._id, { isDefault: false });
            }
        }

        // Set this one as default
        await ctx.db.patch(args.addressId, { isDefault: true });
        return null;
    },
});
