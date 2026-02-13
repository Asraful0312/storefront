"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AdminSidebar } from "@/components/admin";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const convexUser = useQuery(api.users.getCurrentUser);

    // Check if loading or user not found yet
    const isLoading = convexUser === undefined;

    // Check if user is admin
    const isAdmin = convexUser?.role === "admin";

    // Hide admin sidebar on settings pages (settings has its own sidebar)
    const isSettingsPage = pathname?.startsWith("/admin/settings");

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="size-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Verifying access...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background p-4">
                <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 shadow-sm flex flex-col items-center text-center gap-4">
                    <div className="size-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                        <ShieldAlert className="size-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
                    <p className="text-muted-foreground">
                        You do not have permission to view this area. This section is restricted to administrators only.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                        <Button variant="outline" onClick={() => router.back()}>
                            Go Back
                        </Button>
                        <Button asChild>
                            <Link href="/">Go Home</Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (isSettingsPage) {
        // Settings pages use their own layout with settings sidebar
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <AdminSidebar />
            <main className="flex-1 flex flex-col h-full overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
