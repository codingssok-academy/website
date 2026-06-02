"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createClient } from "@/lib/supabase";

interface HomeworkBadgeState {
    count: number;
    loading: boolean;
}

/**
 * 미완료 숙제 건수를 반환하는 훅.
 * layout.tsx Navbar, MobileAppLayout MobileHeader 양쪽에서 공유.
 */
export function useHomeworkBadge(): HomeworkBadgeState {
    const { user } = useAuth();
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        let cancelled = false;

        async function load() {
            try {
                const sb = createClient();
                const userIds = Array.from(
                    new Set([user!.id, (user as { studentId?: string }).studentId].filter(Boolean) as string[])
                );

                const { data: homeworks } = await sb
                    .from("homework")
                    .select("id")
                    .eq("is_active", true)
                    .or(
                        `assigned_to.is.null,assigned_to.eq.${user!.id}${
                            (user as { studentId?: string }).studentId
                                ? `,assigned_to.eq.${(user as { studentId?: string }).studentId}`
                                : ""
                        }`
                    );

                if (!homeworks || homeworks.length === 0) {
                    if (!cancelled) { setCount(0); setLoading(false); }
                    return;
                }

                const hwIds = (homeworks as { id: string }[]).map((h) => h.id);
                const { data: submissions } = await sb
                    .from("homework_submissions")
                    .select("homework_id")
                    .in("user_id", userIds)
                    .in("homework_id", hwIds);

                const submittedIds = new Set((submissions as { homework_id: string }[] | null)?.map((s) => s.homework_id) ?? []);
                if (!cancelled) setCount(hwIds.filter((id: string) => !submittedIds.has(id)).length);
            } catch {
                /* silent fallback */
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [user]);

    return { count, loading };
}
