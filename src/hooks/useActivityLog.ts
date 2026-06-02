"use client";

/**
 * useActivityLog
 * 학생의 모든 학습 페이지 방문을 영구 기록한다.
 *
 * - 페이지 진입 시 student_activity_log INSERT (started_at)
 * - 페이지 이탈/언마운트 시 ended_at + duration_seconds UPDATE
 * - presence(현재 상태)와 달리 모든 방문 이력이 누적된다
 *
 * 필요한 Supabase 테이블 (마이그레이션):
 *   create table student_activity_log (
 *     id uuid primary key default gen_random_uuid(),
 *     user_id uuid not null references auth.users(id) on delete cascade,
 *     student_name text,
 *     course_id text, course_title text,
 *     unit_id text, unit_title text,
 *     page_id text, page_title text,
 *     page_url text,
 *     started_at timestamptz not null default now(),
 *     ended_at timestamptz,
 *     duration_seconds int,
 *     created_at timestamptz not null default now()
 *   );
 *   create index student_activity_log_user_started_idx
 *     on student_activity_log(user_id, started_at desc);
 */

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface ActivityOptions {
    courseId?: string;
    courseTitle?: string;
    unitId?: string;
    unitTitle?: string;
    pageId?: string;
    pageTitle?: string;
}

export function useActivityLog(options: ActivityOptions) {
    const { user } = useAuth();
    const logIdRef = useRef<string | null>(null);
    const startedAtRef = useRef<number>(Date.now());

    useEffect(() => {
        if (!user?.id || !options.pageId) return;

        const supabase = createClient();
        startedAtRef.current = Date.now();
        let cancelled = false;

        const insertEntry = async () => {
            try {
                const { data, error } = await supabase
                    .from("student_activity_log")
                    .insert({
                        user_id: user.id,
                        student_name: user.name || user.email?.split("@")[0] || null,
                        course_id: options.courseId || null,
                        course_title: options.courseTitle || null,
                        unit_id: options.unitId || null,
                        unit_title: options.unitTitle || null,
                        page_id: options.pageId || null,
                        page_title: options.pageTitle || null,
                        page_url: typeof window !== "undefined" ? window.location.pathname : null,
                        started_at: new Date(startedAtRef.current).toISOString(),
                    })
                    .select("id")
                    .single();
                if (error) {
                    if (process.env.NODE_ENV === "development") console.warn("[ActivityLog] insert:", error.message);
                    return;
                }
                if (!cancelled) logIdRef.current = data?.id || null;
            } catch (e) {
                if (process.env.NODE_ENV === "development") console.warn("[ActivityLog] insert exception:", e);
            }
        };

        const finalize = async () => {
            const id = logIdRef.current;
            if (!id) return;
            const duration = Math.round((Date.now() - startedAtRef.current) / 1000);
            try {
                await supabase
                    .from("student_activity_log")
                    .update({ ended_at: new Date().toISOString(), duration_seconds: duration })
                    .eq("id", id);
            } catch (e) {
                if (process.env.NODE_ENV === "development") console.warn("[ActivityLog] finalize:", e);
            }
        };

        insertEntry();
        window.addEventListener("beforeunload", finalize);

        return () => {
            cancelled = true;
            window.removeEventListener("beforeunload", finalize);
            finalize();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id, options.courseId, options.unitId, options.pageId]);
}
