
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useLocalStorage } from "./useLocalStorage";
import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";

export interface CartItem {
    productId: Id<"products">;
    variantId?: Id<"productVariants">; // or string
    quantity: number;
}

export function useCart() {
    const { isSignedIn, user } = useUser();

    // Local Storage for Guest
    const [localItems, setLocalItems] = useLocalStorage<CartItem[]>("cart-items", []);

    // Mutations
    const addItemMutation = useMutation(api.cart.add);
    const removeItemMutation = useMutation(api.cart.remove);
    const updateQuantityMutation = useMutation(api.cart.updateQuantity);
    const syncMutation = useMutation(api.cart.sync);

    // Queries
    // If logged in, fetch from DB
    const dbItems = useQuery(api.cart.get, isSignedIn ? undefined : "skip");

    // If guest, fetch details for local items
    const guestItemsData = useQuery(api.cart.getGuest, !isSignedIn && localItems.length > 0 ? { items: localItems as any } : "skip");

    // Sync Logic
    useEffect(() => {
        if (isSignedIn && localItems.length > 0) {
            const syncCart = async () => {
                try {
                    await syncMutation({ items: localItems as any });
                    setLocalItems([]);
                    toast.success("Cart synced to your account");
                } catch (error) {
                    console.error("Failed to sync cart:", error);
                    toast.error("Failed to sync cart items");
                }
            };
            syncCart();
        }
    }, [isSignedIn, localItems, syncMutation, setLocalItems]);

    // Unified Data
    const items = isSignedIn ? (dbItems || []) : (guestItemsData || []);
    const isLoading = isSignedIn ? dbItems === undefined : (localItems.length > 0 && guestItemsData === undefined);

    // Actions
    const addItem = async (productId: Id<"products">, variantId: string | undefined, quantity: number = 1) => {
        if (isSignedIn) {
            try {
                await addItemMutation({
                    productId,
                    variantId: variantId as Id<"productVariants"> | undefined,
                    quantity
                });
                toast.success("Added to cart");
            } catch (error) {
                console.error(error);
                toast.error("Failed to add to cart");
            }
        } else {
            setLocalItems((prev) => {
                const existing = prev.find(item => item.productId === productId && item.variantId === variantId);
                if (existing) {
                    return prev.map(item =>
                        (item.productId === productId && item.variantId === variantId)
                            ? { ...item, quantity: item.quantity + quantity }
                            : item
                    );
                } else {
                    return [...prev, {
                        productId,
                        variantId: variantId as Id<"productVariants">,
                        quantity
                    }];
                }
            });
            toast.success("Added to cart");
        }
    };

    const removeItem = async (itemId: string) => {
        // itemId logic:
        // For DB items, it's `_id` (Id<"cartItems">).
        // For Guest items, I generated `guest-...`.

        if (isSignedIn) {
            try {
                await removeItemMutation({ cartItemId: itemId as Id<"cartItems"> });
                toast.success("Removed from cart");
            } catch (error) {
                toast.error("Failed to remove item");
            }
        } else {
            // guest items IDs are like `guest-${productId}-${variantId}`.
            // Need to parse or just compare generated logic.
            // Actually, `items` returned by `getGuest` has `_id`. 
            // My `removeItem` calls should pass that `_id`.
            // But to update `localStorage`, I need `productId` and `variantId`.
            // The `itemId` passed here is the generated string.
            // I should parse it or better yet, my UI should pass the product/variant info?
            // Standard approach: Helper to parse or store index?
            // Let's rely on parsing valid guest ID format I defined in `cart.ts`: `guest-${productId}-${variantId || "base"}`

            if (itemId.startsWith("guest-")) {
                const parts = itemId.split("-");
                // parts[0] is 'guest'
                // parts[1] is productId
                // parts[2] is variantId (could be 'base')
                // Wait, productId might contain dashes? No, Convex IDs are alphanumeric base64-like usually but no dashes? 
                // Creating IDs in convex schema: `v.id`.
                // Actually, convex IDs can be long strings. Separation by dash might be risky if ID has dash.
                // IDs usually don't have dashes.

                // Alternative: The `useCart` hook should expose a way to get the *local* item data from the ID if needed, or `removeItem` args should be explicit for guest mode?
                // But for unified API, `removeItem(id)` is best.

                // Let's find the item in `items` array first.
                const itemToRemove = items.find(i => i._id === itemId);
                if (itemToRemove) {
                    setLocalItems(prev => prev.filter(i =>
                        !(i.productId === itemToRemove.productId && i.variantId === itemToRemove.variantId)
                    ));
                    toast.success("Removed from cart");
                }
            }
        }
    };

    const updateQuantity = async (itemId: string, quantity: number) => {
        if (isSignedIn) {
            try {
                await updateQuantityMutation({ cartItemId: itemId as Id<"cartItems">, quantity });
            } catch (error) {
                toast.error("Failed to update quantity");
            }
        } else {
            const itemToUpdate = items.find(i => i._id === itemId);
            if (itemToUpdate) {
                if (quantity <= 0) {
                    setLocalItems(prev => prev.filter(i =>
                        !(i.productId === itemToUpdate.productId && i.variantId === itemToUpdate.variantId)
                    ));
                } else {
                    setLocalItems(prev => prev.map(i =>
                        (i.productId === itemToUpdate.productId && i.variantId === itemToUpdate.variantId)
                            ? { ...i, quantity }
                            : i
                    ));
                }
            }
        }
    };

    const count = items.reduce((acc, item) => acc + item.quantity, 0);

    return {
        items,
        isLoading,
        addItem,
        removeItem,
        updateQuantity,
        count
    };
}
