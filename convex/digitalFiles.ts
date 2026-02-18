import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * CRUD operations for the digital files library.
 * Files are uploaded to Cloudinary (raw type) and metadata is stored here
 * for reuse across multiple products.
 */

export const list = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    return await ctx.db.query("digitalFiles").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("digitalFiles") },
  returns: v.any(),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const save = mutation({
  args: {
    name: v.string(),
    url: v.string(),
    publicId: v.string(),
    fileType: v.string(),
    fileSize: v.optional(v.number()),
  },
  returns: v.id("digitalFiles"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    return await ctx.db.insert("digitalFiles", {
      name: args.name,
      url: args.url,
      publicId: args.publicId,
      fileType: args.fileType,
      fileSize: args.fileSize,
      uploadedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("digitalFiles") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    await ctx.db.delete(args.id);
    return null;
  },
});
