"use client";

import { useState, useRef, useCallback } from "react";
import { useCloudinaryUpload } from "@imaxis/cloudinary-convex/react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

// MIME types the library's server-side validation accepts
const IMAGE_MIME_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
    "image/svg+xml",
];

export interface DigitalFile {
    name: string;
    url: string;
    publicId: string;
    fileType: string;
    fileSize?: number;
}

interface UseCloudinaryFilesOptions {
    folder?: string;
    initialFiles?: DigitalFile[];
}

export function useCloudinaryFiles(options: UseCloudinaryFilesOptions = {}) {
    const { folder = "digital-files", initialFiles = [] } = options;

    const [files, setFiles] = useState<DigitalFile[]>(initialFiles);
    const [isFilePickerOpen, setIsFilePickerOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cloudinary upload hook (for image files)
    let cloudinaryUpload: ReturnType<typeof useCloudinaryUpload> | null = null;
    try {
        cloudinaryUpload = useCloudinaryUpload(api.cloudinary.upload as any);
    } catch {
        // Cloudinary not configured
    }

    // Raw file upload action (for PDFs, ZIPs, etc.)
    const uploadRawFile = useAction(api.uploadRawFile.upload);

    // Digital files library
    const libraryFiles = useQuery(api.digitalFiles.list);
    const saveToLibrary = useMutation(api.digitalFiles.save);
    const removeFromLibrary = useMutation(api.digitalFiles.remove);

    const handleFileUpload = useCallback(async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const fileList = e.target.files;
        if (!fileList?.length) return;

        setIsUploading(true);
        setUploadProgress(0);

        for (const file of Array.from(fileList)) {
            const isImageFile = IMAGE_MIME_TYPES.includes(file.type);

            if (isImageFile && cloudinaryUpload) {
                // Use standard library upload for image files
                try {
                    setUploadProgress(20);
                    const result = await cloudinaryUpload.upload(file, {
                        folder,
                    });
                    if (result) {
                        const publicId = (result as any).publicId || (result as any).public_id;
                        const url = (result as any).secureUrl || (result as any).secure_url;
                        const fileType = file.name.split(".").pop() || "unknown";

                        const digitalFile: DigitalFile = {
                            name: file.name,
                            url,
                            publicId,
                            fileType,
                            fileSize: file.size,
                        };

                        setFiles((prev) => [...prev, digitalFile]);
                        setUploadProgress(90);

                        await saveToLibrary({
                            name: file.name,
                            url,
                            publicId,
                            fileType,
                            fileSize: file.size,
                        });
                        setUploadProgress(100);
                    }
                } catch (err) {
                    console.error("Image file upload failed:", err);
                }
            } else {
                // Use raw upload action for non-image files (PDF, ZIP, EPUB, etc.)
                try {
                    setUploadProgress(10);

                    // Convert file to base64
                    const base64Data = await new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });

                    setUploadProgress(40);

                    const result = await uploadRawFile({
                        base64Data,
                        filename: file.name,
                        folder,
                    });

                    if (result.success) {
                        const fileType = file.name.split(".").pop() || "unknown";

                        const digitalFile: DigitalFile = {
                            name: file.name,
                            url: result.secureUrl,
                            publicId: result.publicId,
                            fileType,
                            fileSize: file.size,
                        };

                        setFiles((prev) => [...prev, digitalFile]);
                        setUploadProgress(90);

                        await saveToLibrary({
                            name: file.name,
                            url: result.secureUrl,
                            publicId: result.publicId,
                            fileType,
                            fileSize: file.size,
                        });
                        setUploadProgress(100);
                    }
                } catch (err) {
                    console.error("Raw file upload failed:", err);
                }
            }
        }

        setIsUploading(false);
        setUploadProgress(0);

        // Reset input
        if (e.target) {
            e.target.value = "";
        }
    }, [cloudinaryUpload, uploadRawFile, folder, saveToLibrary]);

    const handleRemoveFile = useCallback((publicId: string) => {
        setFiles((prev) => prev.filter((f) => f.publicId !== publicId));
    }, []);

    const handleSelectFromLibrary = useCallback((file: {
        name: string;
        url: string;
        publicId: string;
        fileType: string;
        fileSize?: number;
    }) => {
        const exists = files.some((f) => f.publicId === file.publicId);
        if (!exists) {
            setFiles((prev) => [...prev, {
                name: file.name,
                url: file.url,
                publicId: file.publicId,
                fileType: file.fileType,
                fileSize: file.fileSize,
            }]);
        }
    }, [files]);

    const openFilePicker = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const clearFiles = useCallback(() => {
        setFiles([]);
    }, []);

    return {
        // State
        files,
        setFiles,
        isFilePickerOpen,
        setIsFilePickerOpen,
        fileInputRef,

        // Library
        libraryFiles,
        removeFromLibrary,

        // Upload state
        isUploading,
        uploadProgress,

        // Actions
        handleFileUpload,
        handleRemoveFile,
        handleSelectFromLibrary,
        openFilePicker,
        clearFiles,
    };
}
