"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];

        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, "...", totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, "...", currentPage, "...", totalPages);
            }
        }

        return pages;
    };

    return (
        <nav aria-label="Pagination" className="flex justify-center gap-2">
            <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="size-10"
            >
                <ChevronLeft className="size-4" />
            </Button>

            {getPageNumbers().map((page, index) =>
                typeof page === "number" ? (
                    <Button
                        key={index}
                        variant={currentPage === page ? "default" : "outline"}
                        size="icon"
                        onClick={() => onPageChange(page)}
                        className={cn(
                            "size-10 font-medium",
                            currentPage === page && "shadow-md shadow-primary/30"
                        )}
                    >
                        {page}
                    </Button>
                ) : (
                    <span
                        key={index}
                        className="flex size-10 items-center justify-center text-muted-foreground"
                    >
                        {page}
                    </span>
                )
            )}

            <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="size-10"
            >
                <ChevronRight className="size-4" />
            </Button>
        </nav>
    );
}
