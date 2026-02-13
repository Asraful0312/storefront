"use client";

import { useState, useRef, useCallback } from "react";
import { useCloudinaryUpload } from "@imaxis/cloudinary-convex/react";
import { api } from "@/convex/_generated/api";

export interface ProductImage {
    publicId: string;
    url: string;
    alt?: string;
    isMain: boolean;
}

interface UseCloudinaryImagesOptions {
    productName?: string;
    folder?: string;
    initialImages?: ProductImage[];
}

export function useCloudinaryImages(options: UseCloudinaryImagesOptions = {}) {
    const { productName = "", folder = "products", initialImages = [] } = options;

    const [images, setImages] = useState<ProductImage[]>(initialImages);
    const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cloudinary upload hook
    let cloudinaryUpload: ReturnType<typeof useCloudinaryUpload> | null = null;
    try {
        cloudinaryUpload = useCloudinaryUpload(api.cloudinary.upload as any);
    } catch {
        // Cloudinary not configured
    }

    const handleImageUpload = useCallback(async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const files = e.target.files;
        if (!files?.length) return;

        for (const file of Array.from(files)) {
            if (!cloudinaryUpload) {
                // Fallback: use object URL for preview
                setImages((prev) => [
                    ...prev,
                    {
                        publicId: `local-${Date.now()}-${file.name}`,
                        url: URL.createObjectURL(file),
                        alt: productName || file.name,
                        isMain: prev.length === 0,
                    },
                ]);
                continue;
            }

            try {
                const result = await cloudinaryUpload.upload(file, {
                    folder,
                });
                if (result) {
                    const publicId = (result as any).publicId || (result as any).public_id;
                    const url = (result as any).secureUrl || (result as any).secure_url;
                    setImages((prev) => [
                        ...prev,
                        {
                            publicId,
                            url,
                            alt: productName || file.name,
                            isMain: prev.length === 0,
                        },
                    ]);
                }
            } catch (err) {
                console.error("Upload failed:", err);
            }
        }

        // Reset input
        if (e.target) {
            e.target.value = "";
        }
    }, [cloudinaryUpload, folder, productName]);

    const handleSetMainImage = useCallback((publicId: string) => {
        setImages((prev) =>
            prev.map((img) => ({
                ...img,
                isMain: img.publicId === publicId,
            }))
        );
    }, []);

    const handleRemoveImage = useCallback((publicId: string) => {
        setImages((prev) => {
            const filtered = prev.filter((img) => img.publicId !== publicId);
            // If we removed the main image, set first remaining as main
            if (filtered.length > 0 && !filtered.some((img) => img.isMain)) {
                filtered[0].isMain = true;
            }
            return filtered;
        });
    }, []);

    const handleSelectFromLibrary = useCallback((asset: { publicId: string; secureUrl: string }) => {
        const exists = images.some((img) => img.publicId === asset.publicId);
        if (!exists) {
            setImages((prev) => [
                ...prev,
                {
                    publicId: asset.publicId,
                    url: asset.secureUrl,
                    alt: productName || "Product image",
                    isMain: prev.length === 0,
                },
            ]);
        }
    }, [images, productName]);

    const openFilePicker = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const clearImages = useCallback(() => {
        setImages([]);
    }, []);

    return {
        // State
        images,
        setImages,
        isImagePickerOpen,
        setIsImagePickerOpen,
        fileInputRef,

        // Upload state
        isUploading: cloudinaryUpload?.isUploading ?? false,
        uploadProgress: cloudinaryUpload?.progress ?? 0,

        // Actions
        handleImageUpload,
        handleSetMainImage,
        handleRemoveImage,
        handleSelectFromLibrary,
        openFilePicker,
        clearImages,
    };
}
