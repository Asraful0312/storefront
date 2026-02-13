"use client"

import { useState } from "react";
import Link from "next/link";
import { Search, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import {
    Settings,
    Store,
    CreditCard,
    Truck,
    Receipt,
    Bell,
    HelpCircle,
    LogOut,
    Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

const settingsNavItems = [
    { id: "general", label: "General", icon: Settings, href: "/admin/settings" },
    { id: "payments", label: "Payments & Shipping", icon: CreditCard, href: "/admin/settings/payments" },
    { id: "notifications", label: "Notifications", icon: Bell, href: "/admin/settings/notifications" },
];


export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isActive = (href: string) => pathname === href;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const SidebarContent = () => (
        <>
            <div>
                <h3 className="px-4 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                    Store Management
                </h3>
                <nav className="flex flex-col gap-1">
                    {settingsNavItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
                                    active
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "hover:bg-secondary text-muted-foreground"
                                )}
                            >
                                <Icon className={cn("size-5", active && "fill-current")} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="mt-auto">
                <nav className="flex flex-col gap-1">
                    <Link
                        href="#"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                    >
                        <HelpCircle className="size-5" />
                        <span>Help Center</span>
                    </Link>
                    <Link
                        href="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                    >
                        <LogOut className="size-5" />
                        <span>Logout</span>
                    </Link>
                </nav>
            </div>
        </>
    );

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Top Navigation Bar */}
            <header className="flex items-center justify-between whitespace-nowrap border-b border-border bg-card px-4 md:px-6 py-3 sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Button */}
                    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="size-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72 p-0">
                            <SheetHeader className="p-4 border-b border-border">
                                <SheetTitle className="flex items-center gap-3">
                                    <div className="size-8 text-primary">
                                        <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                            <path
                                                clipRule="evenodd"
                                                d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z"
                                                fillRule="evenodd"
                                            />
                                            <path
                                                clipRule="evenodd"
                                                d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z"
                                                fillRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                    <span className="font-bold">Settings</span>
                                </SheetTitle>
                            </SheetHeader>
                            <div className="flex flex-col gap-8 py-6 px-4 h-[calc(100%-60px)]">
                                <SidebarContent />
                            </div>
                        </SheetContent>
                    </Sheet>

                    <Link href="/admin" className="flex items-center gap-4">
                        <div className="size-8 text-primary hidden md:block">
                            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    clipRule="evenodd"
                                    d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z"
                                    fillRule="evenodd"
                                />
                                <path
                                    clipRule="evenodd"
                                    d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z"
                                    fillRule="evenodd"
                                />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">E-Shop Admin</h2>
                    </Link>
                </div>
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="hidden md:flex relative min-w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input placeholder="Search settings..." className="pl-10 h-10 bg-secondary border-none" />
                    </div>
                    <div className="flex gap-2 md:gap-3">
                        <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-secondary hover:bg-secondary/80">
                            <Bell className="size-5 text-foreground" />
                        </button>
                        <button className="hidden sm:flex items-center justify-center rounded-lg h-10 w-10 bg-secondary hover:bg-secondary/80">
                            <HelpCircle className="size-5 text-foreground" />
                        </button>
                    </div>
                    <div className="size-10 rounded-full border-2 border-primary overflow-hidden">
                        <img
                            alt="User"
                            className="w-full h-full object-cover"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBV_OY_f9MQWlyfo7gQ-LbF0VHD_hn3KHJFmvZ7HfIe6Yyyw7Ni2kD7b47Xq-4YEAFKlzLVbcDCnU6ZidgPbtDCwVmOR8PdofgEqleLDGJfORfN0BsG0TaXvJqi4dLqpF-7xFHF1dYfgyNxME4Qx-P-dDPdZUNEzcOBnCmEsNS-cnCKFmzNtLCtiq7XN4_lVM8KDCLF4VGbPSaY2A62FeYICDw2JuWX_Iw-sxE9oXWpDFvT5OCn4LFAL5aqphEo-wRNHJsZjWpvF3E"
                        />
                    </div>
                </div>
            </header>

            {/* Main Content - No Admin Sidebar */}
            <div className="flex-1 flex w-full">
                {/* Settings Sidebar Navigation - Desktop Only */}
                <aside className="w-72 hidden md:flex flex-col border-r border-border py-8 px-4 gap-8">
                    <SidebarContent />
                </aside>
                {children}
            </div>
        </div>
    );
}
