"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, Filter, Plus, ArrowLeft, PackageX } from "lucide-react";
import { Header, Footer, Breadcrumb } from "@/components/storefront";
import { AccountSidebar, Pagination } from "@/components/account";
import { ReturnRequestCard } from "@/components/account/ReturnRequestCard";
import type { ReturnRequest } from "@/components/account/returns-types";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Sample returns data
const sampleReturns: ReturnRequest[] = [
    {
        id: "1",
        orderId: "49230",
        orderDate: "Oct 24, 2023",
        returnDate: "Nov 02, 2023",
        status: "processing",
        reason: "Item arrived damaged - packaging was crushed during shipping",
        refundAmount: 45.0,
        refundMethod: "Original Payment Method",
        items: [
            {
                id: "1",
                name: "Ceramic Vase",
                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAcvPsLKBc5Pdw7aejpfykQfUnSg7HCp9rXfLBSMQitd_16N-NfjjgX74HwThu_xqy1Hprn_N3brhpVE3umeoDTeOxiY7nFaAFHU1HHj9HoFduiCDpk1RogXLAH4-Rf5cjKrnVLOd3qf7WYuIm4CC_bIr9e_zM8TBx3eTaHqCuQzc--uQXIxKScf1ZvfkmtgOHlHlbBdCYdTsqHKySsrFolvl8qqVrw1c_XXa9h6U_qaXzlN4e3dpxTKxgk9Y3G70iN9Z0qXAUXOdA",
                quantity: 1,
                price: 45.0,
            },
        ],
    },
    {
        id: "2",
        orderId: "48102",
        orderDate: "Sep 15, 2023",
        returnDate: "Sep 22, 2023",
        status: "completed",
        reason: "Wrong size - ordered Medium but received Small",
        refundAmount: 89.0,
        refundMethod: "Store Credit",
        items: [
            {
                id: "2",
                name: "Linen Throw Pillow",
                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBBqnTCYwj4Q8drHBz_VKzcQaHZR76-hsl17DIWdyG5E8y_RPjVKBsWNCjcZsaonGqk6DU-jtcoXh2oDgHDRHckdx6fUILPY7lZue_mm0sB_uYznTDTa_HBMwJZKTSN857NJjEAHH6kpSvpLrX5h0uXjDLum44YriTJ7JzwdkSSafrAw2g3G3LnpAJWeOQ2V0yQtUj2Jhr6YrCa6dJqKx5OCrjob13AObOknO9TYe7-OgtwVT_LyvoE76HEHyN0eYlNZSgLzp8IOrw",
                quantity: 2,
                price: 44.5,
            },
        ],
    },
    {
        id: "3",
        orderId: "47229",
        orderDate: "Aug 30, 2023",
        returnDate: "Sep 05, 2023",
        status: "rejected",
        reason: "Changed my mind - no longer need the product",
        refundAmount: 120.0,
        refundMethod: "N/A",
        items: [
            {
                id: "3",
                name: "Acacia Serving Bowl",
                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBnJLLCGQBEO-jvKYpm6-o8b9844ivE3-QoE4gytQwqSU51vwgvtxaa19p5FMEDFRrWZqgXkiBMhTbsrV-6BUFxM2dbYqGCezTRFcyBmOF7LJ03_eb_gG0CjxFjszLXekIi3ppWjoV_qULBqetE_xwd4lU-XlZClsMSznK7S-CaeD-z3P4HboVpCxxU7zzPiW--TrAS00_kUoFTAHS7jC7Oq5L_4Os5aZZVOppg5LG4B-VfonRFd2k68_3P2lcKn_S0FPD6Wec2lnQ",
                quantity: 1,
                price: 120.0,
            },
        ],
    },
    {
        id: "4",
        orderId: "46890",
        orderDate: "Aug 20, 2023",
        returnDate: "Aug 28, 2023",
        status: "pending",
        reason: "Product does not match description - color is different from photos",
        refundAmount: 55.0,
        refundMethod: "Original Payment Method",
        items: [
            {
                id: "4",
                name: "Nordic Glass Carafe",
                image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAWhcpqd-lpQ_KkORFrzcfTkMsi10hclMUyztZeT-BahPR89hEXDmbkP1limlTDnHBHgXxpuvXb1_KTIsLTqnX6Oy5oZi62pAsCr2zv8oVsM0ixh1ggsGC0B6zUI5BzF1B-h78mgaYpO7hd9ftnnTUkiQZMjaEaxzELF8DMf_wq-5XgNn7WJCpjMghQez0PUyX602fCd7wPQilodPUL9NkIv9gg2OGXDLKnXxOaa0V80r8yblCSBk8-PLQFaHGB614UMjpscxGoODc",
                quantity: 1,
                price: 55.0,
            },
        ],
    },
];

export default function ReturnsPage() {
    const [currentPage, setCurrentPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState<string>("all");

    const breadcrumbItems = [
        { label: "Home", href: "/" },
        { label: "My Account", href: "/account" },
        { label: "Returns" },
    ];

    const handleViewDetails = (id: string) => {
        console.log("View return details:", id);
    };

    const handleStartReturn = () => {
        console.log("Start new return");
    };

    // Filter returns based on status
    const filteredReturns =
        filterStatus === "all"
            ? sampleReturns
            : sampleReturns.filter((r) => r.status === filterStatus);

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
                    <AccountSidebar userName="Alex" />

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
                                        <Button className="gap-2">
                                            All Returns
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

                                <Button variant="outline" onClick={handleStartReturn} className="gap-2">
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
                                    You don't have any return requests matching this filter.
                                </p>
                                <Link href="/account/orders">
                                    <Button variant="outline" className="gap-2">
                                        <ArrowLeft className="size-4" />
                                        View Orders
                                    </Button>
                                </Link>
                            </div>
                        )}

                        {/* Pagination */}
                        {filteredReturns.length > 0 && (
                            <div className="mt-10">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={1}
                                    onPageChange={setCurrentPage}
                                />
                            </div>
                        )}

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
