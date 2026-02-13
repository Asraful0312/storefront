export interface ShippingAddress {
    firstName: string;
    lastName: string;
    address: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
}

export interface ShippingMethod {
    id: string;
    name: string;
    description: string;
    price: number;
    estimatedDays: string;
}

export interface PaymentInfo {
    cardNumber: string;
    expiryDate: string;
    cvc: string;
    cardholderName: string;
}

export interface CheckoutItem {
    id: string;
    name: string;
    image: string;
    variant: string;
    quantity: number;
    price: number;
}

export type CheckoutStep = "address" | "shipping" | "payment";
