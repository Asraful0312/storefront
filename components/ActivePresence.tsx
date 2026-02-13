"use client";

import { useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

export function ActivePresence() {
    const { isAuthenticated } = useConvexAuth();
    const heartbeat = useMutation(api.presence.heartbeat);

    useEffect(() => {
        if (!isAuthenticated) return;

        const interval = setInterval(() => {
            heartbeat({});
        }, 60 * 1000 * 24); // 24h

        // Initial call
        heartbeat({});

        return () => clearInterval(interval);
    }, [isAuthenticated, heartbeat]);

    return null;
}
