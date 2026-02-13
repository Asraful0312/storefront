"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Instagram, Twitter, Facebook } from "lucide-react";

const shopLinks = [
    { href: "/new-arrivals", label: "New Arrivals" },
    { href: "/best-sellers", label: "Best Sellers" },
    { href: "/living-room", label: "Living Room" },
    { href: "/decor", label: "Decor & Accessories" },
    { href: "/sale", label: "Sale" },
];

const supportLinks = [
    { href: "/help", label: "Help Center" },
    { href: "/shipping", label: "Shipping & Returns" },
    { href: "/size-guide", label: "Size Guide" },
    { href: "/contact", label: "Contact Us" },
];

export function Footer() {
    const handleNewsletterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Newsletter logic here
        console.log("Newsletter signup submitted");
    };

    return (
        <footer className="bg-[#1a1512] text-white py-12 sm:py-16 px-4 md:px-8 lg:px-12 xl:px-40">
            <div className="max-w-[1440px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
                {/* Brand Column */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <div className="size-6 text-primary">
                            <svg fill="currentColor" viewBox="0 0 48 48">
                                <path d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold">Lumina</h2>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Bringing warmth and modern design to your home since 2023. Carefully
                        curated for comfort.
                    </p>
                    <div className="flex gap-4 mt-2">
                        <Link
                            href="https://facebook.com"
                            className="text-gray-400 hover:text-primary transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Facebook className="size-5" />
                        </Link>
                        <Link
                            href="https://twitter.com"
                            className="text-gray-400 hover:text-primary transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Twitter className="size-5" />
                        </Link>
                        <Link
                            href="https://instagram.com"
                            className="text-gray-400 hover:text-primary transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Instagram className="size-5" />
                        </Link>
                    </div>
                </div>

                {/* Shop Links */}
                <div>
                    <h3 className="font-bold text-white mb-4">Shop</h3>
                    <ul className="flex flex-col gap-2 text-sm text-gray-400">
                        {shopLinks.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className="hover:text-primary transition-colors"
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Support Links */}
                <div>
                    <h3 className="font-bold text-white mb-4">Support</h3>
                    <ul className="flex flex-col gap-2 text-sm text-gray-400">
                        {supportLinks.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className="hover:text-primary transition-colors"
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Newsletter */}
                <div>
                    <h3 className="font-bold text-white mb-4">Stay in the loop</h3>
                    <p className="text-gray-400 text-sm mb-4">
                        Sign up for exclusive offers and design inspiration.
                    </p>
                    <form onSubmit={handleNewsletterSubmit} className="flex flex-col gap-3">
                        <Input
                            type="email"
                            placeholder="Enter your email"
                            className="w-full h-10 rounded bg-white/10 border-white/10 px-3 text-sm text-white placeholder:text-gray-500 focus:ring-1 focus:ring-primary focus:border-primary"
                            required
                        />
                        <Button
                            type="submit"
                            className="h-10 w-full rounded bg-primary hover:bg-orange-600 text-white font-bold text-sm transition-colors"
                        >
                            Subscribe
                        </Button>
                    </form>
                </div>
            </div>

            <Separator className="max-w-[1440px] mx-auto my-8 sm:my-12 bg-white/10" />

            <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-500">
                <p>© {new Date().getFullYear()} Lumina Storefront. All rights reserved.</p>
                <div className="flex gap-6">
                    <Link href="/privacy" className="hover:text-white transition-colors">
                        Privacy Policy
                    </Link>
                    <Link href="/terms" className="hover:text-white transition-colors">
                        Terms of Service
                    </Link>
                </div>
            </div>
        </footer>
    );
}
