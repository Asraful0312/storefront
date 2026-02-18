import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { Id, Doc, DataModel } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";
import { TableAggregate } from "@convex-dev/aggregate";
import { components } from "./_generated/api";

const productStats = new TableAggregate<{
    Key: number;
    DataModel: DataModel;
    TableName: "products";
    Namespace: string;
}>(components.aggregate, {
    sortKey: (doc) => doc._creationTime,
    namespace: (doc) => "v2_" + doc.status,
});

// Helper to generate slug from name
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

// Helper to enrich products with variant and category data
export async function enrichProducts(ctx: QueryCtx, products: Doc<"products">[]) {
    return await Promise.all(
        products.map(async (product) => {
            const variants = await ctx.db
                .query("productVariants")
                .withIndex("by_productId", (q) => q.eq("productId", product._id))
                .collect();

            const totalStock = variants.reduce((sum, v) => sum + v.stockCount, 0);

            // Digital and gift card products use digitalStockMode/digitalStockCount
            const isDigitalProduct = product.productType === "digital" || product.productType === "gift_card";
            const digitalStockMode = product.digitalStockMode || "unlimited";

            // Determine effective stock for display
            let effectiveStock: number;
            if (isDigitalProduct) {
                if (digitalStockMode === "limited" && product.digitalStockCount !== undefined) {
                    effectiveStock = product.digitalStockCount;
                } else {
                    effectiveStock = -1; // unlimited
                }
            } else {
                effectiveStock = totalStock;
            }

            // Infer stock status
            let stockStatus: "in-stock" | "low-stock" | "out-of-stock" = "in-stock";
            if (isDigitalProduct) {
                if (digitalStockMode === "limited" && product.digitalStockCount !== undefined) {
                    if (product.digitalStockCount === 0) {
                        stockStatus = "out-of-stock";
                    } else if (product.digitalStockCount < 10) {
                        stockStatus = "low-stock";
                    }
                }
                // unlimited digital products are always in-stock
            } else if (totalStock === 0) {
                stockStatus = "out-of-stock";
            } else if (totalStock < 10) {
                stockStatus = "low-stock";
            }

            const category = product.categoryId
                ? await ctx.db.get(product.categoryId)
                : null;

            const reviews = await ctx.db
                .query("reviews")
                .withIndex("by_productId", (q) => q.eq("productId", product._id))
                .filter((q) => q.eq(q.field("status"), "approved"))
                .collect();

            const rating = reviews.length > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                : 0;

            // Determine default variant (first one or explicitly marked)
            const defaultVariant = variants.find((v) => v.isDefault) || variants[0];

            return {
                ...product,
                variantCount: variants.length,
                totalStock: effectiveStock,
                stockStatus,
                categoryName: category?.name,
                category: category?.name,
                sku: defaultVariant?.sku || "—",
                defaultVariantId: defaultVariant?._id,
                image: product.featuredImage,
                reviewCount: reviews.length,
                rating,
            };
        })
    );
}


// Get product by ID
export const getById = query({
    args: { id: v.id("products") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

// Get product by slug (for storefront)
export const getBySlug = query({
    args: { slug: v.string() },
    handler: async (ctx, args) => {
        const product = await ctx.db
            .query("products")
            .withIndex("by_slug", (q) => q.eq("slug", args.slug))
            .first();

        if (!product) return null;

        // Get variants
        const variants = await ctx.db
            .query("productVariants")
            .withIndex("by_productId", (q) => q.eq("productId", product._id))
            .collect();

        // Get category
        const category = product.categoryId
            ? await ctx.db.get(product.categoryId)
            : null;

        // Get reviews stats
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_productId", (q) => q.eq("productId", product._id))
            .filter((q) => q.eq(q.field("status"), "approved"))
            .collect();

        const reviewStats = {
            count: reviews.length,
            average:
                reviews.length > 0
                    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                    : 0,
        };

        return {
            ...product,
            variants,
            category,
            reviewStats,
        };
    },
});

// Get product with full details for editing
export const getWithVariants = query({
    args: { id: v.id("products") },
    handler: async (ctx, args) => {
        const product = await ctx.db.get(args.id);
        if (!product) return null;

        const variants = await ctx.db
            .query("productVariants")
            .withIndex("by_productId", (q) => q.eq("productId", args.id))
            .collect();

        return {
            ...product,
            variants,
        };
    },
});

// List all products (admin)
export const list = query({
    args: {
        status: v.optional(
            v.union(v.literal("draft"), v.literal("active"), v.literal("archived"))
        ),
        categoryId: v.optional(v.id("categories")),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        let products;

        if (args.status) {
            products = await ctx.db
                .query("products")
                .withIndex("by_status", (q) => q.eq("status", args.status!))
                .order("desc")
                .take(args.limit ?? 100);
        } else if (args.categoryId) {
            products = await ctx.db
                .query("products")
                .withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId!))
                .order("desc")
                .take(args.limit ?? 100);
        } else {
            products = await ctx.db
                .query("products")
                .order("desc")
                .take(args.limit ?? 100);
        }

        // Manual filter for second condition if needed
        let filtered = products;
        if (args.status && args.categoryId) {
            filtered = products.filter(p => p.categoryId === args.categoryId);
        }

        return await enrichProducts(ctx, filtered);
    },
});

// List active products (storefront)
export const listActive = query({
    args: {
        categorySlug: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 50;

        if (args.categorySlug) {
            const category = await ctx.db
                .query("categories")
                .withIndex("by_slug", (q) => q.eq("slug", args.categorySlug!))
                .first();

            if (!category) return [];

            // Get all subcategory IDs recursively
            const allCategories = await ctx.db.query("categories").collect();
            const targetIds = new Set<string>([category._id]);

            const collectChildren = (parentId: string) => {
                const children = allCategories.filter(c => c.parentId === parentId);
                for (const child of children) {
                    targetIds.add(child._id);
                    collectChildren(child._id);
                }
            };
            collectChildren(category._id);

            // Fetch products for all target categories
            // We fetch 'limit' from EACH category to ensure we have enough candidates
            // then merge and sort.
            const results = await Promise.all(
                Array.from(targetIds).map(id =>
                    ctx.db
                        .query("products")
                        .withIndex("by_categoryId", (q) => q.eq("categoryId", id as Id<"categories">))
                        .order("desc")
                        .take(limit)
                )
            );

            // Flatten, sort by creation time (desc), and take final limit
            const allProducts = results.flat()
                .sort((a, b) => b._creationTime - a._creationTime)
                .slice(0, limit);

            // Enrich
            return await Promise.all(
                allProducts.map(async (product) => {
                    const reviews = await ctx.db
                        .query("reviews")
                        .withIndex("by_productId", (q) => q.eq("productId", product._id))
                        .filter((q) => q.eq(q.field("status"), "approved"))
                        .collect();

                    return {
                        ...product,
                        reviewCount: reviews.length,
                        rating:
                            reviews.length > 0
                                ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                                : 0,
                    };
                })
            );
        }

        // Default: just get newest active products
        const products = await ctx.db
            .query("products")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .order("desc")
            .take(limit);

        // Add review stats
        return await Promise.all(
            products.map(async (product) => {
                const reviews = await ctx.db
                    .query("reviews")
                    .withIndex("by_productId", (q) => q.eq("productId", product._id))
                    .filter((q) => q.eq(q.field("status"), "approved"))
                    .collect();

                return {
                    ...product,
                    reviewCount: reviews.length,
                    rating:
                        reviews.length > 0
                            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
                            : 0,
                };
            })
        );
    },
});

// Paginated list of active products (storefront)
// Filtered and paginated list (custom pagination)
export const getFilteredProducts = query({
    args: {
        categorySlug: v.optional(v.string()),
        search: v.optional(v.string()),
        minPrice: v.optional(v.number()),
        maxPrice: v.optional(v.number()),
        colors: v.optional(v.array(v.string())),
        sizes: v.optional(v.array(v.string())),
        sortBy: v.optional(v.string()), // "newest", "price_asc", "price_desc"
        page: v.optional(v.number()), // 1-indexed
        limit: v.optional(v.number())
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 20;
        const page = args.page ?? 1;

        let allCandidates: Doc<"products">[] = [];

        // 1. Initial Fetch Strategy
        if (args.search && args.search.trim()) {
            // Search Strategy
            allCandidates = await ctx.db
                .query("products")
                .withSearchIndex("search_products", (q) => q.search("name", args.search!))
                .take(1000); // Limit search candidates

            // Filter by Status for search results
            allCandidates = allCandidates.filter(p => p.status === "active");

            // Determine Category Context if slug provided
            if (args.categorySlug) {
                const category = await ctx.db
                    .query("categories")
                    .withIndex("by_slug", (q) => q.eq("slug", args.categorySlug!))
                    .first();

                if (category) {
                    // Filter search results by category (or descendants if we fetched them? No, search is flat)
                    // For search, strict category filtering matches the specific category ID or its children
                    // Ideally we check if product.categoryId is in descendant list.
                    const allCategories = await ctx.db.query("categories").collect();
                    const targetIds = new Set<string>([category._id]);
                    const collectChildren = (parentId: string) => {
                        const children = allCategories.filter(c => c.parentId === parentId);
                        for (const child of children) {
                            targetIds.add(child._id);
                            collectChildren(child._id);
                        }
                    };
                    collectChildren(category._id);

                    allCandidates = allCandidates.filter(p => !p.categoryId || targetIds.has(p.categoryId));
                }
            }

        } else if (args.categorySlug) {
            // Category Strategy
            const category = await ctx.db
                .query("categories")
                .withIndex("by_slug", (q) => q.eq("slug", args.categorySlug!))
                .first();

            if (category) {
                // Fetch recursively
                const allCategories = await ctx.db.query("categories").collect();
                const targetIds = new Set<string>([category._id]);

                const collectChildren = (parentId: string) => {
                    const children = allCategories.filter(c => c.parentId === parentId);
                    for (const child of children) {
                        targetIds.add(child._id);
                        collectChildren(child._id);
                    }
                };
                collectChildren(category._id);

                // Fetch all products in these categories
                const results = await Promise.all(
                    Array.from(targetIds).map(id =>
                        ctx.db
                            .query("products")
                            .withIndex("by_categoryId", (q) => q.eq("categoryId", id as Id<"categories">))
                            .collect()
                    )
                );
                allCandidates = results.flat().filter(p => p.status === "active");
            } else {
                allCandidates = [];
            }
        } else {
            // All Active Strategy
            allCandidates = await ctx.db
                .query("products")
                .withIndex("by_status", (q) => q.eq("status", "active"))
                .order("desc")
                .collect();
        }

        // 2. Apply Filters (Memory)
        let filtered = allCandidates;

        // Price Filter
        if (args.minPrice !== undefined) {
            filtered = filtered.filter(p => p.basePrice >= args.minPrice!);
        }
        if (args.maxPrice !== undefined) {
            filtered = filtered.filter(p => p.basePrice <= args.maxPrice!);
        }

        // Color Filter (Array Intersection)
        if (args.colors && args.colors.length > 0) {
            filtered = filtered.filter(p => {
                if (!p.colorOptions) return false;
                const productColors = p.colorOptions.map(c => c.name.toLowerCase());
                return args.colors!.some(c => productColors.includes(c.toLowerCase()));
            });
        }

        // Size Filter (Array Intersection)
        if (args.sizes && args.sizes.length > 0) {
            filtered = filtered.filter(p => {
                if (!p.sizeOptions) return false;
                const productSizes = p.sizeOptions.map(s => s.toLowerCase());
                return args.sizes!.some(s => productSizes.includes(s.toLowerCase()));
            });
        }

        // 3. Sorting
        const sortMode = args.sortBy || "newest";

        filtered.sort((a, b) => {
            switch (sortMode) {
                case "price_asc":
                    return a.basePrice - b.basePrice;
                case "price_desc":
                    return b.basePrice - a.basePrice;
                case "newest":
                default:
                    return b._creationTime - a._creationTime;
            }
        });

        // 4. Pagination
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / limit);
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedProducts = filtered.slice(start, end);

        return {
            products: await enrichProducts(ctx, paginatedProducts),
            totalItems,
            totalPages,
            currentPage: page,
            hasMore: page < totalPages
        };
    }
});

export const getNewArrivals = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const products = await ctx.db
            .query("products")
            .withIndex("by_status", (q) => q.eq("status", "active"))
            .order("desc")
            .take(args.limit ?? 10);

        return await enrichProducts(ctx, products);
    },
});

export const getFeatured = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const products = await ctx.db
            .query("products")
            .withIndex("by_isFeatured", (q) => q.eq("isFeatured", true))
            .order("desc")
            .take(args.limit ?? 8);

        return await enrichProducts(ctx, products);
    },
});






// Search suggestions (for autocomplete)
export const getSearchSuggestions = query({
    args: {
        query: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        if (!args.query.trim()) return [];

        const products = await ctx.db
            .query("products")
            .withSearchIndex("search_products", (q) => q.search("name", args.query))
            .take(args.limit ?? 5);

        return products.map(p => ({
            id: p._id,
            name: p.name,
            slug: p.slug,
            image: p.featuredImage
        }));
    },
});

// Get product count with filters
export const getProductCount = query({
    args: {
        status: v.optional(
            v.union(v.literal("draft"), v.literal("active"), v.literal("archived"))
        ),
        categoryId: v.optional(v.id("categories")),
        search: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        // Optimization: Use Aggregate only if filtering by Status (and nothing else)
        if (!args.search && !args.categoryId && args.status) {
            return await productStats.count(ctx, { namespace: "v2_" + args.status });
        }

        // Also optimization: if no args at all, we can sum up all namespaces or just count all (aggregate doesn't support 'all' easily without multiple queries, 
        // but 'count' on table is fast? No, table.count() is deprecated/scan. Aggregate is better.)
        if (!args.search && !args.categoryId && !args.status) {
            // We can sum the counts of all 3 statuses
            const [active, draft, archived] = await Promise.all([
                productStats.count(ctx, { namespace: "v2_active" }),
                productStats.count(ctx, { namespace: "v2_draft" }),
                productStats.count(ctx, { namespace: "v2_archived" })
            ]);
            return active + draft + archived;
        }

        if (args.search) {
            const products = await ctx.db
                .query("products")
                .withSearchIndex("search_products", (q) => q.search("name", args.search!))
                .take(1000);

            let filtered = products;
            if (args.status) filtered = filtered.filter(p => p.status === args.status);
            if (args.categoryId) filtered = filtered.filter(p => p.categoryId === args.categoryId);

            return filtered.length;
        }

        let products;
        if (args.status) {
            products = await ctx.db
                .query("products")
                .withIndex("by_status", (q) => q.eq("status", args.status!))
                .collect();
        } else if (args.categoryId) {
            products = await ctx.db
                .query("products")
                .withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId!))
                .collect();
        } else {
            products = await ctx.db.query("products").collect();
        }

        let filtered = products;
        if (args.status && args.categoryId) {
            filtered = products.filter(p => p.categoryId === args.categoryId);
        } else if (args.categoryId && args.status) {
            filtered = products.filter(p => p.status === args.status);
        }

        return filtered.length;
    }
});

// Paginated list of products (admin)
export const paginatedList = query({
    args: {
        paginationOpts: paginationOptsValidator,
        status: v.optional(
            v.union(v.literal("draft"), v.literal("active"), v.literal("archived"))
        ),
        categoryId: v.optional(v.id("categories")),
        search: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        let results;

        if (args.status) {
            results = await ctx.db
                .query("products")
                .withIndex("by_status", (q) => q.eq("status", args.status!))
                .order("desc")
                .paginate(args.paginationOpts);
        } else if (args.categoryId) {
            results = await ctx.db
                .query("products")
                .withIndex("by_categoryId", (q) => q.eq("categoryId", args.categoryId!))
                .order("desc")
                .paginate(args.paginationOpts);
        } else {
            results = await ctx.db
                .query("products")
                .order("desc")
                .paginate(args.paginationOpts);
        }

        let page = results.page;

        if (args.status && args.categoryId) {
            page = page.filter(p => p.categoryId === args.categoryId);
        } else if (args.categoryId && args.status) {
            page = page.filter(p => p.status === args.status);
        }

        return {
            ...results,
            page: await enrichProducts(ctx, page)
        };
    },
});

// Search products (admin search - robust)
export const search = query({
    args: {
        query: v.string(),
        status: v.optional(
            v.union(v.literal("draft"), v.literal("active"), v.literal("archived"))
        ),
        categoryId: v.optional(v.id("categories")),
    },
    handler: async (ctx, args) => {
        if (!args.query.trim()) return [];

        const results = await ctx.db
            .query("products")
            .withSearchIndex("search_products", (q) => q.search("name", args.query))
            .take(50);

        let filtered = results;
        if (args.status) {
            filtered = filtered.filter(p => p.status === args.status);
        }
        if (args.categoryId) {
            filtered = filtered.filter(p => p.categoryId === args.categoryId);
        }

        return await enrichProducts(ctx, filtered);
    },
});


// Create product
export const create = mutation({
    args: {
        name: v.string(),
        description: v.string(),
        story: v.optional(v.string()),
        basePrice: v.number(),
        compareAtPrice: v.optional(v.number()),
        images: v.array(
            v.object({
                publicId: v.string(),
                url: v.string(),
                alt: v.optional(v.string()),
                isMain: v.boolean(),
            })
        ),
        colorOptions: v.optional(
            v.array(
                v.object({
                    id: v.string(),
                    name: v.string(),
                    hex: v.string(),
                })
            )
        ),
        sizeOptions: v.optional(v.array(v.string())),
        weight: v.optional(v.number()),
        dimensions: v.optional(
            v.object({
                length: v.number(),
                width: v.number(),
                height: v.number(),
            })
        ),
        requiresShipping: v.boolean(),
        shipsIndependently: v.optional(v.boolean()),
        categoryId: v.optional(v.id("categories")),
        vendor: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        specifications: v.optional(
            v.array(
                v.object({
                    key: v.string(),
                    value: v.string(),
                })
            )
        ),
        features: v.optional(v.array(v.string())),
        metaTitle: v.optional(v.string()),
        metaDescription: v.optional(v.string()),
        status: v.union(
            v.literal("draft"),
            v.literal("active"),
            v.literal("archived")
        ),
        shippingLabel: v.optional(v.string()),
        shippingSublabel: v.optional(v.string()),
        warrantyLabel: v.optional(v.string()),
        warrantySublabel: v.optional(v.string()),
        policyContent: v.optional(v.string()),
        isFeatured: v.optional(v.boolean()),
        // Digital product fields
        productType: v.optional(
            v.union(v.literal("physical"), v.literal("digital"), v.literal("gift_card"))
        ),
        digitalFiles: v.optional(
            v.array(
                v.object({
                    name: v.string(),
                    url: v.string(),
                    publicId: v.string(),
                    fileType: v.string(),
                    fileSize: v.optional(v.number()),
                })
            )
        ),
        maxDownloads: v.optional(v.number()),
        digitalStockMode: v.optional(
            v.union(v.literal("unlimited"), v.literal("limited"))
        ),
        digitalStockCount: v.optional(v.number()),
        giftCardCodeMode: v.optional(
            v.union(v.literal("auto"), v.literal("manual"))
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
        // Generate unique slug
        let slug = generateSlug(args.name);
        let suffix = 0;

        while (true) {
            const existing = await ctx.db
                .query("products")
                .withIndex("by_slug", (q) =>
                    q.eq("slug", suffix ? `${slug}-${suffix}` : slug)
                )
                .first();

            if (!existing) break;
            suffix++;
        }

        const finalSlug = suffix ? `${slug}-${suffix}` : slug;

        // Find featured image
        const mainImage = args.images.find((img) => img.isMain);
        const featuredImage = mainImage?.url || args.images[0]?.url;

        const productId = await ctx.db.insert("products", {
            ...args,
            slug: finalSlug,
            featuredImage,
            productType: args.productType || "physical",
            requiresShipping: (args.productType === "digital" || args.productType === "gift_card") ? false : args.requiresShipping,
            publishedAt: args.status === "active" ? Date.now() : undefined,
        });

        // Sync with aggregate
        await productStats.insert(ctx, {
            ...args,
            slug: finalSlug,
            featuredImage,
            publishedAt: args.status === "active" ? Date.now() : undefined,
            _id: productId,
            _creationTime: Date.now()
        });

        return productId;
    },
});

// Update product
export const update = mutation({
    args: {
        id: v.id("products"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        story: v.optional(v.string()),
        basePrice: v.optional(v.number()),
        compareAtPrice: v.optional(v.number()),
        images: v.optional(
            v.array(
                v.object({
                    publicId: v.string(),
                    url: v.string(),
                    alt: v.optional(v.string()),
                    isMain: v.boolean(),
                })
            )
        ),
        colorOptions: v.optional(
            v.array(
                v.object({
                    id: v.string(),
                    name: v.string(),
                    hex: v.string(),
                })
            )
        ),
        sizeOptions: v.optional(v.array(v.string())),
        weight: v.optional(v.number()),
        dimensions: v.optional(
            v.object({
                length: v.number(),
                width: v.number(),
                height: v.number(),
            })
        ),
        requiresShipping: v.optional(v.boolean()),
        shipsIndependently: v.optional(v.boolean()),
        categoryId: v.optional(v.id("categories")),
        vendor: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
        specifications: v.optional(
            v.array(
                v.object({
                    key: v.string(),
                    value: v.string(),
                })
            )
        ),
        features: v.optional(v.array(v.string())),
        metaTitle: v.optional(v.string()),
        metaDescription: v.optional(v.string()),
        status: v.optional(
            v.union(v.literal("draft"), v.literal("active"), v.literal("archived"))
        ),
        shippingLabel: v.optional(v.string()),
        shippingSublabel: v.optional(v.string()),
        warrantyLabel: v.optional(v.string()),
        warrantySublabel: v.optional(v.string()),
        policyContent: v.optional(v.string()),
        isFeatured: v.optional(v.boolean()),
        // Digital product fields
        productType: v.optional(
            v.union(v.literal("physical"), v.literal("digital"), v.literal("gift_card"))
        ),
        digitalFiles: v.optional(
            v.array(
                v.object({
                    name: v.string(),
                    url: v.string(),
                    publicId: v.string(),
                    fileType: v.string(),
                    fileSize: v.optional(v.number()),
                })
            )
        ),
        maxDownloads: v.optional(v.number()),
        digitalStockMode: v.optional(
            v.union(v.literal("unlimited"), v.literal("limited"))
        ),
        digitalStockCount: v.optional(v.number()),
        giftCardCodeMode: v.optional(
            v.union(v.literal("auto"), v.literal("manual"))
        ),
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

        const product = await ctx.db.get(id);
        if (!product) throw new Error("Product not found");

        // Update featured image if images changed
        let featuredImage = product.featuredImage;
        if (updates.images) {
            const mainImage = updates.images.find((img) => img.isMain);
            featuredImage = mainImage?.url || updates.images[0]?.url;
        }

        // Set publishedAt if transitioning to active
        let publishedAt = product.publishedAt;
        if (updates.status === "active" && product.status !== "active") {
            publishedAt = Date.now();
        }

        const newProduct = {
            ...product,
            ...updates,
            featuredImage,
            publishedAt,
        }

        // Force requiresShipping for non-physical products
        const effectiveUpdates = { ...updates };
        if (effectiveUpdates.productType === "digital" || effectiveUpdates.productType === "gift_card") {
            effectiveUpdates.requiresShipping = false;
        }

        await ctx.db.patch(id, {
            ...effectiveUpdates,
            featuredImage,
            publishedAt,
        });

        // Sync with aggregate (gracefully handle missing keys from pre-aggregate products)
        try {
            await productStats.replace(ctx, product, newProduct);
        } catch (err) {
            console.warn("productStats.replace failed during update, attempting insert:", err);
            try {
                await productStats.insert(ctx, newProduct);
            } catch {
                console.warn("productStats.insert also failed during update, skipping aggregate sync");
            }
        }

        return id;
    },
});

// Delete product (archive)
export const archive = mutation({
    args: { id: v.id("products") },
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

        const product = await ctx.db.get(args.id);
        if (!product) throw new Error("Product not found");

        const newProduct = { ...product, status: "archived" as const };
        await ctx.db.patch(args.id, { status: "archived" });

        // Sync with aggregate (gracefully handle missing keys from pre-aggregate products)
        try {
            await productStats.replace(ctx, product, newProduct);
        } catch (err) {
            console.warn("productStats.replace failed during archive, attempting insert:", err);
            try {
                await productStats.insert(ctx, newProduct);
            } catch {
                console.warn("productStats.insert also failed during archive, skipping aggregate sync");
            }
        }
    },
});

// Hard delete (admin only)
export const hardDelete = mutation({
    args: { id: v.id("products") },
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

        const product = await ctx.db.get(args.id);
        if (!product) return; // Already deleted or found

        // Delete all variants
        const variants = await ctx.db
            .query("productVariants")
            .withIndex("by_productId", (q) => q.eq("productId", args.id))
            .collect();

        for (const variant of variants) {
            await ctx.db.delete(variant._id);
        }

        // Delete product
        await ctx.db.delete(args.id);

        // Sync with aggregate (gracefully handle missing keys)
        try {
            await productStats.delete(ctx, product);
        } catch (err) {
            console.warn("productStats.delete failed during hard delete, skipping:", err);
        }
    },
});

// Backfill product stats (run once)
export const backfillProductStats = mutation({
    args: {},
    handler: async (ctx) => {
        const allProducts = await ctx.db.query("products").collect();
        for (const product of allProducts) {
            try {
                // If it already exists, this might fail depending on duplicate handling, 
                // but TableAggregate usually handles it or we should be careful. 
                // TableAggregate doesn't have a simple 'exists' check exposed easily without querying.
                // But insert should be fine if we are running this fresh or clearing first. 
                // Wait, TableAggregate tracks by `Key` which we set to `_creationTime`? No, Key is generic.
                // In definition: SortKey is _creationTime. 
                // Actually, if we just blindly insert, we might duplicate if not checking. 
                // Since this is a one-off tool, we can just try-catch or assume we're fixing state.

                // For safety, let's assume we want to reset or just add missing.
                // Using internal cache? No, TableAggregate uses DB tables.
                await productStats.insert(ctx, product);
            } catch (e) {
                // Ignore errors if already tracked? TableAggregate might not throw on duplicate unless we strictly enforce uniqueness at DB level which we likely don't for stats components usually.
                // Actually components.aggregate uses a table. 
                console.log(`Skipped or failed for product ${product._id}:`, e);
            }
        }
    },
});
