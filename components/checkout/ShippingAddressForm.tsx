"use client";

import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { ShippingAddress } from "./types";
import { countries, getStatesOfCountry } from "@/lib/country";

interface ShippingAddressFormProps {
    address: ShippingAddress;
    onChange: (address: ShippingAddress) => void;
    onContinue: () => void;
    stepNumber: number;
    isOpen: boolean;
    onToggle: () => void;
    isCompleted?: boolean;
}



export function ShippingAddressForm({
    address,
    onChange,
    onContinue,
    stepNumber,
    isOpen,
    onToggle,
    isCompleted,
}: ShippingAddressFormProps) {
    const updateField = (field: keyof ShippingAddress, value: string) => {
        onChange({ ...address, [field]: value });
    };

    const [states, setStates] = useState<{ code: string; name: string }[]>([]);

    // Update states when country changes
    useEffect(() => {
        if (address.country) {
            const countryStates = getStatesOfCountry(address.country);
            setStates(countryStates);

            // Clear state selection if current state is not valid for new country
            // optional: check if address.state is in new states list
            const isValidState = countryStates.some(s => s.code === address.state || s.name === address.state);
            if (!isValidState && countryStates.length > 0) {
                updateField("state", "");
            }
        } else {
            setStates([]);
        }
    }, [address.country]);

    return (
        <Collapsible open={isOpen} onOpenChange={onToggle}>
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-4 p-5 md:p-6 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-4">
                        <span
                            className={cn(
                                "flex items-center justify-center size-8 rounded-full font-bold text-sm",
                                isCompleted || isOpen
                                    ? "bg-primary/10 text-primary"
                                    : "border border-muted-foreground/30 text-muted-foreground"
                            )}
                        >
                            {stepNumber}
                        </span>
                        <h3 className={cn("text-lg font-bold", !isOpen && !isCompleted && "text-muted-foreground")}>
                            Shipping Address
                        </h3>
                    </div>
                    <ChevronDown
                        className={cn(
                            "size-5 text-muted-foreground transition-transform",
                            isOpen && "rotate-180"
                        )}
                    />
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <div className="px-6 pb-8 border-t border-border pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    placeholder="Jane"
                                    value={address.firstName}
                                    onChange={(e) => updateField("firstName", e.target.value)}
                                    className="h-12"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    placeholder="Doe"
                                    value={address.lastName}
                                    onChange={(e) => updateField("lastName", e.target.value)}
                                    className="h-12"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    placeholder="123 Main St"
                                    value={address.address}
                                    onChange={(e) => updateField("address", e.target.value)}
                                    className="h-12"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="apartment">Apartment, suite, etc. (optional)</Label>
                                <Input
                                    id="apartment"
                                    placeholder=""
                                    value={address.apartment || ""}
                                    onChange={(e) => updateField("apartment", e.target.value)}
                                    className="h-12"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input
                                    id="city"
                                    placeholder="New York"
                                    value={address.city}
                                    onChange={(e) => updateField("city", e.target.value)}
                                    className="h-12"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="state">State / Province</Label>
                                    {states.length > 0 ? (
                                        <Select
                                            value={address.state}
                                            onValueChange={(value) => updateField("state", value)}
                                        >
                                            <SelectTrigger className="h-12">
                                                <SelectValue placeholder="State" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {states.map((state) => (
                                                    <SelectItem key={state.code} value={state.code}>
                                                        {state.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            id="state"
                                            placeholder="State"
                                            value={address.state}
                                            onChange={(e) => updateField("state", e.target.value)}
                                            className="h-12"
                                        />
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="zipCode">Zip Code</Label>
                                    <Input
                                        id="zipCode"
                                        placeholder="10001"
                                        value={address.zipCode}
                                        onChange={(e) => updateField("zipCode", e.target.value)}
                                        className="h-12"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="country">Country</Label>
                                <Select
                                    value={address.country}
                                    onValueChange={(value) => updateField("country", value)}
                                >
                                    <SelectTrigger className="h-12">
                                        <SelectValue placeholder="Select Country" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countries.map((c) => (
                                            <SelectItem key={c.code} value={c.code}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button onClick={onContinue} className="px-8">
                                Continue to Shipping
                            </Button>
                        </div>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}
