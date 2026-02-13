"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { clerkClient } from "@clerk/nextjs/server";


export const syncUser = internalAction({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        try {
            const client = await clerkClient();
            const user = await client.users.getUser(args.clerkId);

            await ctx.runMutation(internal.users.upsertFromClerk, {
                clerkId: user.id,
                email: user.emailAddresses[0]?.emailAddress ?? "",
                firstName: user.firstName ?? undefined,
                lastName: user.lastName ?? undefined,
                avatarUrl: user.imageUrl ?? undefined,
            });
        } catch (error) {
            console.error("Failed to sync user from Clerk:", error);
        }
    },
});
