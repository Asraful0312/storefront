import { v } from "convex/values";
import { query, action, internalMutation, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// How often to refresh rates (6 hours in ms)
const CACHE_TTL = 6 * 60 * 60 * 1000;

/**
 * Get cached exchange rates.
 * Returns rates object with USD as base, or null if not cached yet.
 */
export const getRates = query({
  args: {},
  returns: v.union(
    v.object({
      base: v.string(),
      rates: v.any(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const cached = await ctx.db
      .query("exchangeRates")
      .withIndex("by_base", (q) => q.eq("base", "USD"))
      .unique();

    if (!cached) return null;

    return {
      base: cached.base,
      rates: cached.rates,
      updatedAt: cached.updatedAt,
    };
  },
});

/**
 * Internal query for use by actions
 */
export const getRatesInternal = internalQuery({
  args: {},
  returns: v.union(
    v.object({
      base: v.string(),
      rates: v.any(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const cached = await ctx.db
      .query("exchangeRates")
      .withIndex("by_base", (q) => q.eq("base", "USD"))
      .unique();

    if (!cached) return null;

    return {
      base: cached.base,
      rates: cached.rates,
      updatedAt: cached.updatedAt,
    };
  },
});

/**
 * Internal mutation to store fetched rates
 */
export const storeRates = internalMutation({
  args: {
    base: v.string(),
    rates: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("exchangeRates")
      .withIndex("by_base", (q) => q.eq("base", args.base))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        rates: args.rates,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("exchangeRates", {
        base: args.base,
        rates: args.rates,
        updatedAt: now,
      });
    }
  },
});

/**
 * Internal action: Fetch exchange rates from a free API and store them.
 * Uses ExchangeRate-API (free tier, no key needed for USD base).
 */
export const fetchRates = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      const response = await fetch(
        "https://open.er-api.com/v6/latest/USD"
      );

      if (!response.ok) {
        throw new Error(`Exchange rate API returned ${response.status}`);
      }

      const data = await response.json();

      if (data.result !== "success" || !data.rates) {
        throw new Error("Invalid exchange rate API response");
      }

      await ctx.runMutation(internal.exchangeRates.storeRates, {
        base: "USD",
        rates: data.rates,
      });

      console.log(
        `Exchange rates updated. ${Object.keys(data.rates).length} currencies.`
      );
    } catch (error) {
      console.error("Failed to fetch exchange rates:", error);
    }
  },
});

/**
 * Public action to refresh rates if stale.
 * Called from the frontend when rates are older than CACHE_TTL.
 */
export const refreshRatesIfStale = action({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const cached = await ctx.runQuery(
      internal.exchangeRates.getRatesInternal,
      {}
    );

    const now = Date.now();
    const isStale = !cached || now - cached.updatedAt > CACHE_TTL;

    if (isStale) {
      await ctx.runAction(internal.exchangeRates.fetchRates, {});
    }

    return null;
  },
});

