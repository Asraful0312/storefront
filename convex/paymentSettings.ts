import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

/**
 * Default payment settings when none exist in DB.
 */
const DEFAULTS = {
    stripeEnabled: true,
    codEnabled: false,
    codInstructions: "",
    bankTransferEnabled: false,
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    routingNumber: "",
    swiftCode: "",
    bankInstructions: "",
};

/**
 * Get payment settings (public — checkout needs to know which methods are available).
 */
export const get = query({
    args: {},
    handler: async (ctx) => {
        const settings = await ctx.db.query("paymentSettings").first();
        if (!settings) {
            return DEFAULTS;
        }
        return settings;
    },
});

/**
 * Update payment settings (admin only).
 */
export const update = mutation({
    args: {
        stripeEnabled: v.boolean(),
        codEnabled: v.boolean(),
        codInstructions: v.optional(v.string()),
        bankTransferEnabled: v.boolean(),
        bankName: v.optional(v.string()),
        accountHolder: v.optional(v.string()),
        accountNumber: v.optional(v.string()),
        routingNumber: v.optional(v.string()),
        swiftCode: v.optional(v.string()),
        bankInstructions: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user.role !== "admin") {
            throw new Error("Unauthorized — admin only");
        }

        const existing = await ctx.db.query("paymentSettings").first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                stripeEnabled: args.stripeEnabled,
                codEnabled: args.codEnabled,
                codInstructions: args.codInstructions,
                bankTransferEnabled: args.bankTransferEnabled,
                bankName: args.bankName,
                accountHolder: args.accountHolder,
                accountNumber: args.accountNumber,
                routingNumber: args.routingNumber,
                swiftCode: args.swiftCode,
                bankInstructions: args.bankInstructions,
            });
        } else {
            await ctx.db.insert("paymentSettings", {
                stripeEnabled: args.stripeEnabled,
                codEnabled: args.codEnabled,
                codInstructions: args.codInstructions,
                bankTransferEnabled: args.bankTransferEnabled,
                bankName: args.bankName,
                accountHolder: args.accountHolder,
                accountNumber: args.accountNumber,
                routingNumber: args.routingNumber,
                swiftCode: args.swiftCode,
                bankInstructions: args.bankInstructions,
            });
        }

        return null;
    },
});
