"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

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

    /* On mount: verify Supabase session first, then load localStorage */
    useEffect(() => {
        let cancelled = false;

        async function init() {
            try {
                const { createClient, isLocalPreviewAuthEnabled, isSupabaseConfigured } = await import("@/lib/supabase");
                if (!isSupabaseConfigured()) {
                    if (isLocalPreviewAuthEnabled()) {
                        const stored = loadUser();
                        if (!cancelled) setUser(stored);
                    } else {
                        saveUser(null);
                        localStorage.removeItem("codingssok_role");
                        if (!cancelled) setUser(null);
                    }
                    return;
                }

                const sb = createClient();

                // Step 1: Check if Supabase auth session exists
                const { data: { session } } = await sb.auth.getSession();

                if (!session) {
                    // No active session — clear any stale localStorage data
                    saveUser(null);
                    localStorage.removeItem("codingssok_role");
                    if (!cancelled) setUser(null);
                    return;
                }

                // Step 2: Session exists — load/sync user profile
                const { data: linkedStudent, error: linkedStudentError } = await sb
                    .from("students")
                    .select("id,name,grade,avatar,status,auth_user_id")
                    .eq("auth_user_id", session.user.id)
                    .maybeSingle();

                if (linkedStudentError || !linkedStudent || linkedStudent.status === "deactivated" || linkedStudent.status === "rejected") {
                    saveUser(null);
                    localStorage.removeItem("codingssok_role");
                    await sb.auth.signOut({ scope: "local" });
                    if (!cancelled) setUser(null);
                    return;
                }

                const stored = loadUser();
                if (stored && stored.id === session.user.id && !cancelled) {
                    // Sync latest XP/level from Supabase
                    try {
                        const { data: progress } = await sb
                            .from("user_progress")
                            .select("xp, level, streak")
                            .eq("user_id", stored.id)
                            .maybeSingle();

                        if (progress && !cancelled) {
                            stored.xp = progress.xp ?? stored.xp;
                            stored.level = progress.level ?? stored.level;
                            stored.streak = progress.streak ?? stored.streak;
                            saveUser(stored);
                        }
                    } catch (e) {
                        if (process.env.NODE_ENV === 'development') console.error('[Auth] XP sync failed:', e);
                    }
                    setUser(stored);
                } else if (!cancelled) {
                    // Session exists but localStorage mismatch — clear stale data
                    saveUser(null);
                    setUser(null);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        init();
        return () => { cancelled = true; };
    }, []);

    const signOut = () => {
        setUser(null);
        saveUser(null);
        localStorage.removeItem("codingssok_role");
        // Supabase session token도 확실히 제거
        for (const key of Object.keys(localStorage)) {
            if (key.startsWith("sb-") || key.includes("supabase")) {
                localStorage.removeItem(key);
            }
        }
        import("@/lib/supabase")
            .then(({ createClient, isSupabaseConfigured }) => {
                if (!isSupabaseConfigured()) return undefined;
                return createClient().auth.signOut({ scope: 'local' });
            })
            .catch(() => undefined)
            .finally(() => {
                window.location.href = "/login";
            });
    };

    const updateProfile = (patch: Partial<UserProfile>) => {
        setUser(prev => {
            if (!prev) return prev;
            const updated = { ...prev, ...patch };
            saveUser(updated);
            return updated;
        });
    };

    return (
        <AuthContext.Provider value={{ user, loading, signOut, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}
