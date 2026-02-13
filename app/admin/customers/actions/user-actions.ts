"use server";

import { clerkClient, auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

export interface CreateUserData {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    phone?: string;
    role?: "customer" | "admin";
    tags?: string[];
    notes?: string;
    sendInvitation?: boolean;
}

export interface CreateUserResult {
    success: boolean;
    userId?: string;
    clerkId?: string;
    error?: string;
}

/**
 * Server action to create a new user via Clerk and Convex
 * This action creates the user in Clerk first, then creates
 * the extended profile in Convex
 */
export async function createClerkUser(data: CreateUserData): Promise<CreateUserResult> {
    try {
        const { userId, getToken } = await auth();

        if (!userId) {
            return {
                success: false,
                error: "You must be logged in to perform this action",
            };
        }

        const clerk = await clerkClient();

        // Create user in Clerk
        const clerkUser = await clerk.users.createUser({
            firstName: data.firstName,
            lastName: data.lastName,
            emailAddress: [data.email],
            password: data.password,
            skipPasswordRequirement: data.sendInvitation ?? true,
        });

        // If invitation should be sent, create an invitation
        if (data.sendInvitation && !data.password) {
            // Clerk will handle sending the email
            // The user can set their own password via the invitation
        }

        // Create extended user profile in Convex
        // We need to pass the auth token so Convex knows who is making this request (the admin)
        const token = await getToken({ template: "convex" });
        const convex = new ConvexHttpClient(convexUrl);

        if (token) {
            convex.setAuth(token);
        }

        const convexUserId = await convex.mutation(api.users.adminCreateUser, {
            clerkId: clerkUser.id,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            role: data.role ?? "customer",
            tags: data.tags,
            notes: data.notes,
        });

        return {
            success: true,
            userId: convexUserId,
            clerkId: clerkUser.id,
        };
    } catch (error: any) {
        console.error("Failed to create user:", error);

        // Extract detailed Clerk error messages
        let errorMessage = error.message || "Failed to create user";
        if (error.errors && Array.isArray(error.errors)) {
            errorMessage = error.errors.map((e: any) => e.message || e.longMessage).join(", ");
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
}

/**
 * Server action to delete a user from both Clerk and Convex
 */
export async function deleteClerkUser(clerkId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const clerk = await clerkClient();

        // Delete from Clerk
        await clerk.users.deleteUser(clerkId);

        // The Clerk webhook will handle deleting from Convex

        return { success: true };
    } catch (error: any) {
        console.error("Failed to delete user:", error);
        return {
            success: false,
            error: error.message || "Failed to delete user",
        };
    }
}

/**
 * Server action to update a user's password in Clerk
 */
export async function updateClerkUserPassword(
    clerkId: string,
    newPassword: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const clerk = await clerkClient();

        await clerk.users.updateUser(clerkId, {
            password: newPassword,
        });

        return { success: true };
    } catch (error: any) {
        console.error("Failed to update password:", error);
        return {
            success: false,
            error: error.message || "Failed to update password",
        };
    }
}
