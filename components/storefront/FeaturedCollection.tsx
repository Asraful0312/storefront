"use client";

import { Button } from "@/components/ui/button";

interface FeaturedCollectionProps {
    badge?: string;
    title: string;
    description: string;
    backgroundImage: string;
    ctaText?: string;
    ctaHref?: string;
    imagePosition?: "left" | "right";
}

export function FeaturedCollection({
    badge = "Featured Collection",
    title,
    description,
    backgroundImage,
    ctaText = "Explore Collection",
    ctaHref = "/collection",
    imagePosition = "left",
}: FeaturedCollectionProps) {
    const imageSection = (
        <div className="relative min-h-[300px] md:min-h-[400px]">
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                style={{ backgroundImage: `url('${backgroundImage}')` }}
            />
        </div>
    );

    const contentSection = (
        <div className="p-8 sm:p-10 md:p-16 flex flex-col justify-center gap-4 md:gap-6">
            <span className="text-primary font-bold uppercase tracking-wider text-sm">
                {badge}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight text-white">
                {title}
            </h2>
            <p className="text-gray-300 leading-relaxed text-base md:text-lg">
                {description}
            </p>
            <Button
                variant="outline"
                size="lg"
                className="mt-2 md:mt-4 w-fit h-11 md:h-12 px-6 md:px-8 rounded-full border-2 border-white text-white bg-transparent hover:bg-white hover:text-foreground font-bold transition-all"
                asChild
            >
                <a href={ctaHref}>{ctaText}</a>
            </Button>
        </div>
    );

    return (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden bg-[#2C2420] text-white">
            {imagePosition === "left" ? (
                <>
                    {imageSection}
                    {contentSection}
                </>
            ) : (
                <>
                    {contentSection}
                    {imageSection}
                </>
            )}
        </section>
    );
}
