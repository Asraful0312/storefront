"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product, ProductCard } from "./ProductCard";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";

interface NewArrivalsSliderProps {
    title?: string;
    products: Product[];
    onLoadMore?: () => void;
}

export function NewArrivalsSlider({
    title = "New Arrivals",
    products,
    onLoadMore,
}: NewArrivalsSliderProps) {
    if (products.length === 0) return null;

    return (
        <section className="w-full">
            <div className="flex items-center justify-between pb-4 sm:pb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                    {title}
                </h2>
            </div>

            <Carousel
                opts={{
                    align: "start",
                    loop: true,
                }}
                className="w-full"
            >
                <div className="relative">
                    <CarouselContent className="-ml-4">
                        {products.map((product) => (
                            <CarouselItem key={product.id} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/4">
                                <ProductCard product={product} />
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                    {/* Navigation Buttons - Positioned outside or styled differently if preferred */}
                    <div className="hidden sm:flex absolute -top-12 right-0 gap-2">
                        <CarouselPrevious className="static translate-y-0 size-8 border-border hover:bg-secondary" />
                        <CarouselNext className="static translate-y-0 size-8 border-border hover:bg-secondary" />
                    </div>
                </div>
            </Carousel>

            {onLoadMore && (
                <div className="flex justify-center mt-8 sm:mt-10">
                    <Button
                        variant="outline"
                        className="h-10 px-8 rounded-full border-border bg-card hover:bg-secondary font-medium"
                        onClick={onLoadMore}
                    >
                        View All New Arrivals
                    </Button>
                </div>
            )}
        </section>
    );
}
