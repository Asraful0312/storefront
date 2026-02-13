"use client";

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeroSectionProps {
    badge?: string;
    title: string;
    highlight?: string;
    description: string;
    backgroundImage: string;
    primaryCta?: {
        text: string;
        href: string;
    };
    secondaryCta?: {
        text: string;
        href: string;
    };
}

export function HeroSection({
    badge = "Spring Collection 2024",
    title = "Embrace the",
    highlight = "Warmth of Home",
    description = "Curated styles for a cozy, modern life. Discover our new season essentials designed to bring comfort to every corner.",
    backgroundImage,
    primaryCta = { text: "Shop Collection", href: "/shop" },
    secondaryCta = { text: "View Lookbook", href: "/lookbook" },
}: HeroSectionProps) {
    return (
        <section className="pt-6 md:pt-10">
            <div className="relative w-full rounded-2xl overflow-hidden bg-secondary min-h-[400px] md:min-h-[500px] flex items-center">
                {/* Hero Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                    style={{ backgroundImage: `url('${backgroundImage}')` }}
                />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />

                {/* Hero Content */}
                <div className="relative z-10 p-6 sm:p-8 md:p-16 max-w-2xl flex flex-col gap-4 md:gap-6 animate-fade-in-up">
                    <Badge
                        variant="secondary"
                        className="inline-flex w-fit px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider border border-white/10 hover:bg-white/30"
                    >
                        {badge}
                    </Badge>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight">
                        {title}
                        {highlight && (
                            <>
                                <br className="hidden sm:block" />
                                <span className="text-orange-200"> {highlight}</span>
                            </>
                        )}
                    </h1>

                    <p className="text-base md:text-lg text-gray-100 max-w-md font-medium leading-relaxed">
                        {description}
                    </p>

                    <div className="flex flex-wrap gap-3 md:gap-4 pt-2">
                        <Button
                            size="lg"
                            className="h-11 md:h-12 px-6 md:px-8 rounded-full bg-primary hover:bg-orange-600 text-white font-bold transition-all shadow-lg shadow-orange-900/20 group"
                            asChild
                        >
                            <a href={primaryCta.href}>
                                {primaryCta.text}
                                <ArrowRight className="ml-2 size-5 group-hover:translate-x-1 transition-transform" />
                            </a>
                        </Button>

                        <Button
                            size="lg"
                            variant="secondary"
                            className="h-11 md:h-12 px-6 md:px-8 rounded-full bg-white hover:bg-gray-100 text-foreground font-bold transition-all"
                            asChild
                        >
                            <a href={secondaryCta.href}>{secondaryCta.text}</a>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
