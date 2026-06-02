"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";

export interface StorePurchase {
    item_id: string;
    item_name: string;
    xp_cost: number;
    purchased_at?: string;
}

export interface StoreItemsState {
    purchased: string[];
    activeTheme: string | null;
    hasDoubleXP: boolean;
    loading: boolean;
}

export function useStoreItems(userId: string | undefined): StoreItemsState {
    const supabase = useMemo(() => isSupabaseConfigured() ? createClient() : null, []);
    const [purchased, setPurchased] = useState<string[]>([]);
    const loading = false;

    useEffect(() => {
        if (!userId || !supabase) return;
        (async () => {
            try {
                const { data } = await supabase
                    .from("store_purchases")
                    .select("item_id")
                    .eq("user_id", userId);
                if (data) setPurchased(data.map((d: { item_id: string }) => d.item_id));
            } catch {
                // 로드 실패 시 빈 배열 유지
            }
        })();
    }, [userId, supabase]);

    const activeTheme = purchased.find((id) => id.startsWith("theme_")) ?? null;
    const hasDoubleXP = purchased.includes("boost_2x");

    return { purchased, activeTheme, hasDoubleXP, loading };
}
