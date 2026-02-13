export interface CartItemData {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    color?: string;
    size?: string;
    variant?: string;
}

export interface OrderSummaryData {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
    promoCode?: string;
    promoDiscount?: number;
}
