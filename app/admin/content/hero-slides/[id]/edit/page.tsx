"use client";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useEffect } from "react";
import {
    ChevronRight,
    ArrowLeft,
    Save,
    Loader2,
    Image as ImageIcon,
    LayoutTemplate,
    AlertCircle,
    X,
    Trash2
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
import { ImageLibraryPicker } from "@/components/admin/ImageLibraryPicker";

export default function EditHeroSlidePage() {
    const router = useRouter();
    const params = useParams();
    const slideId = params.id as Id<"heroSlides">;

    const slide = useQuery(api.heroSlides.get, { id: slideId });
    const updateSlide = useMutation(api.heroSlides.update);
    const removeSlide = useMutation(api.heroSlides.remove);

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [ctaText, setCtaText] = useState("");
    const [ctaHref, setCtaHref] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [sortOrder, setSortOrder] = useState("");
    const [location, setLocation] = useState("hero");

    // Load initial data
    useEffect(() => {
        if (slide) {
            setTitle(slide.title);
            setDescription(slide.description || "");
            setImageUrl(slide.imageUrl);
            setCtaText(slide.ctaText);
            setCtaHref(slide.ctaHref);
            setIsActive(slide.isActive);
            setSortOrder(slide.sortOrder?.toString() || "");
            setLocation(slide.location || "hero");
        }
    }, [slide]);

    // Image Picker State
    const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);

    const handleSubmit = async () => {
        if (!title.trim()) {
            setError("Title is required");
            return;
        }
        if (!imageUrl) {
            setError("Image is required");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await updateSlide({
                id: slideId,
                title,
                description: description || undefined,
                imageUrl,
                ctaText,
                ctaHref,
                isActive,
                sortOrder: sortOrder ? parseInt(sortOrder) : undefined,
                location,
            });
            router.push("/admin/content/hero-slides");
        } catch (err) {
            console.error(err);
            setError("Failed to update slide");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this slide?")) return;
        setIsSaving(true);
        try {
            await removeSlide({ id: slideId });
            router.push("/admin/content/hero-slides");
        } catch (err) {
            console.error(err);
            setError("Failed to delete slide");
            setIsSaving(false);
        }
    };

    if (slide === undefined) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    if (slide === null) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <p className="text-muted-foreground">Slide not found</p>
                <Link href="/admin/content/hero-slides">
                    <Button variant="outline">Back to Content</Button>
                </Link>
            </div>
        );
    }

    return (
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
            {/* Header */}
            <header className="bg-card border-b border-border px-8 py-5 flex items-center justify-between shrink-0 z-10">
                <div className="flex flex-col gap-1">
                    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link href="/admin/content/hero-slides" className="hover:text-primary transition-colors">
                            Content
                        </Link>
                        <ChevronRight className="size-4" />
                        <span className="text-foreground font-medium">Edit Slide</span>
                    </nav>
                    <h1 className="text-2xl font-bold text-foreground">Edit Slide</h1>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/admin/content/hero-slides">
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft className="size-4" />
                            Cancel
                        </Button>
                    </Link>
                    <Button variant="destructive" className="gap-2 text-destructive hover:bg-destructive hover:text-white" onClick={handleDelete} disabled={isSaving}>
                        <Trash2 className="size-4" />
                        Delete
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSaving} className="gap-2">
                        {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                        Save Changes
                    </Button>
                </div>
            </header>

            {/* Error Banner */}
            {error && (
                <div className="bg-destructive/10 border-b border-destructive/30 px-8 py-3 flex items-center gap-2 text-destructive">
                    <AlertCircle className="size-4" />
                    <span className="text-sm">{error}</span>
                    <button className="ml-auto" onClick={() => setError(null)}>
                        <X className="size-4" />
                    </button>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-8">

                    {/* Main Info */}
                    <div className="bg-card rounded-xl p-6 shadow-sm border border-border space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <LayoutTemplate className="size-5 text-primary" />
                            <h2 className="text-lg font-bold">Slide Information</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Title <span className="text-destructive">*</span></Label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Summer Collection" />
                            </div>
                            <div className="space-y-2">
                                <Label>Location</Label>
                                <Select value={location} onValueChange={setLocation}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hero">Hero Slider (Homepage Top)</SelectItem>
                                        <SelectItem value="featured">Featured Banner</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Short description..."
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>CTA Text</Label>
                                <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="e.g. Shop Now" />
                            </div>
                            <div className="space-y-2">
                                <Label>CTA Link</Label>
                                <Input value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} placeholder="e.g. /shop/summer" />
                            </div>
                        </div>
                    </div>

                    {/* Image Section */}
                    <div className="bg-card rounded-xl p-6 shadow-sm border border-border space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                            <ImageIcon className="size-5 text-primary" />
                            <h2 className="text-lg font-bold">Image</h2>
                        </div>

                        <div className="space-y-4">
                            {imageUrl ? (
                                <div className="relative aspect-video rounded-lg overflow-hidden border border-border bg-muted group">
                                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button variant="secondary" onClick={() => setIsImagePickerOpen(true)}>
                                            Change Image
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    onClick={() => setIsImagePickerOpen(true)}
                                    className="aspect-video rounded-lg border-2 border-dashed border-border bg-secondary/30 flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 transition-colors"
                                >
                                    <ImageIcon className="size-10 text-muted-foreground mb-2" />
                                    <p className="text-sm text-muted-foreground">Click to select image</p>
                                </div>
                            )}
                            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Or enter Image URL directly" className="text-xs font-mono" />
                        </div>
                    </div>

                    {/* Settings */}
                    <div className="bg-card rounded-xl p-6 shadow-sm border border-border space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base">Active Status</Label>
                                <p className="text-sm text-muted-foreground">Visible on storefront</p>
                            </div>
                            <Switch checked={isActive} onCheckedChange={setIsActive} />
                        </div>
                        <div className="space-y-2">
                            <Label>Sort Order</Label>
                            <Input
                                type="number"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value)}
                                placeholder="e.g. 1"
                                className="max-w-[200px]"
                            />
                            <p className="text-xs text-muted-foreground">Lower numbers appear first</p>
                        </div>
                    </div>

                </div>
            </div>

            <ImageLibraryPicker
                open={isImagePickerOpen}
                onOpenChange={setIsImagePickerOpen}
                selectedImages={imageUrl ? [{ publicId: 'selected', url: imageUrl }] : []}
                onSelectImage={(asset) => {
                    setImageUrl(asset.secureUrl);
                    setIsImagePickerOpen(false);
                }}
                multiple={false}
            />
        </main>
    );
}
