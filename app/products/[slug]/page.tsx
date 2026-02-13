"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
    ProductGallery,
    ProductInfo,
    ProductTabs,
    ProductDetail as ProductDetailType,
} from "@/components/storefront/ProductDetail";
import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

// Reviews Section Component
function ReviewsSection({ productId }: { productId: string }) {
    const reviews = useQuery(api.reviews.listByProduct, {
        productId: productId as any,
        limit: 10,
    });
    const stats = useQuery(api.reviews.getStats, {
        productId: productId as any,
    });

    if (!reviews || !stats) {
        return <p className="text-muted-foreground">Loading reviews...</p>;
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No reviews yet. Be the first to review this product!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Summary */}
            <div className="flex items-center gap-6 mb-8">
                <div className="text-center">
                    <div className="text-4xl font-bold text-foreground">
                        {stats.average.toFixed(1)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        out of 5
                    </div>
                </div>
                <div className="flex-1">
                    {[5, 4, 3, 2, 1].map((star) => (
                        <div key={star} className="flex items-center gap-2 mb-1">
                            <span className="text-xs w-3">{star}</span>
                            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary"
                                    style={{
                                        width: `${stats.count > 0 ? (stats.distribution[star] / stats.count) * 100 : 0}%`,
                                    }}
                                />
                            </div>
                            <span className="text-xs text-muted-foreground w-8">
                                {stats.distribution[star]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-6">
                {reviews.map((review) => (
                    <div
                        key={review._id}
                        className="border-b border-border pb-6 last:border-0"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="size-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold">
                                {review.userName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="font-medium text-foreground">
                                    {review.userName}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex text-primary">
                                        {[...Array(5)].map((_, i) => (
                                            <span
                                                key={i}
                                                className={
                                                    i < review.rating
                                                        ? "text-primary"
                                                        : "text-muted"
                                                }
                                            >
                                                ★
                                            </span>
                                        ))}
                                    </div>
                                    {review.isVerifiedPurchase && (
                                        <span className="text-xs text-green-600 font-medium">
                                            Verified Purchase
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {review.title && (
                            <h4 className="font-semibold text-foreground mb-1">
                                {review.title}
                            </h4>
                        )}
                        <p className="text-muted-foreground">{review.content}</p>
                        {review.helpfulCount > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                                {review.helpfulCount} people found this helpful
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Enhanced ProductTabs with real data
function ProductTabsWithData({
    story,
    features,
    specifications,
    productId,
}: {
    story?: string;
    features?: string[];
    specifications?: { key: string; value: string }[];
    productId: string;
}) {
    const shippingSettings = useQuery(api.shippingSettings.get);

    return (
        <div className="w-full bg-card border-y border-border mt-8">
            <div className="w-full max-w-[1280px] px-4 lg:px-40 mx-auto">
                <div className="border-b border-border">
                    <nav className="flex gap-8 overflow-x-auto">
                        {["description", "specifications", "shipping", "reviews"].map(
                            (tab) => (
                                <a
                                    key={tab}
                                    href={`#${tab}`}
                                    className="py-4 text-sm font-medium text-muted-foreground hover:text-primary border-b-2 border-transparent hover:border-primary capitalize whitespace-nowrap"
                                >
                                    {tab === "shipping" ? "Shipping & Returns" : tab}
                                </a>
                            )
                        )}
                    </nav>
                </div>

                {/* Description */}
                <section id="description" className="py-12 max-w-3xl">
                    <h3 className="text-xl font-bold text-foreground mb-4">
                        Product Story
                    </h3>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        {story || "No story available for this product."}
                    </p>
                    {features && features.length > 0 && (
                        <ul className="space-y-3">
                            {features.map((feature, index) => (
                                <li
                                    key={index}
                                    className="flex items-start gap-3 text-muted-foreground"
                                >
                                    <span className="text-primary">✓</span>
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Specifications */}
                <section id="specifications" className="py-12 max-w-3xl border-t border-border">
                    <h3 className="text-xl font-bold text-foreground mb-4">
                        Specifications
                    </h3>
                    {specifications && specifications.length > 0 ? (
                        <div className="space-y-4 text-muted-foreground">
                            {specifications.map((spec, i) => (
                                <div
                                    key={i}
                                    className="flex justify-between py-2 border-b border-border"
                                >
                                    <span className="font-medium">{spec.key}</span>
                                    <span>{spec.value}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">
                            No specifications available.
                        </p>
                    )}
                </section>

                {/* Shipping & Returns */}
                <section id="shipping" className="py-12 max-w-3xl border-t border-border">
                    <h3 className="text-xl font-bold text-foreground mb-4">
                        Shipping & Returns
                    </h3>
                    {shippingSettings ? (
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-semibold text-foreground mb-2">
                                    Shipping Options
                                </h4>
                                <div className="space-y-2">
                                    {shippingSettings.zones.map((zone) => (
                                        <div
                                            key={zone.id}
                                            className="flex justify-between text-muted-foreground py-2"
                                        >
                                            <span>{zone.name}</span>
                                            <span>
                                                {zone.baseRate === 0
                                                    ? "Free"
                                                    : `$${(zone.baseRate / 100).toFixed(2)}`}{" "}
                                                · {zone.deliveryTime}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {shippingSettings.freeShippingThreshold && (
                                    <p className="text-sm text-primary mt-4">
                                        Free shipping on orders over $
                                        {(shippingSettings.freeShippingThreshold / 100).toFixed(0)}
                                    </p>
                                )}
                            </div>
                            <div>
                                <h4 className="font-semibold text-foreground mb-2">
                                    Return Policy
                                </h4>
                                <p className="text-muted-foreground">
                                    {shippingSettings.returnPolicy}
                                </p>
                            </div>
                            {shippingSettings.warrantyInfo && (
                                <div>
                                    <h4 className="font-semibold text-foreground mb-2">
                                        Warranty
                                    </h4>
                                    <p className="text-muted-foreground">
                                        {shippingSettings.warrantyInfo}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-muted-foreground">Loading shipping info...</p>
                    )}
                </section>

                {/* Reviews */}
                <section id="reviews" className="py-12 max-w-3xl border-t border-border">
                    <h3 className="text-xl font-bold text-foreground mb-4">
                        Customer Reviews
                    </h3>
                    <ReviewsSection productId={productId} />
                </section>
            </div>
        </div>
    );
}

export default function ProductPage() {
    const params = useParams();
    const slug = params.slug as string;

    // Fetch product data
    const productData = useQuery(api.products.getBySlug, { slug });

    // UI state
    const [selectedColor, setSelectedColor] = useState<string>("");
    const [selectedSize, setSelectedSize] = useState<string>("");
    const [quantity, setQuantity] = useState(1);
    const [isWishlisted, setIsWishlisted] = useState(false);

    // Find selected variant
    const selectedVariant = useMemo(() => {
        if (!productData?.variants) return null;
        return productData.variants.find(
            (v) =>
                (!selectedColor || v.colorId === selectedColor) &&
                (!selectedSize || v.size === selectedSize)
        );
    }, [productData?.variants, selectedColor, selectedSize]);

    // Calculate price with variant adjustment
    const currentPrice = useMemo(() => {
        if (!productData) return 0;
        const base = productData.basePrice;
        const adjustment = selectedVariant?.priceAdjustment || 0;
        return (base + adjustment) / 100; // Convert from cents
    }, [productData, selectedVariant]);

    // Set defaults when product loads
    useMemo(() => {
        if (productData && !selectedColor && productData.colorOptions?.length) {
            setSelectedColor(productData.colorOptions[0].id);
        }
        if (productData && !selectedSize && productData.sizeOptions?.length) {
            setSelectedSize(productData.sizeOptions[0]);
        }
    }, [productData, selectedColor, selectedSize]);

    // Loading state
    if (productData === undefined) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    // Not found
    if (productData === null) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
                <Link href="/" className="text-primary hover:underline">
                    Return to homepage
                </Link>
            </div>
        );
    }

    // Transform to ProductDetail format for existing components
    const product: ProductDetailType = {
        id: productData._id,
        name: productData.name,
        price: currentPrice,
        originalPrice: productData.compareAtPrice
            ? productData.compareAtPrice / 100
            : undefined,
        description: productData.description,
        rating: productData.reviewStats.average,
        reviewCount: productData.reviewStats.count,
        images: productData.images.map((img, i) => ({
            id: img.publicId || String(i),
            url: img.url,
            alt: img.alt || productData.name,
        })),
        colors: productData.colorOptions || [],
        sizes: productData.sizeOptions || [],
        unavailableSizes: productData.variants
            ?.filter((v) => v.stockCount === 0)
            .map((v) => v.size)
            .filter((s): s is string => !!s),
        stockCount: selectedVariant?.stockCount,
        features: productData.features,
        story: productData.story,
    };

    const handleAddToCart = () => {
        // TODO: Implement cart functionality
        console.log("Add to cart:", {
            productId: productData._id,
            variantId: selectedVariant?._id,
            quantity,
        });
    };

    return (
        <main className="min-h-screen bg-background">
            {/* Breadcrumb */}
            <div className="max-w-[1280px] mx-auto px-4 py-4">
                <nav className="text-sm text-muted-foreground">
                    <Link href="/" className="hover:text-primary">
                        Home
                    </Link>
                    <span className="mx-2">/</span>
                    {productData.category && (
                        <>
                            <Link
                                href={`/category/${productData.category.slug}`}
                                className="hover:text-primary"
                            >
                                {productData.category.name}
                            </Link>
                            <span className="mx-2">/</span>
                        </>
                    )}
                    <span className="text-foreground">{productData.name}</span>
                </nav>
            </div>

            {/* Product Section */}
            <div className="max-w-[1280px] mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
                    {/* Gallery */}
                    <ProductGallery
                        images={product.images}
                        isWishlisted={isWishlisted}
                        onWishlistToggle={() => setIsWishlisted(!isWishlisted)}
                    />

                    {/* Info */}
                    <ProductInfo
                        product={product}
                        selectedColor={selectedColor}
                        selectedSize={selectedSize}
                        quantity={quantity}
                        onColorChange={setSelectedColor}
                        onSizeChange={setSelectedSize}
                        onQuantityChange={setQuantity}
                        onAddToCart={handleAddToCart}
                    />
                </div>
            </div>

            {/* Tabs with real data */}
            <ProductTabsWithData
                story={productData.story}
                features={productData.features}
                specifications={productData.specifications}
                productId={productData._id}
            />
        </main>
    );
}
