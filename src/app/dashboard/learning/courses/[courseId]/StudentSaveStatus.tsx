"use client";

import type { PersistenceStatus } from "@/hooks/useLessonPersistence";
import styles from "./StudentSaveStatus.module.css";

const statusCopy: Record<PersistenceStatus, { icon: string; message: string }> = {
    idle: { icon: "●", message: "내용을 바꾸면 자동으로 저장돼요" },
    loading: { icon: "↻", message: "저장한 내용을 불러오는 중이에요" },
    saving: { icon: "↻", message: "학원 계정에 저장하는 중이에요" },
    saved: { icon: "✓", message: "학원 계정에 안전하게 저장됐어요" },
    local: { icon: "!", message: "이 기기에 임시 저장됐어요" },
    error: { icon: "!", message: "아직 저장되지 않았어요" },
};

const statusPriority: Record<PersistenceStatus, number> = {
    idle: 0,
    saved: 1,
    loading: 2,
    saving: 3,
    local: 4,
    error: 5,
};

export function mergePersistenceStatuses(...statuses: PersistenceStatus[]): PersistenceStatus {
    return statuses.reduce((mostImportant, status) => (
        statusPriority[status] > statusPriority[mostImportant] ? status : mostImportant
    ), "idle");
}

export function StudentSaveStatus({
    status,
    onRetry,
    compact = false,
    className,
}: {
    status: PersistenceStatus;
    onRetry?: () => void | Promise<void>;
    compact?: boolean;
    className?: string;
}) {
    const copy = statusCopy[status];
    const canRetry = (status === "local" || status === "error") && onRetry;

    return (
        <div
            className={`${styles.notice}${compact ? ` ${styles.compact}` : ""}${className ? ` ${className}` : ""}`}
            data-status={status}
        >
            <span className={styles.message} role="status" aria-live="polite">
                <i aria-hidden="true">{copy.icon}</i>
                {copy.message}
            </span>
            {canRetry && (
                <button type="button" onClick={() => void onRetry()}>
                    다시 저장하기
                </button>
            )}
        </div>
    );
}
