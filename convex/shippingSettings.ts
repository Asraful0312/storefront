import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ==================== QUERIES ====================

// Get shipping settings
export const get = query({
    args: {},
    handler: async (ctx) => {
        // Get the single settings document
        const settings = await ctx.db.query("shippingSettings").first();

        if (!settings) {
            // Return defaults if not configured
            return null
        }

        return settings;
    },
});

// Get zone for a country
export const getZoneForCountry = query({
    args: { countryCode: v.string() },
    handler: async (ctx, args) => {
        const settings = await ctx.db.query("shippingSettings").first();

        if (!settings) {
            // Return default domestic zone
            return null
        }

        // Find matching zone
        for (const zone of settings.zones) {
            if (zone.regions.includes(args.countryCode) || zone.regions.includes("*")) {
                return zone;
            }
        }

        // Return last zone (usually "Rest of World")
        return settings.zones[settings.zones.length - 1];
    },
});

// ==================== MUTATIONS ====================

// Initialize or update shipping settings
export const update = mutation({
    args: {
        freeShippingThreshold: v.optional(v.number()),
        zones: v.array(
            v.object({
                id: v.string(),
                name: v.string(),
                regions: v.array(v.string()),
                rateType: v.union(
                    v.literal("flat"),
                    v.literal("weight"),
                    v.literal("calculated")
                ),
                baseRate: v.number(),
                perKgRate: v.optional(v.number()),
                freeShippingOverride: v.optional(v.number()),
                deliveryTime: v.string(),
            })
        ),
        dimWeightDivisor: v.number(),
        returnPolicy: v.string(),
        warrantyInfo: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("shippingSettings").first();

        if (existing) {
            await ctx.db.patch(existing._id, args);
            return existing._id;
        } else {
            return await ctx.db.insert("shippingSettings", args);
        }
    },
});

// Calculate shipping for a cart
export const calculateRate = query({
    args: {
        countryCode: v.string(),
        items: v.array(
            v.object({
                weight: v.number(), // grams
                dimensions: v.optional(
                    v.object({
                        length: v.number(),
                        width: v.number(),
                        height: v.number(),
                    })
                ),
                quantity: v.number(),
                // Overrides
                shippingRateOverride: v.optional(v.number()),
                isFreeShipping: v.optional(v.boolean()),
            })
        ),
        subtotal: v.number(), // cents
    },
    handler: async (ctx, args) => {
        const settings = await ctx.db.query("shippingSettings").first();

        // Get zone for country
        let zone = null;

        if (settings) {
            for (const z of settings.zones) {
                if (z.regions.includes(args.countryCode) || z.regions.includes("*")) {
                    zone = z;
                    break;
                }
            }
            zone = zone || settings.zones[settings.zones.length - 1];
        }

        if (!settings || !zone) {
            return null;
        }

        const dimDivisor = settings?.dimWeightDivisor || 5000;
        const freeThreshold =
            zone.freeShippingOverride ?? settings?.freeShippingThreshold;

        // Check global free shipping threshold (applies to subtotal)
        // If subtotal > threshold, EVERYTHING is free? Or just standard shipping?
        // Usually, if you hit $100, everything is free.
        if (freeThreshold && args.subtotal >= freeThreshold) {
            return {
                rate: 0,
                zoneName: zone.name,
                deliveryTime: zone.deliveryTime,
                isFree: true,
                freeShippingThreshold: freeThreshold,
            };
        }

        let totalShippingCost = 0;
        let standardItems = [];

        // 1. Handle overrides
        for (const item of args.items) {
            if (item.isFreeShipping) {
                continue; // Adds 0 to cost
            } else if (item.shippingRateOverride !== undefined) {
                totalShippingCost += item.shippingRateOverride * item.quantity;
            } else {
                standardItems.push(item);
            }
        }

        // 2. Calculate standard shipping for remaining items
        if (standardItems.length > 0) {
            let standardRate = zone.baseRate;

            if (zone.rateType === "weight" && zone.perKgRate) {
                let totalBillableWeight = 0;

                for (const item of standardItems) {
                    const actualWeight = item.weight * item.quantity;
                    let dimWeight = 0;
                    if (item.dimensions) {
                        const { length, width, height } = item.dimensions;
                        dimWeight = ((length * width * height) / dimDivisor) * 1000 * item.quantity;
                    }
                    totalBillableWeight += Math.max(actualWeight, dimWeight);
                }

                const billableKg = totalBillableWeight / 1000;
                // Base rate + weight rate. 
                // Note: Base rate is usually "per shipment". 
                // If we have overrides, do we still charge full base rate?
                // Yes, typically the base rate is for the "box".
                standardRate = zone.baseRate + Math.ceil(billableKg) * (zone.perKgRate || 0);
            }

            // If flat rate, it's just baseRate (once per shipment, not per item, typically).
            // But if we have mix of items? 
            // Standard logic: The presence of ANY standard items triggers the standard shipping calculation.
            totalShippingCost += standardRate;
        }

        return {
            rate: totalShippingCost,
            zoneName: zone.name,
            deliveryTime: zone.deliveryTime,
            isFree: totalShippingCost === 0,
            freeShippingThreshold: freeThreshold,
        };
    },
});
