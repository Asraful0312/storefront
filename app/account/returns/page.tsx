"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Filter, Plus, ArrowLeft, PackageX } from "lucide-react";
import { Header, Footer, Breadcrumb } from "@/components/storefront";
import { AccountSidebar, Pagination } from "@/components/account";
import { ReturnRequestCard } from "@/components/account/ReturnRequestCard";
import type { ReturnRequest, ReturnStatus } from "@/components/account/returns-types";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDate } from "@/lib/utils";

export default function ReturnsPage() {
    const router = useRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState<string>("all");

    const returns = useQuery(api.returns.listMyReturns);

    const breadcrumbItems = [
        { label: "Home", href: "/" },
        { label: "My Account", href: "/account" },
        { label: "Returns" },
    ];

    const handleViewDetails = (id: string) => {
        router.push(`/account/returns/${id}`);
    };

    const handleStartReturn = () => {
        router.push("/account/returns/new");
    };

    // Transform backend data to frontend model
    const formattedReturns: ReturnRequest[] = returns?.map((r) => ({
        id: r._id,
        orderId: r.orderId, // Should format if it's an ID
        orderDate: r.orderDate ? formatDate(r.orderDate) : "N/A",
        returnDate: formatDate(r.submissionDate),
        status: r.status as ReturnStatus,
        reason: r.reason,
        refundAmount: r.refundAmount || 0, // Should calculate or use estimated
        refundMethod: r.refundMethod,
        items: r.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            image: item.image,
            quantity: item.quantity,
            price: item.price / 100,
        })),
    })) || [];

    // Filter returns based on status
    const filteredReturns =
        filterStatus === "all"
            ? formattedReturns
            : formattedReturns.filter((r) => r.status === filterStatus);

    if (returns === undefined) {
        return (
            <>
                <Header />
                <div className="min-h-screen flex items-center justify-center">Loading...</div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />

            <div className="grow w-full max-w-7xl mx-auto px-4 md:px-10 py-8">
                {/* Breadcrumbs */}
                <div className="mb-6">
                    <Breadcrumb items={breadcrumbItems} />
                </div>

                <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
                    {/* Sidebar */}
                    <AccountSidebar userName="User" /> 

                    {/* Main Content */}
                    <main className="flex-1 min-w-0">
                        {/* Page Header & Filters */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight mb-2">Returns & Refunds</h2>
                                <p className="text-muted-foreground">
                                    Track your return requests and refund status
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="gap-2" variant="outline">
                                            {filterStatus === "all" ? "All Returns" : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
                                            <ChevronDown className="size-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => setFilterStatus("all")}>
                                            All Returns
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setFilterStatus("pending")}>
                                            Pending
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setFilterStatus("approved")}>
                                            Approved
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setFilterStatus("processing")}>
                                            Processing
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setFilterStatus("completed")}>
                                            Refunded
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setFilterStatus("rejected")}>
                                            Rejected
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                <Button onClick={handleStartReturn} className="gap-2">
                                    <Plus className="size-4" />
                                    Start a Return
                                </Button>
                            </div>
                        </div>

                        {/* Returns Grid */}
                        {filteredReturns.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredReturns.map((returnRequest) => (
                                    <ReturnRequestCard
                                        key={returnRequest.id}
                                        returnRequest={returnRequest}
                                        onViewDetails={handleViewDetails}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-xl border border-border">
                                <PackageX className="size-16 text-muted-foreground mb-4" />
                                <h3 className="text-xl font-bold text-foreground mb-2">No returns found</h3>
                                <p className="text-muted-foreground mb-6 max-w-md">
                                    {filterStatus === "all" 
                                        ? "You haven't made any return requests yet."
                                        : `You don't have any returns with status "${filterStatus}".`
                                    }
                                </p>
                                <Button variant="outline" className="gap-2" onClick={handleStartReturn}>
                                    <Plus className="size-4" />
                                    Start a Return
                                </Button>
                            </div>
                        )}

                        {/* Pagination - Placeholder for now as backend pagination isn't implemented in listMyReturns yet */}
                        {/* 
                        {filteredReturns.length > 0 && (
                            <div className="mt-10">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={1}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        )} 
                        */}

                        {/* Help Section */}
                        <div className="mt-10 p-6 bg-secondary/30 rounded-xl border border-border text-center">
                            <h3 className="font-bold text-foreground mb-2">Need Help with a Return?</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Our support team is here to help you with any return-related questions.
                            </p>
                            <Button variant="outline">Contact Support</Button>
                        </div>
                    </main>
                </div>
            </div>

            <Footer />
        </>
    );
}
