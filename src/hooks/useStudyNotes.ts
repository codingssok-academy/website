"use client";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase";

export interface StudyNote {
    content: string;
    color: string;
    updatedAt: number;
}

const STORAGE_KEY = "codingssok_study_notes";

function loadAll(): Record<string, StudyNote> {
    if (typeof window === "undefined") return {};
    try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : {}; } catch { return {}; }
}

function persistAll(notes: Record<string, StudyNote>) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch {}
}

export function useStudyNotes(userId?: string) {
    const supabase = useMemo(() => createClient(), []);
    const [notes, setNotes] = useState<Record<string, StudyNote>>(loadAll);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const supabaseDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Load from Supabase on mount
    useEffect(() => {
        if (!userId) return;
        (async () => {
            const { data } = await supabase
                .from("study_notes")
                .select("note_key, content, color, updated_at")
                .eq("user_id", userId);
            if (data && data.length > 0) {
                setNotes(prev => {
                    const merged = { ...prev };
                    for (const row of data) {
                        const remoteTs = new Date(row.updated_at).getTime();
                        const existing = merged[row.note_key];
                        // Remote wins if newer or doesn't exist locally
                        if (!existing || remoteTs > existing.updatedAt) {
                            merged[row.note_key] = {
                                content: row.content,
                                color: row.color,
                                updatedAt: remoteTs,
                            };
                        }
                    }
                    persistAll(merged);
                    return merged;
                });
            }
        })();
    }, [userId, supabase]);

    // Sync single note to Supabase (debounced)
    const syncToSupabase = useCallback((key: string, content: string, color: string) => {
        if (!userId) return;
        if (supabaseDebounceRef.current) clearTimeout(supabaseDebounceRef.current);
        supabaseDebounceRef.current = setTimeout(() => {
            supabase.from("study_notes").upsert({
                user_id: userId,
                note_key: key,
                content,
                color,
                updated_at: new Date().toISOString(),
            }, { onConflict: "user_id,note_key" }).then(() => {});
        }, 1000);
    }, [userId, supabase]);

    const saveNote = useCallback((key: string, content: string, color: string) => {
        setNotes(prev => {
            const next = { ...prev, [key]: { content, color, updatedAt: Date.now() } };
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => persistAll(next), 400);
            return next;
        });
        syncToSupabase(key, content, color);
    }, [syncToSupabase]);

    const getNote = useCallback((key: string): StudyNote | null => {
        return notes[key] || null;
    }, [notes]);

    const getAllNotes = useCallback((courseId: string): { key: string; note: StudyNote }[] => {
        return Object.entries(notes)
            .filter(([k]) => k.startsWith(`${courseId}_`))
            .map(([key, note]) => ({ key, note }))
            .sort((a, b) => b.note.updatedAt - a.note.updatedAt);
    }, [notes]);

    const deleteNote = useCallback((key: string) => {
        setNotes(prev => {
            const next = { ...prev };
            delete next[key];
            persistAll(next);
            return next;
        });
        if (userId) {
            supabase.from("study_notes").delete()
                .eq("user_id", userId).eq("note_key", key).then(() => {});
        }
    }, [userId, supabase]);

    useEffect(() => () => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (supabaseDebounceRef.current) clearTimeout(supabaseDebounceRef.current);
    }, []);

    return { notes, saveNote, getNote, getAllNotes, deleteNote };
}
