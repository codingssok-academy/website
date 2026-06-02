"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { createClient } from "@/lib/supabase";
import type { Student, TeacherAccount } from "./types";

interface AdminContextValue {
    students: Student[];
    loading: boolean;
    authed: boolean;
    currentTeacher: TeacherAccount | null;
    teacherId: string | null;
    studentNameByAnyId: Map<string, string>;
    studentOptions: {
        id: string;
        studentId: string;
        linked: boolean;
        name: string;
        grade: string | null;
        class: string | null;
        avatar: string | null;
        pin: string | null;
        created_at: string;
    }[];
    fetchStudents: () => Promise<void>;
    getTeacherId: () => Promise<string | null>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin() {
    const ctx = useContext(AdminContext);
    if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
    return ctx;
}

export function AdminProvider({ children }: { children: ReactNode }) {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTeacher, setCurrentTeacher] = useState<TeacherAccount | null>(null);
    const [teacherId, setTeacherId] = useState<string | null>(null);

    // 인증 없이 바로 진입 — 학생 목록 로드
    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const sb = createClient();
            const { data, error } = await sb
                .from("students")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            setStudents((data || []) as Student[]);

            // 교사 정보 로드 시도 (실패해도 무시)
            try {
                const { data: { user } } = await sb.auth.getUser();
                if (user) setTeacherId(user.id);
                const res = await fetch("/api/teacher/account", { cache: "no-store" });
                const result = await res.json();
                if (res.ok && result.success) setCurrentTeacher(result.current || null);
            } catch { /* 교사 정보 없어도 관리자 기능은 동작 */ }
        } catch (err) {
            if (process.env.NODE_ENV === "development") console.error("학생 목록 로드 실패:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStudents(); }, [fetchStudents]);

    const getTeacherId = useCallback(async () => {
        try {
            const sb = createClient();
            const { data: { user } } = await sb.auth.getUser();
            return user?.id || null;
        } catch { return null; }
    }, []);

    const studentNameByAnyId = useMemo(() => {
        const map = new Map<string, string>();
        students.forEach(s => {
            map.set(s.id, s.name);
            if (s.auth_user_id) map.set(s.auth_user_id, s.name);
        });
        return map;
    }, [students]);

    const studentOptions = useMemo(() => {
        return [...students]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map(s => ({
                id: s.auth_user_id || s.id,
                studentId: s.id,
                linked: !!s.auth_user_id,
                name: s.name,
                grade: s.grade,
                class: s.class,
                avatar: s.avatar,
                pin: s.pin || null,
                created_at: s.created_at,
            }));
    }, [students]);

    const value = useMemo(() => ({
        students, loading, authed: true, currentTeacher, teacherId,
        studentNameByAnyId, studentOptions, fetchStudents, getTeacherId,
    }), [students, loading, currentTeacher, teacherId, studentNameByAnyId, studentOptions, fetchStudents, getTeacherId]);

    return (
        <AdminContext.Provider value={value}>
            {children}
        </AdminContext.Provider>
    );
}
