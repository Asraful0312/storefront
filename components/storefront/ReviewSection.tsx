
"use client";

import { useState } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Star, Image as ImageIcon, Loader2, User, X } from "lucide-react";
import { useCloudinaryImages } from "@/hooks/useCloudinaryImages";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReviewSectionProps {
    productId: Id<"products">;
    productName: string;
    highlightedReviewId?: string;
}

export function ReviewSection({ productId, productName, highlightedReviewId }: ReviewSectionProps) {
    const { isSignedIn, user } = useUser();
    const [isWriting, setIsWriting] = useState(false);

    // Stats
    const stats = useQuery(api.reviews.getStats, { productId });

    // Reviews List
    const reviews = useQuery(api.reviews.list, { productId, limit: 20 });

    return (
        <section className="w-full bg-background py-16 border-t border-border">
            <div className="w-full max-w-[1280px] px-4 lg:px-40 mx-auto">
                <div className="flex flex-col gap-8">
                    {/* Header with Stats */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold">Customer Reviews</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <div className="flex text-primary">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            className={cn(
                                                "size-5",
                                                stats?.average && s <= Math.round(stats.average) ? "fill-current" : "text-muted"
                                            )}
                                        />
                                    ))}
                                </div>
                                <span className="text-lg font-medium">
                                    {stats?.average?.toFixed(1) || "0.0"}
                                </span>
                                <span className="text-muted-foreground">
                                    Based on {stats?.count || 0} reviews
                                </span>
                            </div>
                        </div>

                        {isSignedIn ? (
                            !isWriting && (
                                <Button onClick={() => setIsWriting(true)}>Write a Review</Button>
                            )
                        ) : (
                            <SignInButton mode="modal">
                                <Button variant="outline">Sign in to Write a Review</Button>
                            </SignInButton>
                        )}
                    </div>

                    {/* Review Form */}
                    {isWriting && (
                        <ReviewForm
                            productId={productId}
                            productName={productName}
                            onCancel={() => setIsWriting(false)}
                            onSuccess={() => setIsWriting(false)}
                        />
                    )}

                    {/* Reviews Grid */}
                    <div className="flex flex-col gap-6">
                        {reviews === undefined ? (
                            <div className="py-8 flex justify-center">
                                <Loader2 className="size-8 animate-spin text-primary" />
                            </div>
                        ) : reviews.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground bg-secondary/30 rounded-lg">
                                No reviews yet. Be the first to review this product!
                            </div>
                        ) : (
                            reviews.map((review) => (
                                <ReviewCard
                                    key={review._id}
                                    review={review}
                                    isHighlighted={review._id === highlightedReviewId}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

function ReviewForm({
    productId,
    productName,
    onCancel,
    onSuccess,
}: {
    productId: Id<"products">;
    productName: string;
    onCancel: () => void;
    onSuccess: () => void;
}) {
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitReview = useMutation(api.reviews.submit);

    // Image Upload
    const {
        images,
        isUploading,
        handleImageUpload,
        fileInputRef,
        handleRemoveImage
    } = useCloudinaryImages({
        folder: "reviews",
        productName: `${productName}-review`
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error("Please select a rating");
            return;
        }
        if (!content.trim()) {
            toast.error("Please provide review content");
            return;
        }

        setIsSubmitting(true);
        try {
            await submitReview({
                productId,
                rating,
                title,
                content,
                images: images.map(img => img.url), // Backend expects array of strings (URLs) based on my updated schema consideration? 
                // Wait, I updated schema to v.array(v.string()). I should store URLs.
                // But I also said I wanted to store publicIds?
                // Schema update was: images: v.optional(v.array(v.string()))
                // So URLs are expected.
            });
            toast.success("Review submitted successfully!");
            onSuccess();
        } catch (err) {
            console.error(err);
            toast.error("Failed to submit review. You may have already reviewed this product.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-card p-6 rounded-lg border border-border space-y-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Write your review</h3>
                <Button variant="ghost" size="icon" onClick={onCancel} type="button">
                    <X className="size-4" />
                </Button>
            </div>

            {/* Rating */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Rating</label>
                <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                        >
                            <Star
                                className={cn(
                                    "size-8 cursor-pointer transition-colors",
                                    star <= rating ? "fill-primary text-primary" : "text-muted-foreground/30 hover:text-primary/50"
                                )}
                            />
                        </button>
                    ))}
                </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Title (Optional)</label>
                <Input
                    placeholder="Subject of your review"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            {/* Content */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Review</label>
                <Textarea
                    placeholder="Share your experience with this product..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    required
                />
            </div>

            {/* Images */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Images (Max 3)</label>
                <div className="flex flex-wrap gap-4">
                    {images.map((img) => (
                        <div key={img.publicId} className="relative size-20 rounded-md overflow-hidden bg-secondary border border-border group">
                            <Image
                                src={img.url}
                                alt="Review image"
                                fill
                                className="object-cover"
                            />
                            <button
                                type="button"
                                onClick={() => handleRemoveImage(img.publicId)}
                                className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="size-3" />
                            </button>
                        </div>
                    ))}

                    {images.length < 3 && (
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="size-20 rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-secondary/50 flex flex-col items-center justify-center cursor-pointer transition-colors"
                        >
                            {isUploading ? (
                                <Loader2 className="size-6 text-muted-foreground animate-spin" />
                            ) : (
                                <ImageIcon className="size-6 text-muted-foreground" />
                            )}
                            <span className="text-[10px] text-muted-foreground mt-1">Add Image</span>
                        </div>
                    )}
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    Upload up to 3 images. Supported formats: JPG, PNG.
                </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || isUploading}>
                    {isSubmitting ? "Submitting..." : "Submit Review"}
                </Button>
            </div>
        </form>
    );
}

import { useEffect, useRef } from "react";

function ReviewCard({ review, isHighlighted }: { review: any; isHighlighted?: boolean }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isHighlighted && ref.current) {
            // Small timeout to ensure tab content is fully rendered and layout is stable
            const timer = setTimeout(() => {
                ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isHighlighted]);

    return (
        <div
            ref={ref}
            className={cn(
                "bg-card p-6 rounded-lg border flex flex-col gap-4 transition-colors duration-500",
                isHighlighted ? "border-primary ring-1 ring-primary bg-primary/5" : "border-border"
            )}
        >
            <div className="flex justify-between items-start">
                <div className="flex gap-3">
                    <div className="size-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                        {review.userAvatar ? (
                            <Image src={review.userAvatar} alt={review.userName} width={40} height={40} className="size-full object-cover" />
                        ) : (
                            <User className="size-6 text-muted-foreground" />
                        )}
                    </div>
                    <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                            {review.userName}
                            {review.isVerifiedPurchase && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium">
                                    Verified Buyer
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>
                                {new Date(review._creationTime).toLocaleDateString(undefined, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex text-primary">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                            key={s}
                            className={cn(
                                "size-4",
                                s <= review.rating ? "fill-current" : "text-muted-foreground/30"
                            )}
                        />
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                {review.title && (
                    <h4 className="font-bold text-base">{review.title}</h4>
                )}
                <p className="text-muted-foreground leading-relaxed">
                    {review.content}
                </p>
            </div>

            {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mt-2">
                    {review.images.map((url: string, idx: number) => (
                        <div key={idx} className="relative size-20 rounded-md overflow-hidden bg-secondary border border-border">
                            <Image
                                src={url}
                                alt={`Review image ${idx + 1}`}
                                fill
                                className="object-cover"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
