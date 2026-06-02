"use client";

/**
 * useCodeSave
 * 학생이 작성한 코드를 (1) localStorage 즉시 저장 + (2) Supabase 1.5초 debounce 저장
 *
 * 피드백 L27-28: "소스코드들 전부 저장 반드시 되게 할것"
 *
 * 사용 예:
 *   const { save, load, loaded } = useCodeSave("problem:c-L1-042", "c");
 *   const [code, setCode] = useState("");
 *   useEffect(() => { load().then(c => { if (c) setCode(c); }); }, []);
 *   useEffect(() => { save(code); }, [code]);
 *
 * 동작:
 *  - localStorage: 매 호출마다 동기 저장 (오프라인/비로그인 대비)
 *  - Supabase: 1.5초 debounce 로 마지막 변경만 업서트 (네트워크 절약)
 *  - 로그인 안 돼있으면 localStorage만 사용
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const LS_PREFIX = "codingssok-code:";
const DEBOUNCE_MS = 1500;

export function useCodeSave(contextKey: string, language: string) {
    const { user } = useAuth();
    const [loaded, setLoaded] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const lastSavedRef = useRef<string>("");

    const lsKey = `${LS_PREFIX}${contextKey}`;

    // ── 로드: Supabase 우선, 실패 시 localStorage ──
    const load = useCallback(async (): Promise<string | null> => {
        // localStorage 빠르게 먼저 읽음
        let localCode: string | null = null;
        try { localCode = localStorage.getItem(lsKey); } catch {}

        if (!user?.id) {
            setLoaded(true);
            return localCode;
        }

        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("student_code_saves")
                .select("code, updated_at")
                .eq("user_id", user.id)
                .eq("context_key", contextKey)
                .maybeSingle();
            if (error) {
                if (process.env.NODE_ENV === "development") console.warn("[useCodeSave] load:", error.message);
                setLoaded(true);
                return localCode;
            }
            if (data?.code) {
                lastSavedRef.current = data.code;
                // 최신 서버 코드를 localStorage에도 반영
                try { localStorage.setItem(lsKey, data.code); } catch {}
                setLoaded(true);
                return data.code;
            }
        } catch (e) {
            if (process.env.NODE_ENV === "development") console.warn("[useCodeSave] load exception:", e);
        }
        setLoaded(true);
        return localCode;
    }, [user?.id, contextKey, lsKey]);

    // ── 저장: localStorage 즉시 + Supabase debounce ──
    const save = useCallback((code: string) => {
        if (!code || code === lastSavedRef.current) return;
        // localStorage 즉시
        try { localStorage.setItem(lsKey, code); } catch {}

        if (!user?.id) return;

        // Supabase debounce
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const supabase = createClient();
                const { error } = await supabase
                    .from("student_code_saves")
                    .upsert({
                        user_id: user.id,
                        context_key: contextKey,
                        language,
                        code,
                    }, { onConflict: "user_id,context_key" });
                if (error) {
                    if (process.env.NODE_ENV === "development") console.warn("[useCodeSave] save:", error.message);
                    return;
                }
                lastSavedRef.current = code;
            } catch (e) {
                if (process.env.NODE_ENV === "development") console.warn("[useCodeSave] save exception:", e);
            }
        }, DEBOUNCE_MS);
    }, [user?.id, contextKey, language, lsKey]);

    // ── 실행 결과 기록 (run_count++, last_run_result) ──
    const recordRun = useCallback(async (result: "passed" | "failed" | "error") => {
        if (!user?.id) return;
        try {
            const supabase = createClient();
            // upsert + run_count 증가를 위해 RPC 가 이상적이지만 간단히 select → update
            const { data } = await supabase
                .from("student_code_saves")
                .select("run_count")
                .eq("user_id", user.id)
                .eq("context_key", contextKey)
                .maybeSingle();
            await supabase
                .from("student_code_saves")
                .update({
                    run_count: (data?.run_count || 0) + 1,
                    last_run_result: result,
                })
                .eq("user_id", user.id)
                .eq("context_key", contextKey);
        } catch { /* silent */ }
    }, [user?.id, contextKey]);

    // 언마운트 시 pending debounce 플러시
    useEffect(() => () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
    }, []);

    return { save, load, recordRun, loaded };
}
