import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to generate slug
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

// List all categories
export const list = query({
    args: {},
    handler: async (ctx) => {
        const categories = await ctx.db.query("categories").collect();

        // Build tree structure
        const childrenMap = new Map<string, typeof categories>();

        for (const cat of categories) {
            if (cat.parentId) {
                const existing = childrenMap.get(cat.parentId);
                if (existing) {
                    existing.push(cat);
                } else {
                    childrenMap.set(cat.parentId, [cat]);
                }
            }
        }

        const buildTree = (parentId: string): any[] => {
            const children = childrenMap.get(parentId) || [];
            return children
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((child) => ({
                    ...child,
                    children: buildTree(child._id),
                }));
        };

        const rootCategories = categories.filter((c) => !c.parentId);

        return rootCategories
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((cat) => ({
                ...cat,
                children: buildTree(cat._id),
            }));
    },
});

// Get category by slug
export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("categories")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();
    },
});

// Get category by ID
export const getById = query({
    args: { id: v.id("categories") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});


// Get all subcategory IDs recursively
export const getSubcategoryIds = query({
    args: { id: v.id("categories") },
    handler: async (ctx, args) => {
        const allCategories = await ctx.db.query("categories").collect();
        const childIds = new Set<string>();

        const collectChildren = (parentId: string) => {
            const children = allCategories.filter(c => c.parentId === parentId);
            for (const child of children) {
                childIds.add(child._id);
                collectChildren(child._id);
            }
        };

        collectChildren(args.id);
        return Array.from(childIds) as string[];
    },
});

// Create category
export const create = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        parentId: v.optional(v.id("categories")),
        sortOrder: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        // Generate unique slug
        let slug = generateSlug(args.name);
        let suffix = 0;

        while (true) {
            const existing = await ctx.db
                .query("categories")
                .withIndex("by_slug", (q) =>
                    q.eq("slug", suffix ? `${slug}-${suffix}` : slug)
                )
                .first();

            if (!existing) break;
            suffix++;
        }

        const finalSlug = suffix ? `${slug}-${suffix}` : slug;

        // Get sort order if not provided
        let sortOrder = args.sortOrder;
        if (sortOrder === undefined) {
            const siblings = await ctx.db
                .query("categories")
                .withIndex("by_parentId", (q) => q.eq("parentId", args.parentId))
                .collect();
            sortOrder = siblings.length;
        }

        return await ctx.db.insert("categories", {
            name: args.name,
            slug: finalSlug,
            description: args.description,
            imageUrl: args.imageUrl,
            parentId: args.parentId,
            sortOrder,
        });
    },
});

// Update category
export const update = mutation({
    args: {
        id: v.id("categories"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        parentId: v.optional(v.id("categories")),
        sortOrder: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const category = await ctx.db.get(id);
        if (!category) throw new Error("Category not found");

        // Update slug if name changed
        if (updates.name && updates.name !== category.name) {
            let slug = generateSlug(updates.name);
            let suffix = 0;

            while (true) {
                const testSlug = suffix ? `${slug}-${suffix}` : slug;
                const existing = await ctx.db
                    .query("categories")
                    .withIndex("by_slug", (q) => q.eq("slug", testSlug))
                    .first();

                if (!existing || existing._id === id) break;
                suffix++;
            }

            (updates as { slug?: string }).slug = suffix
                ? `${slug}-${suffix}`
                : slug;
        }

        await ctx.db.patch(id, updates);
        return id;
    },
});

// Delete category
export const remove = mutation({
    args: { id: v.id("categories") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user.role !== "admin") {
            throw new Error("Unauthorized");
        }
        // Check for child categories
        const children = await ctx.db
            .query("categories")
            .withIndex("by_parentId", (q) => q.eq("parentId", args.id))
            .collect();

        if (children.length > 0) {
            throw new Error("Cannot delete category with subcategories");
        }

        // Unlink products (set categoryId to undefined)
        const products = await ctx.db
            .query("products")
            .withIndex("by_categoryId", (q) => q.eq("categoryId", args.id))
            .collect();

        for (const product of products) {
            await ctx.db.patch(product._id, { categoryId: undefined });
        }

        await ctx.db.delete(args.id);
    },
});

// Reorder categories
export const reorder = mutation({
    args: {
        updates: v.array(
            v.object({
                id: v.id("categories"),
                sortOrder: v.number(),
            })
        ),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user.role !== "admin") {
            throw new Error("Unauthorized");
        }
        for (const update of args.updates) {
            await ctx.db.patch(update.id, { sortOrder: update.sortOrder });
        }
    },
});
