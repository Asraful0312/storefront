"use client";

import { useState } from "react";
import { Filter, Grid3X3, List, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

// Filter Types
export interface Category {
    id: string;
    name: string;
    slug: string;
    count?: number;
    children?: Category[];
}

export interface FilterState {
    categories: string[];
    priceRange: [number, number];
    sizes: string[];
    colors: string[];
    sortBy: string;
}

// Categories Filter
interface CategoriesFilterProps {
    categories: Category[];
    selected: string[];
    onChange: (selected: string[]) => void;
}

interface RenderCategoryProps {
    category: Category;
    selected: string[];
    onSelect: (id: string) => void;
    level?: number;
}

function CategoryItem({ category, selected, onSelect, level = 0 }: RenderCategoryProps) {
    const isSelected = selected.includes(category.slug); // Use slug for matching if IDs are slugs
    const hasChildren = category.children && category.children.length > 0;

    // Check if any child is selected to auto-expand or highlight parent (optional)
    // For now, simple tree.

    return (
        <div className="flex flex-col select-none">
            <button
                onClick={() => onSelect(category.slug)} // Selects the slug
                className={cn(
                    "flex items-center justify-between py-1.5 text-sm transition-colors hover:text-primary text-left",
                    isSelected ? "text-primary font-bold" : "text-muted-foreground",
                )}
                style={{ paddingLeft: `${level * 12}px` }}
            >
                <span>{category.name}</span>
                {/* Optional count if available */}
                {category.count !== undefined && category.count > 0 && (
                    <span className="text-xs text-muted-foreground/50 ml-2">({category.count})</span>
                )}
            </button>

            {hasChildren && (
                <div className="flex flex-col">
                    {category.children!.map((child) => (
                        <CategoryItem
                            key={child.id || child.slug} // Use ID or slug as key
                            category={child}
                            selected={selected}
                            onSelect={onSelect}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function CategoriesFilter({
    categories,
    selected,
    onChange,
}: CategoriesFilterProps) {

    // Enforce single select for this UI pattern
    const handleSelect = (slug: string) => {
        // If clicking the already selected one, clear it (toggle off)
        if (selected.includes(slug)) {
            onChange([]);
        } else {
            onChange([slug]); // Replace selection
        }
    };

    return (
        <div className="flex flex-col gap-1">
            <button
                onClick={() => onChange([])} // Clear selection
                className={cn(
                    "flex items-center text-sm py-1.5 transition-colors hover:text-primary text-left font-medium",
                    selected.length === 0 || selected[0] === "all" ? "text-primary" : "text-muted-foreground"
                )}
            >
                All Categories
            </button>
            {categories.map((category) => (
                <CategoryItem
                    key={category.id}
                    category={category}
                    selected={selected}
                    onSelect={handleSelect}
                />
            ))}
        </div>
    );
}

// Price Range Filter
interface PriceRangeFilterProps {
    min: number;
    max: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
}

export function PriceRangeFilter({
    min,
    max,
    value,
    onChange,
}: PriceRangeFilterProps) {
    return (
        <div className="flex flex-col gap-4 px-1">
            <Slider
                min={min}
                max={max}
                step={10}
                value={value}
                onValueChange={(val) => onChange(val as [number, number])}
                className="mt-2"
            />
            <div className="flex items-center justify-between text-sm font-medium text-foreground">
                <span>${value[0]}</span>
                <span>${value[1]}</span>
            </div>
        </div>
    );
}

// Size Filter
interface SizeFilterProps {
    sizes: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
}

export function SizeFilter({ sizes, selected, onChange }: SizeFilterProps) {
    const handleToggle = (size: string) => {
        if (selected.includes(size)) {
            onChange(selected.filter((s) => s !== size));
        } else {
            onChange([...selected, size]);
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
                <button
                    key={size}
                    onClick={() => handleToggle(size)}
                    className={cn(
                        "px-3 py-2 rounded border text-sm font-medium transition-colors",
                        selected.includes(size)
                            ? "border-primary bg-primary/10 text-primary font-bold shadow-sm"
                            : "border-border bg-card hover:border-primary hover:text-primary"
                    )}
                >
                    {size}
                </button>
            ))}
        </div>
    );
}

// Color Filter
interface ColorOption {
    id: string;
    name: string;
    hex: string;
}

interface ColorFilterProps {
    colors: ColorOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
}

export function ColorFilter({ colors, selected, onChange }: ColorFilterProps) {
    const handleToggle = (colorId: string) => {
        if (selected.includes(colorId)) {
            onChange(selected.filter((id) => id !== colorId));
        } else {
            onChange([...selected, colorId]);
        }
    };

    return (
        <div className="flex flex-wrap gap-3 p-1">
            {colors.map((color) => (
                <button
                    key={color.id}
                    aria-label={color.name}
                    onClick={() => handleToggle(color.id)}
                    className={cn(
                        "w-8 h-8 rounded-full border transition-all ring-offset-2",
                        selected.includes(color.id)
                            ? "ring-2 ring-primary"
                            : "ring-2 ring-transparent hover:ring-border"
                    )}
                    style={{ backgroundColor: color.hex }}
                />
            ))}
        </div>
    );
}

// Filter Sidebar
interface FilterSidebarProps {
    categories: Category[];
    colors: ColorOption[];
    sizes: string[];
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    priceMin?: number;
    priceMax?: number;
}

export function FilterSidebar({
    categories,
    colors,
    sizes,
    filters,
    onFiltersChange,
    priceMin = 0,
    priceMax = 500,
}: FilterSidebarProps) {
    const updateFilters = (partial: Partial<FilterState>) => {
        onFiltersChange({ ...filters, ...partial });
    };

    const clearFilters = () => {
        onFiltersChange({
            categories: ["all"],
            priceRange: [0, 1000],
            sizes: [],
            colors: [],
            sortBy: "newest",
        });
    };

    const filterContent = (
        <Accordion
            type="multiple"
            defaultValue={["categories", "price", "size", "color"]}
            className="w-full"
        >
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <span className="font-bold text-lg">Filters</span>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-primary h-auto p-0 hover:bg-transparent"
                >
                    Clear All
                </Button>
            </div>

            {/* Categories */}
            <AccordionItem value="categories" className="border-border">
                <AccordionTrigger className="text-foreground text-base font-bold uppercase tracking-wider hover:no-underline">
                    Categories
                </AccordionTrigger>
                <AccordionContent>
                    <CategoriesFilter
                        categories={categories}
                        selected={filters.categories}
                        onChange={(selected) => updateFilters({ categories: selected })}
                    />
                </AccordionContent>
            </AccordionItem>

            {/* Price Range */}
            <AccordionItem value="price" className="border-border">
                <AccordionTrigger className="text-foreground text-base font-bold uppercase tracking-wider hover:no-underline">
                    Price Range
                </AccordionTrigger>
                <AccordionContent>
                    <PriceRangeFilter
                        min={priceMin}
                        max={priceMax}
                        value={filters.priceRange}
                        onChange={(value) => updateFilters({ priceRange: value })}
                    />
                </AccordionContent>
            </AccordionItem>

            {/* Size */}
            <AccordionItem value="size" className="border-border">
                <AccordionTrigger className="text-foreground text-base font-bold uppercase tracking-wider hover:no-underline">
                    Size
                </AccordionTrigger>
                <AccordionContent>
                    <SizeFilter
                        sizes={sizes}
                        selected={filters.sizes}
                        onChange={(selected) => updateFilters({ sizes: selected })}
                    />
                </AccordionContent>
            </AccordionItem>

            {/* Color */}
            <AccordionItem value="color" className="border-border">
                <AccordionTrigger className="text-foreground text-base font-bold uppercase tracking-wider hover:no-underline">
                    Color
                </AccordionTrigger>
                <AccordionContent>
                    <ColorFilter
                        colors={colors}
                        selected={filters.colors}
                        onChange={(selected) => updateFilters({ colors: selected })}
                    />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-64 shrink-0">
                {filterContent}
            </aside>

            {/* Mobile Filter Sheet */}
            <div className="lg:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <Filter className="size-4" />
                            Filters
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] overflow-y-auto">
                        <SheetHeader>
                            <SheetTitle>Filters</SheetTitle>
                        </SheetHeader>
                        <div className="mt-6">{filterContent}</div>
                    </SheetContent>
                </Sheet>
            </div>
        </>
    );
}

// Utility Bar (sort, view toggle, product count)
interface UtilityBarProps {
    totalItems: number;
    showingItems: number;
    sortBy: string;
    onSortChange: (value: string) => void;
    viewMode: "grid" | "list";
    onViewModeChange: (mode: "grid" | "list") => void;
}

export function UtilityBar({
    totalItems,
    showingItems,
    sortBy,
    onSortChange,
    viewMode,
    onViewModeChange,
}: UtilityBarProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <p className="text-muted-foreground text-sm font-medium">
                Showing {showingItems} of {totalItems} items
            </p>
            <div className="flex items-center gap-3">
                <span className="text-foreground text-sm font-medium hidden sm:inline">
                    Sort by:
                </span>
                <Select value={sortBy} onValueChange={onSortChange}>
                    <SelectTrigger className="w-[180px] text-sm">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="newest">Newest Arrivals</SelectItem>
                        <SelectItem value="price-asc">Price: Low to High</SelectItem>
                        <SelectItem value="price-desc">Price: High to Low</SelectItem>
                        <SelectItem value="popular">Best Selling</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                    </SelectContent>
                </Select>

                {/* View Toggle */}
                <div className="flex gap-1 ml-2 sm:ml-4 border-l border-border pl-2 sm:pl-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "p-1",
                            viewMode === "grid" ? "text-primary" : "text-muted-foreground"
                        )}
                        onClick={() => onViewModeChange("grid")}
                    >
                        <Grid3X3 className="size-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "p-1",
                            viewMode === "list" ? "text-primary" : "text-muted-foreground"
                        )}
                        onClick={() => onViewModeChange("list")}
                    >
                        <List className="size-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
