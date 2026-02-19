"use client"

import { useState, useEffect } from "react";
import {
    Save,
    CreditCard,
    Wallet,
    Banknote,
    Building2,
    Truck,
    Plus,
    Edit,
    Trash2,
    Sparkles,
    FileEdit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";

export default function PaymentsSettingsPage() {
    const paymentSettings = useQuery(api.paymentSettings.get);
    const shippingSettings = useQuery(api.shippingSettings.get);
    const taxSettings = useQuery(api.tax.get);

    const updatePaymentSettings = useMutation(api.paymentSettings.update);
    const updateShipping = useMutation(api.shippingSettings.update);
    const updateTax = useMutation(api.tax.update);

    const [isSaving, setIsSaving] = useState(false);

    // Payment Method State
    const [stripeEnabled, setStripeEnabled] = useState(true);
    const [codEnabled, setCodEnabled] = useState(false);
    const [codInstructions, setCodInstructions] = useState("");
    const [bankTransferEnabled, setBankTransferEnabled] = useState(false);
    const [bankName, setBankName] = useState("");
    const [accountHolder, setAccountHolder] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [routingNumber, setRoutingNumber] = useState("");
    const [swiftCode, setSwiftCode] = useState("");
    const [bankInstructions, setBankInstructions] = useState("");

    // Shipping State
    const [zones, setZones] = useState<any[]>([]);

    // Tax State
    const [taxMethod, setTaxMethod] = useState<"automatic" | "manual">("automatic");
    const [taxInclusive, setTaxInclusive] = useState(false);
    const [taxOnShipping, setTaxOnShipping] = useState(true);
    const [defaultTaxRate, setDefaultTaxRate] = useState("0");
    const [taxRules, setTaxRules] = useState<any[]>([]);

    // Modal States
    const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
    const [editingZone, setEditingZone] = useState<any>(null);
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<any>(null);

    // Load Payment Settings
    useEffect(() => {
        if (paymentSettings) {
            setStripeEnabled(paymentSettings.stripeEnabled ?? true);
            setCodEnabled(paymentSettings.codEnabled ?? false);
            setCodInstructions(paymentSettings.codInstructions || "");
            setBankTransferEnabled(paymentSettings.bankTransferEnabled ?? false);
            setBankName(paymentSettings.bankName || "");
            setAccountHolder(paymentSettings.accountHolder || "");
            setAccountNumber(paymentSettings.accountNumber || "");
            setRoutingNumber(paymentSettings.routingNumber || "");
            setSwiftCode(paymentSettings.swiftCode || "");
            setBankInstructions(paymentSettings.bankInstructions || "");
        }
    }, [paymentSettings]);

    // Load Shipping
    useEffect(() => {
        if (shippingSettings) {
            setZones(shippingSettings.zones || []);
        }
    }, [shippingSettings]);

    // Load Tax
    useEffect(() => {
        if (taxSettings) {
            setTaxMethod(taxSettings.method === "stripe" ? "automatic" : "manual");
            setTaxInclusive(taxSettings.taxInclusive);
            setTaxOnShipping(taxSettings.taxOnShipping);
            setDefaultTaxRate(taxSettings.defaultRate.toString());
            setTaxRules(taxSettings.rules || []);
        }
    }, [taxSettings]);

    // Shipping Zone Handlers
    const handleAddZone = () => {
        setEditingZone({
            id: `zone-${Date.now()}`,
            name: "",
            regions: [],
            rateType: "flat",
            baseRate: 0,
            deliveryTime: "3-5 Business Days",
            perKgRate: 0,
            freeShippingOverride: undefined,
        });
        setIsZoneModalOpen(true);
    };

    const handleEditZone = (zone: any) => {
        setEditingZone({ ...zone });
        setIsZoneModalOpen(true);
    };

    const handleSaveZone = () => {
        if (!editingZone) return;
        if (!editingZone.name) return alert("Name is required");

        setZones((prev) => {
            const index = prev.findIndex((z) => z.id === editingZone.id);
            if (index >= 0) {
                const newZones = [...prev];
                newZones[index] = editingZone;
                return newZones;
            } else {
                return [...prev, editingZone];
            }
        });
        setIsZoneModalOpen(false);
    };

    const handleDeleteZone = (id: string) => {
        if (confirm("Are you sure you want to delete this zone?")) {
            setZones((prev) => prev.filter((z) => z.id !== id));
        }
    };

    // Tax Rule Handlers
    const handleAddRule = () => {
        setEditingRule({ region: "", rate: 0 });
        setIsRuleModalOpen(true);
    };

    const handleSaveRule = () => {
        if (!editingRule.region) return alert("Region code is required");

        setTaxRules((prev) => {
            const index = prev.findIndex((r) => r.region === editingRule.region);
            if (index >= 0) {
                const newRules = [...prev];
                newRules[index] = editingRule;
                return newRules;
            } else {
                return [...prev, editingRule];
            }
        });
        setIsRuleModalOpen(false);
    };

    const handleDeleteRule = (region: string) => {
        setTaxRules((prev) => prev.filter((r) => r.region !== region));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Update Payment Settings
            await updatePaymentSettings({
                stripeEnabled,
                codEnabled,
                codInstructions: codInstructions || undefined,
                bankTransferEnabled,
                bankName: bankName || undefined,
                accountHolder: accountHolder || undefined,
                accountNumber: accountNumber || undefined,
                routingNumber: routingNumber || undefined,
                swiftCode: swiftCode || undefined,
                bankInstructions: bankInstructions || undefined,
            });

            // Update Shipping
            await updateShipping({
                zones: zones,
                dimWeightDivisor: shippingSettings?.dimWeightDivisor || 5000,
                returnPolicy: shippingSettings?.returnPolicy || "",
                freeShippingThreshold: shippingSettings?.freeShippingThreshold,
            });

            // Update Tax
            await updateTax({
                method: taxMethod,
                taxInclusive,
                taxOnShipping,
                defaultRate: parseFloat(defaultTaxRate) || 0,
                rules: taxRules,
            });

            alert("Settings saved successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to save settings.");
        } finally {
            setIsSaving(false);
        }
    };

    if (paymentSettings === undefined || shippingSettings === undefined || taxSettings === undefined) {
        return <div className="p-10">Loading settings...</div>;
    }

    return (
        <div className="flex-1 flex w-full">
            {/* Modal for Shipping Zones */}
            {isZoneModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-background rounded-lg p-6 w-full max-w-lg space-y-4 shadow-xl border">
                        <h2 className="text-xl font-bold">
                            {editingZone?.id.startsWith("zone-") && !zones.find((z) => z.id === editingZone.id) ? "Add Zone" : "Edit Zone"}
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Zone Name</label>
                                <Input
                                    value={editingZone?.name || ""}
                                    onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })}
                                    placeholder="e.g. North America"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Regions (Country Codes, comma separated)</label>
                                <Input
                                    value={editingZone?.regions?.join(", ") || ""}
                                    onChange={(e) =>
                                        setEditingZone({
                                            ...editingZone,
                                            regions: e.target.value.split(",").map((s: string) => s.trim()),
                                        })
                                    }
                                    placeholder="US, CA, MX"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Rate Type</label>
                                    <select
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                                        value={editingZone?.rateType || "flat"}
                                        onChange={(e) => setEditingZone({ ...editingZone, rateType: e.target.value })}
                                    >
                                        <option value="flat">Flat Rate</option>
                                        <option value="weight">Weight Based</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Delivery Time</label>
                                    <Input
                                        value={editingZone?.deliveryTime || ""}
                                        onChange={(e) => setEditingZone({ ...editingZone, deliveryTime: e.target.value })}
                                        placeholder="3-5 Days"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">Base Rate (Cents)</label>
                                    <Input
                                        type="number"
                                        value={editingZone?.baseRate || 0}
                                        onChange={(e) => setEditingZone({ ...editingZone, baseRate: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                {editingZone?.rateType === "weight" && (
                                    <div>
                                        <label className="text-sm font-medium">Per Kg Rate (Cents)</label>
                                        <Input
                                            type="number"
                                            value={editingZone?.perKgRate || 0}
                                            onChange={(e) =>
                                                setEditingZone({ ...editingZone, perKgRate: parseInt(e.target.value) || 0 })
                                            }
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setIsZoneModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveZone}>Save Zone</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal for Tax Rules */}
            {isRuleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-background rounded-lg p-6 w-full max-w-sm space-y-4 shadow-xl border">
                        <h2 className="text-xl font-bold">Edit Tax Rule</h2>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium">Region (Country Code)</label>
                                <Input
                                    value={editingRule?.region || ""}
                                    onChange={(e) => setEditingRule({ ...editingRule, region: e.target.value })}
                                    placeholder="e.g. US"
                                    maxLength={2}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Tax Rate (%)</label>
                                <Input
                                    type="number"
                                    value={editingRule?.rate || 0}
                                    onChange={(e) => setEditingRule({ ...editingRule, rate: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="outline" onClick={() => setIsRuleModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveRule}>Save Rule</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 bg-background p-8 md:p-12 overflow-y-auto">
                {/* Page Heading */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                    <div className="flex flex-col">
                        <h1 className="text-foreground text-3xl font-black leading-tight tracking-tight">
                            Payments and Shipping
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Configure how you receive money and deliver products.
                        </p>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="shadow-lg shadow-primary/20 gap-2">
                        <Save className="size-4" />
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>

                <div className="space-y-6">
                    {/* ── Section: Payment Gateways ── */}
                    <section className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-foreground text-xl font-bold leading-tight">Payment Methods</h2>
                            <p className="text-muted-foreground text-sm mt-1">
                                Enable the payment methods you want to offer to customers.
                            </p>
                        </div>

                        {/* Stripe */}
                        <div className="flex items-center gap-4 px-6 min-h-[80px] py-4 justify-between border-b border-border">
                            <div className="flex items-center gap-4">
                                <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-12">
                                    <CreditCard className="size-6" />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <p className="text-foreground text-base font-bold leading-normal">Stripe</p>
                                    <p className="text-muted-foreground text-sm font-normal leading-normal">
                                        Accept credit cards, Apple Pay, and Google Pay worldwide.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                                <Switch checked={stripeEnabled} onCheckedChange={setStripeEnabled} />
                            </div>
                        </div>

                        {/* Cash on Delivery */}
                        <div className="border-b border-border">
                            <div className="flex items-center gap-4 px-6 min-h-[80px] py-4 justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="text-green-600 flex items-center justify-center rounded-lg bg-green-600/10 shrink-0 size-12">
                                        <Banknote className="size-6" />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <p className="text-foreground text-base font-bold leading-normal">Cash on Delivery</p>
                                        <p className="text-muted-foreground text-sm font-normal leading-normal">
                                            Collect payment when the order is delivered. Physical products only.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    <Switch checked={codEnabled} onCheckedChange={setCodEnabled} />
                                </div>
                            </div>
                            {codEnabled && (
                                <div className="px-6 pb-5 ml-16">
                                    <label className="text-sm font-medium text-foreground block mb-2">
                                        Instructions for Customer (optional)
                                    </label>
                                    <textarea
                                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground min-h-[80px] resize-y"
                                        value={codInstructions}
                                        onChange={(e) => setCodInstructions(e.target.value)}
                                        placeholder="e.g. Please have exact change ready. Our delivery agent does not carry change."
                                    />
                                </div>
                            )}
                        </div>

                        {/* Bank Transfer */}
                        <div>
                            <div className="flex items-center gap-4 px-6 min-h-[80px] py-4 justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="text-blue-600 flex items-center justify-center rounded-lg bg-blue-600/10 shrink-0 size-12">
                                        <Building2 className="size-6" />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <p className="text-foreground text-base font-bold leading-normal">Bank Transfer</p>
                                        <p className="text-muted-foreground text-sm font-normal leading-normal">
                                            Customer transfers money directly to your bank account.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                    <Switch checked={bankTransferEnabled} onCheckedChange={setBankTransferEnabled} />
                                </div>
                            </div>
                            {bankTransferEnabled && (
                                <div className="px-6 pb-6 ml-16 space-y-4">
                                    <div className="p-5 rounded-lg border border-border bg-secondary/30 space-y-4">
                                        <p className="text-sm font-bold text-foreground">Bank Account Details</p>
                                        <p className="text-xs text-muted-foreground -mt-2">
                                            This information will be shown to customers at checkout so they can transfer funds.
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium">Bank Name</label>
                                                <Input
                                                    value={bankName}
                                                    onChange={(e) => setBankName(e.target.value)}
                                                    placeholder="e.g. Chase Bank"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium">Account Holder Name</label>
                                                <Input
                                                    value={accountHolder}
                                                    onChange={(e) => setAccountHolder(e.target.value)}
                                                    placeholder="e.g. John Doe"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium">Account Number / IBAN</label>
                                                <Input
                                                    value={accountNumber}
                                                    onChange={(e) => setAccountNumber(e.target.value)}
                                                    placeholder="e.g. 1234567890"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium">Routing Number</label>
                                                <Input
                                                    value={routingNumber}
                                                    onChange={(e) => setRoutingNumber(e.target.value)}
                                                    placeholder="e.g. 021000021"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium">SWIFT / BIC Code</label>
                                                <Input
                                                    value={swiftCode}
                                                    onChange={(e) => setSwiftCode(e.target.value)}
                                                    placeholder="e.g. CHASUS33"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Transfer Instructions (optional)</label>
                                            <textarea
                                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground min-h-[80px] resize-y mt-1"
                                                value={bankInstructions}
                                                onChange={(e) => setBankInstructions(e.target.value)}
                                                placeholder="e.g. Use your Order ID as the payment reference. Transfers typically take 1-3 business days to process."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ── Section: Shipping Zones ── */}
                    <section className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                        <div className="p-6 border-b border-border flex justify-between items-center">
                            <div>
                                <h2 className="text-foreground text-xl font-bold leading-tight">Shipping Zones</h2>
                                <p className="text-muted-foreground text-sm mt-1">
                                    Define where you ship and how much it costs.
                                </p>
                            </div>
                            <Button onClick={handleAddZone} variant="secondary" className="gap-2 font-bold">
                                <Plus className="size-4" />
                                Add Zone
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-secondary/50 text-muted-foreground text-xs uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Zone Name</th>
                                        <th className="px-6 py-4">Regions</th>
                                        <th className="px-6 py-4">Base Rate</th>
                                        <th className="px-6 py-4">Delivery</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {zones.length > 0 ? (
                                        zones.map((zone: any) => (
                                            <tr key={zone.id} className="hover:bg-secondary/30 transition-colors">
                                                <td className="px-6 py-4 text-foreground font-medium">{zone.name}</td>
                                                <td className="px-6 py-4 text-muted-foreground text-sm">
                                                    {zone.regions.join(", ")}
                                                </td>
                                                <td className="px-6 py-4 text-foreground text-sm font-bold">
                                                    ${(zone.baseRate / 100).toFixed(2)}
                                                    {zone.rateType === "weight" &&
                                                        ` + $${((zone.perKgRate || 0) / 100).toFixed(2)}/kg`}
                                                </td>
                                                <td className="px-6 py-4 text-muted-foreground text-sm">{zone.deliveryTime}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            onClick={() => handleEditZone(zone)}
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 text-primary hover:bg-primary/10"
                                                        >
                                                            <Edit className="size-4" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDeleteZone(zone.id)}
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 text-muted-foreground hover:bg-red-50 hover:text-red-500"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                                No shipping zones configured yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* ── Section: Tax Rules ── */}
                    <section className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mb-12">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-foreground text-xl font-bold leading-tight">Tax Rules</h2>
                            <p className="text-muted-foreground text-sm mt-1">
                                Manage how taxes are calculated for your orders.
                            </p>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Calculation Method */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <label
                                    className={cn(
                                        "relative flex cursor-pointer rounded-xl border-2 p-4 transition-all",
                                        taxMethod === "automatic"
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/20"
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="tax_method"
                                        className="sr-only"
                                        checked={taxMethod === "automatic"}
                                        onChange={() => setTaxMethod("automatic")}
                                    />
                                    <div className="flex gap-4">
                                        <div className={cn("mt-1", taxMethod === "automatic" ? "text-primary" : "text-muted-foreground")}>
                                            <Sparkles className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-foreground font-bold text-sm">Automatic Calculation</p>
                                            <p className="text-muted-foreground text-xs mt-1">
                                                Taxes are automatically calculated based on customer location.
                                            </p>
                                        </div>
                                    </div>
                                </label>
                                <label
                                    className={cn(
                                        "relative flex cursor-pointer rounded-xl border-2 p-4 transition-all",
                                        taxMethod === "manual"
                                            ? "border-primary bg-primary/5"
                                            : "border-border hover:border-primary/20"
                                    )}
                                >
                                    <input
                                        type="radio"
                                        name="tax_method"
                                        className="sr-only"
                                        checked={taxMethod === "manual"}
                                        onChange={() => setTaxMethod("manual")}
                                    />
                                    <div className="flex gap-4">
                                        <div className={cn("mt-1", taxMethod === "manual" ? "text-primary" : "text-muted-foreground")}>
                                            <FileEdit className="size-5" />
                                        </div>
                                        <div>
                                            <p className="text-foreground font-bold text-sm">Manual Rates</p>
                                            <p className="text-muted-foreground text-xs mt-1">
                                                Define flat tax percentages for specific regions manually.
                                            </p>
                                        </div>
                                    </div>
                                </label>
                            </div>

                            {/* Manual Tax Rules Table */}
                            {taxMethod === "manual" && (
                                <div className="border rounded-lg overflow-hidden mt-4">
                                    <div className="bg-secondary/50 px-4 py-3 border-b flex justify-between items-center">
                                        <h3 className="font-bold text-sm">Regional Tax Rates</h3>
                                        <Button size="sm" variant="outline" onClick={handleAddRule} className="h-8 gap-1">
                                            <Plus className="size-3" /> Add Region
                                        </Button>
                                    </div>
                                    <table className="w-full text-left text-sm">
                                        <thead className="text-muted-foreground font-medium border-b">
                                            <tr>
                                                <th className="px-4 py-3">Region</th>
                                                <th className="px-4 py-3">Tax Rate</th>
                                                <th className="px-4 py-3 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {taxRules.length > 0 ? (
                                                taxRules.map((rule) => (
                                                    <tr key={rule.region}>
                                                        <td className="px-4 py-3 font-medium">{rule.region}</td>
                                                        <td className="px-4 py-3">{rule.rate}%</td>
                                                        <td className="px-4 py-3 text-right">
                                                            <Button
                                                                onClick={() => handleDeleteRule(rule.region)}
                                                                variant="ghost"
                                                                size="icon"
                                                                className="size-6 text-muted-foreground hover:text-red-500"
                                                            >
                                                                <Trash2 className="size-3" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                                                        No manual tax rates configured.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Tax Options */}
                            <div className="space-y-4 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <p className="text-foreground text-sm font-bold">Default Tax Rate (%)</p>
                                        <p className="text-muted-foreground text-xs">
                                            Fallback tax rate if no specific rule applies.
                                        </p>
                                    </div>
                                    <Input
                                        type="number"
                                        className="w-24 h-9"
                                        value={defaultTaxRate}
                                        onChange={(e) => setDefaultTaxRate(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <p className="text-foreground text-sm font-bold">Tax inclusive pricing</p>
                                        <p className="text-muted-foreground text-xs">
                                            Product prices already include tax (VAT/GST style).
                                        </p>
                                    </div>
                                    <Switch checked={taxInclusive} onCheckedChange={setTaxInclusive} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <p className="text-foreground text-sm font-bold">Charge tax on shipping rates</p>
                                        <p className="text-muted-foreground text-xs">
                                            Apply the applicable tax rate to the shipping costs as well.
                                        </p>
                                    </div>
                                    <Switch checked={taxOnShipping} onCheckedChange={setTaxOnShipping} />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}
