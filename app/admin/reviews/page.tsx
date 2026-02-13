"use client";

import { usePaginatedQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { format } from "date-fns";
import {
    Loader2,
    Star,
    Trash2,
    Eye,
    MoreHorizontal,
    MessageSquare
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

import { useDebounce } from "@/hooks/useDebounce";

export default function AdminReviewsPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 500);

    const { results, status, loadMore, isLoading } = usePaginatedQuery(
        api.reviews.paginatedList,
        { search: debouncedSearch },
        { initialNumItems: 20 }
    );

    const deleteReview = useMutation(api.reviews.deleteReview);
    const [reviewToDelete, setReviewToDelete] = useState<Id<"reviews"> | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!reviewToDelete) return;
        setIsDeleting(true);
        try {
            await deleteReview({ id: reviewToDelete });
            toast.success("Review deleted successfully");
        } catch (error) {
            toast.error("Failed to delete review");
            console.error(error);
        } finally {
            setIsDeleting(false);
            setReviewToDelete(null);
        }
    };

    if (status === "LoadingFirstPage") {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background">

            <div className="p-6 md:p-8 space-y-6">
                {/* Search Bar */}
                <div className="relative max-w-md">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search reviews..."
                        className="pl-8 bg-background"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/50">
                                <TableHead className="w-[300px]">Product</TableHead>
                                <TableHead>Reviewer</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead className="w-[400px]">Review</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No reviews found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                results.map((review) => (
                                    <TableRow key={review._id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="relative size-10 rounded-md overflow-hidden bg-secondary shrink-0 border border-border">
                                                    {review.productImage ? (
                                                        <Image
                                                            src={review.productImage}
                                                            alt={review.productName}
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-muted-foreground">
                                                            <MessageSquare className="size-4" />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="font-medium truncate max-w-[200px]" title={review.productName}>
                                                    {review.productName}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{review.reviewerName}</span>
                                                <span className="text-xs text-muted-foreground">{review.reviewerEmail}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-0.5">
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        className={`size-4 ${i < review.rating ? "fill-orange-400 text-orange-400" : "text-muted-foreground/30"}`}
                                                    />
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                {review.title && <p className="font-medium text-sm">{review.title}</p>}
                                                <p className="text-sm text-muted-foreground line-clamp-2" title={review.content}>
                                                    {review.content}
                                                </p>
                                                {review.isVerifiedPurchase && (
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-green-500/10 text-green-600 border-green-200">
                                                        Verified Purchase
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={review.status === "approved" ? "default" : "secondary"}
                                                className={
                                                    review.status === "approved"
                                                        ? "bg-green-500 hover:bg-green-600"
                                                        : review.status === "rejected"
                                                            ? "bg-red-500 hover:bg-red-600"
                                                            : "bg-yellow-500 hover:bg-yellow-600"
                                                }
                                            >
                                                {review.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {format(new Date(review._creationTime), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="size-8">
                                                        <MoreHorizontal className="size-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/product/${review.slug}?review=${review._id}`} target="_blank">
                                                            <Eye className="mr-2 size-4" />
                                                            View Context
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-red-500 focus:text-red-500 focus:bg-red-50"
                                                        onClick={() => setReviewToDelete(review._id)}
                                                    >
                                                        <Trash2 className="mr-2 size-4" />
                                                        Delete Review
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {status === "CanLoadMore" && (
                    <div className="flex justify-center pt-4">
                        <Button
                            variant="outline"
                            onClick={() => loadMore(20)}
                            disabled={isLoading}
                        >
                            {isLoading ? "Loading..." : "Load More Reviews"}
                        </Button>
                    </div>
                )}
            </div>

            <AlertDialog open={!!reviewToDelete} onOpenChange={(open) => !open && setReviewToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the review.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-500 hover:bg-red-600"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete Review"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
