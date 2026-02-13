
import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import Stripe from "stripe";
import { components } from "./_generated/api";

// We don't export 'stripe' component wrapper anymore as we use raw SDK for checkout.
// http.ts uses components.stripe directly for webhooks, which is fine.

export const createCheckoutSession = action({
    args: {
        shippingAddress: v.object({
            street: v.string(),
            city: v.string(),
            state: v.string(),
            zipCode: v.string(),
            country: v.string(),
        }),
        couponCode: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) throw new Error("Unauthenticated");

        if (!process.env.STRIPE_KEY) {
            throw new Error("Missing STRIPE_KEY env variable");
        }

        const stripe = new Stripe(process.env.STRIPE_KEY, {
            apiVersion: "2026-01-28.clover",
        });

        // 1. Get Cart Items
        const cartItems = await ctx.runQuery(api.cart.get);
        if (!cartItems || cartItems.length === 0) {
            throw new Error("Cart is empty");
        }

        // 2. Prepare items for calculation
        const domain = process.env.HOST_URL ?? "http://localhost:3000";

        // Calculate Subtotal
        const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

        // 3. Calculate Shipping
        const shippingCalc = await ctx.runQuery(api.shippingSettings.calculateRate, {
            countryCode: args.shippingAddress.country,
            items: cartItems.map(item => ({
                weight: item.product.weight,
                dimensions: item.product.dimensions,
                quantity: item.quantity,
                shippingRateOverride: item.product.shippingRateOverride,
                isFreeShipping: item.product.isFreeShipping
            })),
            subtotal: subtotal
        });

        // 4. Calculate Tax
        const taxCalc = await ctx.runQuery(api.tax.calculateTax, {
            subtotal,
            shipping: shippingCalc.rate,
            countryCode: args.shippingAddress.country,
            items: cartItems.map(item => ({
                price: item.product.price,
                quantity: item.quantity,
                isTaxable: item.product.isTaxable,
                taxRateOverride: item.product.taxRateOverride
            }))
        });

        // 6. Construct Line Items
        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = cartItems.map(item => ({
            price_data: {
                currency: "usd",
                product_data: {
                    name: item.product.name + (item.variant ? ` (${item.variant.name})` : ""),
                    images: item.product.image ? [item.product.image] : [],
                },
                unit_amount: item.product.price, // cents
            },
            quantity: item.quantity,
        }));

        // Add Shipping
        if (shippingCalc.rate > 0) {
            line_items.push({
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `Shipping (${shippingCalc.zoneName})`,
                        description: shippingCalc.deliveryTime,
                    },
                    unit_amount: shippingCalc.rate,
                },
                quantity: 1,
            });
        }

        // Add Tax
        if (taxCalc.amount > 0 && !taxCalc.inclusive) {
            line_items.push({
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `Tax (${taxCalc.rate}%)`,
                    },
                    unit_amount: taxCalc.amount,
                },
                quantity: 1,
            });
        }

        // 7. Create Session
        const session = await stripe.checkout.sessions.create({
            line_items,
            mode: "payment",
            customer_email: user.email,
            success_url: `${domain}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${domain}/checkout`,
            metadata: {
                userId: user.subject,
                shippingAddress: JSON.stringify(args.shippingAddress)
            },
        });

        return session.url;
    },
});

export const fulfillOrder = internalMutation({
    args: { stripeId: v.string(), paymentIntent: v.optional(v.string()), amountTotal: v.number(), metadata: v.any() },
    handler: async (ctx, args) => {
        const { stripeId, paymentIntent, amountTotal, metadata } = args;

        // Idempotency check
        const existing = await ctx.db.query("orders").withIndex("by_orderNumber", q => q.eq("orderNumber", stripeId)).first();
        if (existing) return;

        const userId = metadata.userId;
        if (!userId) {
            console.error("No userId in metadata for Stripe Session:", stripeId);
            return;
        }

        // Find user
        const user = await ctx.db.query("users").withIndex("by_clerkId", q => q.eq("clerkId", userId)).unique();
        if (!user) {
            console.error("User not found for clerkId:", userId);
            return;
        }

        // Get Cart Items
        const cartItems = await ctx.db.query("cartItems").withIndex("by_userId", q => q.eq("userId", user._id)).collect();

        if (cartItems.length === 0) {
            console.warn("Cart empty during fulfillment for user:", user._id);
            return;
        }

        // Parse Shipping Address
        let shippingAddressId = undefined;
        try {
            const addrData = JSON.parse(metadata.shippingAddress);
            const newAddress = await ctx.db.insert("addresses", {
                userId: user._id,
                label: "Order Address",
                recipientName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
                street: addrData.street,
                city: addrData.city,
                state: addrData.state,
                zipCode: addrData.zipCode,
                country: addrData.country,
                type: "home",
                isDefault: false
            });
            shippingAddressId = newAddress;
        } catch (e) {
            console.error("Failed to parse shipping address:", e);
        }

        // Re-construct order items
        const orderItems = [];
        let subtotal = 0;

        for (const item of cartItems) {
            const product = await ctx.db.get(item.productId);
            if (!product) continue;

            let variant = null;
            if (item.variantId) {
                variant = await ctx.db.get(item.variantId);
            }

            const price = variant ? (product.basePrice + (variant.priceAdjustment || 0)) : product.basePrice;
            subtotal += price * item.quantity;

            orderItems.push({
                productId: item.productId,
                variantId: item.variantId,
                name: product.name,
                sku: variant?.sku || "N/A",
                quantity: item.quantity,
                price: price,
                image: variant?.imageUrl || product.images[0]?.url,
            });
        }

        const remainder = amountTotal - subtotal;

        await ctx.db.insert("orders", {
            userId: user._id,
            orderNumber: stripeId,
            status: "pending",
            items: orderItems,
            subtotal: subtotal,
            tax: 0,
            shipping: remainder > 0 ? remainder : 0,
            total: amountTotal,
            shippingAddressId: shippingAddressId,
            paymentMethod: "stripe",
            trackingNumber: undefined
        });

        // Clear cart
        for (const item of cartItems) {
            await ctx.db.delete(item._id);
        }
    }
});
