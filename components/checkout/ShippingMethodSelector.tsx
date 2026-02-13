"use client";

import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { ShippingMethod } from "./types";

interface ShippingMethodSelectorProps {
    methods: ShippingMethod[];
    selected: string;
    onChange: (methodId: string) => void;
    onContinue: () => void;
    stepNumber: number;
    isOpen: boolean;
    onToggle: () => void;
    isCompleted?: boolean;
}

export function ShippingMethodSelector({
    methods,
    selected,
    onChange,
    onContinue,
    stepNumber,
    isOpen,
    onToggle,
    isCompleted,
}: ShippingMethodSelectorProps) {
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
                            Shipping Method
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
                        <RadioGroup value={selected} onValueChange={onChange} className="space-y-3">
                            {methods.map((method) => (
                                <Label
                                    key={method.id}
                                    htmlFor={method.id}
                                    className={cn(
                                        "relative flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors",
                                        selected === method.id
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-muted-foreground/50"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <RadioGroupItem value={method.id} id={method.id} />
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm">{method.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {method.estimatedDays}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="font-medium">
                                        {method.price === 0 ? "Free" : `$${method.price.toFixed(2)}`}
                                    </span>
                                </Label>
                            ))}
                        </RadioGroup>
                        <div className="mt-6 flex justify-end">
                            <Button onClick={onContinue} className="px-8">
                                Continue to Payment
                            </Button>
                        </div>
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}
