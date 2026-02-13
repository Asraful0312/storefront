
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get tax settings
export const get = query({
    args: {},
    handler: async (ctx) => {
        const settings = await ctx.db.query("taxSettings").first();
        // Return null if not configured, do not return defaults
        return settings;
    },
});

// Update tax settings
export const update = mutation({
    args: {
        method: v.union(v.literal("automatic"), v.literal("manual")), // "stripe" in schema is "automatic" effectively for now, aligning with UI
        defaultRate: v.number(),
        taxOnShipping: v.boolean(),
        taxInclusive: v.boolean(),
        rules: v.optional(
            v.array(
                v.object({
                    region: v.string(),
                    rate: v.number(),
                })
            )
        ),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("taxSettings").first();

        // Map UI "automatic" to schema "stripe" or keep distinct?
        // Schema says: method: v.union(v.literal("manual"), v.literal("stripe"))
        // UI says: "automatic" vs "manual"
        // Let's align on "stripe" for automatic in backend
        const dbMethod = (args.method === "automatic" ? "stripe" : "manual") as "stripe" | "manual";

        const dbArgs = {
            ...args,
            method: dbMethod,
        };

        if (existing) {
            await ctx.db.patch(existing._id, dbArgs);
        } else {
            await ctx.db.insert("taxSettings", dbArgs);
        }
    },
});

// Calculate tax for a cart
export const calculateTax = query({
    args: {
        subtotal: v.number(), // cents (Total of items)
        shipping: v.number(), // cents
        countryCode: v.string(), // "US", "CA", etc.
        items: v.optional(
            v.array(
                v.object({
                    price: v.number(),
                    quantity: v.number(),
                    isTaxable: v.optional(v.boolean()),
                    taxRateOverride: v.optional(v.number()),
                })
            )
        ),
    },
    handler: async (ctx, args) => {
        const settings = await ctx.db.query("taxSettings").first();

        if (!settings) {
            return {
                amount: 0,
                rate: 0,
                isConfigured: false,
            };
        }

        // 1. Determine Standard Rate for Region
        let standardRate = settings.defaultRate; // Percentage
        if (settings.rules) {
            const rule = settings.rules.find(r => r.region === args.countryCode);
            if (rule) {
                standardRate = rule.rate;
            }
        }

        let totalTax = 0;

        // 2. Calculate Item Tax
        if (args.items) {
            for (const item of args.items) {
                // Skip if explicitly not taxable (default to true if undefined)
                if (item.isTaxable === false) {
                    continue;
                }

                const rate = item.taxRateOverride ?? standardRate;
                const itemTotal = item.price * item.quantity;

                // Calculate tax for this item (round per item or per line? usually per line)
                totalTax += Math.round(itemTotal * (rate / 100));
            }
        } else {
            // Fallback for when items aren't provided (backwards compat / simple calc)
            // Assumes everything is standard taxable
            totalTax = Math.round(args.subtotal * (standardRate / 100));
        }

        // 3. Calculate Shipping Tax
        if (settings.taxOnShipping) {
            totalTax += Math.round(args.shipping * (standardRate / 100));
        }

        return {
            amount: totalTax,
            rate: standardRate, // Return standard rate for display, even if mixed
            isConfigured: true,
            inclusive: settings.taxInclusive,
        };
    },
});
