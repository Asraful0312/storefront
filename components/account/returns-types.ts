export type ReturnStatus = "pending" | "approved" | "processing" | "completed" | "rejected";

export interface ReturnRequest {
    id: string;
    orderId: string;
    orderDate: string;
    returnDate: string;
    status: ReturnStatus;
    items: ReturnItem[];
    reason: string;
    refundAmount: number;
    refundMethod: string;
}

export interface ReturnItem {
    id: string;
    name: string;
    image: string;
    quantity: number;
    price: number;
}
