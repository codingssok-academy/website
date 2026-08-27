"use client";

import type { LearningChoiceActivity } from "@/data/courses/types";
import type { PersistenceStatus } from "@/hooks/useLessonPersistence";
import styles from "./PictureChoiceActivity.module.css";

const SEPARATOR = " · ";

function statusLabel(status: PersistenceStatus) {
    if (status === "loading" || status === "saving") return "저장 중";
    if (status === "error") return "저장 오류";
    if (status === "local") return "이 기기에 저장";
    if (status === "saved") return "자동 저장됨";
    return "고르면 자동 저장";
}

export function PictureChoiceActivity({
    activity,
    value,
    onChange,
    saveStatus,
}: {
    activity: LearningChoiceActivity;
    value: string;
    onChange: (value: string) => void;
    saveStatus: PersistenceStatus;
}) {
    const validLabels = new Set(activity.options.map((option) => option.label));
    const selectedLabels = value.split(SEPARATOR).filter((label) => validLabels.has(label));

    const toggle = (label: string) => {
        const next = selectedLabels.includes(label)
            ? selectedLabels.filter((item) => item !== label)
            : [...selectedLabels, label];
        onChange(next.join(SEPARATOR));
    };

    return (
        <section className={styles.panel} aria-labelledby="picture-choice-title">
            <div className={styles.top}>
                <span>{activity.label}</span>
                <b data-status={saveStatus}>{statusLabel(saveStatus)}</b>
            </div>
            <h3 id="picture-choice-title">{activity.prompt}</h3>
            <div className={styles.grid} role="group" aria-label={activity.prompt}>
                {activity.options.map((option) => {
                    const selected = selectedLabels.includes(option.label);
                    return (
                        <button
                            key={option.id}
                            type="button"
                            className={selected ? styles.selected : undefined}
                            aria-pressed={selected}
                            onClick={() => toggle(option.label)}
                        >
                            <span className={styles.emoji} aria-hidden="true">{option.emoji}</span>
                            <strong>{option.label}</strong>
                            <small>{option.description}</small>
                            <em>{selected ? "선택했어요 ✓" : "눌러서 선택"}</em>
                        </button>
                    );
                })}
            </div>
            <div className={styles.guides}>
                <p><b>혼자 할 때</b>{activity.soloGuide}</p>
                <p><b>함께 할 때</b>{activity.groupGuide}</p>
            </div>
        </section>
    );
}
