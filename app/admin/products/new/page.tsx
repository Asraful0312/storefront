"use client";

import Link from "next/link";
import {
    ChevronRight,
    FileText,
    Image as ImageIcon,
    CreditCard,
    Tag,
    CloudUpload,
    Eye,
    Trash2,
    Plus,
    X,
    Save,
    Package,
    Loader2,
    AlertCircle,
    Palette,
    Ruler,
    Weight,
    Star,
    CornerDownRight,
    Grid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Id } from "@/convex/_generated/dataModel";

// Hooks
import { useProductForm } from "@/hooks/useProductForm";
import { useCloudinaryImages } from "@/hooks/useCloudinaryImages";

// Components
import { ImageLibraryPicker } from "@/components/admin/ImageLibraryPicker";
import { type ProductDetail } from "@/components/storefront";

export default function AddNewProductPage() {
    // Use the product form hook
    const form = useProductForm();

    // Use cloudinary images hook
    const cloudinary = useCloudinaryImages({ productName: form.name });

    const handlePreview = () => {
        const formData = form.getFormData();

        const previewData: ProductDetail = {
            id: "preview",
            name: formData.name || "Untitled Product",
            price: parseFloat(formData.basePrice) || 0,
            originalPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
            description: formData.description || "",
            rating: 0,
            reviewCount: 0,
            images: cloudinary.images.map(img => ({
                id: img.publicId,
                url: img.url,
                alt: img.alt || ""
            })),
            colors: formData.colorOptions || [],
            sizes: formData.sizeOptions || [],
            unavailableSizes: [],
            stockCount: form.baseStock ? parseInt(form.baseStock) : undefined,
            features: formData.features,
            story: formData.story,
        };

        localStorage.setItem("productPreview", JSON.stringify(previewData));
        window.open("/admin/products/preview", "_blank");
    };

    // Handle form submission
    const handleSubmit = async (asDraft: boolean) => {
        const validationError = form.validateForm();
        if (validationError) {
            form.setError(validationError);
            return;
        }

        if (cloudinary.images.length === 0) {
            form.setError("Please add at least one product image");
            return;
        }

        form.setIsSaving(true);
        form.setError(null);

        try {
            const formData = form.getFormData();

            const productId = await form.createProduct({
                name: formData.name,
                description: formData.description,
                story: formData.story || undefined,
                basePrice: Math.round(parseFloat(formData.basePrice) * 100),
                compareAtPrice: formData.compareAtPrice
                    ? Math.round(parseFloat(formData.compareAtPrice) * 100)
                    : undefined,
                images: cloudinary.images.map((img) => ({
                    publicId: img.publicId,
                    url: img.url,
                    isMain: img.isMain,
                })),
                tags: formData.tags,
                vendor: formData.vendor || undefined,
                categoryId: formData.categoryId
                    ? (formData.categoryId as Id<"categories">)
                    : undefined,
                status: asDraft ? "draft" : "active",
                isFeatured: formData.isFeatured,
                weight: formData.weight ? parseFloat(formData.weight) : undefined,
                dimensions: (formData.length && formData.width && formData.height)
                    ? {
                        length: parseFloat(formData.length),
                        width: parseFloat(formData.width),
                        height: parseFloat(formData.height),
                    }
                    : undefined,
                requiresShipping: formData.requiresShipping,
                specifications: formData.specifications.filter(s => s.key && s.value),
                features: formData.features,
                colorOptions: formData.colorOptions,
                sizeOptions: formData.sizeOptions,
                shippingLabel: formData.shippingLabel,
                shippingSublabel: formData.shippingSublabel,
                warrantyLabel: formData.warrantyLabel,
                warrantySublabel: formData.warrantySublabel,
                policyContent: formData.policyContent,
            });

            // Create variants if any
            if (form.variants.length > 0) {
                await form.createVariants({
                    productId,
                    variants: form.variants.map((v) => ({
                        colorId: v.colorId,
                        size: v.size,
                        sku: v.sku,
                        stockCount: v.stockCount,
                        priceAdjustment: v.priceAdjustment,
                        isDefault: false,
                    })),
                });
            }

            form.router.push("/admin/products");
        } catch (err) {
            form.setError(err instanceof Error ? err.message : "Failed to create product");
        } finally {
            form.setIsSaving(false);
        }
    };

    const handleSetMainImage = (publicId: string) => {
        cloudinary.setImages((prev) =>
            prev.map((img) => ({
                ...img,
                isMain: img.publicId === publicId,
            }))
        );
    };

    const handleRemoveImage = (publicId: string) => {
        cloudinary.setImages((prev) => {
            const filtered = prev.filter((img) => img.publicId !== publicId);
            if (filtered.length > 0 && !filtered.some((img) => img.isMain)) {
                filtered[0].isMain = true;
            }
            return filtered;
        });
    };

    return (
        <>
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Top Bar */}
                <header className="bg-card border-b border-border px-8 py-5 flex items-center justify-between shrink-0 z-10">
                    <div className="flex flex-col gap-1">
                        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Link href="/admin" className="hover:text-primary transition-colors">
                                Dashboard
                            </Link>
                            <ChevronRight className="size-4" />
                            <Link href="/admin/products" className="hover:text-primary transition-colors">
                                Products
                            </Link>
                            <ChevronRight className="size-4" />
                            <span className="text-foreground font-medium">Add New Product</span>
                        </nav>
                        <h1 className="text-2xl font-bold text-foreground">Add New Product</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="gap-2" disabled={form.isSaving} onClick={handlePreview}>
                            <Eye className="size-4" />
                            Preview
                        </Button>
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => handleSubmit(true)}
                            disabled={form.isSaving}
                        >
                            {form.isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                            Save as Draft
                        </Button>
                        <Button
                            className="gap-2"
                            onClick={() => handleSubmit(false)}
                            disabled={form.isSaving}
                        >
                            {form.isSaving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                            Publish Product
                        </Button>
                    </div>
                </header>

                {/* Error Banner */}
                {form.error && (
                    <div className="bg-destructive/10 border-b border-destructive/30 px-8 py-3 flex items-center gap-2 text-destructive">
                        <AlertCircle className="size-4" />
                        <span className="text-sm">{form.error}</span>
                        <button className="ml-auto" onClick={() => form.setError(null)}>
                            <X className="size-4" />
                        </button>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto bg-background">
                    <div className="max-w-6xl mx-auto px-8 py-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column - Main Content */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* General Information */}
                                <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
                                    <div className="flex items-center gap-2 mb-6">
                                        <FileText className="size-5 text-primary" />
                                        <h2 className="text-lg font-bold text-foreground">General Information</h2>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-medium">
                                                Product Name <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                placeholder="Enter product name"
                                                value={form.name}
                                                onChange={(e) => form.setName(e.target.value)}
                                                className="h-11"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="description" className="text-sm font-medium">
                                                Description
                                            </Label>
                                            <Textarea
                                                id="description"
                                                placeholder="Describe your product..."
                                                rows={4}
                                                value={form.description}
                                                onChange={(e) => form.setDescription(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="story" className="text-sm font-medium">
                                                Brand Story
                                            </Label>
                                            <Textarea
                                                id="story"
                                                placeholder="Tell the story behind this product..."
                                                rows={3}
                                                value={form.story}
                                                onChange={(e) => form.setStory(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Media Section */}
                                <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <ImageIcon className="size-5 text-primary" />
                                            <h2 className="text-lg font-bold text-foreground">Media</h2>
                                        </div>
                                        {cloudinary.isUploading && (
                                            <div className="flex items-center gap-2 text-sm text-primary">
                                                <Loader2 className="size-4 animate-spin" />
                                                Uploading... {cloudinary.uploadProgress}%
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        ref={cloudinary.fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                        onChange={cloudinary.handleImageUpload}
                                    />
                                    <div
                                        className="border-2 border-dashed border-primary/30 rounded-xl bg-secondary/30 p-8 text-center hover:bg-primary/5 transition-colors cursor-pointer group"
                                        onClick={cloudinary.openFilePicker}
                                    >
                                        <div className="bg-card rounded-full size-12 flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform duration-200">
                                            <CloudUpload className="size-6 text-primary" />
                                        </div>
                                        <p className="text-foreground font-medium mb-1">
                                            Click to upload or drag and drop
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            PNG, JPG, WebP (recommended: 800x800px)
                                        </p>
                                    </div>

                                    {/* Or select from existing */}
                                    <div className="flex items-center gap-4 mt-4">
                                        <div className="flex-1 h-px bg-border" />
                                        <span className="text-xs text-muted-foreground">or</span>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full mt-4 gap-2"
                                        onClick={() => cloudinary.setIsImagePickerOpen(true)}
                                    >
                                        <Grid className="size-4" />
                                        Select from Library
                                    </Button>

                                    {/* Thumbnails Grid */}
                                    {cloudinary.images.length > 0 && (
                                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            {cloudinary.images.map((image) => (
                                                <div
                                                    key={image.publicId}
                                                    className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-secondary"
                                                >
                                                    <img
                                                        alt={image.alt || "Product image"}
                                                        className="object-cover w-full h-full"
                                                        src={image.url}
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <button
                                                            className="bg-white/20 hover:bg-white/40 p-1.5 rounded-full text-white backdrop-blur-sm"
                                                            onClick={() => handleSetMainImage(image.publicId)}
                                                            title="Set as main"
                                                        >
                                                            <Star className={`size-4 ${image.isMain ? "fill-yellow-400 text-yellow-400" : ""}`} />
                                                        </button>
                                                        <button
                                                            className="bg-red-500/80 hover:bg-red-600 p-1.5 rounded-full text-white backdrop-blur-sm"
                                                            onClick={() => handleRemoveImage(image.publicId)}
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                    </div>
                                                    {image.isMain && (
                                                        <div className="absolute top-2 left-2 bg-white/90 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-foreground shadow-sm backdrop-blur-md">
                                                            Main
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                {/* Pricing Section */}
                                <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
                                    <div className="flex items-center gap-2 mb-6">
                                        <CreditCard className="size-5 text-primary" />
                                        <h2 className="text-lg font-bold text-foreground">Pricing</h2>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <Label htmlFor="basePrice" className="text-sm font-medium">
                                                Base Price <span className="text-destructive">*</span>
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                                <Input
                                                    id="basePrice"
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    className="pl-8 h-11"
                                                    value={form.basePrice}
                                                    onChange={(e) => form.setBasePrice(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="compareAtPrice" className="text-sm font-medium">
                                                Compare at Price
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                                <Input
                                                    id="compareAtPrice"
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    className="pl-8 h-11"
                                                    value={form.compareAtPrice}
                                                    onChange={(e) => form.setCompareAtPrice(e.target.value)}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Original price shown with strikethrough
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {/* Shipping Section */}
                                <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Package className="size-5 text-primary" />
                                        <h2 className="text-lg font-bold text-foreground">Shipping</h2>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-foreground">Physical Product</p>
                                                <p className="text-sm text-muted-foreground">This product requires shipping</p>
                                            </div>
                                            <Switch
                                                checked={form.requiresShipping}
                                                onCheckedChange={form.setRequiresShipping}
                                            />
                                        </div>
                                        {form.requiresShipping && (
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium flex items-center gap-1">
                                                        <Weight className="size-3.5" /> Weight (kg)
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={form.weight}
                                                        onChange={(e) => form.setWeight(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium flex items-center gap-1">
                                                        <Ruler className="size-3.5" /> Length (cm)
                                                    </Label>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="0"
                                                        value={form.length}
                                                        onChange={(e) => form.setLength(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Width (cm)</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="0"
                                                        value={form.width}
                                                        onChange={(e) => form.setWidth(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-medium">Height (cm)</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.1"
                                                        placeholder="0"
                                                        value={form.height}
                                                        onChange={(e) => form.setHeight(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* Specifications Section */}
                                <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Ruler className="size-5 text-primary" />
                                        <h2 className="text-lg font-bold text-foreground">Specifications</h2>
                                    </div>
                                    <div className="space-y-4">
                                        {form.specifications.map((spec, index) => (
                                            <div key={index} className="flex gap-3">
                                                <Input
                                                    placeholder="Property"
                                                    value={spec.key}
                                                    onChange={(e) => form.handleUpdateSpecification(index, "key", e.target.value)}
                                                    className="flex-1"
                                                />
                                                <Input
                                                    placeholder="Value"
                                                    value={spec.value}
                                                    onChange={(e) => form.handleUpdateSpecification(index, "value", e.target.value)}
                                                    className="flex-1"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => form.handleRemoveSpecification(index)}
                                                    disabled={form.specifications.length === 1}
                                                >
                                                    <X className="size-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button variant="outline" onClick={form.handleAddSpecification} className="gap-2">
                                            <Plus className="size-4" />
                                            Add Specification
                                        </Button>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-border">
                                        <Label className="text-sm font-medium mb-3 block">Key Features</Label>
                                        <div className="flex gap-2 mb-3">
                                            <Input
                                                placeholder="Add a feature"
                                                value={form.featureInput}
                                                onChange={(e) => form.setFeatureInput(e.target.value)}
                                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); form.handleAddFeature(); } }}
                                            />
                                            <Button variant="outline" onClick={form.handleAddFeature}>
                                                <Plus className="size-4" />
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {form.features.map((feature, index) => (
                                                <span key={index} className="inline-flex items-center gap-1 bg-secondary px-3 py-1 rounded-full text-sm">
                                                    {feature}
                                                    <button onClick={() => form.handleRemoveFeature(index)}>
                                                        <X className="size-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Right Column - Sidebar */}
                            <div className="space-y-6">
                                {/* Organization */}
                                <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Tag className="size-5 text-primary" />
                                        <h2 className="text-lg font-bold text-foreground">Organization</h2>
                                    </div>
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Category</Label>
                                            <Select value={form.categoryId} onValueChange={form.setCategoryId}>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {(() => {
                                                        // Flatten category tree
                                                        const flattenCategories = (
                                                            categories: any[],
                                                            depth: number = 0
                                                        ): { id: string; name: string; depth: number }[] => {
                                                            const result: { id: string; name: string; depth: number }[] = [];

                                                            for (const cat of categories) {
                                                                result.push({ id: cat._id, name: cat.name, depth });
                                                                if (cat.children && cat.children.length > 0) {
                                                                    result.push(...flattenCategories(cat.children, depth + 1));
                                                                }
                                                            }

                                                            return result;
                                                        };

                                                        const flatList = form.categories ? flattenCategories(form.categories) : [];

                                                        return flatList.map((cat) => (
                                                            <SelectItem className="group" key={cat.id} value={cat.id}>
                                                                <span className="flex items-center">
                                                                    {cat.depth > 0 && (
                                                                        <span className="flex mr-2 text-muted-foreground" style={{ width: `${cat.depth * 20}px` }}>
                                                                            <span className="flex-1" />
                                                                            <CornerDownRight className="size-4 opacity-50 mb-0.5 ml-auto group-hover:text-primary transition-colors" />
                                                                        </span>
                                                                    )}
                                                                    {cat.name}
                                                                </span>
                                                            </SelectItem>

                                                        ));
                                                    })()}
                                                </SelectContent>
                                            </Select>
                                            <Link href="/admin/products/categories" className="text-primary hover:underline text-sm">
                                                Add New Category
                                            </Link>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Vendor</Label>
                                            <Input
                                                placeholder="Brand or vendor name"
                                                value={form.vendor}
                                                onChange={(e) => form.setVendor(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Tags</Label>
                                            <Input
                                                placeholder="Add tags (press Enter)"
                                                value={form.tagInput}
                                                onChange={(e) => form.setTagInput(e.target.value)}
                                                onKeyDown={form.handleAddTag}
                                            />
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {form.tags.map((tag) => (
                                                    <span key={tag} className="inline-flex items-center gap-1 bg-secondary px-2 py-1 rounded text-xs">
                                                        {tag}
                                                        <button onClick={() => form.handleRemoveTag(tag)}>
                                                            <X className="size-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                                        <div className="space-y-0.5">
                                            <Label className="text-base">Featured Product</Label>
                                            <p className="text-sm text-muted-foreground">Show in featured lists</p>
                                        </div>
                                        <Switch
                                            checked={form.isFeatured}
                                            onCheckedChange={form.setIsFeatured}
                                        />
                                    </div>
                                </section>

                                {/* Variants */}
                                <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Palette className="size-5 text-primary" />
                                        <h2 className="text-lg font-bold text-foreground">Variants</h2>
                                    </div>
                                    <div className="space-y-4">
                                        {/* Colors */}
                                        <div>
                                            <Label className="text-sm font-medium mb-2 block">Colors</Label>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {form.colorOptions.map((color) => (
                                                    <span key={color.id} className="inline-flex items-center gap-1 bg-secondary px-2 py-1 rounded text-xs">
                                                        <span className="size-3 rounded-full" style={{ backgroundColor: color.hex }} />
                                                        {color.name}
                                                        <button onClick={() => form.handleRemoveColor(color.id)}>
                                                            <X className="size-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Color name"
                                                    value={form.newColorName}
                                                    onChange={(e) => form.setNewColorName(e.target.value)}
                                                    className="flex-1 h-8 text-sm"
                                                />
                                                <input
                                                    type="color"
                                                    value={form.newColorHex}
                                                    onChange={(e) => form.setNewColorHex(e.target.value)}
                                                    className="w-8 h-8 rounded cursor-pointer"
                                                />
                                                <Button variant="outline" size="sm" className="h-8" onClick={form.handleAddColor}>
                                                    <Plus className="size-3" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Sizes */}
                                        <div>
                                            <Label className="text-sm font-medium mb-2 block">Sizes</Label>
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {form.sizeOptions.map((size) => (
                                                    <span key={size} className="inline-flex items-center gap-1 bg-secondary px-2 py-1 rounded text-xs">
                                                        {size}
                                                        <button onClick={() => form.handleRemoveSize(size)}>
                                                            <X className="size-3" />
                                                        </button>
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="e.g. S, M, L, XL"
                                                    value={form.newSize}
                                                    onChange={(e) => form.setNewSize(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); form.handleAddSize(); } }}
                                                    className="flex-1 h-8 text-sm"
                                                />
                                                <Button variant="outline" size="sm" className="h-8" onClick={form.handleAddSize}>
                                                    <Plus className="size-3" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Generate Variants */}
                                        {(form.colorOptions.length > 0 || form.sizeOptions.length > 0) && (
                                            <>
                                                {/* Base Values */}
                                                <div className="grid grid-cols-2 gap-3 p-3 bg-secondary/50 rounded-lg">
                                                    <div>
                                                        <Label className="text-xs font-medium">Base Stock</Label>
                                                        <div className="flex gap-2 mt-1">
                                                            <Input
                                                                type="number"
                                                                className="h-8 text-sm"
                                                                value={form.baseStock}
                                                                onChange={(e) => form.setBaseStock(e.target.value)}
                                                            />
                                                            {form.variants.length > 0 && (
                                                                <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={form.applyStockToAll}>
                                                                    Apply
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs font-medium">Price +/-</Label>
                                                        <div className="flex gap-2 mt-1">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                className="h-8 text-sm"
                                                                value={form.basePriceAdjustment}
                                                                onChange={(e) => form.setBasePriceAdjustment(e.target.value)}
                                                            />
                                                            {form.variants.length > 0 && (
                                                                <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={form.applyPriceAdjustmentToAll}>
                                                                    Apply
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    variant="outline"
                                                    className="w-full gap-2 border-primary text-primary hover:bg-primary hover:text-white"
                                                    onClick={() => { form.generateVariantMatrix(); form.setShowVariantBuilder(true); }}
                                                >
                                                    {form.variants.length > 0 ? "Regenerate" : "Generate"}{" "}
                                                    {Math.max(form.colorOptions.length, 1) * Math.max(form.sizeOptions.length, 1)} Variants
                                                </Button>

                                                {/* Variant Table */}
                                                {form.showVariantBuilder && form.variants.length > 0 && (
                                                    <div className="mt-4 max-h-60 overflow-y-auto">
                                                        <table className="w-full text-xs">
                                                            <thead className="bg-secondary sticky top-0">
                                                                <tr>
                                                                    <th className="text-left p-2">Variant</th>
                                                                    <th className="text-left p-2">SKU</th>
                                                                    <th className="text-left p-2">Stock</th>
                                                                    <th className="text-left p-2">Price +/-</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-border">
                                                                {form.variants.map((v, i) => {
                                                                    const color = form.colorOptions.find((c) => c.id === v.colorId);
                                                                    return (
                                                                        <tr key={i}>
                                                                            <td className="p-2">
                                                                                {color && <span className="inline-block size-3 rounded-full mr-1" style={{ backgroundColor: color.hex }} />}
                                                                                {color?.name}{color && v.size && " / "}{v.size}
                                                                            </td>
                                                                            <td className="p-2">
                                                                                <Input className="h-7 text-xs w-24" value={v.sku} onChange={(e) => form.updateVariant(i, "sku", e.target.value)} />
                                                                            </td>
                                                                            <td className="p-2">
                                                                                <Input type="number" className="h-7 text-xs w-16" value={v.stockCount} onChange={(e) => form.updateVariant(i, "stockCount", parseInt(e.target.value) || 0)} />
                                                                            </td>
                                                                            <td className="p-2">
                                                                                <div className="flex items-center gap-1">
                                                                                    <span className="text-muted-foreground text-xs">$</span>
                                                                                    <Input type="number" step="0.01" className="h-7 text-xs w-16" value={((v.priceAdjustment || 0) / 100).toFixed(2)} onChange={(e) => form.updateVariant(i, "priceAdjustment", parseFloat(e.target.value) * 100 || 0)} />
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </section>

                                {/* Policies & Badges */}
                                <section className="bg-card rounded-xl p-6 shadow-sm border border-border">
                                    <div className="flex items-center gap-2 mb-6">
                                        <FileText className="size-5 text-primary" />
                                        <h2 className="text-lg font-bold text-foreground">Policies & Badges</h2>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="shippingLabel">Shipping Badge Label</Label>
                                            <Input
                                                id="shippingLabel"
                                                placeholder="e.g., Free Shipping"
                                                value={form.shippingLabel}
                                                onChange={(e) => form.setShippingLabel(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="shippingSublabel">Shipping Badge Sublabel</Label>
                                            <Input
                                                id="shippingSublabel"
                                                placeholder="e.g., On orders over $150"
                                                value={form.shippingSublabel}
                                                onChange={(e) => form.setShippingSublabel(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="warrantyLabel">Warranty Badge Label</Label>
                                            <Input
                                                id="warrantyLabel"
                                                placeholder="e.g., 2 Year Warranty"
                                                value={form.warrantyLabel}
                                                onChange={(e) => form.setWarrantyLabel(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="warrantySublabel">Warranty Badge Sublabel</Label>
                                            <Input
                                                id="warrantySublabel"
                                                placeholder="e.g., Full coverage included"
                                                value={form.warrantySublabel}
                                                onChange={(e) => form.setWarrantySublabel(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="policyContent">Shipping & Returns Policy</Label>
                                            <Textarea
                                                id="policyContent"
                                                placeholder="Details about shipping and returns..."
                                                rows={4}
                                                value={form.policyContent}
                                                onChange={(e) => form.setPolicyContent(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Image Library Picker */}
                <ImageLibraryPicker
                    open={cloudinary.isImagePickerOpen}
                    onOpenChange={cloudinary.setIsImagePickerOpen}
                    selectedImages={cloudinary.images}
                    onSelectImage={cloudinary.handleSelectFromLibrary}
                />
            </main>
        </>
    );
}
