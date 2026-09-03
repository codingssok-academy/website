"use client";

import { useMemo, useState } from "react";
import { COURSES } from "@/data/courses";
import { buildLearningReviewRequest } from "@/lib/learning-review-request";
import styles from "./LearningReviewRequestComposer.module.css";

const reviewCourses = COURSES.filter(course =>
    !course.comingSoon && course.chapters.some(chapter => chapter.units.some(unit => (unit.pages?.length || 0) > 0)),
);

export default function LearningReviewRequestComposer({
    studentName,
    sending,
    onSend,
}: {
    studentName: string;
    sending: boolean;
    onSend: (message: string) => Promise<boolean>;
}) {
    const [open, setOpen] = useState(false);
    const [courseId, setCourseId] = useState("");
    const [unitId, setUnitId] = useState("");
    const [pageId, setPageId] = useState("");
    const [note, setNote] = useState("");
    const [notice, setNotice] = useState("");

    const course = reviewCourses.find(item => item.id === courseId);
    const units = useMemo(() => course?.chapters.flatMap(chapter =>
        chapter.units
            .filter(unit => (unit.pages?.length || 0) > 0)
            .map(unit => ({ ...unit, chapterTitle: chapter.title })),
    ) || [], [course]);
    const unit = units.find(item => item.id === unitId);
    const pages = unit?.pages || [];
    const page = pages.find(item => item.id === pageId);
    const canSend = !!course && !!unit && !!page && !sending;

    const resetLocation = () => {
        setCourseId("");
        setUnitId("");
        setPageId("");
        setNote("");
    };

    const submit = async () => {
        if (!course || !unit || !page || sending) return;
        setNotice("");
        const message = buildLearningReviewRequest({
            courseId: course.id,
            unitId: unit.id,
            pageId: page.id,
            courseTitle: course.title,
            unitTitle: unit.title,
            pageTitle: page.title,
            note,
        });
        const sent = await onSend(message);
        if (!sent) {
            setNotice("표시 요청을 보내지 못했습니다. 잠시 후 다시 눌러 주세요.");
            return;
        }
        resetLocation();
        setOpen(false);
        setNotice(`${studentName} 학생의 해당 학습 화면에 표시했습니다.`);
    };

    return (
        <div className={styles.wrapper}>
            <button
                type="button"
                className={styles.toggle}
                aria-expanded={open}
                onClick={() => {
                    setOpen(current => !current);
                    setNotice("");
                }}
            >
                <span className="material-symbols-outlined" aria-hidden="true">flag</span>
                선생님 확인 필요 표시
            </button>

            {open && (
                <section className={styles.panel} aria-label="학습 확인 위치 선택">
                    <div className={styles.copy}>
                        <strong>{studentName} 학생이 다시 볼 화면을 선택하세요.</strong>
                        <span>요청을 보내면 학생의 정확한 학습 화면에 주황색 안내가 표시됩니다.</span>
                    </div>
                    <div className={styles.fields}>
                        <label>
                            <span>수업</span>
                            <select
                                aria-label="확인할 수업"
                                value={courseId}
                                onChange={event => {
                                    setCourseId(event.target.value);
                                    setUnitId("");
                                    setPageId("");
                                }}
                            >
                                <option value="">수업 선택</option>
                                {reviewCourses.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
                            </select>
                        </label>
                        <label>
                            <span>단원</span>
                            <select
                                aria-label="확인할 단원"
                                value={unitId}
                                disabled={!course}
                                onChange={event => {
                                    setUnitId(event.target.value);
                                    setPageId("");
                                }}
                            >
                                <option value="">단원 선택</option>
                                {units.map(item => (
                                    <option key={item.id} value={item.id}>{item.chapterTitle} · {item.title}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            <span>학습 화면</span>
                            <select
                                aria-label="확인할 학습 화면"
                                value={pageId}
                                disabled={!unit}
                                onChange={event => setPageId(event.target.value)}
                            >
                                <option value="">화면 선택</option>
                                {pages.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
                            </select>
                        </label>
                    </div>
                    <label className={styles.note}>
                        <span>선생님 말씀 (선택)</span>
                        <input
                            value={note}
                            maxLength={300}
                            onChange={event => setNote(event.target.value)}
                            placeholder="예: 반복문의 횟수를 다시 확인해 보세요."
                        />
                    </label>
                    <div className={styles.actions}>
                        <button type="button" onClick={() => setOpen(false)}>취소</button>
                        <button type="button" disabled={!canSend} onClick={() => void submit()}>
                            {sending ? "보내는 중..." : "학생 화면에 표시"}
                        </button>
                    </div>
                </section>
            )}

            {notice && <p className={styles.notice} role="status">{notice}</p>}
        </div>
    );
}
