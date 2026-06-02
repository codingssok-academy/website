"use client";
import { useMemo, useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { generateParentPin, PIN_COURSE } from "@/lib/parent-auth";

/**
 * Hook to manage parent access PIN.
 * Stores the PIN in the study_progress table with course_id='__parent_pin__'
 * and completed_units=['XXXXXX'] (the 6-digit PIN).
 */
export function useParentPin(userId: string | undefined) {
    const supabase = useMemo(() => createClient(), []);
    const [pin, setPin] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) { setLoading(false); return; }
        (async () => {
            // Check if PIN already exists
            const { data } = await supabase
                .from("study_progress")
                .select("completed_units")
                .eq("user_id", userId)
                .eq("course_id", PIN_COURSE)
                .maybeSingle();

            if (data?.completed_units?.[0]) {
                setPin(data.completed_units[0]);
            } else {
                // Generate new PIN
                const newPin = generateParentPin();
                await supabase.from("study_progress").upsert({
                    user_id: userId,
                    course_id: PIN_COURSE,
                    completed_units: [newPin],
                    updated_at: new Date().toISOString(),
                }, { onConflict: "user_id,course_id" });
                setPin(newPin);
            }
            setLoading(false);
        })();
    }, [userId, supabase]);

    const regeneratePin = useCallback(async () => {
        if (!userId) return;
        const newPin = generateParentPin();
        await supabase.from("study_progress").upsert({
            user_id: userId,
            course_id: PIN_COURSE,
            completed_units: [newPin],
            updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,course_id" });
        setPin(newPin);
    }, [userId, supabase]);

    return { pin, loading, regeneratePin };
}
