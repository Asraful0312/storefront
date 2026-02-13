import { makeCloudinaryAPI, CloudinaryClient } from "@imaxis/cloudinary-convex";
import { components } from "./_generated/api";
import { query } from "./_generated/server";
import { v } from "convex/values";

// Initialize client for server-side usage
const cloudinary = new CloudinaryClient(components.cloudinary);

export const {
    upload,
    transform,
    deleteAsset,
    listAssets,
    getAsset,
    updateAsset,
    generateUploadCredentials,
    finalizeUpload,
} = makeCloudinaryAPI(components.cloudinary);

// Custom listAssets that handles the status field issue
export const listAssetsCustom = query({
    args: {
        limit: v.optional(v.number()),
        folder: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Use CloudinaryClient's list method which properly accesses component tables
        const assets = await cloudinary.list(ctx, {
            limit: args.limit || 50
        });

        // Filter by folder if specified and map to expected format
        return assets
            .filter((asset: any) => !args.folder || asset.folder === args.folder)
            .map((asset: any) => ({
                publicId: asset.publicId,
                secureUrl: asset.secureUrl,
                width: asset.width,
                height: asset.height,
                format: asset.format,
                folder: asset.folder,
            }));
    },
});