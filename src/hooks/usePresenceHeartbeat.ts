"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface PresenceOptions {
    courseId?: string;
    courseTitle?: string;
    unitId?: string;
    unitTitle?: string;
    pageId?: string;
    pageTitle?: string;
    sessionOrigin?: string;
    learningContext?: string;
}

const HEARTBEAT_INTERVAL = 15_000;
const ACTIVE_WINDOW_MS = 60_000;
const ATTENTIVE_WINDOW_MS = 3 * 60_000;

export function usePresenceHeartbeat(options: PresenceOptions) {
    const { user } = useAuth();
    const optionsRef = useRef(options);
    const lastInteractionAtRef = useRef(Date.now());
    const lastEventRef = useRef("page-load");
    optionsRef.current = options;

    useEffect(() => {
        if (!user?.id) return;

        const supabase = createClient();
        let intervalId: NodeJS.Timeout;

        const markInteraction = (eventName: string) => {
            lastInteractionAtRef.current = Date.now();
            lastEventRef.current = eventName;
        };

        const resolveActivity = () => {
            const now = Date.now();
            const idleMs = now - lastInteractionAtRef.current;
            const hidden = typeof document !== "undefined" && document.visibilityState === "hidden";

            if (hidden) {
                return { state: "background", score: 25 };
            }

            if (idleMs <= ACTIVE_WINDOW_MS) {
                return { state: "active", score: 95 };
            }

            if (idleMs <= ATTENTIVE_WINDOW_MS) {
                return { state: "attentive", score: 70 };
            }

            return { state: "idle", score: 35 };
        };

        const upsert = async (online: boolean) => {
            const opts = optionsRef.current;
            const activity = online ? resolveActivity() : { state: "offline", score: 0 };
            try {
                await supabase.from("student_presence").upsert({
                    user_id: user.id,
                    student_name: user.name || user.email?.split("@")[0] || "unknown",
                    course_id: opts.courseId || null,
                    course_title: opts.courseTitle || null,
                    unit_id: opts.unitId || null,
                    unit_title: opts.unitTitle || null,
                    page_id: opts.pageId || null,
                    page_title: opts.pageTitle || null,
                    page_url: typeof window !== "undefined" ? window.location.pathname : null,
                    is_online: online,
                    activity_state: activity.state,
                    activity_score: activity.score,
                    last_interaction_at: new Date(lastInteractionAtRef.current).toISOString(),
                    last_event: lastEventRef.current,
                    current_focus_label: typeof document !== "undefined" ? document.title || window.location.pathname : null,
                    session_origin: opts.sessionOrigin || "web",
                    learning_context: opts.learningContext || "hybrid",
                    last_heartbeat: new Date().toISOString(),
                }, { onConflict: "user_id", ignoreDuplicates: false });
            } catch (e) {
                if (process.env.NODE_ENV === "development") console.error("[Presence] upsert:", e);
            }
        };

        const interactionHandlers: Array<[keyof WindowEventMap, EventListener]> = [
            ["mousemove", () => markInteraction("mousemove")],
            ["keydown", () => markInteraction("keydown")],
            ["scroll", () => markInteraction("scroll")],
            ["touchstart", () => markInteraction("touchstart")],
            ["click", () => markInteraction("click")],
        ];

        const handleVisibility = () => {
            markInteraction(document.visibilityState === "hidden" ? "hidden" : "visible");
        };

        interactionHandlers.forEach(([eventName, handler]) => {
            window.addEventListener(eventName, handler, { passive: true });
        });
        document.addEventListener("visibilitychange", handleVisibility);

        // 즉시 온라인 표시
        upsert(true);
        intervalId = setInterval(() => upsert(true), HEARTBEAT_INTERVAL);

        // 페이지 떠날 때 오프라인 표시
        const handleUnload = () => {
            const body = JSON.stringify({
                user_id: user.id,
                student_name: user.name || "unknown",
                is_online: false,
                last_heartbeat: new Date().toISOString(),
                course_id: optionsRef.current.courseId || null,
                course_title: optionsRef.current.courseTitle || null,
                unit_id: optionsRef.current.unitId || null,
                unit_title: optionsRef.current.unitTitle || null,
                page_id: optionsRef.current.pageId || null,
                page_title: optionsRef.current.pageTitle || null,
                page_url: window.location.pathname,
                activity_state: "offline",
                activity_score: 0,
                last_interaction_at: new Date(lastInteractionAtRef.current).toISOString(),
                last_event: "beforeunload",
                current_focus_label: document.title || window.location.pathname,
                session_origin: optionsRef.current.sessionOrigin || "web",
                learning_context: optionsRef.current.learningContext || "hybrid",
            });
            // fetch keepalive로 페이지 떠날 때도 안정적으로 전송
            const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/student_presence?on_conflict=user_id`;
            fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
                    "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""}`,
                    "Prefer": "resolution=merge-duplicates",
                },
                body,
                keepalive: true,
            }).catch(() => {});
        };
        window.addEventListener("beforeunload", handleUnload);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener("beforeunload", handleUnload);
            interactionHandlers.forEach(([eventName, handler]) => {
                window.removeEventListener(eventName, handler);
            });
            document.removeEventListener("visibilitychange", handleVisibility);
            upsert(false);
        };
    }, [user?.id, options.courseId, options.unitId, options.pageId]);
}
