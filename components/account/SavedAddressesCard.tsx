"use client";

import { Home, Building2, Edit2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SavedAddress {
    id: string;
    type: "home" | "office" | "other";
    label: string;
    address: string[];
    isDefault?: boolean;
}

interface SavedAddressesCardProps {
    addresses: SavedAddress[];
    onAddNew: () => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

const addressIcons = {
    home: Home,
    office: Building2,
    other: Building2,
};

export function SavedAddressesCard({
    addresses,
    onAddNew,
    onEdit,
    onDelete,
}: SavedAddressesCardProps) {
    return (
        <section className="bg-card rounded-xl shadow-sm border border-border flex flex-col h-full">
            <div className="px-6 py-5 border-b border-border flex justify-between items-center">
                <h2 className="text-lg font-bold text-foreground">Saved Addresses</h2>
                <Button variant="ghost" size="sm" onClick={onAddNew} className="gap-1 text-primary">
                    <Plus className="size-4" />
                    Add New
                </Button>
            </div>
            <div className="p-6 grid gap-4 flex-1">
                {addresses.map((address) => {
                    const Icon = addressIcons[address.type];

                    return (
                        <div
                            key={address.id}
                            className={cn(
                                "relative rounded-lg p-4 transition-all",
                                address.isDefault
                                    ? "border-2 border-primary/20 bg-primary/5"
                                    : "border border-border bg-card hover:border-muted-foreground/30"
                            )}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <Icon
                                        className={cn(
                                            "size-5",
                                            address.isDefault ? "text-primary" : "text-muted-foreground"
                                        )}
                                    />
                                    <span className="font-bold text-foreground text-sm">{address.label}</span>
                                </div>
                                {address.isDefault && (
                                    <Badge className="bg-primary text-white text-[10px] uppercase font-bold tracking-wider">
                                        Default
                                    </Badge>
                                )}
                            </div>
                            <div className="text-sm text-muted-foreground leading-relaxed pl-7">
                                {address.address.map((line, idx) => (
                                    <span key={idx}>
                                        {line}
                                        {idx < address.address.length - 1 && <br />}
                                    </span>
                                ))}
                            </div>
                            <div className="flex justify-end gap-2 mt-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground hover:text-primary"
                                    onClick={() => onEdit(address.id)}
                                >
                                    <Edit2 className="size-4" />
                                </Button>
                                {!address.isDefault && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8 text-muted-foreground hover:text-red-500"
                                        onClick={() => onDelete(address.id)}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
