"use client";

import { useEffect, useState } from "react";
import { ProductDetailView } from "@/components/storefront/ProductDetailView";
import { type ProductDetail } from "@/components/storefront";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProductPreviewPage() {
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load data from localStorage
        try {
            const data = localStorage.getItem("productPreview");
            if (data) {
                setProduct(JSON.parse(data));
            }
        } catch (e) {
            console.error("Failed to parse preview data", e);
        } finally {
            setLoading(false);
        }
    }, []);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <p className="text-muted-foreground">No preview data found.</p>
                <Button onClick={() => window.close()}>Close Preview</Button>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Preview Banner */}
            <div className="bg-primary/10 border-b border-primary/20 p-2 text-center text-sm font-medium text-primary sticky top-0 z-50 backdrop-blur-sm">
                Preview Mode - This product is not saved yet.
            </div>
            <ProductDetailView product={product} />
        </div>
    );
}
