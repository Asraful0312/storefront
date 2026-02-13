"use client";

import { useEffect, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCloudinaryImages } from "@/hooks/useCloudinaryImages";

export default function AdminSettingsPage() {
    const settings = useQuery(api.siteSettings.get);
    const updateSettings = useMutation(api.siteSettings.update);

    const [storeName, setStoreName] = useState("");
    const [storeUrl, setStoreUrl] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [supportPhone, setSupportPhone] = useState("");
    const [facebook, setFacebook] = useState("");
    const [twitter, setTwitter] = useState("");
    const [instagram, setInstagram] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Initial Data Load
    useEffect(() => {
        if (settings) {
            setStoreName(settings.storeName || "");
            setStoreUrl(settings.storeUrl || "");
            setContactEmail(settings.contactEmail || "");
            setSupportPhone(settings.supportPhone || "");
            setFacebook(settings.socialLinks?.facebook || "");
            setTwitter(settings.socialLinks?.twitter || "");
            setInstagram(settings.socialLinks?.instagram || "");

            // Sync logo if exists
            if (settings.logoUrl && settings.logoPublicId) {
                // Check if already in images to avoid loop (basic check)
                const alreadyHas = imgHook.images.some(img => img.publicId === settings.logoPublicId);
                if (!alreadyHas) {
                    imgHook.setImages([{
                        publicId: settings.logoPublicId!,
                        url: settings.logoUrl!,
                        isMain: true
                    }]);
                }
            }
        }
    }, [settings]);

    // Logo Upload Hook
    const imgHook = useCloudinaryImages({
        folder: "store_assets",
        productName: "store-logo",
    });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const logo = imgHook.images[0]; // Take the first image as logo
            await updateSettings({
                storeName,
                storeUrl,
                contactEmail,
                supportPhone,
                logoUrl: logo?.url,
                logoPublicId: logo?.publicId,
                socialLinks: {
                    facebook,
                    twitter,
                    instagram,
                }
            });
            alert("Settings saved successfully!");
        } catch (error) {
            console.error("Failed to save settings:", error);
            alert("Failed to save settings. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (settings === undefined) {
        return <div className="p-12 text-center">Loading settings...</div>;
    }

    return (
        <main className="flex-1 bg-card p-8 md:p-12 overflow-y-auto">
            <div className="flex flex-wrap justify-between items-end gap-4 mb-10 border-b border-border pb-8">
                <div className="max-w-2xl">
                    <h1 className="text-3xl font-black tracking-tight text-foreground">Store Settings</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your store's identity, logo, and contact information.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="shadow-lg shadow-primary/20"
                    >
                        {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="space-y-12 max-w-4xl">
                {/* Branding Section */}
                <section>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-primary rounded-full" />
                        Branding & Logo
                    </h2>
                    <div className="p-6 border-2 border-dashed border-border rounded-xl bg-secondary/30 flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group size-40 shrink-0">
                            {imgHook.images.length > 0 ? (
                                <>
                                    <div className="w-full h-full bg-card rounded-xl border border-border overflow-hidden shadow-sm flex items-center justify-center p-2">
                                        <img
                                            src={imgHook.images[0].url}
                                            alt="Logo Preview"
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                    <button
                                        onClick={() => imgHook.handleRemoveImage(imgHook.images[0].publicId)}
                                        className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="size-4" />
                                    </button>
                                </>
                            ) : (
                                <div
                                    onClick={imgHook.openFilePicker}
                                    className="w-full h-full bg-card rounded-xl border border-border flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50 transition-colors"
                                >
                                    <Upload className="size-8 text-muted-foreground mb-2" />
                                    <span className="text-xs text-muted-foreground font-medium">Upload Logo</span>
                                </div>
                            )}
                            {/* Hidden Input */}
                            <input
                                type="file"
                                ref={imgHook.fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={imgHook.handleImageUpload}
                            />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-lg font-bold text-foreground">Store Logo</h3>
                            <p className="text-muted-foreground mt-1 text-sm">
                                This logo will appear on your storefront and emails. <br />
                                Recommended: 512x512px, PNG with transparent background.
                            </p>
                            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                                <Button
                                    variant="secondary"
                                    className="font-bold"
                                    onClick={imgHook.openFilePicker}
                                    disabled={imgHook.isUploading}
                                >
                                    {imgHook.isUploading ? "Uploading..." : "Upload New Image"}
                                </Button>
                                {imgHook.images.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={imgHook.clearImages}
                                    >
                                        Remove
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Identity Information */}
                <section>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-primary rounded-full" />
                        Identity & Contact
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Store Name</Label>
                            <Input
                                value={storeName}
                                onChange={(e) => setStoreName(e.target.value)}
                                placeholder="e.g. Acme Corp"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Store URL</Label>
                            <Input
                                value={storeUrl}
                                onChange={(e) => setStoreUrl(e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact Email</Label>
                            <Input
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                placeholder="support@example.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Support Phone (Optional)</Label>
                            <Input
                                value={supportPhone}
                                onChange={(e) => setSupportPhone(e.target.value)}
                                placeholder="+1 (555) ..."
                            />
                        </div>
                    </div>
                </section>

                {/* Social Media */}
                <section>
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-primary rounded-full" />
                        Social Media
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label>Facebook</Label>
                            <Input
                                value={facebook}
                                onChange={(e) => setFacebook(e.target.value)}
                                placeholder="URL"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Twitter / X</Label>
                            <Input
                                value={twitter}
                                onChange={(e) => setTwitter(e.target.value)}
                                placeholder="URL"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Instagram</Label>
                            <Input
                                value={instagram}
                                onChange={(e) => setInstagram(e.target.value)}
                                placeholder="URL"
                            />
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
