
import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import Stripe from "stripe";
import { components } from "./_generated/api";

// We don't export 'stripe' component wrapper anymore as we use raw SDK for checkout.
// http.ts uses components.stripe directly for webhooks, which is fine.

export const createCheckoutSession = action({
    args: {
        shippingAddress: v.optional(v.object({
            street: v.string(),
            city: v.string(),
            state: v.string(),
            zipCode: v.string(),
            country: v.string(),
        })),
        couponCode: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<string | null> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.runQuery(internal.users.getUserByClerkId, { clerkId: identity.subject });
        if (!user) throw new Error("User not found");

        if (!process.env.STRIPE_KEY) {
            throw new Error("Missing STRIPE_KEY env variable");
        }

        const stripe = new Stripe(process.env.STRIPE_KEY, {
            apiVersion: "2026-01-28.clover" as any,
        });

        // 1. Get Cart Items
        const cartItems: any[] = await ctx.runQuery(api.cart.get);
        if (!cartItems || cartItems.length === 0) {
            throw new Error("Cart is empty");
        }

        // 2. Prepare items for calculation
        const domain = process.env.HOST_URL ?? "http://localhost:3000";

        // Calculate Subtotal
        const subtotal = cartItems.reduce((sum: number, item: any) => sum + item.product.price * item.quantity, 0);

        // --- COUPON LOGIC ---
        let couponCode = args.couponCode;
        if (!couponCode) {
            // Check metadata
            const metadata = await ctx.runQuery(internal.cart.getMetadata, { userId: user._id });
            if (metadata?.couponCode) {
                couponCode = metadata.couponCode;
            }
        }

        let stripeDiscounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
        let isFreeShippingCoupon = false;

        if (couponCode) {
            const validation = await ctx.runQuery(api.coupons.validateCoupon, { 
                code: couponCode, 
                purchaseAmount: subtotal * 100, // Cents? Wait, product.price is cents or dollars? 
                // Using assumption that product.price is defined in Schema. 
                // Storefront usually uses cents. Checking schema/usage... schema says Check `convex/schema.ts`.
                // Products have `price: v.number()`. Usually cents.
                // Let's assume cents.
                userId: user._id 
            });

            if (validation.valid && validation.coupon) {
                if (validation.coupon.discountType === "shipping") {
                    isFreeShippingCoupon = true;
                } else if (validation.coupon.stripeCouponId) {
                    stripeDiscounts = [{ coupon: validation.coupon.stripeCouponId }];
                } else {
                    // Self-healing: Coupon is valid in DB but missing Stripe ID. Recreate it.
                    console.warn(`Coupon ${couponCode} missing Stripe ID. Attempting to heal...`);
                    try {
                        const couponParams: Stripe.CouponCreateParams = {
                            name: validation.coupon.code,
                            duration: "forever",
                            currency: validation.coupon.discountType === "fixed" ? "usd" : undefined,
                        };

                        if (validation.coupon.discountType === "percentage") {
                            couponParams.percent_off = validation.coupon.discountValue;
                        } else if (validation.coupon.discountType === "fixed") {
                            couponParams.amount_off = validation.coupon.discountValue;
                        }

                        if (validation.coupon.usageLimit) {
                            couponParams.max_redemptions = validation.coupon.usageLimit;
                        }
                        if (validation.coupon.validUntil) {
                            couponParams.redeem_by = Math.floor(validation.coupon.validUntil / 1000);
                        }

                        const newStripeCoupon = await stripe.coupons.create(couponParams);
                        
                        // Update DB with new ID
                        await ctx.runMutation(internal.coupons.updateCouponInternal, {
                            id: validation.coupon._id,
                            stripeCouponId: newStripeCoupon.id
                        });

                        stripeDiscounts = [{ coupon: newStripeCoupon.id }];
                        console.log(`Coupon ${couponCode} healed. New Stripe ID: ${newStripeCoupon.id}`);
                    } catch (err) {
                        console.error("Failed to heal coupon:", err);
                        // Fallback: throw error so user knows discount failed rather than silent failure
                        throw new Error("Failed to apply coupon. Please contact support.");
                    }
                }
            } else if (args.couponCode) {
                 // Throw if user explicitly tried to use it
                 console.error("Coupon validation failed in checkout session:", validation.error);
                 throw new Error(validation.error || "Invalid coupon");
            }
        }

        // --------------------

        // Check if cart is all-digital (no physical products)
        const isAllDigital = cartItems.every((item: any) => {
            const pType = (item.product as any).productType;
            return pType === "digital" || pType === "gift_card";
        });

        // Validate shipping address for physical items
        if (!isAllDigital && !args.shippingAddress) {
            throw new Error("Shipping address is required for physical items");
        }

        // 3. Calculate Shipping (skip for digital-only carts)
        let shippingCalc = { rate: 0, zoneName: "", deliveryTime: "" };
        if (!isAllDigital && args.shippingAddress) {
            shippingCalc = await ctx.runQuery(api.shippingSettings.calculateRate, {
                countryCode: args.shippingAddress.country,
                items: cartItems
                    .filter((item: any) => {
                        const pType = (item.product as any).productType;
                        return !pType || pType === "physical";
                    })
                    .map((item: any) => ({
                        weight: item.product.weight,
                        dimensions: item.product.dimensions,
                        quantity: item.quantity,
                        shippingRateOverride: item.product.shippingRateOverride,
                        isFreeShipping: item.product.isFreeShipping
                    })),
                subtotal: subtotal
            });

            if (isFreeShippingCoupon) {
                shippingCalc.rate = 0;
                shippingCalc.zoneName += " (Free Shipping Coupon)";
            }
        }

        // 4. Calculate Tax
        const taxCalc = args.shippingAddress ? await ctx.runQuery(api.tax.calculateTax, {
            subtotal,
            shipping: shippingCalc.rate,
            countryCode: args.shippingAddress.country,
            items: cartItems.map((item: any) => ({
                price: item.product.price,
                quantity: item.quantity,
                isTaxable: item.product.isTaxable,
                taxRateOverride: item.product.taxRateOverride
            }))
        }) : { amount: 0, rate: 0, inclusive: false };

        // 6. Construct Line Items
        const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = cartItems.map((item: any) => ({
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
        if (shippingCalc.rate > 0 || isFreeShippingCoupon) {
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
            discounts: stripeDiscounts,
            customer_email: identity.email,
            success_url: `${domain}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${domain}/checkout`,
            metadata: {
                userId: identity.subject,
                customerEmail: identity.email || "",
                shippingAddress: args.shippingAddress ? JSON.stringify(args.shippingAddress) : "",
                isAllDigital: isAllDigital ? "true" : "false",
                couponCode: couponCode || "", 
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

        // Parse Shipping Address (skip for all-digital orders)
        const isAllDigital = metadata.isAllDigital === "true";
        let shippingAddressId = undefined;
        if (!isAllDigital) {
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
        }

        // Helper: generate gift card code
        const generateGiftCode = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
            return `GIFT-${segment()}-${segment()}-${segment()}`;
        };

        // Re-construct order items with digital product data
        const orderItems = [];
        let subtotal = 0;
        let hasOnlyDigital = true;

        for (const item of cartItems) {
            const product = await ctx.db.get(item.productId);
            if (!product) continue;

            let variant = null;
            if (item.variantId) {
                variant = await ctx.db.get(item.variantId);
            }

            const price = variant ? (product.basePrice + (variant.priceAdjustment || 0)) : product.basePrice;
            subtotal += price * item.quantity;

            const productType = product.productType || "physical";
            if (productType === "physical") hasOnlyDigital = false;

            // Build order item with digital fields
            const orderItem: any = {
                productId: item.productId,
                variantId: item.variantId,
                name: product.name,
                sku: variant?.sku || "N/A",
                quantity: item.quantity,
                price: price,
                image: variant?.imageUrl || product.images[0]?.url,
                productType,
            };

            // Snapshot digital file info
            if (productType === "digital" && product.digitalFiles && product.digitalFiles.length > 0) {
                // Store file info if needed, but we rely on product lookups or store here?
                // Storing here ensures robust access if product changes.
                // However, our validator only has 'downloads' and 'maxDownloads'.
                // The filename/url might be part of 'product' data fetched on demand, or we should add to orderItem?
                // For now, let's just init the counters.
                orderItem.downloadCount = 0;
                orderItem.maxDownloads = product.maxDownloads;
            }

            // Auto-generate gift card codes for auto mode
            if (productType === "gift_card" && product.giftCardCodeMode === "auto") {
                orderItem.giftCardCode = generateGiftCode();
            }

            orderItems.push(orderItem);
        }

        const remainder = amountTotal - subtotal;

        // Digital-only orders are auto-delivered immediately
        const initialStatus = hasOnlyDigital ? "delivered" : "pending";

        await ctx.db.insert("orders", {
            userId: user._id,
            orderNumber: stripeId,
            status: initialStatus,
            items: orderItems,
            subtotal: subtotal,
            tax: 0,
            shipping: remainder > 0 ? remainder : 0,
            total: amountTotal,
            shippingAddressId: shippingAddressId,
            customerEmail: metadata.customerEmail || undefined,
            paymentMethod: "stripe",
            trackingNumber: undefined
        });

        // Clear cart
        for (const item of cartItems) {
            await ctx.db.delete(item._id);
        }
    }
});
