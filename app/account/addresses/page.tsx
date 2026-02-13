"use client";

import { useState, useEffect } from "react";
import { Plus, MapPin } from "lucide-react";
import { Header, Footer, Breadcrumb } from "@/components/storefront";
import { AccountSidebar } from "@/components/account";
import { AddressCard, type Address } from "@/components/account/AddressCard";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { countries } from "@/lib/country";

export default function AddressBookPage() {
    const rawAddresses = useQuery(api.addresses.listAddresses);
    const addAddress = useMutation(api.addresses.addAddress);
    const updateAddress = useMutation(api.addresses.updateAddress);
    const deleteAddress = useMutation(api.addresses.deleteAddress);
    const setDefaultAddress = useMutation(api.addresses.setDefaultAddress);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        label: "",
        type: "home",
        recipientName: "",
        phone: "",
        streetAddress: "",
        apartment: "",
        city: "",
        state: "",
        zipCode: "",
        country: "US",
    });

    // Mapped addresses for component
    const addresses: Address[] = (rawAddresses || []).map((addr: any) => ({
        id: addr._id,
        type: (addr.type === "home" || addr.type === "office" || addr.type === "other") ? addr.type : "home",
        label: addr.label,
        recipientName: addr.recipientName || "",
        phone: addr.phone,
        streetAddress: addr.street,
        apartment: addr.apartment,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode,
        country: addr.country,
        isDefault: addr.isDefault,
    }));

    const breadcrumbItems = [
        { label: "Home", href: "/" },
        { label: "My Account", href: "/account" },
        { label: "Address Book" },
    ];

    const resetForm = () => {
        setFormData({
            label: "",
            type: "home",
            recipientName: "",
            phone: "",
            streetAddress: "",
            apartment: "",
            city: "",
            state: "",
            zipCode: "",
            country: "US",
        });
        setEditingId(null);
    };

    const handleEdit = (id: string) => {
        const addr = rawAddresses?.find(a => a._id === id);
        if (addr) {
            setFormData({
                label: addr.label,
                type: addr.type,
                recipientName: addr.recipientName || "",
                phone: addr.phone || "",
                streetAddress: addr.street,
                apartment: addr.apartment || "",
                city: addr.city,
                state: addr.state,
                zipCode: addr.zipCode,
                country: addr.country,
            });
            setEditingId(id);
            setIsDialogOpen(true);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this address?")) {
            await deleteAddress({ addressId: id as any });
        }
    };

    const handleSetDefault = async (id: string) => {
        await setDefaultAddress({ addressId: id as any });
    };

    const handleAddNew = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateAddress({
                    addressId: editingId as any,
                    label: formData.label,
                    type: formData.type,
                    recipientName: formData.recipientName,
                    phone: formData.phone,
                    street: formData.streetAddress,
                    apartment: formData.apartment,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipCode,
                    country: formData.country,
                });
            } else {
                await addAddress({
                    label: formData.label,
                    type: formData.type,
                    recipientName: formData.recipientName,
                    phone: formData.phone,
                    street: formData.streetAddress,
                    apartment: formData.apartment,
                    city: formData.city,
                    state: formData.state,
                    zipCode: formData.zipCode,
                    country: formData.country,
                    isDefault: addresses.length === 0, // First address is default
                });
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error(error);
            alert("Failed to save address");
        }
    };

    return (
        <>
            <Header />

            <div className="grow w-full max-w-7xl mx-auto px-4 md:px-10 py-8">
                {/* Breadcrumbs */}
                <div className="mb-6">
                    <Breadcrumb items={breadcrumbItems} />
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
                    {/* Sidebar */}
                    <AccountSidebar userName="User" />

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        {/* Page Header */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight mb-2">Address Book</h2>
                                <p className="text-muted-foreground">
                                    Manage your shipping and billing addresses
                                </p>
                            </div>
                            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                                setIsDialogOpen(open);
                                if (!open) resetForm();
                            }}>
                                <DialogTrigger asChild>
                                    <Button onClick={handleAddNew} className="gap-2">
                                        <Plus className="size-4" />
                                        Add New Address
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle>{editingId ? "Edit Address" : "Add New Address"}</DialogTitle>
                                        <DialogDescription>
                                            Enter your address details below.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="label">Address Label</Label>
                                                <Input
                                                    id="label"
                                                    placeholder="e.g., Home, Office"
                                                    value={formData.label}
                                                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="type">Type</Label>
                                                <Select
                                                    value={formData.type}
                                                    onValueChange={(val) => setFormData({ ...formData, type: val })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="home">Home</SelectItem>
                                                        <SelectItem value="office">Office</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="recipientName">Recipient Name</Label>
                                            <Input
                                                id="recipientName"
                                                placeholder="Full name"
                                                value={formData.recipientName}
                                                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                placeholder="+1 (555) 000-0000"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="streetAddress">Street Address</Label>
                                            <Input
                                                id="streetAddress"
                                                placeholder="123 Main St"
                                                value={formData.streetAddress}
                                                onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="apartment">Apartment, Suite, etc. (optional)</Label>
                                            <Input
                                                id="apartment"
                                                placeholder="Apt 4B"
                                                value={formData.apartment}
                                                onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="city">City</Label>
                                                <Input
                                                    id="city"
                                                    placeholder="City"
                                                    value={formData.city}
                                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="state">State</Label>
                                                <Input
                                                    id="state"
                                                    placeholder="State"
                                                    value={formData.state}
                                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="zipCode">Zip Code</Label>
                                                <Input
                                                    id="zipCode"
                                                    placeholder="00000"
                                                    value={formData.zipCode}
                                                    onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="country">Country</Label>
                                                <Select
                                                    value={formData.country}
                                                    onValueChange={(val) => setFormData({ ...formData, country: val })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Country" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {countries.map((c) => (
                                                            <SelectItem key={c.code} value={c.code}>
                                                                {c.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-3 pt-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsDialogOpen(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button type="submit">{editingId ? "Save Changes" : "Save Address"}</Button>
                                        </div>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Address Grid */}
                        {rawAddresses === undefined ? (
                            <div className="py-10 text-center text-muted-foreground">Loading addresses...</div>
                        ) : addresses.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {addresses.map((address) => (
                                    <AddressCard
                                        key={address.id}
                                        address={address}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onSetDefault={handleSetDefault}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-xl border border-border">
                                <MapPin className="size-16 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-bold text-foreground mb-2">No addresses saved</h3>
                                <p className="text-muted-foreground mb-6 max-w-md">
                                    Add your first address to make checkout faster.
                                </p>
                                <Button onClick={handleAddNew} className="gap-2">
                                    <Plus className="size-4" />
                                    Add Your First Address
                                </Button>
                            </div>
                        )}

                        {/* Info Card */}
                        <div className="mt-10 p-6 bg-secondary/30 rounded-xl border border-border">
                            <h3 className="font-bold text-foreground mb-2">Shipping Information</h3>
                            <p className="text-sm text-muted-foreground">
                                Your default address will be pre-selected during checkout. You can always change
                                the shipping address at checkout or add a new one.
                            </p>
                        </div>
                    </main>
                </div>
            </div>

            <Footer />
        </>
    );
}
