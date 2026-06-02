"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * 학부모 숙제 페이지 폐기 — /parent로 redirect.
 * 담당자 명시 "학부모 숙제 기능 + UI 없애자". 기존 링크 호환을 위해 redirect 유지.
 */
export default function ParentHomeworkRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace("/parent");
    }, [router]);
    return null;
}
