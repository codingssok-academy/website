"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import StudentLogoutStatus from "@/components/growth-v2/StudentLogoutStatus";

/* ── Types ── */
export interface UserProfile {
    id: string;
    studentId?: string;
    name: string;
    email: string;
    grade?: string;
    phone?: string;
    avatar?: string;
    role?: "student" | "teacher";
    level: number;
    xp: number;
    streak: number;
    joinedAt: string;
}

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    signOut: () => void;
    updateProfile: (patch: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: () => { },
    updateProfile: () => { },
});

export const useAuth = () => useContext(AuthContext);

/* ── Storage Keys ── */
const AUTH_KEY = "codingssok_user";

function loadUser(): UserProfile | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(AUTH_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) { if (process.env.NODE_ENV === 'development') console.error('[Auth] loadUser failed:', e); return null; }
}

function saveUser(u: UserProfile | null) {
    if (typeof window === "undefined") return;
    if (u) localStorage.setItem(AUTH_KEY, JSON.stringify(u));
    else localStorage.removeItem(AUTH_KEY);
}

/* ── Provider ── */
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [logoutStatus, setLogoutStatus] = useState<"idle" | "pending" | "error">("idle");
    const logoutRequested = useRef(false);
    const logoutInFlight = useRef(false);

    /* On mount: verify Supabase session first, then load localStorage */
    useEffect(() => {
        let cancelled = false;
        const isCurrent = () => !cancelled && !logoutRequested.current;

        async function init() {
            try {
                const { createClient, isLocalPreviewAuthEnabled, isSupabaseConfigured } = await import("@/lib/supabase");
                if (!isCurrent()) return;
                if (!isSupabaseConfigured()) {
                    if (isLocalPreviewAuthEnabled()) {
                        const stored = loadUser();
                        if (isCurrent()) setUser(stored);
                    } else {
                        saveUser(null);
                        localStorage.removeItem("codingssok_role");
                        if (isCurrent()) setUser(null);
                    }
                    return;
                }

                const sb = createClient();

                // Step 1: Check if Supabase auth session exists
                const { data: { session } } = await sb.auth.getSession();
                if (!isCurrent()) return;

                if (!session) {
                    // No active session — clear any stale localStorage data
                    saveUser(null);
                    localStorage.removeItem("codingssok_role");
                    if (isCurrent()) setUser(null);
                    return;
                }

                // Step 2: Session exists — load/sync user profile
                const { data: linkedStudent, error: linkedStudentError } = await sb
                    .from("students")
                    .select("id,name,grade,avatar,status,auth_user_id")
                    .eq("auth_user_id", session.user.id)
                    .maybeSingle();
                if (!isCurrent()) return;

                if (linkedStudentError || !linkedStudent || linkedStudent.status === "deactivated" || linkedStudent.status === "rejected") {
                    saveUser(null);
                    localStorage.removeItem("codingssok_role");
                    await sb.auth.signOut({ scope: "local" });
                    if (isCurrent()) setUser(null);
                    return;
                }

                const stored = loadUser();
                if (stored && stored.id === session.user.id && isCurrent()) {
                    // Sync latest XP/level from Supabase
                    try {
                        const { data: progress } = await sb
                            .from("user_progress")
                            .select("xp, level, streak")
                            .eq("user_id", stored.id)
                            .maybeSingle();

                        if (progress && isCurrent()) {
                            stored.xp = progress.xp ?? stored.xp;
                            stored.level = progress.level ?? stored.level;
                            stored.streak = progress.streak ?? stored.streak;
                            saveUser(stored);
                        }
                    } catch (e) {
                        if (process.env.NODE_ENV === 'development') console.error('[Auth] XP sync failed:', e);
                    }
                    if (isCurrent()) setUser(stored);
                } else if (isCurrent()) {
                    // Session exists but localStorage mismatch — clear stale data
                    saveUser(null);
                    setUser(null);
                }
            } finally {
                if (isCurrent()) setLoading(false);
            }
        }

        init();
        return () => { cancelled = true; };
    }, []);

    const signOut = async () => {
        if (logoutInFlight.current) return;
        logoutInFlight.current = true;
        logoutRequested.current = true;
        setLogoutStatus("pending");
        try {
            const { createClient, isSupabaseConfigured, isLocalPreviewAuthEnabled } = await import("@/lib/supabase");
            if (isSupabaseConfigured()) {
                const sb = createClient();
                const result = await sb.auth.signOut({ scope: "local" });
                if (result.error) throw result.error;
                const verification = await sb.auth.getSession();
                if (verification.error || verification.data.session) {
                    throw new Error("Student logout is not confirmed");
                }
            } else if (!isLocalPreviewAuthEnabled()) {
                throw new Error("Student logout configuration is unavailable");
            }

            // Only remove this UI's cache after the SDK confirms session removal.
            // SSR authentication cookies belong to the SDK, not a broad key scan.
            saveUser(null);
            localStorage.removeItem("codingssok_role");
            setUser(null);
            window.location.href = "/login";
        } catch {
            // Keep the learning UI unmounted; a failed logout is not a success.
            // Do not expose SDK errors (which may contain account details).
            setLogoutStatus("error");
        } finally {
            logoutInFlight.current = false;
        }
    };

    const updateProfile = (patch: Partial<UserProfile>) => {
        setUser(prev => {
            if (!prev || logoutRequested.current) return prev;
            const updated = { ...prev, ...patch };
            saveUser(updated);
            return updated;
        });
    };

    return (
        <AuthContext.Provider value={{ user, loading, signOut, updateProfile }}>
            {logoutStatus === "idle"
                ? children
                : <StudentLogoutStatus status={logoutStatus} onRetry={signOut} />}
        </AuthContext.Provider>
    );
}
