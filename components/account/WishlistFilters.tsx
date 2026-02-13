"use client";

import { Filter, CheckCircle, Tag, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type WishlistFilter = "all" | "in-stock" | "on-sale";
export type WishlistSort = "date-added" | "price-low" | "price-high" | "name";

interface WishlistFiltersProps {
    activeFilter: WishlistFilter;
    onFilterChange: (filter: WishlistFilter) => void;
    sortBy: WishlistSort;
    onSortChange: (sort: WishlistSort) => void;
}

const filterConfig = [
    { id: "all" as WishlistFilter, label: "All Items", icon: Filter },
    { id: "in-stock" as WishlistFilter, label: "In Stock", icon: CheckCircle },
    { id: "on-sale" as WishlistFilter, label: "On Sale", icon: Tag },
];

const sortOptions = [
    { id: "date-added" as WishlistSort, label: "Date Added" },
    { id: "price-low" as WishlistSort, label: "Price: Low to High" },
    { id: "price-high" as WishlistSort, label: "Price: High to Low" },
    { id: "name" as WishlistSort, label: "Name" },
];

export function WishlistFilters({
    activeFilter,
    onFilterChange,
    sortBy,
    onSortChange,
}: WishlistFiltersProps) {
    const currentSort = sortOptions.find((s) => s.id === sortBy)?.label || "Date Added";

    return (
        <div className="flex gap-3 flex-wrap overflow-x-auto pb-2">
            {filterConfig.map((filter) => {
                const Icon = filter.icon;
                const isActive = activeFilter === filter.id;

                return (
                    <Button
                        key={filter.id}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => onFilterChange(filter.id)}
                        className={cn(
                            "shrink-0 gap-2 rounded-full",
                            !isActive && "text-muted-foreground"
                        )}
                    >
                        <Icon className="size-4" />
                        {filter.label}
                    </Button>
                );
            })}

            <div className="flex-1" />

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                        Sort by: {currentSort}
                        <ChevronDown className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {sortOptions.map((option) => (
                        <DropdownMenuItem
                            key={option.id}
                            onClick={() => onSortChange(option.id)}
                            className={cn(sortBy === option.id && "font-bold text-primary")}
                        >
                            {option.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
