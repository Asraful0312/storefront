"use client";

import { use, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { User, Camera, Tag, X, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { updateClerkUser, updateClerkUserImage, removeClerkUserImage } from "../../actions/update-user-actions";

export default function EditCustomerPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const resolvedParams = use(params);
    const userId = resolvedParams.id as Id<"users">;
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch data from Convex
    const customer = useQuery(api.users.getUserById, { userId });
    const addresses = useQuery(api.addresses.getAddressesForUser, { userId });

    // Mutations
    const updateProfile = useMutation(api.users.updateProfile);
    const updateUserAdminInfo = useMutation(api.users.updateUserAdminInfo);

    // Form state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState<"customer" | "admin">("customer");
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    // Tags and notes
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [notes, setNotes] = useState("");

    // Initialize form when customer data loads
    useEffect(() => {
        if (customer) {
            setFirstName(customer.firstName ?? "");
            setLastName(customer.lastName ?? "");
            setPhone(customer.phone ?? "");
            setRole(customer.role);
            setAvatarUrl(customer.avatarUrl ?? null);
            setTags(customer.tags ?? []);
            setNotes(customer.notes ?? "");
        }
    }, [customer]);

    const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatarPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = async () => {
        if (!customer?.clerkId) return;

        setIsUploadingImage(true);
        try {
            const result = await removeClerkUserImage(customer.clerkId);
            if (result.success) {
                setAvatarUrl(null);
                setAvatarPreview(null);
                setAvatarFile(null);
            } else {
                setError(result.error || "Failed to remove image");
            }
        } catch (err) {
            setError("Failed to remove image");
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleSubmit = async () => {
        if (!customer) return;

        setIsSubmitting(true);
        setError(null);
        setSuccess(false);

        try {
            // Upload new image if selected
            if (avatarFile && customer.clerkId) {
                setIsUploadingImage(true);
                const imageResult = await updateClerkUserImage(customer.clerkId, avatarFile);
                if (!imageResult.success) {
                    setError(imageResult.error || "Failed to upload image");
                    setIsSubmitting(false);
                    setIsUploadingImage(false);
                    return;
                }
                setIsUploadingImage(false);
            }

            // Update Clerk user
            const clerkResult = await updateClerkUser({
                clerkId: customer.clerkId,
                firstName,
                lastName,
            });

            if (!clerkResult.success) {
                setError(clerkResult.error || "Failed to update user");
                setIsSubmitting(false);
                return;
            }

            // Update Convex user admin info
            await updateUserAdminInfo({
                userId,
                tags,
                notes,
            });

            setSuccess(true);
            setTimeout(() => {
                router.push(`/admin/customers/${userId}`);
            }, 1000);
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading state
    if (customer === undefined) {
        return (
            <main className="flex-1 flex justify-center py-8">
                <div className="flex flex-col max-w-[1100px] w-full px-6">
                    <Skeleton className="h-6 w-48 mb-6" />
                    <Skeleton className="h-10 w-64 mb-8" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <Skeleton className="h-96" />
                        <Skeleton className="h-96" />
                    </div>
                </div>
            </main>
        );
    }

    // Not found
    if (customer === null) {
        return (
            <main className="flex-1 flex justify-center py-8">
                <div className="text-center py-16">
                    <h1 className="text-2xl font-bold mb-4">Customer Not Found</h1>
                    <Button asChild>
                        <Link href="/admin/customers">
                            <ArrowLeft className="size-4 mr-2" />
                            Back to Customers
                        </Link>
                    </Button>
                </div>
            </main>
        );
    }

    const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Unknown";
    const displayImage = avatarPreview || avatarUrl;

    return (
        <main className="flex-1 flex justify-center py-8">
            <div className="flex flex-col max-w-[1100px] w-full px-6">
                {/* Breadcrumbs */}
                <nav className="flex flex-wrap gap-2 py-2">
                    <Link href="/admin" className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors">
                        Dashboard
                    </Link>
                    <span className="text-muted-foreground text-sm font-medium">/</span>
                    <Link href="/admin/customers" className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors">
                        Customers
                    </Link>
                    <span className="text-muted-foreground text-sm font-medium">/</span>
                    <Link href={`/admin/customers/${userId}`} className="text-muted-foreground text-sm font-medium hover:text-primary transition-colors">
                        {fullName}
                    </Link>
                    <span className="text-muted-foreground text-sm font-medium">/</span>
                    <span className="text-primary text-sm font-semibold">Edit</span>
                </nav>

                {/* Page Heading */}
                <div className="flex flex-wrap justify-between items-center gap-3 py-6">
                    <div>
                        <h1 className="text-foreground text-3xl font-black leading-tight tracking-tight">
                            Edit Customer
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Update customer profile information and settings.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" asChild>
                            <Link href={`/admin/customers/${userId}`}>Cancel</Link>
                        </Button>
                        <Button
                            className="shadow-lg shadow-primary/20"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </div>

                {/* Error/Success Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                        Customer updated successfully! Redirecting...
                    </div>
                )}

                {/* Two-Column Form Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="flex flex-col gap-6">
                        {/* Profile Image Card */}
                        <section className="bg-card rounded-xl border border-border p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <Camera className="size-5 text-primary" />
                                <h2 className="text-foreground text-xl font-bold">Profile Image</h2>
                            </div>
                            <div className="flex items-center gap-6">
                                <div
                                    className="relative size-24 rounded-xl bg-primary/10 bg-cover bg-center flex items-center justify-center text-primary text-3xl font-bold overflow-hidden"
                                    style={displayImage ? { backgroundImage: `url('${displayImage}')` } : {}}
                                >
                                    {!displayImage && (fullName.charAt(0) || "?")}
                                    {isUploadingImage && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Loader2 className="size-6 text-white animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploadingImage}
                                    >
                                        Change Image
                                    </Button>
                                    {displayImage && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={handleRemoveImage}
                                            disabled={isUploadingImage}
                                        >
                                            <Trash2 className="size-4 mr-1" />
                                            Remove
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Personal Information Card */}
                        <section className="bg-card rounded-xl border border-border p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <User className="size-5 text-primary" />
                                <h2 className="text-foreground text-xl font-bold">Personal Information</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold">First Name</Label>
                                    <Input
                                        placeholder="e.g. Michael"
                                        className="h-12"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold">Last Name</Label>
                                    <Input
                                        placeholder="e.g. Scott"
                                        className="h-12"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <Label className="text-sm font-semibold">Email Address</Label>
                                    <Input
                                        type="email"
                                        className="h-12 bg-secondary/50"
                                        value={customer.email}
                                        disabled
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Email cannot be changed from here.
                                    </p>
                                </div>
                                <div className="space-y-1.5 col-span-2">
                                    <Label className="text-sm font-semibold">Phone Number</Label>
                                    <Input
                                        type="tel"
                                        placeholder="+1 (555) 000-0000"
                                        className="h-12"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-6">
                        {/* Role & Tags Card */}
                        <section className="bg-card rounded-xl border border-border p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <Tag className="size-5 text-primary" />
                                <h2 className="text-foreground text-xl font-bold">Role & Organization</h2>
                            </div>
                            <div className="flex flex-col gap-5">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold">User Role</Label>
                                    <Select value={role} onValueChange={(v) => setRole(v as "customer" | "admin")}>
                                        <SelectTrigger className="h-12">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="customer">Customer</SelectItem>
                                            <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold">Internal Tags</Label>
                                    <div className="flex flex-wrap gap-2 p-3 border border-border rounded-lg min-h-[48px] items-center">
                                        {tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded flex items-center gap-1"
                                            >
                                                {tag}
                                                <button onClick={() => removeTag(tag)}>
                                                    <X className="size-3 cursor-pointer" />
                                                </button>
                                            </span>
                                        ))}
                                        <input
                                            className="border-none focus:ring-0 focus:outline-none text-sm p-0 w-24 bg-transparent placeholder:text-muted-foreground"
                                            placeholder="Add tag..."
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={handleAddTag}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Notes Card */}
                        <section className="bg-card rounded-xl border border-border p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <User className="size-5 text-primary" />
                                <h2 className="text-foreground text-xl font-bold">Admin Notes</h2>
                            </div>
                            <Textarea
                                className="resize-none min-h-32"
                                placeholder="Add internal notes about this customer..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                            <p className="text-[11px] text-muted-foreground mt-2">
                                These notes are private and only visible to administrative staff.
                            </p>
                        </section>
                    </div>
                </div>

                {/* Footer Action (Mobile/Tablet) */}
                <div className="mt-8 pt-6 border-t border-border flex justify-end gap-3 lg:hidden">
                    <Button variant="outline" asChild>
                        <Link href={`/admin/customers/${userId}`}>Cancel</Link>
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="size-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </div>
            </div>
        </main>
    );
}
