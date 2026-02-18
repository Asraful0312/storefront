"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ProductDetailView } from "@/components/storefront/ProductDetailView";
import { type ProductDetail } from "@/components/storefront";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import React from "react";
import { useCurrency } from "@/lib/currency-context";

export function ProductPageClient({ slug }: { slug: string }) {
    const searchParams = useSearchParams();
    const highlightedReviewId = searchParams.get("review");
    const { formatPrice: formatCurrencyPrice } = useCurrency();

    // Fetch product data
    const productData = useQuery(api.products.getBySlug, { slug });

    // Fetch related products (only if we have a category)
    const categorySlug = productData?.category?.slug;
    const relatedProductsData = useQuery(
        api.products.listActive,
        categorySlug ? { categorySlug, limit: 4 } : "skip"
    );

    // Fetch global settings
    const globalSettings = useQuery(api.shippingSettings.get);

    if (productData === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    if (productData === null) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <h1 className="text-2xl font-bold">Product Not Found</h1>
                <p className="text-muted-foreground">The product you are looking for does not exist.</p>
                <Link href="/" className="text-primary hover:underline">
                    Return to homepage
                </Link>
            </div>
        );
    }

    // Default Fallbacks
    const defaultPolicy = "Returns accepted within 30 days of purchase. Items must be in original condition.";
    const defaultWarranty = "1 Year Warranty";

    // Determine Policy Content
    // 1. Product specific override
    // 2. Global settings return policy
    // 3. Hardcoded default
    const policyContent = productData.policyContent || globalSettings?.returnPolicy || defaultPolicy;

    // Determine Warranty Label
    const warrantyLabel = productData.warrantyLabel || (globalSettings?.warrantyInfo ? "Warranty Included" : undefined);
    const warrantySublabel = productData.warrantySublabel || globalSettings?.warrantyInfo || undefined;

    // Determine Shipping Badge
    // If free shipping threshold is met globally or override
    let shippingLabel = productData.shippingLabel;
    let shippingSublabel = productData.shippingSublabel;

    if (!shippingLabel) {
        if (productData.isFreeShipping) {
            shippingLabel = "Free Shipping";
            shippingSublabel = "For this item";
        } else if (productData.shippingRateOverride !== undefined) {
            // If 0, it's free
            if (productData.shippingRateOverride === 0) {
                shippingLabel = "Free Shipping";
                shippingSublabel = "For this item";
            } else {
                shippingLabel = "Shipping";
                shippingSublabel = formatCurrencyPrice(productData.shippingRateOverride);
            }
        } else if (globalSettings?.freeShippingThreshold) {
            shippingLabel = "Free Shipping";
            shippingSublabel = `On orders over ${formatCurrencyPrice(globalSettings.freeShippingThreshold)}`;
        }
    }

    // Map to ProductDetail interface
    const product: ProductDetail = {
        id: productData._id,
        name: productData.name,
        price: productData.basePrice / 100,
        originalPrice: productData.compareAtPrice ? productData.compareAtPrice / 100 : undefined,
        description: productData.description,
        rating: productData.reviewStats.average,
        reviewCount: productData.reviewStats.count,
        images: productData.images.map((img: any, i: number) => ({
            id: img.publicId || `img-${i}`,
            url: img.url,
            alt: img.alt || productData.name,
        })),
        colors: productData.colorOptions || [],
        sizes: productData.sizeOptions || [],
        unavailableSizes: productData.variants
            ?.filter((v: any) => v.stockCount === 0)
            .map((v: any) => v.size)
            .filter((s: string) => !!s) || [],
        stockCount: productData.variants?.reduce((acc: number, v: any) => acc + (v.stockCount || 0), 0) || 0,
        variants: productData.variants?.map((v: any) => ({
            id: v._id,
            colorId: v.colorId,
            size: v.size,
            price: (productData.basePrice + (v.priceAdjustment || 0)) / 100,
            stockCount: v.stockCount
        })) || [],
        features: productData.features,
        story: productData.story,
        // Dynamic Policies with Fallback
        policyContent,
        shippingLabel,
        shippingSublabel,
        warrantyLabel,

        warrantySublabel,
        productType: productData.productType,
    };

    // Map related products
    const relatedProducts = relatedProductsData
        ?.filter((p) => p._id !== productData._id)
        .slice(0, 4)
        .map((p) => ({
            id: p._id,
            name: p.name,
            price: p.basePrice / 100,
            slug: p.slug,
            originalPrice: p.compareAtPrice ? p.compareAtPrice / 100 : undefined,
            rating: p.rating,
            image: p.featuredImage || p.images[0]?.url,
            badge: p.compareAtPrice ? "SALE" : undefined,
        })) || [];

    return (
        <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="size-8 animate-spin text-primary" /></div>}>
            <ProductDetailView
                product={product}
                relatedProducts={relatedProducts}
                highlightedReviewId={highlightedReviewId || undefined}
            />
        </React.Suspense>
    );
}
