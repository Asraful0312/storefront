import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { components } from "./_generated/api";
import { registerRoutes } from "@convex-dev/stripe";

const http = httpRouter();

registerRoutes(http, components.stripe, {
    events: {
        "checkout.session.completed": async (ctx, event) => {
            const session = event.data.object as any;
            await ctx.runMutation(internal.payments.fulfillOrder, {
                stripeId: session.id,
                paymentIntent: session.payment_intent as string,
                amountTotal: session.amount_total ?? 0,
                metadata: session.metadata
            });
        }
    }
});

/**
 * Clerk webhook endpoint for user sync
 * Configure this webhook in Clerk Dashboard:
 * - URL: https://your-convex-deployment.convex.site/webhook
 * - Events: user.created, user.updated, user.deleted
 */
http.route({
    path: "/webhook",
    method: "POST",
    handler: httpAction(async (ctx, req) => {
        // Verify webhook signature (in production, verify with Clerk's svix library)
        const svixId = req.headers.get("svix-id");
        const svixTimestamp = req.headers.get("svix-timestamp");
        const svixSignature = req.headers.get("svix-signature");

        if (!svixId || !svixTimestamp || !svixSignature) {
            return new Response("Missing svix headers", { status: 400 });
        }

        try {
            const body = await req.json();
            const eventType = body.type as string;
            const data = body.data;

            console.log("Clerk event type:", eventType);

            switch (eventType) {
                case "user.created":
                case "user.updated": {
                    // Sync user data to Convex
                    await ctx.runMutation(internal.users.upsertFromClerk, {
                        clerkId: data.id,
                        email: data.email_addresses?.[0]?.email_address ?? "",
                        firstName: data.first_name ?? undefined,
                        lastName: data.last_name ?? undefined,
                        avatarUrl: data.image_url ?? undefined,
                    });
                    break;
                }

                case "user.deleted": {
                    // Handle user deletion
                    await ctx.runMutation(internal.users.deleteFromClerk, {
                        clerkId: data.id,
                    });
                    break;
                }

                case "session.created": {
                    // Fallback: If user.created missing, ensure user exists on session creation
                    const clerkUserId = data.user_id;
                    if (clerkUserId) {
                        const user = await ctx.runQuery(internal.users.getUserByClerkId, {
                            clerkId: clerkUserId,
                        });

                        if (!user) {
                            console.log(`User ${clerkUserId} missing in Convex. Syncing from Clerk...`);
                            await ctx.runAction(internal.clerk.syncUser, {
                                clerkId: clerkUserId,
                            });
                        }
                    }
                    break;
                }

                default:
                    console.log(`Unhandled Clerk event: ${eventType}`);
            }

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { "Content-Type": "application/json" },
            });
        } catch (error) {
            console.error("Clerk webhook error:", error);
            return new Response("Webhook processing failed", { status: 500 });
        }
    }),
});

export default http;
