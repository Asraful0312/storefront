"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, ShoppingBag, RotateCcw, Heart, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@clerk/clerk-react";
import UserIcon from "../ui/user-icon";
import { useEffect, useRef } from "react";
import { AnimatedIconHandle } from "../ui/types";
import RefreshIcon from "../ui/refresh-icon";
import HeartIcon from "../ui/heart-icon";
import ShoppingBagIcon from "../ui/shopping-bag-icon";
import MapPinIcon from "../ui/map-pin-icon";

interface AccountSidebarProps {
    userName: string;
}

const navItems = [
    { id: "profile", label: "Profile", icon: UserIcon, href: "/account/profile" },
    { id: "addresses", label: "Address Book", icon: MapPinIcon, href: "/account/addresses" },
    { id: "orders", label: "Orders", icon: ShoppingBagIcon, href: "/account/orders" },
    { id: "returns", label: "Returns", icon: RefreshIcon, href: "/account/returns" },
    { id: "wishlist", label: "Wishlist", icon: HeartIcon, href: "/account/wishlist" },
];

export function AccountSidebar({ userName }: AccountSidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="w-full lg:w-64 shrink-0">
            <div className="sticky top-24 bg-card rounded-xl shadow-sm p-6 border border-border">
                <div className="mb-6">
                    <h1 className="text-lg font-bold mb-1">My Account</h1>
                    <p className="text-muted-foreground text-sm">Welcome back, {userName}</p>
                </div>

                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                        const Icon = item.icon;

                        return (
                            <SidebarItem
                                key={item.id}
                                icon={Icon}
                                isAnimated={true}
                                item={item}
                                isActive={isActive}
                            />
                        );
                    })}

                    <div className="h-px bg-border my-2" />


                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full">
                        <LogOut className="size-5" />
                        <SignOutButton />
                    </div>
                </nav>
            </div>
        </aside>
    );
}


const SidebarItem = ({
    icon: Icon,
    isAnimated = true,
    item,
    isActive,
}: any) => {
    const ref = useRef<AnimatedIconHandle>(null);

    const handleMouseEnter = () => {
        if (isAnimated) {
            ref.current?.startAnimation();
        }
    };

    const handleMouseLeave = () => {
        if (isAnimated) {
            ref.current?.stopAnimation();
        }
    };

    useEffect(() => {
        if (!isAnimated) {
            ref.current?.stopAnimation();
        }
    }, [isAnimated]);

    return (
        <Link
            key={item.id}
            href={item.href}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-primary"
            )}
        >
            <Icon className="size-5" ref={ref} disableHover={!isAnimated} />
            <span className="text-sm font-medium">{item.label}</span>
        </Link>
    );
};