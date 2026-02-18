import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ==================== USER TABLES ====================

  // Users - Extended profile data (linked to Clerk via clerkId)
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("customer"), v.literal("admin")),
    tags: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
    marketingPrefs: v.optional(
      v.object({
        emailNewsletter: v.boolean(),
        smsNotifications: v.boolean(),
      })
    ),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // Addresses - User shipping/billing addresses
  addresses: defineTable({
    userId: v.id("users"),
    label: v.string(),
    recipientName: v.string(),
    phone: v.optional(v.string()),
    type: v.string(), // "home", "office", "other"
    street: v.string(),
    apartment: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    zipCode: v.string(),
    country: v.string(),
    isDefault: v.boolean(),
  }).index("by_userId", ["userId"]),

  // Notifications
  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    message: v.string(),
    read: v.boolean(),
    data: v.optional(v.any()),
  })
    .index("by_userId", ["userId"])
    .index("by_read", ["read"]),

  // Presence - Real-time user tracking
  presence: defineTable({
    userId: v.id("users"),
    updated: v.number(),
    data: v.optional(v.any()),
  })
    .index("by_userId", ["userId"])
    .index("by_updated", ["updated"]),

  // ==================== PRODUCT TABLES ====================

  // Products - Main product information
  products: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    story: v.optional(v.string()),

    // Product type
    productType: v.optional(
      v.union(v.literal("physical"), v.literal("digital"), v.literal("gift_card"))
    ), // defaults to "physical" for backward compat

    // Digital product fields
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
    maxDownloads: v.optional(v.number()), // null/undefined = unlimited

    // Digital/gift card stock management
    digitalStockMode: v.optional(
      v.union(v.literal("unlimited"), v.literal("limited"))
    ), // defaults to "unlimited"
    digitalStockCount: v.optional(v.number()), // only used when digitalStockMode is "limited"

    // Gift card fields
    giftCardCodeMode: v.optional(
      v.union(v.literal("auto"), v.literal("manual"))
    ),

    // Pricing (in cents)
    basePrice: v.number(),
    compareAtPrice: v.optional(v.number()),

    // Images (Cloudinary)
    images: v.array(
      v.object({
        publicId: v.string(),
        url: v.string(),
        alt: v.optional(v.string()),
        isMain: v.boolean(),
      })
    ),
    featuredImage: v.optional(v.string()),

    // Variant options (available choices)
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

    // Shipping dimensions (defaults for variants)
    weight: v.optional(v.number()), // grams
    dimensions: v.optional(
      v.object({
        length: v.number(), // cm
        width: v.number(),
        height: v.number(),
      })
    ),
    requiresShipping: v.boolean(),
    shipsIndependently: v.optional(v.boolean()),
    // Shipping Overrides
    shippingRateOverride: v.optional(v.number()), // Cents. If set, replaces calculated rate for this item.
    isFreeShipping: v.optional(v.boolean()), // If true, shipping for this item is free.
    // Tax Overrides
    isTaxable: v.optional(v.boolean()), // If false, no tax is charged.
    taxRateOverride: v.optional(v.number()), // Percentage. If set, replaces calculated tax rate for this item.

    // Organization
    categoryId: v.optional(v.id("categories")),
    vendor: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),

    // Specifications
    specifications: v.optional(
      v.array(
        v.object({
          key: v.string(),
          value: v.string(),
        })
      )
    ),
    features: v.optional(v.array(v.string())),

    // SEO
    metaTitle: v.optional(v.string()),
    metaDescription: v.optional(v.string()),

    // Status
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("archived")
    ),
    // Policies & Badges
    shippingLabel: v.optional(v.string()),
    shippingSublabel: v.optional(v.string()),
    warrantyLabel: v.optional(v.string()),
    warrantySublabel: v.optional(v.string()),
    policyContent: v.optional(v.string()), // For "Shipping & Returns" tab

    publishedAt: v.optional(v.number()),
    isFeatured: v.optional(v.boolean()),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"])
    .index("by_categoryId", ["categoryId"])
    .index("by_isFeatured", ["isFeatured"])
    .searchIndex("search_products", { searchField: "name" }),

  // Hero Slides - Homepage main slider
  heroSlides: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.string(),
    ctaText: v.string(),
    ctaHref: v.string(),
    sortOrder: v.number(),
    isActive: v.boolean(),
    location: v.optional(v.string()) // "hero" | "featured"
  })
    .index("by_isActive", ["isActive"])
    .index("by_location", ["location"])
    .index("by_sortOrder", ["sortOrder"]),

  // Product Variants - Individual SKU/stock per size+color combination
  productVariants: defineTable({
    productId: v.id("products"),

    // Variant attributes
    colorId: v.optional(v.string()),
    size: v.optional(v.string()),

    // Inventory
    sku: v.string(),
    stockCount: v.number(),
    lowStockThreshold: v.optional(v.number()),

    // Price override
    priceAdjustment: v.optional(v.number()), // +/- cents from base

    // Shipping override (inherits from product if not set)
    weight: v.optional(v.number()),
    dimensions: v.optional(
      v.object({
        length: v.number(),
        width: v.number(),
        height: v.number(),
      })
    ),

    // Variant-specific image
    imageUrl: v.optional(v.string()),

    isDefault: v.boolean(),
  })
    .index("by_productId", ["productId"])
    .index("by_sku", ["sku"]),

  // Categories
  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
    sortOrder: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_parentId", ["parentId"]),

  // Product Reviews
  reviews: defineTable({
    productId: v.id("products"),
    userId: v.id("users"),
    rating: v.number(), // 1-5
    title: v.optional(v.string()),
    content: v.string(),
    images: v.optional(v.array(v.string())),
    isVerifiedPurchase: v.boolean(),
    helpfulCount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
  })
    .index("by_productId", ["productId"])
    .index("by_userId", ["userId"])
    .index("by_userId_and_productId", ["userId", "productId"])
    .index("by_status", ["status"])
    .searchIndex("search_content", { searchField: "content" }),

  // Wishlist - User's saved products
  wishlist: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    addedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_productId", ["userId", "productId"]),

  // ==================== ORDER TABLES ====================

  // Orders
  orders: defineTable({
    userId: v.id("users"),
    orderNumber: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("returned")
    ),
    items: v.array(
      v.object({
        productId: v.id("products"),
        variantId: v.optional(v.id("productVariants")),
        name: v.string(),
        sku: v.optional(v.string()),
        quantity: v.number(),
        price: v.number(),
        image: v.optional(v.string()),
        // Digital delivery fields
        productType: v.optional(v.string()),
        digitalFileUrl: v.optional(v.string()),
        digitalFileName: v.optional(v.string()),
        giftCardCode: v.optional(v.string()),
        downloadCount: v.optional(v.number()),
        maxDownloads: v.optional(v.number()),
      })
    ),
    subtotal: v.number(),
    tax: v.number(),
    shipping: v.number(),
    total: v.number(),
    shippingAddressId: v.optional(v.id("addresses")),
    customerEmail: v.optional(v.string()),
    paymentMethod: v.optional(v.string()),
    trackingNumber: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_orderNumber", ["orderNumber"])
    .index("by_status", ["status"])
    .searchIndex("search_orderNumber", { searchField: "orderNumber" }),

  // Returns
  returns: defineTable({
    userId: v.id("users"),
    orderId: v.id("orders"),
    status: v.union(
      v.literal("requested"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("shipped"),
      v.literal("completed")
    ),
    reason: v.string(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        variantId: v.optional(v.id("productVariants")),
        quantity: v.number(),
      })
    ),
    refundAmount: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_orderId", ["orderId"]),

  // Digital Files Library
  digitalFiles: defineTable({
    name: v.string(),
    url: v.string(),
    publicId: v.string(),
    fileType: v.string(),
    fileSize: v.optional(v.number()),
    uploadedAt: v.number(),
  }).index("by_name", ["name"]),

  // ==================== MARKETING TABLES ====================

  // Coupons
  coupons: defineTable({
    code: v.string(),
    discountType: v.union(
      v.literal("percentage"),
      v.literal("fixed"),
      v.literal("shipping")
    ),
    discountValue: v.number(),
    minPurchaseAmount: v.optional(v.number()),
    applicableCategories: v.optional(v.array(v.string())),
    validFrom: v.optional(v.number()),
    validUntil: v.optional(v.number()),
    usageLimit: v.optional(v.number()),
    limitPerCustomer: v.optional(v.boolean()),
    usageCount: v.number(),
    isActive: v.boolean(),
    stripeCouponId: v.optional(v.string()),
  })
    .index("by_code", ["code"])
    .index("by_isActive", ["isActive"])
    .index("by_usageCount", ["usageCount"])
    .searchIndex("search_code", { searchField: "code" }),

  // Cart Metadata
  cartMetadata: defineTable({
    userId: v.id("users"),
    couponCode: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  // ==================== SETTINGS TABLES ====================

  // Shipping Settings - Global configuration
  shippingSettings: defineTable({
    // Free shipping threshold (cents)
    freeShippingThreshold: v.optional(v.number()),

    // Shipping zones with hybrid rates
    zones: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        regions: v.array(v.string()), // country codes
        rateType: v.union(
          v.literal("flat"),
          v.literal("weight"),
          v.literal("calculated")
        ),
        baseRate: v.number(), // cents
        perKgRate: v.optional(v.number()),
        freeShippingOverride: v.optional(v.number()),
        deliveryTime: v.string(),
      })
    ),

    // Dimensional weight divisor (5000 = cm/kg standard)
    dimWeightDivisor: v.number(),

    // Policies
    warrantyInfo: v.optional(v.string()),
    returnPolicy: v.optional(v.string()),
  }),

  // Tax Settings
  taxSettings: defineTable({
    method: v.union(v.literal("manual"), v.literal("stripe")),
    defaultRate: v.number(), // Percentage (e.g. 8.5 for 8.5%)
    taxOnShipping: v.boolean(),
    taxInclusive: v.boolean(),
    // Manual rules for specific regions
    rules: v.optional(
      v.array(
        v.object({
          region: v.string(), // Country or State code
          rate: v.number(),
        })
      )
    ),
  }),

  // Site Identity & Global Settings
  siteSettings: defineTable({
    storeName: v.string(),
    storeUrl: v.string(),
    logoUrl: v.optional(v.string()),
    logoPublicId: v.optional(v.string()),
    faviconUrl: v.optional(v.string()),

    // Contact Info
    contactEmail: v.string(),
    supportPhone: v.optional(v.string()),

    // Social Media
    socialLinks: v.optional(v.object({
      facebook: v.optional(v.string()),
      twitter: v.optional(v.string()),
      instagram: v.optional(v.string()),
      linkedin: v.optional(v.string()),
    })),
  }),

  // Exchange Rates - Cached currency rates (base: USD)
  exchangeRates: defineTable({
    base: v.string(), // "USD"
    rates: v.any(), // { BDT: 119.5, EUR: 0.92, GBP: 0.79, ... }
    updatedAt: v.number(), // timestamp ms
  }).index("by_base", ["base"]),

  // Shopping Cart
  cartItems: defineTable({
    userId: v.id("users"),
    productId: v.id("products"),
    // If variantId is present, it refers to a specific variant. 
    // If null/undefined, it refers to the base product (if no variants).
    // Using simple string to handle potential disconnects, but v.id is better for integrity.
    // Let's use v.optional(v.string()) to avoid strict FK issues if variants change? 
    // No, v.id is best practice in Convex.
    variantId: v.optional(v.id("productVariants")),
    quantity: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_productId", ["userId", "productId"]),
});
