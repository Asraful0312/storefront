export interface WishlistItem {
    id: string;
    name: string;
    image: string;
    price: number;
    originalPrice?: number;
    category: string;
    stockStatus: "in-stock" | "low-stock" | "out-of-stock";
    onSale?: boolean;
    defaultVariantId?: string;
}
