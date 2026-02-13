"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Heart, ShoppingBag, User, Menu } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { UserButton, SignInButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { MegaMenu, MobileMenu } from "@/components/storefront/MegaMenu";
import { SearchBar } from "@/components/storefront/SearchBar";
import { useCart } from "@/hooks/useCart";

const navLinks = [
    // Shop is now handled by MegaMenu
    { href: "/about", label: "About" },
    { href: "/stories", label: "Stories" },
    { href: "/contact", label: "Contact" },
];

export function Header() {
    const { count } = useCart();
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const { isSignedIn, user: currentUser } = useUser();
    const convexUser = useQuery(api.users.getCurrentUser);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur-sm">
            <div className="px-4 md:px-8 lg:px-12 xl:px-40 py-3">
                <div className="flex items-center justify-between gap-4">
                    {/* Logo & Brand */}
                    <div className="flex items-center gap-2 lg:gap-8">
                        <Link href="/" className="flex items-center gap-2 text-foreground group">
                            <div className="size-8 text-primary">
                                <svg
                                    className="transition-transform group-hover:scale-110"
                                    fill="currentColor"
                                    viewBox="0 0 48 48"
                                >
                                    <path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" />
                                </svg>
                            </div>
                            <h2 className="hidden md:block text-xl font-bold leading-tight tracking-tight">
                                Lumina
                            </h2>
                        </Link>

                        {/* Desktop Nav Links */}
                        <nav className="hidden lg:flex items-center gap-8 pl-4">
                            <MegaMenu />
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="text-sm font-medium hover:text-primary transition-colors"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            {convexUser?.role === "admin" && (
                                <Link
                                    href="/admin"
                                    className="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                                >
                                    <span className="relative flex h-2 w-2 mr-1">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                    </span>
                                    Admin Dashboard
                                </Link>
                            )}
                        </nav>
                    </div>

                    {/* Search & Actions */}
                    <div className="flex flex-1 items-center justify-end gap-4 lg:gap-8">
                        {/* Search Bar */}
                        <div className="hidden md:flex w-full max-w-sm">
                            <SearchBar />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-10 rounded-full hover:bg-secondary"
                            >
                                <Heart className="size-6" />
                            </Button>

                            <Link
                                href='/cart'
                                className={buttonVariants({
                                    className: "relative size-10 rounded-full hover:bg-secondary",
                                    variant: "ghost",
                                    size: "icon"
                                })}
                            >
                                <ShoppingBag className="size-6" />
                                {count > 0 && (
                                    <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary ring-2 ring-card flex items-center justify-center text-[10px] font-bold text-primary-foreground min-w-[16px] min-h-[16px] -mr-1 -mt-1 px-0.5">
                                        {count}
                                    </span>
                                )}
                            </Link>

                            {/* User Button */}
                            {isSignedIn ? (
                                <Link href='/account/profile' className={buttonVariants({
                                    className: "relative size-10 rounded-full hover:bg-secondary",
                                    variant: "ghost",
                                    size: "icon"
                                })} >
                                    {currentUser?.imageUrl ? (
                                        <Image src={currentUser?.imageUrl} alt="User" width={32} height={32} className="size-8 rounded-full ring-2 ring-primary" />
                                    ) : (
                                        <User className="size-6" />
                                    )}
                                </Link>
                            ) : (
                                <SignInButton mode="modal">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="hidden sm:flex size-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                                    >
                                        <User className="size-6" />
                                    </Button>
                                </SignInButton>
                            )}

                            {/* Mobile Menu Toggle */}
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="lg:hidden size-10 rounded-full hover:bg-secondary"
                                    >
                                        <Menu className="size-6" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[300px] sm:w-[350px] overflow-y-auto">
                                    <div className="flex flex-col gap-6 pt-6">
                                        {/* Mobile Search */}
                                        <div className="relative mt-6">
                                            <SearchBar
                                                className="w-full max-w-none"
                                                onClose={() => {

                                                }}
                                            />
                                        </div>

                                        {convexUser?.role === "admin" && (
                                            <Link
                                                href="/admin"
                                                className="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 px-4"
                                            >
                                                <span className="relative flex h-2 w-2 mr-1">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                                </span>
                                                Admin Dashboard
                                            </Link>
                                        )}

                                        {/* Mobile Nav Links */}
                                        <nav className="flex flex-col gap-2">
                                            {/* Mobile Mega Menu */}
                                            <MobileMenu />

                                            {navLinks.map((link) => (
                                                <SheetClose asChild key={link.href}>
                                                    <Link
                                                        href={link.href}
                                                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-lg font-medium hover:bg-secondary transition-colors"
                                                    >
                                                        {link.label}
                                                    </Link>
                                                </SheetClose>
                                            ))}
                                        </nav>

                                        {/* Mobile Actions */}
                                        <div className="flex flex-col gap-2 pt-4 border-t border-border">
                                            <SheetClose asChild>
                                                <Link
                                                    href="/wishlist"
                                                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors"
                                                >
                                                    <Heart className="size-5" />
                                                    <span>Wishlist</span>
                                                </Link>
                                            </SheetClose>
                                            <SheetClose asChild>
                                                <Link
                                                    href="/cart"
                                                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-secondary transition-colors"
                                                >
                                                    <ShoppingBag className="size-5" />
                                                    <span>Cart</span>
                                                    <span className="ml-auto size-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                                                        2
                                                    </span>
                                                </Link>
                                            </SheetClose>
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

