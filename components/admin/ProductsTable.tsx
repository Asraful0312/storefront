"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Edit2, Eye, Trash2 } from "lucide-react";
import TrashIcon from "../ui/trash-icon";
import PenIcon from "../ui/pen-icon";
import EyeIcon from "../ui/eye-icon";
import { useEffect, useRef, useState } from "react";
import { AnimatedIconHandle } from "../ui/types";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { type ProductDetail } from "@/components/storefront";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation } from "convex/react";
import { Loader2 } from "lucide-react";

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export interface AdminProduct {
    id: string;
    name: string;
    image: string;
    sku: string;
    category: string;
    price: number;
    stockLevel: number;
    stockStatus: StockStatus;
    status: string;
}

interface ProductsTableProps {
    products: AdminProduct[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    totalCount?: number;
    filteredCount?: number;
}

const stockStatusConfig: Record<StockStatus, { label: string; className: string; barClass: string }> = {
    "in-stock": {
        label: "In Stock",
        className: "text-green-600 dark:text-green-400",
        barClass: "bg-green-500",
    },
    "low-stock": {
        label: "Low Stock",
        className: "text-primary",
        barClass: "bg-primary",
    },
    "out-of-stock": {
        label: "Out of Stock",
        className: "text-red-500",
        barClass: "bg-red-500",
    },
};

export function ProductsTable({ products, onEdit, onDelete, totalCount, filteredCount }: ProductsTableProps) {

    return (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border bg-secondary/50">
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-16">
                                Image
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[200px]">
                                Product Name
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                SKU
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Category
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Price
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[140px]">
                                Stock Level
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[140px]">
                                Status
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {products.map((product) => {
                            const stockConfig = stockStatusConfig[product.stockStatus];
                            const stockPercent = Math.min((product.stockLevel / 100) * 100, 100);

                            return (
                                <tr key={product.id} className="group hover:bg-secondary/30 transition-colors">
                                    <td className="px-6 py-3">
                                        <div
                                            className="h-10 w-10 rounded-lg bg-secondary bg-cover bg-center"
                                            style={{ backgroundImage: `url('${product.image}')` }}
                                        />
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="text-sm font-semibold text-foreground">{product.name}</div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="text-sm font-mono text-muted-foreground">{product.sku}</div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <Badge variant="secondary" className="text-xs">
                                            {product.category}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="text-sm font-medium text-foreground">
                                            ${(product.price / 100).toFixed(2)}
                                        </div>
                                    </td>

                                    <td className="px-6 py-3">
                                        <div className="flex flex-col gap-1.5 w-full max-w-[120px]">
                                            <div className="flex justify-between text-xs">
                                                <span className="font-medium text-foreground">{product.stockLevel}</span>
                                                <span className={stockConfig.className}>{stockConfig.label}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                                <div
                                                    className={cn("h-full rounded-full", stockConfig.barClass)}
                                                    style={{ width: `${stockPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">All variant combined</p>
                                    </td>
                                    <td className="px-6 py-3">
                                        <StatusCell status={product.status} productId={product.id} />
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <ProductAction onDelete={onDelete} onEdit={onEdit} productId={product.id} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-card">
                <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    <span className="font-medium text-foreground">{products.length}</span>
                    {filteredCount !== undefined && filteredCount !== totalCount && (
                        <> of <span className="font-medium text-foreground">{totalCount}</span> (filtered)</>
                    )}
                    {filteredCount === totalCount && totalCount !== undefined && (
                        <> products</>
                    )}
                    {totalCount === undefined && <> products</>}
                </div>
            </div>
        </div>
    );
}


const ProductAction = ({ onDelete, onEdit, productId }: { onDelete: (id: string) => void, onEdit: (id: string) => void, productId: string }) => {
    const editRef = useRef<AnimatedIconHandle>(null);
    const trashRef = useRef<AnimatedIconHandle>(null);
    const previewRef = useRef<AnimatedIconHandle>(null);
    const [isAnimated, setIsAnimated] = useState(true);
    const convex = useConvex();

    const handlePreview = async () => {
        try {
            const product = await convex.query(api.products.getWithVariants, { id: productId as Id<"products"> });

            if (!product) return;

            const previewData: ProductDetail = {
                id: product._id,
                name: product.name,
                price: product.basePrice / 100,
                originalPrice: product.compareAtPrice ? product.compareAtPrice / 100 : undefined,
                description: product.description,
                rating: 0,
                reviewCount: 0,
                images: product.images.map((img: any) => ({
                    id: img.publicId,
                    url: img.url,
                    alt: img.alt || ""
                })),
                colors: product.colorOptions || [],
                sizes: product.sizeOptions || [],
                unavailableSizes: [],
                stockCount: product.variants?.reduce((acc: number, v: any) => acc + (v.stockCount || 0), 0) || 0,
                features: product.features || [],
                story: product.story,
            };

            localStorage.setItem("productPreview", JSON.stringify(previewData));
            window.open("/admin/products/preview", "_blank");
        } catch (error) {
            console.error("Failed to load preview data", error);
        }
    };

    return (
        <div className="flex items-center justify-end gap-2">
            <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={handlePreview}
                onMouseEnter={() => isAnimated && previewRef.current?.startAnimation()}
                onMouseLeave={() => isAnimated && previewRef.current?.stopAnimation()}
                title="Preview Product"
            >
                <EyeIcon ref={previewRef} className="size-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                onClick={() => onEdit(productId)}
                onMouseEnter={() => isAnimated && editRef.current?.startAnimation()}
                onMouseLeave={() => isAnimated && editRef.current?.stopAnimation()}
            >
                <PenIcon ref={editRef} className="size-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => onDelete(productId)}
                onMouseEnter={() => isAnimated && trashRef.current?.startAnimation()}
                onMouseLeave={() => isAnimated && trashRef.current?.stopAnimation()}
            >
                <TrashIcon ref={trashRef} className="size-4" />
            </Button>
        </div>
    )
}

const StatusCell = ({ status, productId }: { status: string, productId: string }) => {
    const updateProduct = useMutation(api.products.update);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusChange = async (newStatus: "draft" | "active" | "archived") => {
        if (newStatus === status) return;
        setIsUpdating(true);
        try {
            await updateProduct({ id: productId as Id<"products">, status: newStatus });
        } catch (error) {
            console.error("Failed to update status", error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="cursor-pointer hover:opacity-80 transition-opacity">
                    <Badge
                        variant={status === "active" ? "default" : status === "draft" ? "warning" : "destructive"}
                        className="text-xs gap-1 pr-1.5"
                    >
                        {status}
                        {isUpdating && <Loader2 className="size-3 animate-spin ml-1" />}
                    </Badge>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => handleStatusChange("active")}>
                    Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange("draft")}>
                    Draft
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange("archived")}>
                    Archived
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};