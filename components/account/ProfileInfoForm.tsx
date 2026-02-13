"use client";

import { useState, useRef } from "react";
import { Camera, Mail, Phone, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProfileInfoFormProps {
    user: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        avatar: string;
        membershipLevel?: string;
        clerkId?: string;
    };
    onSave: (data: { firstName: string; lastName: string; email: string; phone: string }) => void;
    onImageChange?: (file: File) => Promise<void>;
    onImageRemove?: () => Promise<void>;
}

export function ProfileInfoForm({ user, onSave, onImageChange, onImageRemove }: ProfileInfoFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(formData);
            setIsEditing(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
        });
        setAvatarPreview(null);
        setIsEditing(false);
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onImageChange) return;

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setAvatarPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        // Upload image
        setIsUploadingImage(true);
        try {
            await onImageChange(file);
        } catch (error) {
            console.error("Failed to upload image:", error);
            setAvatarPreview(null);
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleRemoveImage = async () => {
        if (!onImageRemove) return;

        setIsUploadingImage(true);
        try {
            await onImageRemove();
            setAvatarPreview(null);
        } catch (error) {
            console.error("Failed to remove image:", error);
        } finally {
            setIsUploadingImage(false);
        }
    };

    const displayAvatar = avatarPreview || user.avatar;

    return (
        <section className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="px-6 py-5 border-b border-border flex justify-between items-center">
                <h2 className="text-xl font-bold text-foreground">Personal Information</h2>
                {!isEditing && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        Edit Profile
                    </Button>
                )}
            </div>
            <div className="p-6 md:p-8">
                {/* Avatar Section */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
                    <div className="relative group">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                        <div
                            className="size-24 rounded-full bg-cover bg-center border-4 border-card shadow-md bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold cursor-pointer"
                            style={displayAvatar ? { backgroundImage: `url('${displayAvatar}')` } : {}}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {!displayAvatar && (user.firstName?.charAt(0) || "?")}
                            {isUploadingImage && (
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                    <Loader2 className="size-6 text-white animate-spin" />
                                </div>
                            )}
                        </div>
                        {!isUploadingImage && (
                            <div
                                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Camera className="size-6 text-white" />
                            </div>
                        )}
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex items-center gap-2 justify-center sm:justify-start">
                            <h3 className="text-lg font-bold text-foreground">
                                {user.firstName} {user.lastName}
                            </h3>
                            {user.membershipLevel && (
                                <Badge className="bg-primary/10 text-primary">
                                    {user.membershipLevel}
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground text-sm mb-4">
                            Update your photo and personal details here.
                        </p>
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                            {displayAvatar && onImageRemove && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleRemoveImage}
                                    disabled={isUploadingImage}
                                >
                                    {isUploadingImage ? (
                                        <>
                                            <Loader2 className="size-3 mr-1 animate-spin" />
                                            Removing...
                                        </>
                                    ) : (
                                        "Remove Photo"
                                    )}
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingImage}
                            >
                                Change Photo
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                            id="firstName"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            disabled={!isEditing}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                            id="lastName"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            disabled={!isEditing}
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={true}
                                className="pl-10 bg-secondary/50"
                            />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Email cannot be changed from here.
                        </p>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                disabled={!isEditing}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </div>

                {/* Action Footer */}
                {isEditing && (
                    <div className="mt-8 flex items-center justify-end gap-4 pt-6 border-t border-border">
                        <Button variant="ghost" onClick={handleCancel} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </section>
    );
}
