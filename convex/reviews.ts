
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";

// Submit a review
export const submit = mutation({
    args: {
        productId: v.id("products"),
        rating: v.number(),
        title: v.optional(v.string()),
        content: v.string(),
        images: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("You must be logged in to leave a review.");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user) {
            throw new Error("User not found.");
        }

        // Validate rating
        if (args.rating < 1 || args.rating > 5) {
            throw new Error("Rating must be between 1 and 5.");
        }

        // Check if user already reviewed this product?
        const existingReview = await ctx.db
            .query("reviews")
            .withIndex("by_userId_and_productId", (q) =>
                q.eq("userId", user._id).eq("productId", args.productId)
            )
            .unique();

        if (existingReview) {
            throw new Error("You have already reviewed this product.");
        }

        // Check for verified purchase (Optional logic, for now assumes false or checks orders)
        // For now, simple check if they have an order with this product delivered
        const orders = await ctx.db
            .query("orders")
            .withIndex("by_userId", (q) => q.eq("userId", user._id))
            .collect();

        let isVerifiedPurchase = false;
        for (const order of orders) {
            if (order.status === "delivered") {
                const hasProduct = order.items.some(item => item.productId === args.productId);
                if (hasProduct) {
                    isVerifiedPurchase = true;
                    break;
                }
            }
        }

        const reviewId = await ctx.db.insert("reviews", {
            productId: args.productId,
            userId: user._id,
            rating: args.rating,
            title: args.title,
            content: args.content,
            images: args.images,
            isVerifiedPurchase,
            helpfulCount: 0,
            status: "pending", // Reviews need approval? Or auto-approve?
            // "pending" is safer for user generated content.
            // But for this task user didn't specify moderation. 
            // I'll set it to "approved" immediately for smoother DX unless specified.
            // The previous code in products.ts filters by "approved".
            // Explicitly setting to approved for now to make it visible.
        });

        // If I want to trigger re-calculation of product rating, I might do it here or let the queries handle it dynamically.
        // Queries in products.ts calculate on the fly.

        // Auto-approve for now
        await ctx.db.patch(reviewId, { status: "approved" });

        return reviewId;
    },
});

// List reviews for a product
export const list = query({
    args: {
        productId: v.id("products"),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_productId", (q) => q.eq("productId", args.productId))
            .filter((q) => q.eq(q.field("status"), "approved"))
            .order("desc") // default ordering by creation time?
            // "reviews" table doesn't have explicit creation time field in schema definition??
            // defineTable adds _creationTime automatically.
            .take(args.limit ?? 20);

        // Enrich with user details
        return await Promise.all(
            reviews.map(async (review) => {
                const user = await ctx.db.get(review.userId);
                return {
                    ...review,
                    userName: user ? (user.firstName || "User") : "Anonymous",
                    userAvatar: user?.avatarUrl,
                };
            })
        );
    },
});

// Get review stats for a product
export const getStats = query({
    args: { productId: v.id("products") },
    handler: async (ctx, args) => {
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_productId", (q) => q.eq("productId", args.productId))
            .filter((q) => q.eq(q.field("status"), "approved"))
            .collect();

        const count = reviews.length;
        const average = count > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / count
            : 0;

        // Breakdown (1-5 stars)
        const breakdown = [0, 0, 0, 0, 0];
        reviews.forEach(r => {
            if (r.rating >= 1 && r.rating <= 5) {
                breakdown[r.rating - 1]++;
            }
        });

        return {
            count,
            average,
            breakdown
        };
    },
});
// Delete a review (admin only)
export const deleteReview = mutation({
    args: { id: v.id("reviews") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user.role !== "admin") throw new Error("Unauthorized");

        await ctx.db.delete(args.id);
    },
});

// Admin: Paginated list of all reviews
export const paginatedList = query({
    args: {
        paginationOpts: paginationOptsValidator,
        search: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new Error("Unauthenticated");

        const user = await ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
            .unique();

        if (!user || user.role !== "admin") throw new Error("Unauthorized");

        // Note: Reviews table doesn't have a search index on content yet, so we just list all sorted by status/date.
        // If we want search, we need to add search index to schema.
        // For now, simple list.
        if (args.search) {
            const results = await ctx.db
                .query("reviews")
                .withSearchIndex("search_content", (q) => q.search("content", args.search!))
                .take(args.paginationOpts.numItems);

            // Pagination for search results is tricky with `take`, but for now we follow the pattern used in products:
            // Actually, `paginate` supports search indexes? No, paginate() works on indexes/tables.
            // Search Queries return string[] of results or you have to paginate manually?
            // Convex paginate() does NOT support withSearchIndex directly yet in the same way.
            // Wait, ctx.db.query("reviews").withSearchIndex(...) does NOT have .paginate() method standardly?
            // Let's check products.ts implementation of search.
            // Products implementation uses .take(1000) and then in-memory filter.
            // But here we want paginated results.
            // If we want real search pagination, we can't easily use `usePaginatedQuery` with `paginate`.
            // `usePaginatedQuery` expects the query to return `PaginationResult`.
            // `paginate` method is strictly for `db.query(...).withIndex(...)` or `db.query(...)`. 
            // It does NOT work with `withSearchIndex`.

            // So we CANNOT easily support search with `usePaginatedQuery` standard pagination for search results without a workaround.
            // Workaround: 
            // Option 1: Just return top 50 matches and disable "Load More" for search (Simple).
            // Option 2: Use the manual pagination strategy from `products.ts` (using page numbers) -> BUT this breaks `usePaginatedQuery` on frontend which expects cursor.

            // DECISION: 
            // To keep frontend using `usePaginatedQuery` simple:
            // We'll perform the search, get ALL IDs (up to a reasonable limit, e.g. 200), 
            // then fetch them.
            // BUT `usePaginatedQuery` on frontend expects the specific return shape { page, isDone, continueCursor }.
            // We can't fake that easily for search results.
            //
            // ALTERNATIVE:
            // Admin panels usually don't need infinite scroll for search; standard pagination or just "top X results" is fine.
            // Let's modify the Frontend to handle "Search Mode" differently? 
            // Or just simple search: if search term exists, return a simplified "page" and isDone=true.

            const searchResults = await ctx.db
                .query("reviews")
                .withSearchIndex("search_content", (q) => q.search("content", args.search!))
                .take(args.paginationOpts.numItems);

            return {
                page: await Promise.all(
                    searchResults.map(async (review) => {
                        const product = await ctx.db.get(review.productId);
                        const reviewer = await ctx.db.get(review.userId);
                        return {
                            ...review,
                            productName: product?.name || "Unknown Product",
                            productImage: product?.featuredImage || product?.images[0]?.url,
                            reviewerName: reviewer?.firstName || "Anonymous",
                            reviewerAvatar: reviewer?.avatarUrl,
                            reviewerEmail: reviewer?.email,
                            slug: product?.slug,
                        };
                    })
                ),
                isDone: true,
                continueCursor: "",
            };
        }

        const results = await ctx.db
            .query("reviews")
            .order("desc")
            .paginate(args.paginationOpts);

        // Enrich
        const enrichedPage = await Promise.all(
            results.page.map(async (review) => {
                const product = await ctx.db.get(review.productId);
                const reviewer = await ctx.db.get(review.userId);
                return {
                    ...review,
                    productName: product?.name || "Unknown Product",
                    productImage: product?.featuredImage || product?.images[0]?.url,
                    reviewerName: reviewer?.firstName || "Anonymous",
                    reviewerAvatar: reviewer?.avatarUrl,
                    reviewerEmail: reviewer?.email,
                    slug: product?.slug,
                };
            })
        );

        return {
            ...results,
            page: enrichedPage,
        };
    },
});


