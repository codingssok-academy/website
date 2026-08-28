"use client";

import type { LearningActionWriting } from "@/data/courses/types";
import type { PersistenceStatus } from "@/hooks/useLessonPersistence";
import styles from "./DigitalCreatorActionWriting.module.css";

export type DigitalCreatorActionAnswers = {
    make: string;
    challenge: string;
};

function statusLabel(status: PersistenceStatus) {
    if (status === "loading" || status === "saving") return "저장 중";
    if (status === "error") return "저장 오류";
    if (status === "local") return "이 기기에 저장";
    if (status === "saved") return "자동 저장됨";
    return "적으면 자동 저장";
}

export function DigitalCreatorActionWriting({
    activity,
    value,
    onChange,
    saveStatus,
}: {
    activity: LearningActionWriting;
    value: DigitalCreatorActionAnswers;
    onChange: (value: DigitalCreatorActionAnswers) => void;
    saveStatus: PersistenceStatus;
}) {
    return (
        <section className={styles.panel} aria-labelledby="digital-creator-action-title">
            <div className={styles.top}>
                <div>
                    <span className={styles.eyebrow}>직접 작성하기</span>
                    <h3 id="digital-creator-action-title">{activity.label}</h3>
                </div>
                <b className={styles.status} data-status={saveStatus} role="status" aria-live="polite">
                    {statusLabel(saveStatus)}
                </b>
            </div>

            <div className={styles.grid}>
                <label className={`${styles.card} ${styles.make}`}>
                    <span><i aria-hidden="true">🧩</i> 만들기</span>
                    <strong>{activity.make.prompt}</strong>
                    <textarea
                        value={value.make}
                        onChange={(event) => onChange({ ...value, make: event.target.value })}
                        placeholder={activity.make.placeholder}
                        maxLength={300}
                        aria-label={`만들기: ${activity.make.prompt}`}
                    />
                </label>

                <label className={`${styles.card} ${styles.challenge}`}>
                    <span><i aria-hidden="true">⚑</i> 도전하기</span>
                    <strong>{activity.challenge.prompt}</strong>
                    <textarea
                        value={value.challenge}
                        onChange={(event) => onChange({ ...value, challenge: event.target.value })}
                        placeholder={activity.challenge.placeholder}
                        maxLength={300}
                        aria-label={`도전하기: ${activity.challenge.prompt}`}
                    />
                </label>
            </div>

            <p className={styles.help}>{activity.help}</p>
        </section>
    );
}
