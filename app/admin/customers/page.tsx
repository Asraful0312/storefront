"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Upload,
    Plus,
    MoreVertical,
    TrendingUp,
    Users,
    Zap,
    UserPlus,
    DollarSign,
    Ban,
    User,
    Loader2,
    Trash2,
    Pencil,
    FileJson,
    FileSpreadsheet,
    Download,
    Star,
    Sparkles,
    History
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";

type CustomerStatus = "vip" | "new" | "returning" | "inactive";

const statusConfig: Record<CustomerStatus, { label: string; icon: React.ElementType; className: string }> = {
    vip: {
        label: "VIP",
        icon: Star,
        className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800",
    },
    new: {
        label: "New",
        icon: Sparkles,
        className: "bg-primary/10 text-primary border-primary/20",
    },
    returning: {
        label: "Returning",
        icon: History,
        className: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    },
    inactive: {
        label: "Inactive",
        icon: Ban,
        className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
    },
};

const filterChips = [
    { id: "all", label: "All Customers", icon: null },
    { id: "vip", label: "VIP", icon: Star, iconClass: "text-amber-500" },
    { id: "new", label: "New", icon: Sparkles, iconClass: "text-primary" },
    { id: "returning", label: "Returning", icon: History, iconClass: "text-blue-500" },
    { id: "inactive", label: "Inactive", icon: Ban, iconClass: "text-gray-400" },
];

export default function AdminCustomersPage() {
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch customers with their stats (using server-side search)
    const customersData = useQuery(api.users.listCustomersWithStats, {
        limit: 50,
        search: debouncedSearch || undefined
    });
    const deleteUser = useMutation(api.users.adminDeleteUser);
    const onlineUsers = useQuery(api.presence.getOnlineUsers); // Fetch online users
    const isLoading = customersData === undefined;


    const handleDelete = async (userId: Id<"users">) => {
        if (confirm("Are you sure you want to delete this customer? This action cannot be undone.")) {
            try {
                await deleteUser({ userId });
            } catch (error) {
                alert("Failed to delete customer");
                console.error(error);
            }
        }
    };

    // Determine status for a user based on their data
    const getUserStatus = (user: any): CustomerStatus => {
        if (user.tags?.includes("VIP")) return "vip";
        // ... rest of logic
        // If created in the last 30 days
        const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        if (user._creationTime > oneMonthAgo) return "new";

        // If has multiple orders
        if (user.totalOrders > 1) return "returning";

        // Default to inactive if no orders or old orders
        // (In a real app, logic would be stricter, e.g. no orders in 6 months)
        return "inactive";
    };

    // Filter customers
    const filteredCustomers = (customersData?.users ?? []).filter((user) => {
        const status = getUserStatus(user);
        const matchesFilter = activeFilter === "all" || status === activeFilter;

        // Note: Search is now handled on the server
        return matchesFilter;
    });

    const totalRevenue = (customersData?.users ?? []).reduce((sum, user) => sum + user.totalSpent, 0);

    const exportCSV = () => {
        const headers = ["ID", "Name", "Email", "Role", "Orders", "Spent", "Joined"];
        const rows = filteredCustomers.map(user => [
            user._id,
            `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
            user.email,
            user.role,
            user.totalOrders,
            user.totalSpent.toFixed(2),
            new Date(user._creationTime).toLocaleDateString()
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const exportJSON = () => {
        const jsonContent = JSON.stringify(filteredCustomers, null, 2);
        const blob = new Blob([jsonContent], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `customers_export_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const exportPDF = () => {
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(18);
        doc.text("Customer Report", 14, 22);

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);

        const headers = [["ID", "Name", "Email", "Role", "Orders", "Spent", "Joined"]];
        const data = filteredCustomers.map(user => [
            user._id,
            `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
            user.email,
            user.role,
            user.totalOrders,
            `$${user.totalSpent.toFixed(2)}`,
            new Date(user._creationTime).toLocaleDateString()
        ]);

        autoTable(doc, {
            head: headers,
            body: data,
            startY: 35,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] }
        });

        doc.save(`customers_export_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <main className="flex-1 px-4 md:px-10 py-8 max-w-[1440px] mx-auto w-full overflow-y-auto">
            {/* Page Heading & Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black leading-tight tracking-tight text-foreground">
                        Customer Management
                    </h1>
                    <p className="text-muted-foreground text-base font-normal">
                        Manage your customer base, view activity, and track revenue.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <Download className="size-4" />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={exportCSV}>
                                <FileSpreadsheet className="size-4 mr-2" />
                                Export as CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={exportJSON}>
                                <FileJson className="size-4 mr-2" />
                                Export as JSON
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={exportPDF}>
                                <FileSpreadsheet className="size-4 mr-2" />
                                Export as PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Link href="/admin/customers/new" className={buttonVariants({
                        className: "gap-2",
                    })}>
                        <Plus className="size-4" />
                        Add Customer
                    </Link>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="flex flex-col gap-2 rounded-xl p-6 bg-card border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm font-medium">Total Customers</p>
                        <Users className="size-6 text-primary" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        {isLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <p className="text-2xl font-bold text-foreground">{customersData?.totalCount ?? 0}</p>
                        )}
                        <p className="text-green-600 text-sm font-medium flex items-center gap-0.5">
                            <TrendingUp className="size-4" />
                            12%
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-2 rounded-xl p-6 bg-card border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm font-medium">Active Now</p>
                        <Zap className="size-6 text-primary" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        {onlineUsers === undefined ? (
                            <Skeleton className="h-8 w-12" />
                        ) : (
                            <p className="text-2xl font-bold text-foreground">{onlineUsers}</p>
                        )}
                        {/* <p className="text-green-600 text-sm font-medium flex items-center gap-0.5">
                            <TrendingUp className="size-4" />
                            --
                        </p> */}
                    </div>
                </div>

                <div className="flex flex-col gap-2 rounded-xl p-6 bg-card border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm font-medium">New this Month</p>
                        <UserPlus className="size-6 text-primary" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        {isLoading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <p className="text-2xl font-bold text-foreground">{customersData?.newThisMonth ?? 0}</p>
                        )}
                        {/* <p className="text-green-600 text-sm font-medium flex items-center gap-0.5">
                            <TrendingUp className="size-4" />
                            2%
                        </p> */}
                    </div>
                </div>

                <div className="flex flex-col gap-2 rounded-xl p-6 bg-card border border-border shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-muted-foreground text-sm font-medium">Total Revenue</p>
                        <DollarSign className="size-6 text-primary" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        {isLoading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <p className="text-2xl font-bold text-foreground">${totalRevenue.toFixed(0)}</p>
                        )}
                        {/* <p className="text-green-600 text-sm font-medium flex items-center gap-0.5">
                            <TrendingUp className="size-4" />
                            8%
                        </p> */}
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                {/* Filter Chips */}
                <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
                    {filterChips.map((chip) => {
                        const Icon = chip.icon;
                        return (
                            <button
                                key={chip.id}
                                onClick={() => setActiveFilter(chip.id)}
                                className={cn(
                                    "flex h-9 px-4 items-center justify-center rounded-full text-sm font-medium transition-colors whitespace-nowrap gap-2",
                                    activeFilter === chip.id
                                        ? "bg-foreground text-background"
                                        : "bg-card border border-border text-foreground hover:bg-secondary"
                                )}
                            >
                                {Icon && <Icon className={cn("size-4", activeFilter !== chip.id && chip.iconClass)} />}
                                {chip.label}
                            </button>
                        );
                    })}
                </div>

                {/* Table Specific Search */}
                <div className="relative w-full lg:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, email..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                        <thead>
                            <tr className="bg-secondary/50 border-b border-border">
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    Orders
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    Total Spent
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    Last Order
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        <td className="px-6 py-4"><Skeleton className="h-10 w-48" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-20" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                                        <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                                        <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                                        <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-24 ml-auto" /></td>
                                        <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-8 ml-auto" /></td>
                                    </tr>
                                ))
                            ) : filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                        No customers found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map((customer) => {
                                    const statusKey = getUserStatus(customer);
                                    const status = statusConfig[statusKey];
                                    const StatusIcon = status.icon;
                                    const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Unknown";
                                    const initials = fullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

                                    return (
                                        <tr key={customer._id} className="hover:bg-primary/5 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {customer.avatarUrl ? (
                                                        <div
                                                            className="size-10 rounded-full bg-cover bg-center"
                                                            style={{ backgroundImage: `url('${customer.avatarUrl}')` }}
                                                        />
                                                    ) : (
                                                        <div
                                                            className={cn(
                                                                "size-10 rounded-full flex items-center justify-center font-bold text-sm bg-primary/10 text-primary"
                                                            )}
                                                        >
                                                            {initials || "?"}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-bold text-foreground">{fullName}</p>
                                                        <p className="text-xs text-muted-foreground">Joined: {new Date(customer._creationTime).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={cn(
                                                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border",
                                                        status.className
                                                    )}
                                                >
                                                    <StatusIcon className="size-3.5" />
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-foreground">{customer.email}</td>
                                            <td className="px-6 py-4 text-sm text-foreground text-right">{customer.totalOrders}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-foreground text-right">
                                                ${customer.totalSpent.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground text-right">
                                                {customer.lastOrderDate
                                                    ? new Date(customer.lastOrderDate).toLocaleDateString()
                                                    : "Never"}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button variant="link" className="text-primary font-medium text-sm p-0 h-auto" asChild>
                                                        <Link href={`/admin/customers/${customer._id}`}>View</Link>
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="size-8">
                                                                <MoreVertical className="size-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild className="focus:text-blue-500">
                                                                <Link className="text-blue-500" href={`/admin/customers/${customer._id}/edit`}>
                                                                    <Pencil className="size-4 mr-2 text-blue-500" />
                                                                    Edit Customer
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10 cursor-pointer"
                                                                onClick={() => handleDelete(customer._id as Id<"users">)}
                                                            >
                                                                <Trash2 className="size-4 mr-2 text-red-600" />
                                                                Delete Customer
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-border bg-card px-4 py-3 sm:px-6">
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Showing <span className="font-medium text-foreground">{isLoading ? "..." : "1"}</span> to{" "}
                                <span className="font-medium text-foreground">{isLoading ? "..." : filteredCustomers.length}</span> of{" "}
                                <span className="font-medium text-foreground">{isLoading ? "..." : customersData?.totalCount ?? 0}</span> results
                            </p>
                        </div>
                        <div>
                            {/* Pagination Logic would be implemented here connecting to Convex cursor */}
                            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm opacity-50 pointer-events-none">
                                <Button variant="outline" size="icon" className="rounded-r-none">
                                    <ChevronLeft className="size-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-none bg-primary text-white border-primary font-semibold"
                                >
                                    1
                                </Button>
                                <Button variant="outline" size="icon" className="rounded-l-none">
                                    <ChevronRight className="size-4" />
                                </Button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
