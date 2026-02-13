import { Star, StarHalf } from "lucide-react";

// Star Rating Component
function StarRating({ rating, reviewCount }: { rating: number; reviewCount: number }) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <div className="flex items-center gap-1">
            {[...Array(fullStars)].map((_, i) => (
                <Star
                    key={`full-${i}`}
                    className="size-4 fill-primary text-primary"
                />
            ))}
            {hasHalfStar && (
                <StarHalf className="size-4 fill-primary text-primary" />
            )}
            {[...Array(emptyStars)].map((_, i) => (
                <Star
                    key={`empty-${i}`}
                    className="size-4 text-muted-foreground"
                />
            ))}
            <span className="text-xs text-muted-foreground ml-1">
                ({reviewCount})
            </span>
        </div>
    );
}

export default StarRating;