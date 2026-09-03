"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";
import {
    LEARNING_REVIEW_REQUEST_PREFIX,
    isLearningReviewRequestForPage,
    parseLearningReviewRequest,
    type LearningReviewRequest,
} from "@/lib/learning-review-request";
import styles from "./LearningReviewMarker.module.css";

interface ReviewRow {
    sender_id: string;
    content: string;
    created_at: string;
}

interface TeacherRow {
    id: string;
}

interface ReviewWithDate extends LearningReviewRequest {
    createdAt: string;
}

export function LearningReviewNotice({ request }: { request: ReviewWithDate }) {
    return (
        <aside className={styles.notice} aria-label="선생님 확인 필요" role="status">
            <span className={styles.icon} aria-hidden="true">!</span>
            <div className={styles.copy}>
                <strong>선생님 확인 필요</strong>
                <p>{request.note || "이 화면을 다시 천천히 확인해 보세요."}</p>
                <small>{request.unitTitle} · {request.pageTitle}</small>
            </div>
            <Link href="/dashboard/learning/dm">선생님께 질문하기</Link>
        </aside>
    );
}

export default function LearningReviewMarker({
    enabled,
    authUserId,
    studentId,
    courseId,
    unitId,
    pageId,
}: {
    enabled: boolean;
    authUserId?: string;
    studentId?: string;
    courseId: string;
    unitId?: string;
    pageId?: string;
}) {
    const supabase = useMemo(() => createClient(), []);
    const [requests, setRequests] = useState<ReviewWithDate[]>([]);
    const recipientIds = useMemo(
        () => Array.from(new Set([authUserId, studentId].filter(Boolean))) as string[],
        [authUserId, studentId],
    );
    const recipientKey = recipientIds.join(",");

    useEffect(() => {
        if (!enabled || !courseId || recipientIds.length === 0) return;
        let cancelled = false;
        void supabase
            .from("direct_messages")
            .select("sender_id, content, created_at")
            .in("receiver_id", recipientIds)
            .like("content", `${LEARNING_REVIEW_REQUEST_PREFIX}%`)
            .order("created_at", { ascending: false })
            .limit(100)
            .then(async (result: { data: ReviewRow[] | null }) => {
                if (cancelled) return;
                const rows = result.data || [];
                const senderIds = Array.from(new Set(rows.map(row => row.sender_id)));
                if (senderIds.length === 0) {
                    setRequests([]);
                    return;
                }
                const teacherResult = await supabase
                    .from("profiles")
                    .select("id")
                    .in("id", senderIds)
                    .in("role", ["teacher", "admin"]);
                if (cancelled) return;
                const teacherIds = new Set(((teacherResult.data || []) as TeacherRow[]).map(row => row.id));
                const parsed = rows
                    .filter(row => teacherIds.has(row.sender_id))
                    .map(row => {
                        const request = parseLearningReviewRequest(row.content);
                        return request ? { ...request, createdAt: row.created_at } : null;
                    })
                    .filter((request): request is ReviewWithDate => !!request && request.courseId === courseId);
                setRequests(parsed);
            });
        return () => { cancelled = true; };
    }, [courseId, enabled, recipientKey, recipientIds, supabase]);

    if (!enabled || !unitId || !pageId) return null;
    const request = requests.find(item => isLearningReviewRequestForPage(item, { courseId, unitId, pageId }));
    return request ? <LearningReviewNotice request={request} /> : null;
}
