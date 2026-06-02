"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OldDashboardPage() {
    const router = useRouter();
    useEffect(() => {
        try {
            const stored = localStorage.getItem("codingssok_user");
            const user = stored ? JSON.parse(stored) as { role?: string } : null;
            const role = localStorage.getItem("codingssok_role") || user?.role;
            router.replace(role === "teacher" || role === "admin" ? "/dashboard/learning/admin" : "/dashboard/learning");
        } catch {
            router.replace("/dashboard/learning");
        }
    }, [router]);
    return null;
}
