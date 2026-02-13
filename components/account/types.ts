export type OrderStatus = "delivered" | "shipped" | "processing" | "returned" | "cancelled";

export interface OrderItem {
    id: string;
    name: string;
    image: string;
}

export interface Order {
    id: string;
    orderId: string;
    date: string;
    status: OrderStatus;
    statusDate?: string;
    items: OrderItem[];
    total: number;
}

export interface AccountNavItem {
    id: string;
    label: string;
    icon: string;
    href: string;
    isActive?: boolean;
}
