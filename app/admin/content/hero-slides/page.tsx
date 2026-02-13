"use client";

import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    Plus,
    Loader2,
    MoreHorizontal,
    Pencil,
    Trash2,
    LayoutTemplate,
    Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

export default function HeroSlidesPage() {
    const slides = useQuery(api.heroSlides.list);
    const removeSlide = useMutation(api.heroSlides.remove);
    const [deletingId, setDeletingId] = useState<Id<"heroSlides"> | null>(null);

    const handleDelete = async (id: Id<"heroSlides">) => {
        if (!confirm("Are you sure you want to delete this slide?")) return;
        setDeletingId(id);
        try {
            await removeSlide({ id });
        } catch (error) {
            console.error("Failed to delete slide:", error);
            alert("Failed to delete slide");
        } finally {
            setDeletingId(null);
        }
    };

    if (slides === undefined) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    const heroSlides = slides.filter(s => s.location !== "featured");
    const featuredSlides = slides.filter(s => s.location === "featured");

    return (
        <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
            <header className="bg-card border-b border-border px-8 py-5 flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Content Management</h1>
                    <p className="text-sm text-muted-foreground">Manage homepage slides and banners</p>
                </div>
                <Link href="/admin/content/hero-slides/new">
                    <Button className="gap-2">
                        <Plus className="size-4" />
                        Add New Slide
                    </Button>
                </Link>
            </header>

            <div className="flex-1 overflow-y-auto p-8 space-y-10">
                {/* Hero Slides Section */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <LayoutTemplate className="size-5 text-primary" />
                        <h2 className="text-xl font-bold">Hero Slider</h2>
                    </div>

                    {heroSlides.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-card/50">
                            <p className="text-muted-foreground">No slides in the main hero slider</p>
                            <Link href="/admin/content/hero-slides/new?location=hero" className="mt-4 inline-block">
                                <Button variant="outline">Create Hero Slide</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {heroSlides.map((slide) => (
                                <SlideCard
                                    key={slide._id}
                                    slide={slide}
                                    onDelete={() => handleDelete(slide._id)}
                                    isDeleting={deletingId === slide._id}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Featured Banners Section */}
                <section>
                    <div className="flex items-center gap-2 mb-6">
                        <Star className="size-5 text-primary" />
                        <h2 className="text-xl font-bold">Featured Banners</h2>
                    </div>

                    {featuredSlides.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-border rounded-xl bg-card/50">
                            <p className="text-muted-foreground">No featured banners</p>
                            <Link href="/admin/content/hero-slides/new?location=featured" className="mt-4 inline-block">
                                <Button variant="outline">Create Featured Banner</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {featuredSlides.map((slide) => (
                                <SlideCard
                                    key={slide._id}
                                    slide={slide}
                                    onDelete={() => handleDelete(slide._id)}
                                    isDeleting={deletingId === slide._id}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

function SlideCard({ slide, onDelete, isDeleting }: { slide: any, onDelete: () => void, isDeleting: boolean }) {
    return (
        <Card className="overflow-hidden group">
            <div className="relative aspect-video bg-muted">
                <img
                    src={slide.imageUrl}
                    alt={slide.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                    <Badge variant={slide.isActive ? "default" : "secondary"} className="shadow-sm backdrop-blur-md">
                        {slide.isActive ? "Active" : "Inactive"}
                    </Badge>
                </div>
                <div className="absolute bottom-3 left-3">
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-md shadow-sm">
                        Order: {slide.sortOrder ?? 0}
                    </Badge>
                </div>
            </div>
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="font-semibold text-lg line-clamp-1">{slide.title}</h3>
                        <p className="text-muted-foreground text-sm line-clamp-2 mt-1 h-10">
                            {slide.description || "No description"}
                        </p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="-mr-2">
                                <MoreHorizontal className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <Link href={`/admin/content/hero-slides/${slide._id}/edit`}>
                                <DropdownMenuItem>
                                    <Pencil className="size-4 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
                                <Trash2 className="size-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <span className="truncate max-w-[150px]">{slide.ctaText}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
