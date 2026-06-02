"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStoreItems } from "@/hooks/useStoreItems";
import { applyTheme } from "@/lib/store-effects";

export function StoreThemeApplier() {
    const { user } = useAuth();
    const { activeTheme, hasDoubleXP, loading } = useStoreItems(user?.id);

    useEffect(() => {
        if (loading) return;
        applyTheme(activeTheme);
        if (hasDoubleXP) {
            document.documentElement.setAttribute("data-xp-boost", "2");
        } else {
            document.documentElement.removeAttribute("data-xp-boost");
        }
    }, [activeTheme, hasDoubleXP, loading]);

    return null;
}
