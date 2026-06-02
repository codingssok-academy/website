"use client";

import { useEffect } from "react";

export default function ParentSwRegister() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/parent-sw.js", { scope: "/parent/" });
        }
    }, []);

    return null;
}
