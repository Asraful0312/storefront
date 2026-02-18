"use client";

import { useState, useEffect } from "react";
import { Heart, Minus, Plus, Star, StarHalf, ShoppingBag, Truck, Shield, CheckCircle, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { ReviewSection } from "./ReviewSection";
import { Id } from "@/convex/_generated/dataModel";
import { useCurrency } from "@/lib/currency-context";

// Types
interface ProductColor {
    id: string;
    name: string;
    hex: string;
}

interface ProductImage {
    id: string;
    url: string;
    alt: string;
}

export interface ProductVariant {
    id: string;
    colorId: string;
    size: string;
    price: number;
    stockCount: number;
}

export interface ProductDetail {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    description: string;
    rating: number;
    reviewCount: number;
    images: ProductImage[];
    colors: ProductColor[];
    sizes: string[];
    unavailableSizes?: string[];
    variants?: ProductVariant[];
    stockCount?: number;
    features?: string[];
    story?: string;
    shippingLabel?: string;
    shippingSublabel?: string;
    warrantyLabel?: string;
    warrantySublabel?: string;
    policyContent?: string;
    productType?: "physical" | "digital" | "gift_card";
}

// Image Gallery Component
interface ProductGalleryProps {
    images: ProductImage[];
    onWishlistToggle?: () => void;
    isWishlisted?: boolean;
}

export function ProductGallery({ images, onWishlistToggle, isWishlisted }: ProductGalleryProps) {
    const [selectedImage, setSelectedImage] = useState(0);
    const remainingImages = images.length > 4 ? images.length - 4 : 0;

    return (
        <div className="flex flex-col gap-4">
            {/* Main Image */}
            <div className="relative w-full aspect-square md:aspect-4/3 lg:aspect-square overflow-hidden rounded-xl bg-secondary group">
                <div
                    className="w-full h-full bg-center bg-cover bg-no-repeat transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${images[selectedImage]?.url}')` }}
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "absolute top-4 right-4 size-10 bg-white/80 backdrop-blur rounded-full shadow-sm",
                        "hover:bg-white hover:text-primary transition-colors",
                        isWishlisted && "text-red-500"
                    )}
                    onClick={onWishlistToggle}
                >
                    <Heart className={cn("size-5", isWishlisted && "fill-current")} />
                </Button>
            </div>

            {/* Thumbnail Grid */}
            <div className="grid grid-cols-4 gap-4">
                {images.slice(0, 4).map((image, index) => (
                    <button
                        key={image.id}
                        onClick={() => setSelectedImage(index)}
                        className={cn(
                            "relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all",
                            selectedImage === index
                                ? "border-2 border-primary"
                                : "border border-transparent hover:border-muted-foreground/30 opacity-70 hover:opacity-100"
                        )}
                    >
                        <div
                            className="w-full h-full bg-cover bg-center"
                            style={{ backgroundImage: `url('${image.url}')` }}
                        />
                        {index === 3 && remainingImages > 0 && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-lg">
                                +{remainingImages}
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}

// Star Rating Component
function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
        <div className="flex items-center gap-2">
            <div className="flex text-primary">
                {[...Array(fullStars)].map((_, i) => (
                    <Star key={`full-${i}`} className="size-5 fill-current" />
                ))}
                {hasHalfStar && <StarHalf className="size-5 fill-current" />}
            </div>
            <span className="text-sm font-medium text-muted-foreground underline cursor-pointer hover:text-primary">
                {reviewCount} Reviews
            </span>
        </div>
    );
}

// Color Selector
interface ColorSelectorProps {
    colors: ProductColor[];
    selected: string;
    onChange: (colorId: string) => void;
}

export function ColorSelector({ colors, selected, onChange }: ColorSelectorProps) {
    const selectedColor = colors.find((c) => c.id === selected);

    return (
        <div className="flex flex-col gap-3">
            <span className="text-sm font-bold text-foreground">
                Color: <span className="font-normal text-muted-foreground">{selectedColor?.name}</span>
            </span>
            <div className="flex gap-3 p-1">
                {colors.map((color) => (
                    <button
                        key={color.id}
                        aria-label={`Select ${color.name} Color`}
                        onClick={() => onChange(color.id)}
                        className={cn(
                            "size-8 rounded-full cursor-pointer transition-all ring-offset-2 ring-offset-background",
                            selected === color.id
                                ? "ring-2 ring-primary"
                                : "ring-1 ring-transparent hover:ring-muted-foreground/50"
                        )}
                        style={{ backgroundColor: color.hex }}
                    />
                ))}
            </div>
        </div>
    );
}

// Size Selector
interface SizeSelectorProps {
    sizes: string[];
    unavailable?: string[];
    selected: string;
    onChange: (size: string) => void;
    onSizeGuide?: () => void;
}

export function SizeSelector({ sizes, unavailable = [], selected, onChange, onSizeGuide }: SizeSelectorProps) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-foreground">
                    Size: <span className="font-normal text-muted-foreground">{selected}</span>
                </span>
                {onSizeGuide && (
                    <button
                        onClick={onSizeGuide}
                        className="text-xs font-medium text-muted-foreground underline hover:text-primary"
                    >
                        Size Guide
                    </button>
                )}
            </div>
            <div className="flex flex-wrap gap-2">
                {sizes.map((size) => {
                    const isUnavailable = unavailable.includes(size);
                    return (
                        <button
                            key={size}
                            onClick={() => !isUnavailable && onChange(size)}
                            disabled={isUnavailable}
                            className={cn(
                                "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                                selected === size
                                    ? "border-2 border-primary bg-primary/5 text-primary font-bold"
                                    : isUnavailable
                                        ? "border-border opacity-50 cursor-not-allowed bg-muted"
                                        : "border-border hover:border-muted-foreground"
                            )}
                        >
                            {size}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// Quantity Selector
interface QuantitySelectorProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
}

export function QuantitySelector({ value, onChange, min = 1, max = 99 }: QuantitySelectorProps) {
    return (
        <div className="flex items-center border border-border rounded-lg h-12 w-32 bg-card">
            <button
                className="w-10 h-full flex items-center justify-center text-foreground hover:text-primary disabled:opacity-50"
                onClick={() => onChange(Math.max(min, value - 1))}
                disabled={value <= min}
            >
                <Minus className="size-4" />
            </button>
            <input
                type="text"
                readOnly
                value={value}
                className="w-full text-center border-none focus:ring-0 p-0 text-foreground bg-transparent font-medium"
            />
            <button
                className="w-10 h-full flex items-center justify-center text-foreground hover:text-primary disabled:opacity-50"
                onClick={() => onChange(Math.min(max, value + 1))}
                disabled={value >= max}
            >
                <Plus className="size-4" />
            </button>
        </div>
    );
}

// Service Badges
export function ServiceBadges({ product }: { product: ProductDetail }) {
    if (!product.shippingLabel && !product.warrantyLabel) return null;

    return (
        <div className="grid grid-cols-2 gap-4 mt-4">
            {product.shippingLabel && (
                <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                    <Truck className="size-5 text-primary" />
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">{product.shippingLabel}</span>
                        {product.shippingSublabel && <span className="text-[10px] text-muted-foreground">{product.shippingSublabel}</span>}
                    </div>
                </div>
            )}
            {product.warrantyLabel && (
                <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                    <Shield className="size-5 text-primary" />
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">{product.warrantyLabel}</span>
                        {product.warrantySublabel && <span className="text-[10px] text-muted-foreground">{product.warrantySublabel}</span>}
                    </div>
                </div>
            )}
        </div>
    );
}

interface ProductInfoProps {
    product: ProductDetail;
    selectedColor: string;
    selectedSize: string;
    quantity: number;
    onColorChange: (color: string) => void;
    onSizeChange: (size: string) => void;
    onQuantityChange: (qty: number) => void;
    onAddToCart: () => void;
}

export function ProductInfo({
    product,
    selectedColor,
    selectedSize,
    quantity,
    onColorChange,
    onSizeChange,
    onQuantityChange,
    onAddToCart,
}: ProductInfoProps) {
    // Calculate dynamic price based on selected variant
    const selectedVariant = product.variants?.find(
        (v) => v.colorId === selectedColor && (v.size === selectedSize || (!v.size && !selectedSize))
    );

    const currentPrice = selectedVariant ? selectedVariant.price : product.price;
    const totalPrice = currentPrice * quantity;

    const hasDiscount = product.originalPrice && product.originalPrice > currentPrice;
    const discountPercent = hasDiscount
        ? Math.round((1 - currentPrice / product.originalPrice!) * 100)
        : 0;

    const { formatDollarPrice } = useCurrency();

    return (
        <div className="flex flex-col gap-6">
            {/* Rating & Title */}
            <div>
                <StarRating rating={product.rating} reviewCount={product.reviewCount} />
                <h1 className="mt-2 text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.1]">
                    {product.name}
                </h1>
                <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                    {product.description}
                </p>
            </div>

            <div className="h-px bg-border" />

            {/* Price */}
            <div className="flex flex-col gap-1">
                <div className="flex items-end gap-3">
                    <div className="flex flex-col">
                        <span className="text-3xl font-bold text-primary">{formatDollarPrice(totalPrice)}</span>
                        {quantity > 1 && (
                            <span className="text-sm text-muted-foreground">
                                {formatDollarPrice(currentPrice)} each
                            </span>
                        )}
                    </div>

                    {hasDiscount && (
                        <>
                            <span className="text-lg text-muted-foreground line-through mb-1">
                                {formatDollarPrice(product.originalPrice!)}
                            </span>
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/10 ml-auto mb-1.5">
                                SAVE {discountPercent}%
                            </Badge>
                        </>
                    )}
                </div>
                {!!product.stockCount && product.stockCount > 0 && product.stockCount <= 5 && (
                    <p className="text-sm text-primary font-medium flex items-center gap-1">
                        <Flame className="size-4" />
                        Only {product.stockCount} left in stock!
                    </p>
                )}
            </div>

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
                <ColorSelector
                    colors={product.colors}
                    selected={selectedColor}
                    onChange={onColorChange}
                />
            )}

            {/* Size Selector */}
            {product.sizes && product.sizes.length > 0 && (
                <SizeSelector
                    sizes={product.sizes}
                    unavailable={product.unavailableSizes}
                    selected={selectedSize}
                    onChange={onSizeChange}
                    onSizeGuide={() => console.log("Open size guide")}
                />
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
                <QuantitySelector value={quantity} onChange={onQuantityChange} />
                <Button
                    size="lg"
                    className="flex-1 h-12 bg-primary hover:bg-orange-700 text-white font-bold shadow-lg shadow-primary/20 gap-2"
                    onClick={onAddToCart}
                >
                    <ShoppingBag className="size-5" />
                    Add to Cart
                </Button>
            </div>

            {/* Service Badges */}
            <ServiceBadges product={product} />
        </div>
    );
}

// Product Tabs (Description, Specifications, Reviews)
interface ProductTabsProps {
    story?: string;
    features?: string[];
    policyContent?: string;
    productId: Id<"products">;
    productName: string;
    highlightedReviewId?: string;
    productType?: "physical" | "digital" | "gift_card";
}

export function ProductTabs({ story, features, policyContent, productId, productName, highlightedReviewId, productType = "physical" }: ProductTabsProps) {
    const [activeTab, setActiveTab] = useState(highlightedReviewId ? "reviews" : "description");

    // Sync tab with highlightedReviewId when it changes (e.g. client-side navigation)
    useEffect(() => {
        console.log("ProductTabs: highlightedReviewId changed:", highlightedReviewId);
        if (highlightedReviewId) {
            console.log("ProductTabs: Setting activeTab to reviews");
            setActiveTab("reviews");
        }
    }, [highlightedReviewId]);

    return (
        <div className="w-full bg-card border-y border-border mt-8">
            <div className="w-full max-w-[1280px] px-4 lg:px-40 mx-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="overflow-x-auto overflow-y-hidden -mx-4 px-4 pt-4">
                        <TabsList className="inline-flex w-max min-w-full justify-start gap-2 sm:gap-8 h-auto p-0 bg-transparent border-b border-border rounded-none">
                            <TabsTrigger
                                value="description"
                                className="px-3 sm:px-4 py-4 text-sm font-medium whitespace-nowrap data-[state=active]:font-bold data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
                            >
                                Description
                            </TabsTrigger>
                            {productType === "physical" && (
                                <>
                                    <TabsTrigger
                                        value="specifications"
                                        className="px-3 sm:px-4 py-4 text-sm font-medium whitespace-nowrap data-[state=active]:font-bold data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
                                    >
                                        Specifications
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="shipping"
                                        className="px-3 sm:px-4 py-4 text-sm font-medium whitespace-nowrap data-[state=active]:font-bold data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
                                    >
                                        Shipping & Returns
                                    </TabsTrigger>
                                </>
                            )}
                            <TabsTrigger
                                value="reviews"
                                className="px-3 sm:px-4 py-4 text-sm font-medium whitespace-nowrap data-[state=active]:font-bold data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent"
                            >
                                Reviews
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="description" className="py-12 max-w-3xl">
                        <h3 className="text-xl font-bold text-foreground mb-4">Product Story</h3>
                        <p className="text-muted-foreground leading-relaxed mb-6">
                            {story || "No story available for this product."}
                        </p>
                        {features && features.length > 0 && (
                            <ul className="space-y-3">
                                {features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-3 text-muted-foreground">
                                        <CheckCircle className="size-5 text-primary mt-0.5 shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </TabsContent>

                    {productType === "physical" && (
                        <>
                            <TabsContent value="specifications" className="py-12 max-w-3xl">
                                <h3 className="text-xl font-bold text-foreground mb-4">Specifications</h3>
                                <div className="space-y-4 text-muted-foreground">
                                    <div className="flex justify-between py-2 border-b border-border">
                                        <span className="font-medium">Material</span>
                                        <span>100% Merino Wool</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-border">
                                        <span className="font-medium">Weight</span>
                                        <span>280g</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b border-border">
                                        <span className="font-medium">Care</span>
                                        <span>Machine wash cold, lay flat to dry</span>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="shipping" className="py-12 max-w-3xl">
                                <h3 className="text-xl font-bold text-foreground mb-4">Shipping & Returns</h3>
                                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                    {policyContent || "No Shipping & Returns policy available for this product."}
                                </p>
                            </TabsContent>
                        </>
                    )}

                    <TabsContent value="reviews" className="py-12 w-full">
                        {/* Review Section embedded here. We might want to remove its default padding/container if we want it to fit flush, but let's see. */}
                        {/* ReviewSection normally has its own container. We can use a wrapper or modify ReviewSection. */
                            /* Passing productId and name. ReviewSection handles fetching. */
                        }
                        <div className="-mx-4 lg:-mx-40">
                            <ReviewSection
                                productId={productId}
                                productName={productName}
                                highlightedReviewId={highlightedReviewId}
                            />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
