"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ChevronDown,
    ChevronUp,
    Search,
    Filter,
    MoreVertical,
    CheckCircle,
    XCircle,
    RotateCcw,
    Clock,
    AlertCircle,
    Download,
    Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { formatDate, cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

type ReturnStatus = "pending" | "approved" | "rejected" | "refunded" | "completed";

const statusConfig: Record<ReturnStatus, { label: string; className: string; icon: any }> = {
    pending: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200", icon: Clock },
    approved: { label: "Approved", className: "bg-blue-100 text-blue-800 border-blue-200", icon: CheckCircle },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
    refunded: { label: "Refunded", className: "bg-green-100 text-green-800 border-green-200", icon: RotateCcw },
    completed: { label: "Completed", className: "bg-gray-100 text-gray-800 border-gray-200", icon: CheckCircle },
};

export default function AdminReturnsPage() {
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedReturnId, setExpandedReturnId] = useState<Id<"returnRequests"> | null>(null);

    const returns = useQuery(api.returns.listAllReturns, { 
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: 50 
    });
    
    const stats = useQuery(api.returns.getReturnStats);
    const updateStatus = useMutation(api.returns.updateReturnStatus);

    const handleStatusUpdate = async (returnId: Id<"returnRequests">, newStatus: Exclude<ReturnStatus, "pending">) => {
        try {
            await updateStatus({
                returnId,
                status: newStatus,
            });
            toast.success(`Return request ${newStatus}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };
// ...


    const toggleExpand = (id: Id<"returnRequests">) => {
        setExpandedReturnId(expandedReturnId === id ? null : id);
    };

    const filteredReturns = returns?.filter(r => 
        r.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.userEmail?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 overflow-y-auto bg-background">
            <div className="px-6 md:px-10 py-8 max-w-[1400px] mx-auto flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-foreground">Returns Management</h1>
                        <p className="text-muted-foreground mt-1">Manage return requests and refunds.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="gap-2">
                            <Download className="size-4" /> Export
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Returns</CardTitle>
                            <RotateCcw className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                            <Clock className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600">{stats?.pending || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Approved</CardTitle>
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats?.approved || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Table */}
                <div className="flex flex-col gap-4 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-border flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                            {["all", "pending", "approved", "rejected", "refunded", "completed"].map((status) => (
                                <Button
                                    key={status}
                                    variant={statusFilter === status ? "default" : "secondary"}
                                    size="sm"
                                    onClick={() => setStatusFilter(status)}
                                    className="capitalize whitespace-nowrap"
                                >
                                    {status}
                                </Button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search order #, customer..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order #</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Refund Method</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!filteredReturns ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                                    </TableRow>
                                ) : filteredReturns.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No returns found.</TableCell>
                                    </TableRow>
                                ) : (
                                    filteredReturns.map((request) => {
                                        const StatusIcon = statusConfig[request.status as ReturnStatus]?.icon || AlertCircle;
                                        return (
                                            <>
                                                <TableRow 
                                                    key={request._id} 
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() => toggleExpand(request._id)}
                                                >
                                                    <TableCell className="font-medium text-primary">#{request.orderNumber}</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{request.userName}</span>
                                                            <span className="text-xs text-muted-foreground">{request.userEmail}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{formatDate(request.submissionDate)}</TableCell>
                                                    <TableCell>
                                                        <Badge 
                                                            variant="outline" 
                                                            className={cn("gap-1", statusConfig[request.status as ReturnStatus]?.className)}
                                                        >
                                                            <StatusIcon className="size-3" />
                                                            {statusConfig[request.status as ReturnStatus]?.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="capitalize">{request.refundMethod.replace('_', ' ')}</TableCell>
                                                    <TableCell>{request.items.length} items</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); toggleExpand(request._id); }}>
                                                            {expandedReturnId === request._id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                                {/* Expanded Details */}
                                                {expandedReturnId === request._id && (
                                                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                                                        <TableCell colSpan={7} className="p-0">
                                                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-border">
                                                                <div>
                                                                    <h4 className="font-semibold mb-4">Request Details</h4>
                                                                    <div className="space-y-4">
                                                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                                                            <span className="text-muted-foreground">Reason:</span>
                                                                            <span className="font-medium">{request.reason}</span>
                                                                            
                                                                            <span className="text-muted-foreground">Submitted:</span>
                                                                            <span>{new Date(request.submissionDate).toLocaleString()}</span>

                                                                            <span className="text-muted-foreground">Admin Notes:</span>
                                                                            <span className="italic text-muted-foreground">{request.adminNotes || "None"}</span>
                                                                        </div>

                                                                        {request.images && request.images.length > 0 && (
                                                                            <div className="mt-4">
                                                                                <h5 className="text-sm font-semibold mb-2">Customer Photos:</h5>
                                                                                <div className="flex gap-2 flex-wrap">
                                                                                    {request.images.map((img: string, i: number) => (
                                                                                        <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded overflow-hidden border hover:opacity-80 transition-opacity">
                                                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                                            <img src={img} alt="Proof" className="w-full h-full object-cover" />
                                                                                        </a>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        
                                                                        <div className="mt-4">
                                                                            <h5 className="text-sm font-semibold mb-2">Items to Return:</h5>
                                                                            <ul className="space-y-3">
                                                                                {request.items.map((item: any, idx: number) => (
                                                                                    <li key={idx} className="flex gap-3 bg-background p-3 rounded-md border items-center">
                                                                                        <div 
                                                                                            className="h-10 w-10 rounded bg-cover bg-center shrink-0 bg-secondary border"
                                                                                            style={item.image ? { backgroundImage: `url('${item.image}')` } : {}}
                                                                                        />
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="text-sm font-medium truncate">{item.name || "Unknown Item"}</p>
                                                                                            <p className="text-xs text-muted-foreground">ID: {item.itemId}</p>
                                                                                        </div>
                                                                                        <div className="text-right">
                                                                                            <span className="text-sm font-bold">Qty: {item.quantity}</span>
                                                                                        </div>
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <h4 className="font-semibold mb-4">Actions</h4>
                                                                    <div className="bg-background p-4 rounded-lg border border-border space-y-4">
                                                                        <div className="flex flex-col gap-2">
                                                                            <span className="text-sm font-medium">Update Status</span>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                <Button 
                                                                                    size="sm" 
                                                                                    variant="outline" 
                                                                                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-200"
                                                                                    onClick={() => handleStatusUpdate(request._id, "approved")}
                                                                                    disabled={request.status === "approved" || request.status === "completed"}
                                                                                >
                                                                                    Approve
                                                                                </Button>
                                                                                <Button 
                                                                                    size="sm" 
                                                                                    variant="outline" 
                                                                                    className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200"
                                                                                    onClick={() => handleStatusUpdate(request._id, "rejected")}
                                                                                    disabled={request.status === "rejected" || request.status === "completed"}
                                                                                >
                                                                                    Reject
                                                                                </Button>
                                                                                <Button 
                                                                                    size="sm" 
                                                                                    variant="outline" 
                                                                                    className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200"
                                                                                    onClick={() => handleStatusUpdate(request._id, "refunded")}
                                                                                    disabled={request.status === "refunded"}
                                                                                >
                                                                                    Mark Refunded
                                                                                </Button>
                                                                                 <Button 
                                                                                    size="sm" 
                                                                                    variant="outline" 
                                                                                    onClick={() => handleStatusUpdate(request._id, "completed")}
                                                                                    disabled={request.status === "completed"}
                                                                                >
                                                                                    Complete
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}
