"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Star } from "lucide-react";
import {
    Header,
    Footer,
    Breadcrumb,
    ProductGallery,
    ProductInfo,
    ProductTabs,
    type ProductDetail,
} from "@/components/storefront";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { Id } from "@/convex/_generated/dataModel";
import { useQueryState, parseAsString } from "@fobos531/nuqs";

interface ProductDetailViewProps {
    product: ProductDetail;
    relatedProducts?: any[];
    highlightedReviewId?: string;
}

export function ProductDetailView({ product, relatedProducts = [], highlightedReviewId }: ProductDetailViewProps) {
    const { addItem } = useCart();
    // ... (existing code omitted for brevity) ...
    // Determine default color/size from product
    const defaultColor = product.colors && product.colors.length > 0 ? product.colors[0].id : undefined;
    const defaultSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : undefined;

    const [selectedColor, setSelectedColor] = useQueryState(
        "color",
        parseAsString.withDefault(defaultColor || "")
    );
    const [selectedSize, setSelectedSize] = useQueryState(
        "size",
        parseAsString.withDefault(defaultSize || "")
    );

    const [quantity, setQuantity] = useState(1);
    const [isWishlisted, setIsWishlisted] = useState(false);

    const handleAddToCart = () => {
        const selectedVariant = product.variants?.find(
            (v) => v.colorId === selectedColor && (v.size === selectedSize || (!v.size && !selectedSize))
        );

        addItem(
            product.id as Id<"products">,
            selectedVariant?.id as Id<"productVariants"> | undefined,
            quantity
        );
    };

    const breadcrumbItems = [
        { label: "Home", href: "/" },
        { label: "Shop", href: "/shop" },
        { label: product.name },
    ];

    return (
        <>
            <Header />

            <main className="grow w-full flex flex-col items-center">
                {/* Breadcrumbs */}
                <div className="w-full max-w-[1280px] px-4 lg:px-40 py-6">
                    <Breadcrumb items={breadcrumbItems} />
                </div>

                {/* Main Product Section */}
                <div className="w-full max-w-[1280px] px-4 lg:px-40 pb-16">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                        {/* Left Column: Gallery */}
                        <div className="lg:col-span-7">
                            <ProductGallery
                                images={product.images}
                                isWishlisted={isWishlisted}
                                onWishlistToggle={() => setIsWishlisted(!isWishlisted)}
                            />
                        </div>

                        {/* Right Column: Product Details */}
                        <div className="lg:col-span-5">
                            <ProductInfo
                                product={product}
                                selectedColor={selectedColor || ""}
                                selectedSize={selectedSize || ""}
                                quantity={quantity}
                                onColorChange={setSelectedColor}
                                onSizeChange={setSelectedSize}
                                onQuantityChange={setQuantity}
                                onAddToCart={handleAddToCart}
                            />
                        </div>
                    </div>
                </div>

                {/* Product Tabs */}
                <ProductTabs
                    story={product.story}
                    features={product.features}
                    policyContent={product.policyContent}
                    productId={product.id as any}
                    productName={product.name}
                    highlightedReviewId={highlightedReviewId}
                />

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="w-full bg-background py-16">
                        <div className="w-full max-w-[1280px] px-4 lg:px-40 mx-auto flex flex-col gap-8">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-foreground">You Might Also Like</h2>
                                <Link
                                    href="/shop"
                                    className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
                                >
                                    View all <ArrowRight className="size-4" />
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {relatedProducts.map((p) => (
                                    <Link
                                        key={p.id}
                                        href={`/product/${p.slug}`}
                                        className="group flex flex-col gap-3"
                                    >
                                        <div className="relative w-full aspect-3/4 rounded-lg overflow-hidden bg-card">
                                            <div
                                                className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                                style={{ backgroundImage: `url('${p.image}')` }}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute bottom-3 right-3 size-8 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity text-foreground hover:text-primary"
                                            >
                                                <ShoppingBag className="size-4" />
                                            </Button>
                                            {p.badge && (
                                                <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">
                                                    {p.badge}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                                {p.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span
                                                    className={`text-sm font-medium ${p.originalPrice ? "text-red-500" : "text-muted-foreground"
                                                        }`}
                                                >
                                                    ${p.price.toFixed(2)}
                                                </span>
                                                {p.originalPrice && (
                                                    <span className="text-xs text-muted-foreground line-through">
                                                        ${p.originalPrice.toFixed(2)}
                                                    </span>
                                                )}
                                                {p.rating > 0 && (
                                                    <div className="flex text-primary text-xs ml-auto">
                                                        {[...Array(Math.round(p.rating))].map((_, i) => (
                                                            <Star key={i} className="size-3.5 fill-current" />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </>
    );
}
