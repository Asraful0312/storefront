"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Search, X, History, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
    PopoverAnchor,
} from "@/components/ui/popover";
import { useDebounce } from "@/lib/hooks";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface SearchBarProps {
    className?: string;
    onClose?: () => void; // For mobile sheet close
}

export function SearchBar({ className, onClose }: SearchBarProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebounce(query, 300);
    const [history, setHistory] = useState<string[]>([]);

    // Load history from localStorage
    useEffect(() => {
        const saved = localStorage.getItem("search_history");
        if (saved) {
            try {
                setHistory(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse search history", e);
            }
        }
    }, []);

    // Save history
    const addToHistory = (term: string) => {
        if (!term.trim()) return;
        const newHistory = [term, ...history.filter(h => h !== term)].slice(0, 5);
        setHistory(newHistory);
        localStorage.setItem("search_history", JSON.stringify(newHistory));
    };

    const removeFromHistory = (term: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newHistory = history.filter(h => h !== term);
        setHistory(newHistory);
        localStorage.setItem("search_history", JSON.stringify(newHistory));
    };

    // Fetch suggestions
    const suggestions = useQuery(api.products.getSearchSuggestions, {
        query: debouncedQuery,
        limit: 5
    });

    const handleSelect = (term: string, type: "product" | "term" = "term", slug?: string) => {
        addToHistory(term);
        setOpen(false);
        setQuery(term);
        if (onClose) onClose();

        if (type === "product" && slug) {
            router.push(`/product/${slug}`);
        } else {
            router.push(`/shop?search=${encodeURIComponent(term)}`);
        }
    };

    const handleSearchSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;
        handleSelect(query);
    };

    return (
        <div className={cn("relative w-full max-w-sm lg:max-w-lg z-50", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverAnchor asChild>
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Search for products..."
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                if (e.target.value) setOpen(true);
                            }}
                            onFocus={() => setOpen(true)}
                            onClick={() => setOpen(true)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSearchSubmit();
                                    e.preventDefault();
                                }
                            }}
                            className="pl-9 pr-4 w-full bg-secondary/50 border-transparent focus:bg-background transition-all"
                        />
                        {query && (
                            <button
                                onClick={() => {
                                    setQuery("");
                                    setOpen(false);
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
                            >
                                <X className="size-3 text-muted-foreground" />
                            </button>
                        )}
                    </div>
                </PopoverAnchor>
                <PopoverContent
                    className="w-[calc(100vw-2rem)] sm:w-[500px] p-0"
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <Command shouldFilter={false}>
                        {/* <CommandInput /> We use external input */}
                        <CommandList>
                            {/* Empty State / Loading */}
                            {!query && history.length === 0 && (
                                <div className="py-6 text-center text-sm text-muted-foreground">
                                    Start typing to search...
                                </div>
                            )}

                            {/* History */}
                            {!query && history.length > 0 && (
                                <CommandGroup heading="Recent Searches">
                                    {history.map((term) => (
                                        <CommandItem
                                            key={term}
                                            value={term}
                                            onSelect={() => handleSelect(term)}
                                            className="flex items-center justify-between cursor-pointer"
                                        >
                                            <div className="flex items-center gap-2">
                                                <History className="size-4 text-muted-foreground" />
                                                <span>{term}</span>
                                            </div>
                                            <button
                                                onClick={(e) => removeFromHistory(term, e)}
                                                className="p-1 hover:text-destructive"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {/* Loading */}
                            {query && suggestions === undefined && (
                                <div className="py-6 flex justify-center text-muted-foreground">
                                    <Loader2 className="size-5 animate-spin" />
                                </div>
                            )}

                            {/* Suggestions */}
                            {query && suggestions && (
                                <>
                                    {suggestions.length > 0 && (
                                        <CommandGroup heading="Products">
                                            {suggestions.map((product) => (
                                                <CommandItem
                                                    key={product.id}
                                                    value={product.name}
                                                    onSelect={() => handleSelect(product.name, "product", product.slug)}
                                                    className="flex items-center gap-3 cursor-pointer"
                                                >
                                                    <div className="relative size-8 rounded overflow-hidden bg-secondary shrink-0">
                                                        {product.image && (
                                                            <Image
                                                                src={product.image}
                                                                alt={product.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        )}
                                                    </div>
                                                    <span className="truncate">{product.name}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    )}

                                    <CommandSeparator />

                                    <CommandGroup heading="Search">
                                        <CommandItem
                                            className="cursor-pointer"
                                            onSelect={() => handleSearchSubmit()}
                                        >
                                            <div className="flex items-center gap-2 text-primary">
                                                <Search className="size-4" />
                                                <span>Search for "{query}"</span>
                                                <ArrowRight className="size-3 ml-auto" />
                                            </div>
                                        </CommandItem>
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
