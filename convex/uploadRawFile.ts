"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import crypto from "crypto";

/**
 * Upload a raw file (PDF, ZIP, EPUB, etc.) directly to Cloudinary,
 * bypassing the @imaxis/cloudinary-convex library's image-only validation.
 *
 * Uses Cloudinary's Upload API with resource_type: "raw".
 */
export const upload = action({
    args: {
        base64Data: v.string(),
        filename: v.string(),
        folder: v.optional(v.string()),
    },
    handler: async (_ctx, args) => {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName || !apiKey || !apiSecret) {
            throw new Error(
                "Missing Cloudinary configuration. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET environment variables."
            );
        }

        // Validate base64 data
        if (!args.base64Data) {
            throw new Error("File data is required");
        }

        // Estimate size (~33% base64 overhead)
        const base64Content = args.base64Data.includes(",")
            ? args.base64Data.split(",")[1]
            : args.base64Data;
        const estimatedSize = (base64Content.length * 3) / 4;
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (estimatedSize > maxSize) {
            throw new Error(
                `File too large. Maximum size: ${Math.round(maxSize / (1024 * 1024))}MB`
            );
        }

        // Generate signature for authenticated upload
        const timestamp = Math.floor(Date.now() / 1000);
        const folder = args.folder || "digital-files";

        const params: Record<string, string> = {
            folder,
            timestamp: timestamp.toString(),
        };

        // Build signature string (params sorted alphabetically)
        const signatureString =
            Object.keys(params)
                .sort()
                .map((key) => `${key}=${params[key]}`)
                .join("&") + apiSecret;

        const signature = crypto
            .createHash("sha1")
            .update(signatureString)
            .digest("hex");

        // Upload to Cloudinary using raw resource type
        const formData = new FormData();
        formData.append("file", args.base64Data);
        formData.append("api_key", apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("signature", signature);
        formData.append("folder", folder);

        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`;

        const response = await fetch(uploadUrl, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Cloudinary upload failed: ${errorText}`);
        }

        const result = await response.json();

        return {
            success: true,
            publicId: result.public_id as string,
            secureUrl: result.secure_url as string,
            format: result.format as string,
            bytes: result.bytes as number,
            originalFilename: result.original_filename as string,
        };
    },
});
