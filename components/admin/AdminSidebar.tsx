"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    ShoppingCart,
    LogOut,
    Store,
} from "lucide-react";
import { cn } from "@/lib/utils";
import LayoutDashboardIcon from "../ui/layout-dashboard-icon";
import GearIcon from "../ui/gear-icon";
import ChartHistogramIcon from "../ui/chart-histogram-icon";
import UsersIcon from "../ui/users-icon";
import ShoppingCartIcon from "../ui/shopping-cart-icon";
import PackageIcon from "../ui/package-icon";
import MegaphoneIcon from "../ui/megaphone-icon";
import { useEffect, useRef } from "react";
import { AnimatedIconHandle } from "../ui/types";
import ArrowDownAZIcon from "../ui/arrow-down-a-z-icon";
import WorldIcon from "../ui/world-icon";
import PenIcon from "../ui/pen-icon";

const navItems = [
    { id: "site", label: "Site", icon: WorldIcon, href: "/" },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboardIcon, href: "/admin" },
    { id: "products", label: "Products", icon: PackageIcon, href: "/admin/products" },
    { id: "orders", label: "Orders", icon: ShoppingCartIcon, href: "/admin/orders" },
    { id: "customers", label: "Customers", icon: UsersIcon, href: "/admin/customers" },
    { id: "reviews", label: "Reviews", icon: PenIcon, href: "/admin/reviews" },
    { id: "analytics", label: "Analytics", icon: ChartHistogramIcon, href: "/admin/analytics" },
    { id: "marketing", label: "Marketing", icon: MegaphoneIcon, href: "/admin/marketing" },
    { id: "content", label: "Content", icon: ArrowDownAZIcon, href: "/admin/content/hero-slides" },
    { id: "settings", label: "Settings", icon: GearIcon, href: "/admin/settings" },
];

interface AdminSidebarProps {
    adminName?: string;
    adminAvatar?: string;
}

export function AdminSidebar({ adminName = "Store Admin", adminAvatar }: AdminSidebarProps) {
    const pathname = usePathname();

    return (
        <aside className="w-64 shrink-0 border-r border-border bg-card hidden md:flex flex-col h-full">
            <div className="p-6 flex flex-col gap-6 h-full">
                {/* Store/Admin Profile */}
                <div className="flex gap-3 items-center">
                    {adminAvatar ? (
                        <div
                            className="size-12 rounded-full bg-cover bg-center shrink-0 border border-border"
                            style={{ backgroundImage: `url('${adminAvatar}')` }}
                        />
                    ) : (
                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <Store className="size-6" />
                        </div>
                    )}
                    <div className="flex flex-col overflow-hidden">
                        <h1 className="text-foreground text-base font-bold leading-normal truncate">
                            {adminName}
                        </h1>
                        <p className="text-muted-foreground text-sm font-normal leading-normal truncate">
                            Manage Store
                        </p>
                    </div>

                </div>

                {/* Nav Links */}
                <nav className="flex flex-col gap-1 flex-1">
                    {navItems.map((item) => {
                        const isActive =
                            pathname === item.href ||
                            (item.href !== "/admin" && pathname?.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <SidebarItem
                                key={item.id}
                                href={item.href}
                                icon={Icon}
                                label={item.label}
                                item={item}
                                isActive={isActive}
                            />
                        );
                    })}
                </nav>

                {/* Footer/Logout */}
                <div className="mt-auto">
                    <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-red-500 transition-colors w-full">
                        <LogOut className="size-6" />
                        <p className="text-sm font-medium leading-normal">Log Out</p>
                    </button>
                </div>
            </div>
        </aside>
    );
}


const SidebarItem = ({
    icon: Icon,
    label,
    href,
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
               item.href !== '/' && isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
        >
            <Icon className="size-6" ref={ref} disableHover={!isAnimated} />
            <p
                className={cn(
                    "text-sm leading-normal",
                    isActive ? "font-semibold" : "font-medium"
                )}
            >
                {item.label}
            </p>
        </Link>
    );
};