"use client";

import styles from "./DigitalCreatorLessonProgress.module.css";

type ProgressCount = {
    completed: number;
    total: number;
};

const remaining = (count: ProgressCount) => Math.max(0, count.total - count.completed);

export function DigitalCreatorLessonProgress({
    screens,
    records,
    loading,
    completed,
}: {
    screens: ProgressCount;
    records: ProgressCount;
    loading: boolean;
    completed: boolean;
}) {
    const screenRemaining = remaining(screens);
    const recordRemaining = remaining(records);
    const total = screens.total + records.total;
    const done = Math.min(total, screens.completed + records.completed);
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    const allRequirementsMet = !loading && screenRemaining === 0 && recordRemaining === 0;

    const message = loading
        ? "진행 상황을 불러오고 있어요"
        : completed
            ? "이번 수업을 완료했어요"
            : allRequirementsMet
                ? "모든 조건을 마쳤어요. 마지막 화면에서 수업 완료를 눌러주세요."
                : `남은 화면 ${screenRemaining}개 · 남은 기록 ${recordRemaining}개`;

    return (
        <section className={styles.panel} aria-label="이번 수업 진행 상황">
            <div className={styles.summary}>
                <span className={styles.label}>이번 수업 진행</span>
                <strong aria-live="polite">
                    화면 <b>{loading ? `-/${screens.total}` : `${screens.completed}/${screens.total}`}</b>
                    <i aria-hidden="true">·</i>
                    기록 <b>{loading ? `-/${records.total}` : `${records.completed}/${records.total}`}</b>
                </strong>
            </div>
            <div className={styles.detail}>
                <span>{message}</span>
                <div
                    className={styles.track}
                    role="progressbar"
                    aria-label="이번 수업 완료 조건 진행률"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={loading ? 0 : percent}
                >
                    <i style={{ width: `${loading ? 0 : percent}%` }} />
                </div>
            </div>
        </section>
    );
}
