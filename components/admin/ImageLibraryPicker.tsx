import { useState, useRef } from "react";
import { useQuery } from "convex/react";
import { useCloudinaryUpload } from "@imaxis/cloudinary-convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Loader2,
    Image as ImageIcon,
    Star,
    ChevronLeft,
    ChevronRight,
    Search,
    Upload,
} from "lucide-react";

export interface ImageAsset {
    publicId: string;
    url: string;
    alt?: string;
    isMain?: boolean;
}

interface ImageLibraryPickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedImages: ImageAsset[];
    onSelectImage: (asset: { publicId: string; secureUrl: string }) => void;
    multiple?: boolean;
}

const ITEMS_PER_PAGE = 12;

export function ImageLibraryPicker({
    open,
    onOpenChange,
    selectedImages,
    onSelectImage,
    multiple = true,
}: ImageLibraryPickerProps) {
    const [currentPage, setCurrentPage] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cloudinary upload hook
    let cloudinaryUpload: ReturnType<typeof useCloudinaryUpload> | null = null;
    try {
        cloudinaryUpload = useCloudinaryUpload(api.cloudinary.upload as any);
    } catch {
        // Cloudinary not configured
    }

    // Fetch more images than we show per page for client-side filtering
    const cloudinaryAssets = useQuery(api.cloudinary.listAssetsCustom, {
        limit: 200
    });

    // Filter assets based on search query
    const filteredAssets = cloudinaryAssets?.filter((asset: any) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            asset.publicId?.toLowerCase().includes(query) ||
            asset.folder?.toLowerCase().includes(query)
        );
    }) || [];

    // Pagination calculations
    const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE);
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentAssets = filteredAssets.slice(startIndex, endIndex);

    // Reset to first page when search changes
    const handleSearch = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(0);
    };

    const handleSelectImage = (asset: any) => {
        onSelectImage({
            publicId: asset.publicId,
            secureUrl: asset.secureUrl,
        });
        if (!multiple) {
            onOpenChange(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files?.length || !cloudinaryUpload) return;

        for (const file of Array.from(files)) {
            try {
                const result = await cloudinaryUpload.upload(file, {
                    folder: "products", // Default folder
                });
                // Note: The list query should auto-update if it's reactive to the new asset
                // If not, we might need to manually handle the optimistic update or refetch
                // But typically adding to Cloudinary -> storing in Convex (if that's how it works) will trigger update
            } catch (err) {
                console.error("Upload failed:", err);
            }
        }

        // Reset input
        if (e.target) {
            e.target.value = "";
        }
    };

    const isUploading = cloudinaryUpload?.isUploading;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>Select from Library</DialogTitle>
                </DialogHeader>

                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                />

                {/* Search & Filter Bar */}
                <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Search images..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                        />
                    </div>

                    <Button
                        variant="default"
                        onClick={handleUploadClick}
                        disabled={isUploading}
                        className="gap-2"
                    >
                        {isUploading ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Upload className="size-4" />
                        )}
                        {isUploading ? "Uploading..." : "Upload New"}
                    </Button>
                </div>

                {/* Image Grid */}
                <div className="flex-1 overflow-y-auto py-4">
                    {!cloudinaryAssets ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredAssets.length === 0 ? (
                        <div className="text-center py-12">
                            <ImageIcon className="size-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">
                                {searchQuery
                                    ? "No images match your search"
                                    : "No images uploaded yet"}
                            </p>
                            {!searchQuery && (
                                <Button
                                    className="mt-4"
                                    onClick={handleUploadClick}
                                    variant="outline"
                                >
                                    Upload Your First Image
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                            {currentAssets.map((asset: any) => {
                                const isSelected = selectedImages.some(
                                    (img) => img.publicId === asset.publicId
                                );
                                return (
                                    <div
                                        key={asset.publicId}
                                        className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 ${isSelected
                                            ? "border-primary ring-2 ring-primary/30"
                                            : "border-border hover:border-primary/50"
                                            }`}
                                        onClick={() => handleSelectImage(asset)}
                                    >
                                        <img
                                            src={asset.secureUrl}
                                            alt={asset.publicId}
                                            className="object-cover w-full h-full"
                                            loading="lazy"
                                        />
                                        {isSelected && (
                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                <div className="bg-primary text-white rounded-full p-1">
                                                    <Star className="size-4 fill-current" />
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 truncate">
                                            {asset.folder || "root"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Pagination Footer */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                        {selectedImages.length} selected • {filteredAssets.length} total
                    </p>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground min-w-[80px] text-center">
                                Page {currentPage + 1} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="size-8"
                                disabled={currentPage >= totalPages - 1}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    )}

                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
