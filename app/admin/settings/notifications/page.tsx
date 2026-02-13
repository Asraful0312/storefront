"use client";

import { useState } from "react";
import { Mail, Users, UserPlus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: "owner" | "editor" | "viewer";
    status: "active" | "pending";
}

const teamMembers: TeamMember[] = [
    {
        id: "1",
        name: "Alexander Wright",
        email: "alex@my-store.com",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDqFLDwwUoXSVsWxrv8EkxeGlZdnNS1M4CklsgAj0zxJe5mnKAGde_-d7OdpWo6XzH7pdZy_fSTC1tVK9KymhD20xvydclYMe5i1T_l9rHetF1Q_tg5Zz2fzWMABe4bZtW51Zyg_yYHY1fJ26LmdNY2QCs-knikLl4p-Uv2TMSeagE4aDanDw0we_7XBhg5Oudd-I2e7lIU7DOtpQRfbmZjYoCz6Cix6OTXoduA3_2LtwJeUo9mAUOh1FTYzIm_w5ti6cPNt2sE4II",
        role: "owner",
        status: "active",
    },
    {
        id: "2",
        name: "Sarah Jenkins",
        email: "s.jenkins@my-store.com",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCxcvf8hruHya7GQrv0V74fnmgPwiBF2Z81WplsxNqcoxNi7VJ6bXuGdkV5lr68uZtJ6f67k85ZHL0GdJRTHl5WwNhQiaiIQPRdvv9cIkvyKC80NE-V-mKAMAmbgRWku1wArBbiL6-9MqMjpacd6eJSQvLkEL5b8E5eryYH89gqSBtFwpJr2a8effLa0FBNPjDlEpv-zMAYPjzWlMAxtBT4ve-DxUh92m2mSNgc4OkRk50wGwxvR2BBfhThdTNqTmm1hmqjg_8m8YQ",
        role: "editor",
        status: "active",
    },
    {
        id: "3",
        name: "Marcus Chen",
        email: "m.chen@contractor.com",
        avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuARossdMlPYWnEPl6xYkxcvruvTrp7KtXacuBFfzY4II-HrkBxXIHELdjDwncWbb2TqpOLBA5r5UC_zOhej29-OWf7z97V3AiSHPOFVgLRSFAhuyphlBkuUcGadf9feEqO4PSOPkKXaMTn72mXVYKh_ljZBY3yj2cGYOtoqmeaSdTZNaI5mNFXonw0eR3CunlEoZoixCKWDWe5IrqE0Jkco6mlSVduTEm-KYm0WMrQ20bC9TBilSUvkdz0vfZlgba_yPpQuFR-KX3U",
        role: "viewer",
        status: "pending",
    },
];

const roleConfig = {
    owner: { label: "Owner", className: "bg-primary/10 text-primary" },
    editor: { label: "Editor", className: "bg-blue-100 text-blue-700" },
    viewer: { label: "Viewer", className: "bg-gray-100 text-gray-600" },
};

export default function NotificationsSettingsPage() {
    const [orderConfirmation, setOrderConfirmation] = useState(true);
    const [shippingUpdate, setShippingUpdate] = useState(true);
    const [lowStockAlerts, setLowStockAlerts] = useState(false);

    return (
        <main className="flex-1 bg-background p-8 md:p-12 overflow-y-auto">
            {/* Page Heading */}
            <div className="flex flex-col gap-2 mb-8">
                <h2 className="text-foreground text-3xl font-black leading-tight tracking-tight">
                    Notifications & Team
                </h2>
                <p className="text-muted-foreground text-sm md:text-base font-normal">
                    Configure your automated email alerts and manage admin access permissions.
                </p>
            </div>

            <div className="flex flex-col gap-8">
                {/* Email Notifications Section */}
                <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-border pb-2">
                        <Mail className="size-5 text-primary" />
                        <h3 className="text-foreground text-lg font-bold">Email Notifications</h3>
                    </div>
                    <div className="grid gap-3">
                        {/* Toggle Card 1 */}
                        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex flex-col gap-1">
                                <p className="text-foreground text-base font-bold">Order Confirmation Email</p>
                                <p className="text-muted-foreground text-sm font-normal">
                                    Sent to customers immediately after a successful purchase.
                                </p>
                            </div>
                            <Switch checked={orderConfirmation} onCheckedChange={setOrderConfirmation} />
                        </div>
                        {/* Toggle Card 2 */}
                        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex flex-col gap-1">
                                <p className="text-foreground text-base font-bold">Shipping Update Email</p>
                                <p className="text-muted-foreground text-sm font-normal">
                                    Automatically notify customers when tracking info is added.
                                </p>
                            </div>
                            <Switch checked={shippingUpdate} onCheckedChange={setShippingUpdate} />
                        </div>
                        {/* Toggle Card 3 */}
                        <div className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-sm">
                            <div className="flex flex-col gap-1">
                                <p className="text-foreground text-base font-bold">Low Stock Alerts</p>
                                <p className="text-muted-foreground text-sm font-normal">
                                    Alert the admin team when inventory drops below 5 units.
                                </p>
                            </div>
                            <Switch checked={lowStockAlerts} onCheckedChange={setLowStockAlerts} />
                        </div>
                    </div>
                </section>

                {/* Team Members Section */}
                <section className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-2">
                        <div className="flex items-center gap-2">
                            <Users className="size-5 text-primary" />
                            <h3 className="text-foreground text-lg font-bold">Team Members</h3>
                        </div>
                        <Button className="gap-2 shadow-lg shadow-primary/20">
                            <UserPlus className="size-4" />
                            Invite Member
                        </Button>
                    </div>
                    <div className="overflow-hidden rounded-xl border border-border bg-card">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-secondary/50">
                                <tr>
                                    <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Member
                                    </th>
                                    <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-5 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {teamMembers.map((member) => {
                                    const role = roleConfig[member.role];
                                    return (
                                        <tr key={member.id} className="hover:bg-secondary/30 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="size-10 rounded-full bg-cover bg-center border border-border"
                                                        style={{ backgroundImage: `url('${member.avatar}')` }}
                                                    />
                                                    <div>
                                                        <p className="text-sm font-bold text-foreground">{member.name}</p>
                                                        <p className="text-xs text-muted-foreground">{member.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${role.className}`}
                                                >
                                                    {role.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span
                                                        className={`size-2 rounded-full ${member.status === "active" ? "bg-green-500" : "bg-amber-400"
                                                            }`}
                                                    />
                                                    <span className="text-xs font-medium text-foreground capitalize">
                                                        {member.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <Button variant="ghost" size="icon" className="size-8">
                                                    <MoreVertical className="size-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Bottom Save Changes */}
                <div className="flex justify-end gap-3 mt-4 border-t border-border pt-6">
                    <Button variant="secondary">Discard Changes</Button>
                    <Button className="shadow-lg shadow-primary/30">Save Changes</Button>
                </div>
            </div>
        </main>
    );
}
