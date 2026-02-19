"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Clock, Package, RotateCcw, XCircle, AlertCircle } from "lucide-react";
import { Header, Footer, Breadcrumb } from "@/components/storefront";
import { AccountSidebar } from "@/components/account";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { formatDate, cn } from "@/lib/utils";

type ReturnStatus = "pending" | "approved" | "rejected" | "refunded" | "completed";

const statusConfig: Record<ReturnStatus, { label: string; className: string; icon: any; description: string }> = {
    pending: { 
        label: "Pending Review", 
        className: "bg-amber-100 text-amber-800 border-amber-200", 
        icon: Clock,
        description: "Your return request has been received and is being reviewed by our team."
    },
    approved: { 
        label: "Approved", 
        className: "bg-blue-100 text-blue-800 border-blue-200", 
        icon: CheckCircle,
        description: "Your return has been approved. Please ship the items back to us."
    },
    rejected: { 
        label: "Rejected", 
        className: "bg-red-100 text-red-800 border-red-200", 
        icon: XCircle,
        description: "Your return request was not approved. See details below."
    },
    refunded: { 
        label: "Refunded", 
        className: "bg-green-100 text-green-800 border-green-200", 
        icon: RotateCcw,
        description: "Your refund has been processed."
    },
    completed: { 
        label: "Completed", 
        className: "bg-gray-100 text-gray-800 border-gray-200", 
        icon: CheckCircle,
        description: "The return process is complete."
    },
};

export default function ReturnDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const returnId = params.id as Id<"returnRequests">;

    const returnRequest = useQuery(api.returns.getReturn, { returnId });

    const breadcrumbItems = [
        { label: "Home", href: "/" },
        { label: "My Account", href: "/account" },
        { label: "Returns", href: "/account/returns" },
        { label: "Return Details" },
    ];

    if (returnRequest === undefined) {
        return (
            <>
                <Header />
                <div className="min-h-screen flex items-center justify-center">Loading...</div>
                <Footer />
            </>
        );
    }

    if (returnRequest === null) {
        return (
            <>
                <Header />
                <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                    <h2 className="text-xl font-bold">Return Request Not Found</h2>
                    <Link href="/account/returns">
                        <Button variant="outline">Back to Returns</Button>
                    </Link>
                </div>
                <Footer />
            </>
        );
    }

    const StatusIcon = statusConfig[returnRequest.status as ReturnStatus]?.icon || AlertCircle;
    const statusInfo = statusConfig[returnRequest.status as ReturnStatus];

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
                        <div className="mb-6">
                            <Link href="/account/returns" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-4">
                                <ArrowLeft className="size-4" /> Back to Returns
                            </Link>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                        Return #{returnRequest._id.substring(0, 8)}
                                        <Badge variant="outline" className={cn("gap-1 font-normal", statusInfo.className)}>
                                            <StatusIcon className="size-3" />
                                            {statusInfo.label}
                                        </Badge>
                                    </h2>
                                    <p className="text-muted-foreground mt-1">
                                        Requested on {formatDate(returnRequest.submissionDate)} • Order #{returnRequest.orderNumber}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Status Card */}
                        <Card className="mb-6 border-l-4 border-l-primary/50">
                            <CardContent className="pt-6">
                                <div className="flex gap-4 items-start">
                                    <div className="mt-1 bg-primary/10 p-2 rounded-full">
                                        <StatusIcon className="size-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg mb-1">{statusInfo.label}</h3>
                                        <p className="text-muted-foreground">{statusInfo.description}</p>
                                        
                                        {returnRequest.rejectionReason && (
                                            <div className="mt-3 bg-red-50 text-red-800 p-3 rounded-md text-sm border border-red-100">
                                                <strong>Reason for rejection:</strong> {returnRequest.rejectionReason}
                                            </div>
                                        )}

                                        {returnRequest.adminNotes && (
                                            <div className="mt-3 bg-secondary/50 p-3 rounded-md text-sm border border-border">
                                                <strong>Note from support:</strong> {returnRequest.adminNotes}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column: Items & Refund Info */}
                            <div className="lg:col-span-2 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Items to Return</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            {returnRequest.items.map((item: any, idx: number) => (
                                                <div key={idx} className="flex gap-4">
                                                    <div 
                                                        className="h-20 w-20 rounded-md bg-cover bg-center shrink-0 bg-secondary border"
                                                        style={item.image ? { backgroundImage: `url('${item.image}')` } : {}}
                                                    />
                                                    <div className="flex-1">
                                                        <h4 className="font-medium">{item.name || "Unknown Item"}</h4>
                                                        <p className="text-sm text-muted-foreground mt-1">Quantity: {item.quantity}</p>
                                                        <div className="mt-2 text-sm bg-secondary/30 inline-block px-2 py-1 rounded">
                                                            Reason: {item.reason}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Refund Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-muted-foreground">Refund Method</span>
                                            <span className="font-medium capitalize">{returnRequest.refundMethod.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b">
                                            <span className="text-muted-foreground">Original Order Total</span>
                                            <span className="font-medium">${(returnRequest.orderTotal ? returnRequest.orderTotal / 100 : 0).toFixed(2)}</span>
                                        </div>
                                        {/* Estimated refund - typically we'd calculate this based on returned items price */}
                                        <div className="flex justify-between items-center py-2">
                                            <span className="font-bold">Refund Amount</span>
                                            <span className="font-bold text-xl">
                                                {returnRequest.refundAmount 
                                                    ? `$${returnRequest.refundAmount.toFixed(2)}` 
                                                    : "Pending"}
                                            </span>
                                        </div>
                                    </CardContent>
                                    {(returnRequest.status === "approved" || returnRequest.status === "pending") && (
                                        <CardFooter className="bg-secondary/20 text-sm text-muted-foreground px-6 py-4">
                                            <p>Refunds are typically processed within 3-5 business days after we receive your return.</p>
                                        </CardFooter>
                                    )}
                                </Card>

                                {returnRequest.images && returnRequest.images.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-lg">Uploaded Photos</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex gap-2 flex-wrap">
                                                {returnRequest.images.map((img: string, i: number) => (
                                                    <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 rounded-md overflow-hidden border hover:opacity-80 transition-opacity">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={img} alt="Proof" className="w-full h-full object-cover" />
                                                    </a>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Right Column: Next Steps / Instructions */}
                            <div className="space-y-6">
                                <Card className="bg-primary/5 border-primary/20">
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <Package className="size-5 text-primary" /> Return Instructions
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4 text-sm">
                                        {returnRequest.status === "approved" ? (
                                            <>
                                                <p><strong>1. Pack your items:</strong> Place the items securely in the original packaging if possible.</p>
                                                <p><strong>2. Print shipping label:</strong> We've sent a shipping label to your email. Print it and attach it to the package.</p>
                                                <p><strong>3. Ship it:</strong> Drop off the package at any shipping carrier location.</p>
                                                <Button className="w-full mt-2" variant="outline">Download Label</Button>
                                            </>
                                        ) : (
                                            <>
                                                <p>Once your return is approved, you will realize instructions on how to ship your items back.</p>
                                                <p>Please allow 24-48 hours for our team to review your request.</p>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </main>
                </div>
            </div>

            <Footer />
        </>
    );
}
