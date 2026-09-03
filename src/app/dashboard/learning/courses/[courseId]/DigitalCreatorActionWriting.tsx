"use client";

import type { LearningActionWriting } from "@/data/courses/types";
import type { PersistenceStatus } from "@/hooks/useLessonPersistence";
import styles from "./DigitalCreatorActionWriting.module.css";
import { StudentSaveStatus } from "./StudentSaveStatus";

export type DigitalCreatorActionAnswers = {
    make: string;
    challenge: string;
};

export function DigitalCreatorActionWriting({
    activity,
    value,
    onChange,
    saveStatus,
    onRetrySave,
}: {
    activity: LearningActionWriting;
    value: DigitalCreatorActionAnswers;
    onChange: (value: DigitalCreatorActionAnswers) => void;
    saveStatus: PersistenceStatus;
    onRetrySave?: () => void | Promise<void>;
}) {
    return (
        <section className={styles.panel} aria-labelledby="digital-creator-action-title">
            <div className={styles.top}>
                <div>
                    <span className={styles.eyebrow}>직접 작성하기</span>
                    <h3 id="digital-creator-action-title">{activity.label}</h3>
                </div>
                <StudentSaveStatus status={saveStatus} onRetry={onRetrySave} />
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
