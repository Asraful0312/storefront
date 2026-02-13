"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Lock, Truck, Tag, X, Loader2 } from "lucide-react";
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
import { createClerkUser, type CreateUserData } from "../actions/user-actions";

export default function AddNewCustomerPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [sendInvitation, setSendInvitation] = useState(true);

    // Address state
    const [street, setStreet] = useState("");
    const [city, setCity] = useState("");
    const [state, setState] = useState("");
    const [zipCode, setZipCode] = useState("");
    const [country, setCountry] = useState("us");

    // Tags and notes
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [notes, setNotes] = useState("");

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

    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
        let newPassword = "";
        for (let i = 0; i < 12; i++) {
            newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setPassword(newPassword);
    };

    const handleSubmit = async () => {
        // Validate required fields
        if (!firstName.trim() || !email.trim()) {
            setError("First name and email are required");
            return;
        }

        if (!sendInvitation && !password) {
            setError("Password is required when not sending an invitation");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const userData: CreateUserData = {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                phone: phone.trim() || undefined,
                password: sendInvitation ? undefined : password,
                sendInvitation,
                tags: tags.length > 0 ? tags : undefined,
                notes: notes.trim() || undefined,
                role: "customer",
            };

            const result = await createClerkUser(userData);

            if (result.success) {
                router.push(`/admin/customers/${result.userId}`);
            } else {
                setError(result.error || "Failed to create customer");
            }
        } catch (err) {
            setError("An unexpected error occurred");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

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
                    <span className="text-primary text-sm font-semibold">Add New Customer</span>
                </nav>

                {/* Page Heading */}
                <div className="flex flex-wrap justify-between items-center gap-3 py-6">
                    <div>
                        <h1 className="text-foreground text-3xl font-black leading-tight tracking-tight">
                            Add New Customer
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Create a new customer profile and manage their account access.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" asChild>
                            <Link href="/admin/customers">Cancel</Link>
                        </Button>
                        <Button
                            className="shadow-lg shadow-primary/20"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Customer"
                            )}
                        </Button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                {/* Two-Column Form Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="flex flex-col gap-6">
                        {/* Personal Information Card */}
                        <section className="bg-card rounded-xl border border-border p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <User className="size-5 text-primary" />
                                <h2 className="text-foreground text-xl font-bold">Personal Information</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold">First Name *</Label>
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
                                    <Label className="text-sm font-semibold">Email Address *</Label>
                                    <Input
                                        type="email"
                                        placeholder="m.scott@dundermifflin.com"
                                        className="h-12"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
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

                        {/* Account Settings Card */}
                        <section className="bg-card rounded-xl border border-border p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <Lock className="size-5 text-primary" />
                                <h2 className="text-foreground text-xl font-bold">Account Settings</h2>
                            </div>
                            <div className="flex flex-col gap-5">
                                <div className="flex items-center justify-between py-2">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm font-semibold text-foreground">Send Invitation Email</span>
                                        <span className="text-xs text-muted-foreground">
                                            Send a welcome email with instructions to set their own password.
                                        </span>
                                    </div>
                                    <Switch checked={sendInvitation} onCheckedChange={setSendInvitation} />
                                </div>
                                {!sendInvitation && (
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-semibold">Password *</Label>
                                        <div className="relative">
                                            <Input
                                                type="password"
                                                placeholder="••••••••"
                                                className="h-12 pr-24"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <button
                                                onClick={generatePassword}
                                                type="button"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary text-xs font-bold hover:underline uppercase tracking-wider"
                                            >
                                                Generate
                                            </button>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            At least 8 characters, one number and one special character.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column */}
                    <div className="flex flex-col gap-6">
                        {/* Initial Shipping Address Card */}
                        <section className="bg-card rounded-xl border border-border p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <Truck className="size-5 text-primary" />
                                <h2 className="text-foreground text-xl font-bold">Initial Shipping Address</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5 col-span-2">
                                    <Label className="text-sm font-semibold">Street Address</Label>
                                    <Input
                                        placeholder="1725 Slough Avenue"
                                        className="h-12"
                                        value={street}
                                        onChange={(e) => setStreet(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold">City</Label>
                                    <Input
                                        placeholder="Scranton"
                                        className="h-12"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold">State / Province</Label>
                                    <Input
                                        placeholder="Pennsylvania"
                                        className="h-12"
                                        value={state}
                                        onChange={(e) => setState(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold">Zip / Postal Code</Label>
                                    <Input
                                        placeholder="18505"
                                        className="h-12"
                                        value={zipCode}
                                        onChange={(e) => setZipCode(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold">Country</Label>
                                    <Select value={country} onValueChange={setCountry}>
                                        <SelectTrigger className="h-12">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="us">United States</SelectItem>
                                            <SelectItem value="ca">Canada</SelectItem>
                                            <SelectItem value="uk">United Kingdom</SelectItem>
                                            <SelectItem value="de">Germany</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </section>

                        {/* Organization & Notes Card */}
                        <section className="bg-card rounded-xl border border-border p-6 shadow-sm">
                            <div className="flex items-center gap-2 mb-6">
                                <Tag className="size-5 text-primary" />
                                <h2 className="text-foreground text-xl font-bold">Organization & Internal Info</h2>
                            </div>
                            <div className="flex flex-col gap-5">
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
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-semibold">Admin Notes</Label>
                                    <Textarea
                                        className="resize-none"
                                        placeholder="Add internal notes about this customer..."
                                        rows={4}
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        These notes are private and only visible to administrative staff.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer Action (Mobile/Tablet) */}
                <div className="mt-8 pt-6 border-t border-border flex justify-end gap-3 lg:hidden">
                    <Button variant="outline" asChild>
                        <Link href="/admin/customers">Cancel</Link>
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="size-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Customer"
                        )}
                    </Button>
                </div>
            </div>
        </main>
    );
}
