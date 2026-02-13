"use client";

import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Header, Footer, Breadcrumb } from "@/components/storefront";
import {
    AccountSidebar,
    ProfileInfoForm,
    SavedAddressesCard,
    PaymentMethodDisplayCard,
} from "@/components/account";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
    const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();

    // Fetch user data from Convex
    const convexUser = useQuery(api.users.getCurrentUser);
    const addresses = useQuery(api.addresses.listAddresses);

    // Mutations
    const updateProfile = useMutation(api.users.updateProfile);
    const addAddress = useMutation(api.addresses.addAddress);
    const updateAddress = useMutation(api.addresses.updateAddress);
    const deleteAddress = useMutation(api.addresses.deleteAddress);

    const breadcrumbItems = [
        { label: "Home", href: "/" },
        { label: "My Account", href: "/account" },
        { label: "Profile" },
    ];

    const handleSaveProfile = async (data: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    }) => {
        try {
            // Update Clerk first (for first/last name)
            if (clerkUser) {
                await clerkUser.update({
                    firstName: data.firstName,
                    lastName: data.lastName,
                });
            }

            // Update Convex extended profile
            await updateProfile({
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
            });
        } catch (error) {
            console.error("Error saving profile:", error);
        }
    };

    const handleImageChange = async (file: File) => {
        if (!clerkUser) return;
        try {
            await clerkUser.setProfileImage({ file });
        } catch (error) {
            console.error("Error updating profile image:", error);
            throw error;
        }
    };

    const handleImageRemove = async () => {
        if (!clerkUser) return;
        try {
            // Setting file to null removes the image in Clerk
            await clerkUser.setProfileImage({ file: null });
        } catch (error) {
            console.error("Error removing profile image:", error);
            throw error;
        }
    };

    const handleAddAddress = async () => {
        try {
            await addAddress({
                label: "New Address",
                type: "shipping",
                street: "",
                city: "",
                state: "",
                zipCode: "",
                country: "United States",
                isDefault: false,
                phone: undefined,
                recipientName: ""
            });
        } catch (error) {
            console.error("Error adding address:", error);
        }
    };

    const handleEditAddress = (id: string) => {
        console.log("Edit address:", id);
    };

    const handleDeleteAddress = async (id: string) => {
        try {
            await deleteAddress({ addressId: id as any });
        } catch (error) {
            console.error("Error deleting address:", error);
        }
    };

    const handleAddPayment = () => {
        console.log("Add payment method");
    };

    const handleManagePayments = () => {
        console.log("Manage payments");
    };

    // Loading state
    if (!isClerkLoaded || convexUser === undefined) {
        return (
            <>
                <Header />
                <main className="grow w-full max-w-[1280px] mx-auto px-4 md:px-10 py-8">
                    <div className="mb-6">
                        <Skeleton className="h-6 w-48" />
                    </div>
                    <div className="mb-8 space-y-2">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-5 w-96" />
                    </div>
                    <div className="flex flex-col lg:flex-row gap-8 items-start">
                        <Skeleton className="w-64 h-96" />
                        <div className="flex-1 w-full space-y-8">
                            <Skeleton className="h-64 w-full" />
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                <Skeleton className="h-48" />
                                <Skeleton className="h-48" />
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    // Not signed in
    if (!clerkUser) {
        return (
            <>
                <Header />
                <main className="grow w-full max-w-[1280px] mx-auto px-4 md:px-10 py-8">
                    <div className="text-center py-16">
                        <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
                        <p className="text-muted-foreground">
                            You need to be signed in to view your profile.
                        </p>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    // Build user data from Convex + Clerk
    const userData = {
        firstName: convexUser?.firstName ?? clerkUser.firstName ?? "",
        lastName: convexUser?.lastName ?? clerkUser.lastName ?? "",
        email: convexUser?.email ?? clerkUser.primaryEmailAddress?.emailAddress ?? "",
        phone: convexUser?.phone ?? "",
        avatar: convexUser?.avatarUrl ?? clerkUser.imageUrl,
        membershipLevel: convexUser?.tags?.includes("VIP") ? "VIP Member" : "Member",
        clerkId: clerkUser.id,
    };

    // Transform addresses for the component
    const savedAddresses = (addresses ?? []).map((addr) => ({
        id: addr._id,
        type: addr.type === "shipping" ? ("home" as const) : ("office" as const),
        label: addr.label,
        address: [addr.street, `${addr.city}, ${addr.state} ${addr.zipCode}`].filter(Boolean),
        isDefault: addr.isDefault,
    }));

    // Placeholder for payment (would come from Stripe/payment provider)
    const paymentCard = undefined;

    return (
        <>
            <Header />

            <main className="grow w-full max-w-[1280px] mx-auto px-4 md:px-10 py-8">
                {/* Breadcrumbs */}
                <div className="mb-6">
                    <Breadcrumb items={breadcrumbItems} />
                </div>

                {/* Page Title */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2">
                        My Account
                    </h1>
                    <p className="text-muted-foreground">
                        Manage your personal information, privacy settings, and security.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Sidebar */}
                    <AccountSidebar userName={userData.firstName || "User"} />

                    {/* Main Content */}
                    <div className="flex-1 w-full space-y-8">
                        {/* Personal Information */}
                        <ProfileInfoForm
                            user={userData}
                            onSave={handleSaveProfile}
                            onImageChange={handleImageChange}
                            onImageRemove={handleImageRemove}
                        />

                        {/* 2-Column: Addresses & Payment */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                            <SavedAddressesCard
                                addresses={savedAddresses}
                                onAddNew={handleAddAddress}
                                onEdit={handleEditAddress}
                                onDelete={handleDeleteAddress}
                            />
                            <PaymentMethodDisplayCard
                                card={paymentCard}
                                onAddNew={handleAddPayment}
                                onManage={handleManagePayments}
                            />
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}
