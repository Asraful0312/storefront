"use server";

import { clerkClient } from "@clerk/nextjs/server";

export interface UpdateUserData {
    clerkId: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
}

/**
 * Server action to update a user's profile in Clerk
 */
export async function updateClerkUser(data: UpdateUserData): Promise<{ success: boolean; error?: string }> {
    try {
        const clerk = await clerkClient();

        await clerk.users.updateUser(data.clerkId, {
            firstName: data.firstName,
            lastName: data.lastName,
        });

        return { success: true };
    } catch (error: any) {
        console.error("Failed to update user:", error);

        let errorMessage = error.message || "Failed to update user";
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
 * Server action to update a user's profile image in Clerk
 */
export async function updateClerkUserImage(
    clerkId: string,
    imageFile: File
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
    try {
        const clerk = await clerkClient();

        // Upload the image to Clerk
        const result = await clerk.users.updateUserProfileImage(clerkId, {
            file: imageFile,
        });

        return {
            success: true,
            imageUrl: result.imageUrl
        };
    } catch (error: any) {
        console.error("Failed to update user image:", error);

        let errorMessage = error.message || "Failed to update image";
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
 * Server action to remove a user's profile image in Clerk
 */
export async function removeClerkUserImage(clerkId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const clerk = await clerkClient();

        await clerk.users.deleteUserProfileImage(clerkId);

        return { success: true };
    } catch (error: any) {
        console.error("Failed to remove user image:", error);

        let errorMessage = error.message || "Failed to remove image";
        if (error.errors && Array.isArray(error.errors)) {
            errorMessage = error.errors.map((e: any) => e.message || e.longMessage).join(", ");
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
}
