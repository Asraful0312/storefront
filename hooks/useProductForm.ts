"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Types
export interface ColorOption {
    id: string;
    name: string;
    hex: string;
}

export interface Specification {
    key: string;
    value: string;
}

export interface VariantDraft {
    _id?: string; // Optional for existing variants
    colorId?: string;
    size?: string;
    sku: string;
    stockCount: number;
    priceAdjustment?: number;
}

export interface ProductFormData {
    name: string;
    description: string;
    story: string;
    basePrice: string;
    compareAtPrice: string;
    tags: string[];
    vendor: string;
    categoryId: string;
    status: "draft" | "active";
    isFeatured?: boolean;
    // Badges & Policies
    shippingLabel?: string;
    shippingSublabel?: string;
    warrantyLabel?: string;
    warrantySublabel?: string;
    policyContent?: string;
    // Shipping
    weight: string;
    length: string;
    width: string;
    height: string;
    requiresShipping: boolean;
    // Specifications
    specifications: Specification[];
    features: string[];
    // Options
    colorOptions?: ColorOption[];
    sizeOptions?: string[];
}

interface UseProductFormOptions {
    initialData?: Partial<ProductFormData> & { variants?: VariantDraft[] };
    productId?: Id<"products">;
    isEdit?: boolean;
}

export function useProductForm(options: UseProductFormOptions = {}) {
    const router = useRouter();
    const { initialData, productId, isEdit = false } = options;

    // Form state
    const [name, setName] = useState(initialData?.name || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [story, setStory] = useState(initialData?.story || "");
    const [basePrice, setBasePrice] = useState(initialData?.basePrice || "");
    const [compareAtPrice, setCompareAtPrice] = useState(initialData?.compareAtPrice || "");
    const [tags, setTags] = useState<string[]>(initialData?.tags || []);
    const [tagInput, setTagInput] = useState("");
    const [vendor, setVendor] = useState(initialData?.vendor || "");
    const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
    const [status, setStatus] = useState<"draft" | "active">(initialData?.status || "draft");
    const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured || false);

    // Badges & Policies
    const [shippingLabel, setShippingLabel] = useState(initialData?.shippingLabel || "");
    const [shippingSublabel, setShippingSublabel] = useState(initialData?.shippingSublabel || "");
    const [warrantyLabel, setWarrantyLabel] = useState(initialData?.warrantyLabel || "");
    const [warrantySublabel, setWarrantySublabel] = useState(initialData?.warrantySublabel || "");
    const [policyContent, setPolicyContent] = useState(initialData?.policyContent || "");

    // Shipping dimensions
    const [weight, setWeight] = useState(initialData?.weight || "");
    const [length, setLength] = useState(initialData?.length || "");
    const [width, setWidth] = useState(initialData?.width || "");
    const [height, setHeight] = useState(initialData?.height || "");
    const [requiresShipping, setRequiresShipping] = useState(initialData?.requiresShipping ?? true);

    // Specifications
    const [specifications, setSpecifications] = useState<Specification[]>(
        initialData?.specifications || [{ key: "", value: "" }]
    );
    const [features, setFeatures] = useState<string[]>(initialData?.features || []);
    const [featureInput, setFeatureInput] = useState("");

    // Variants
    const [colorOptions, setColorOptions] = useState<ColorOption[]>(initialData?.colorOptions || []);
    const [sizeOptions, setSizeOptions] = useState<string[]>(initialData?.sizeOptions || []);
    const [showVariantBuilder, setShowVariantBuilder] = useState(!!initialData?.variants?.length);
    const [variants, setVariants] = useState<VariantDraft[]>(initialData?.variants || []);
    const [newColorName, setNewColorName] = useState("");
    const [newColorHex, setNewColorHex] = useState("#000000");
    const [newSize, setNewSize] = useState("");
    const [baseStock, setBaseStock] = useState("10");
    const [basePriceAdjustment, setBasePriceAdjustment] = useState("0");

    // UI state
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Queries & Mutations
    const categories = useQuery(api.categories.list);
    const createProduct = useMutation(api.products.create);
    const updateProduct = useMutation(api.products.update);
    const createVariants = useMutation(api.productVariants.createBulk);
    const replaceVariants = useMutation(api.productVariants.replace);

    // Tag handlers
    const handleAddTag = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput("");
        }
    }, [tagInput, tags]);

    const handleRemoveTag = useCallback((tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    }, [tags]);

    // Feature handlers
    const handleAddFeature = useCallback(() => {
        if (featureInput.trim() && !features.includes(featureInput.trim())) {
            setFeatures([...features, featureInput.trim()]);
            setFeatureInput("");
        }
    }, [featureInput, features]);

    const handleRemoveFeature = useCallback((index: number) => {
        setFeatures(features.filter((_, i) => i !== index));
    }, [features]);

    // Specification handlers
    const handleAddSpecification = useCallback(() => {
        setSpecifications([...specifications, { key: "", value: "" }]);
    }, [specifications]);

    const handleUpdateSpecification = useCallback((
        index: number,
        field: "key" | "value",
        value: string
    ) => {
        const updated = [...specifications];
        updated[index][field] = value;
        setSpecifications(updated);
    }, [specifications]);

    const handleRemoveSpecification = useCallback((index: number) => {
        setSpecifications(specifications.filter((_, i) => i !== index));
    }, [specifications]);

    // Color handlers
    const handleAddColor = useCallback(() => {
        if (newColorName.trim()) {
            setColorOptions([
                ...colorOptions,
                {
                    id: newColorName.toLowerCase().replace(/\s+/g, "-"),
                    name: newColorName.trim(),
                    hex: newColorHex,
                },
            ]);
            setNewColorName("");
            setNewColorHex("#000000");
        }
    }, [newColorName, newColorHex, colorOptions]);

    const handleRemoveColor = useCallback((colorId: string) => {
        setColorOptions(colorOptions.filter((c) => c.id !== colorId));
    }, [colorOptions]);

    // Size handlers
    const handleAddSize = useCallback(() => {
        if (newSize.trim() && !sizeOptions.includes(newSize.trim())) {
            setSizeOptions([...sizeOptions, newSize.trim()]);
            setNewSize("");
        }
    }, [newSize, sizeOptions]);

    const handleRemoveSize = useCallback((size: string) => {
        setSizeOptions(sizeOptions.filter((s) => s !== size));
    }, [sizeOptions]);

    // Variant generation
    const generateVariantMatrix = useCallback(() => {
        const newVariants: VariantDraft[] = [];

        if (colorOptions.length === 0 && sizeOptions.length === 0) {
            return;
        }

        const colors = colorOptions.length > 0 ? colorOptions : [null];
        const sizes = sizeOptions.length > 0 ? sizeOptions : [null];
        const defaultStock = parseInt(baseStock) || 0;
        const defaultPriceAdj = parseFloat(basePriceAdjustment) || 0;

        let skuIndex = 1;
        for (const color of colors) {
            for (const size of sizes) {
                const skuParts = [name.substring(0, 3).toUpperCase()];
                if (color) skuParts.push(color.id.toUpperCase().substring(0, 3));
                if (size) skuParts.push(size.toUpperCase().substring(0, 3));
                skuParts.push(String(skuIndex).padStart(3, "0"));

                // Check if we have an existing variant that matches?
                // For edit mode, we might want to preserve IDs/stock of matching variants.
                // Simple logic: Just generate strict matches from scratch for now.
                // If "Regenerate" is clicked, we usually wipe. 

                newVariants.push({
                    colorId: color?.id,
                    size: size || undefined,
                    sku: skuParts.join("-"),
                    stockCount: defaultStock,
                    priceAdjustment: defaultPriceAdj * 100,
                });
                skuIndex++;
            }
        }

        setVariants(newVariants);
    }, [colorOptions, sizeOptions, name, baseStock, basePriceAdjustment]);

    // Bulk update helpers
    const applyStockToAll = useCallback(() => {
        const stock = parseInt(baseStock) || 0;
        setVariants(variants.map(v => ({ ...v, stockCount: stock })));
    }, [baseStock, variants]);

    const applyPriceAdjustmentToAll = useCallback(() => {
        const adj = (parseFloat(basePriceAdjustment) || 0) * 100;
        setVariants(variants.map(v => ({ ...v, priceAdjustment: adj })));
    }, [basePriceAdjustment, variants]);

    // Update variant
    const updateVariant = useCallback((index: number, field: keyof VariantDraft, value: any) => {
        const updated = [...variants];
        (updated[index] as any)[field] = value;
        setVariants(updated);
    }, [variants]);

    // Get form data for submission
    const getFormData = useCallback((): ProductFormData => ({
        name,
        description,
        story,
        basePrice,
        compareAtPrice,
        tags,
        vendor,
        categoryId,
        status,
        isFeatured,
        shippingLabel,
        shippingSublabel,
        warrantyLabel,
        warrantySublabel,
        policyContent,
        weight,
        length,
        width,
        height,
        requiresShipping,
        specifications: specifications.filter(s => s.key && s.value),
        features,
        colorOptions,
        sizeOptions,
    }), [
        name, description, story, basePrice, compareAtPrice, tags, vendor,
        categoryId, status, isFeatured, shippingLabel, shippingSublabel, warrantyLabel, warrantySublabel, policyContent,
        weight, length, width, height, requiresShipping,
        specifications, features, colorOptions, sizeOptions
    ]);

    // Validate form
    const validateForm = useCallback((): string | null => {
        if (!name.trim()) return "Product name is required";
        if (!basePrice || parseFloat(basePrice) <= 0) return "Base price must be greater than 0";
        return null;
    }, [name, basePrice]);

    // Reset form
    const resetForm = useCallback(() => {
        setName("");
        setDescription("");
        setStory("");
        setBasePrice("");
        setCompareAtPrice("");
        setTags([]);
        setVendor("");
        setCategoryId("");
        setStatus("draft");
        setIsFeatured(false);
        setShippingLabel("");
        setShippingSublabel("");
        setWarrantyLabel("");
        setWarrantySublabel("");
        setPolicyContent("");
        setWeight("");
        setLength("");
        setWidth("");
        setHeight("");
        setRequiresShipping(true);
        setSpecifications([{ key: "", value: "" }]);
        setFeatures([]);
        setColorOptions([]);
        setSizeOptions([]);
        setVariants([]);
        setShowVariantBuilder(false);
        setError(null);
    }, []);

    return {
        // Basic fields
        name, setName,
        description, setDescription,
        story, setStory,
        basePrice, setBasePrice,
        compareAtPrice, setCompareAtPrice,
        tags, setTags,
        tagInput, setTagInput,
        vendor, setVendor,
        categoryId, setCategoryId,
        status, setStatus,
        isFeatured, setIsFeatured,
        shippingLabel, setShippingLabel,
        shippingSublabel, setShippingSublabel,
        warrantyLabel, setWarrantyLabel,
        warrantySublabel, setWarrantySublabel,
        policyContent, setPolicyContent,

        // Shipping
        weight, setWeight,
        length, setLength,
        width, setWidth,
        height, setHeight,
        requiresShipping, setRequiresShipping,

        // Specifications
        specifications, setSpecifications,
        features, setFeatures,
        featureInput, setFeatureInput,

        // Variants
        colorOptions, setColorOptions,
        sizeOptions, setSizeOptions,
        showVariantBuilder, setShowVariantBuilder,
        variants, setVariants,
        newColorName, setNewColorName,
        newColorHex, setNewColorHex,
        newSize, setNewSize,
        baseStock, setBaseStock,
        basePriceAdjustment, setBasePriceAdjustment,

        // UI state
        isSaving, setIsSaving,
        error, setError,

        // Data
        categories,

        // Mutations
        createProduct,
        updateProduct,
        createVariants,
        replaceVariants,

        // Handlers
        handleAddTag,
        handleRemoveTag,
        handleAddFeature,
        handleRemoveFeature,
        handleAddSpecification,
        handleUpdateSpecification,
        handleRemoveSpecification,
        handleAddColor,
        handleRemoveColor,
        handleAddSize,
        handleRemoveSize,
        generateVariantMatrix,
        applyStockToAll,
        applyPriceAdjustmentToAll,
        updateVariant,

        // Utilities
        getFormData,
        validateForm,
        resetForm,
        router,
        isEdit
    };
}
