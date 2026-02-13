import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List uploaded assets for a product
export const listByProduct = query({
    args: { productId: v.id("products") },
    handler: async (ctx, args) => {
        const product = await ctx.db.get(args.productId);
        return product?.images || [];
    },
});


// Save uploaded image to product
export const saveImageToProduct = mutation({
    args: {
        productId: v.id("products"),
        image: v.object({
            publicId: v.string(),
            url: v.string(),
            alt: v.optional(v.string()),
            isMain: v.boolean(),
        }),
    },
    handler: async (ctx, args) => {
        const product = await ctx.db.get(args.productId);
        if (!product) throw new Error("Product not found");

        const images = [...(product.images || [])];

        // If this is main, unset others
        if (args.image.isMain) {
            for (let i = 0; i < images.length; i++) {
                images[i] = { ...images[i], isMain: false };
            }
        }

        images.push(args.image);

        // Update featured image if this is main or first image
        const featuredImage = args.image.isMain
            ? args.image.url
            : product.featuredImage || args.image.url;

        await ctx.db.patch(args.productId, { images, featuredImage });

        return images.length - 1; // Index of new image
    },
});

// Remove image from product
export const removeImageFromProduct = mutation({
    args: {
        productId: v.id("products"),
        publicId: v.string(),
    },
    handler: async (ctx, args) => {
        const product = await ctx.db.get(args.productId);
        if (!product) throw new Error("Product not found");

        const images = product.images.filter((img) => img.publicId !== args.publicId);

        // Update featured image if removed was main
        let featuredImage = product.featuredImage;
        const removedImage = product.images.find((img) => img.publicId === args.publicId);

        if (removedImage?.isMain || removedImage?.url === product.featuredImage) {
            const newMain = images.find((img) => img.isMain) || images[0];
            featuredImage = newMain?.url;

            // Set first image as main if no main exists
            if (images.length > 0 && !images.some((img) => img.isMain)) {
                images[0] = { ...images[0], isMain: true };
            }
        }

        await ctx.db.patch(args.productId, { images, featuredImage });
    },
});

// Set image as main
export const setMainImage = mutation({
    args: {
        productId: v.id("products"),
        publicId: v.string(),
    },
    handler: async (ctx, args) => {
        const product = await ctx.db.get(args.productId);
        if (!product) throw new Error("Product not found");

        const images = product.images.map((img) => ({
            ...img,
            isMain: img.publicId === args.publicId,
        }));

        const mainImage = images.find((img) => img.isMain);
        const featuredImage = mainImage?.url || product.featuredImage;

        await ctx.db.patch(args.productId, { images, featuredImage });
    },
});

// Update image alt text
export const updateImageAlt = mutation({
    args: {
        productId: v.id("products"),
        publicId: v.string(),
        alt: v.string(),
    },
    handler: async (ctx, args) => {
        const product = await ctx.db.get(args.productId);
        if (!product) throw new Error("Product not found");

        const images = product.images.map((img) =>
            img.publicId === args.publicId ? { ...img, alt: args.alt } : img
        );

        await ctx.db.patch(args.productId, { images });
    },
});

// Reorder images
export const reorderImages = mutation({
    args: {
        productId: v.id("products"),
        publicIds: v.array(v.string()), // New order of public IDs
    },
    handler: async (ctx, args) => {
        const product = await ctx.db.get(args.productId);
        if (!product) throw new Error("Product not found");

        const imageMap = new Map(product.images.map((img) => [img.publicId, img]));
        const reorderedImages = args.publicIds
            .map((id) => imageMap.get(id))
            .filter((img): img is NonNullable<typeof img> => img !== undefined);

        await ctx.db.patch(args.productId, { images: reorderedImages });
    },
});

