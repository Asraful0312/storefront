"use client";

import { useState } from "react";
import {
    Home,
    Building2,
    MapPin,
    Edit2,
    Trash2,
    Plus,
    Check,
    MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface Address {
    id: string;
    type: "home" | "office" | "other";
    label: string;
    recipientName: string;
    phone?: string;
    streetAddress: string;
    apartment?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault?: boolean;
}

interface AddressCardProps {
    address: Address;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onSetDefault: (id: string) => void;
}

const addressIcons = {
    home: Home,
    office: Building2,
    other: MapPin,
};

export function AddressCard({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) {
    const Icon = addressIcons[address.type];

    return (
        <div
            className={cn(
                "relative rounded-xl p-5 transition-all",
                address.isDefault
                    ? "border-2 border-primary/30 bg-primary/5"
                    : "border border-border bg-card hover:border-muted-foreground/30"
            )}
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            "size-10 rounded-lg flex items-center justify-center",
                            address.isDefault ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                        )}
                    >
                        <Icon className="size-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground">{address.label}</span>
                            {address.isDefault && (
                                <Badge className="bg-primary text-white text-[10px] uppercase font-bold tracking-wider">
                                    Default
                                </Badge>
                            )}
                        </div>
                        <span className="text-sm text-muted-foreground">{address.recipientName}</span>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                            <MoreVertical className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(address.id)}>
                            <Edit2 className="size-4 mr-2" />
                            Edit Address
                        </DropdownMenuItem>
                        {!address.isDefault && (
                            <DropdownMenuItem onClick={() => onSetDefault(address.id)}>
                                <Check className="size-4 mr-2" />
                                Set as Default
                            </DropdownMenuItem>
                        )}
                        {!address.isDefault && (
                            <DropdownMenuItem
                                onClick={() => onDelete(address.id)}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="size-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Address Details */}
            <div className="text-sm text-muted-foreground leading-relaxed pl-13">
                <p>{address.streetAddress}</p>
                {address.apartment && <p>{address.apartment}</p>}
                <p>
                    {address.city}, {address.state} {address.zipCode}
                </p>
                <p>{address.country}</p>
                {address.phone && <p className="mt-2 text-foreground font-medium">{address.phone}</p>}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(address.id)}
                    className="gap-1 text-muted-foreground hover:text-primary"
                >
                    <Edit2 className="size-3.5" />
                    Edit
                </Button>
                {!address.isDefault && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSetDefault(address.id)}
                        className="gap-1 text-muted-foreground hover:text-primary"
                    >
                        <Check className="size-3.5" />
                        Set Default
                    </Button>
                )}
            </div>
        </div>
    );
}
