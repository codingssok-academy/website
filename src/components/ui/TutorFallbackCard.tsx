"use client";

import {
    buildTeacherQuestionDraft,
    saveTeacherQuestionDraft,
} from "@/lib/tutor-fallback";
import styles from "./TutorFallbackCard.module.css";

export default function TutorFallbackCard({
    hint,
    question,
    context,
    onRetry,
}: {
    hint: string;
    question: string;
    context?: string;
    onRetry: () => void;
}) {
    const prepareTeacherQuestion = () => {
        saveTeacherQuestionDraft(buildTeacherQuestionDraft({ question, context }));
    };

    return (
        <section className={styles.card} aria-labelledby="tutor-fallback-title">
            <div className={styles.heading}>
                <span aria-hidden="true">💡</span>
                <div>
                    <small>쏙쌤이 잠시 쉬고 있어요</small>
                    <h3 id="tutor-fallback-title">기본 힌트</h3>
                </div>
            </div>
            <p>{hint}</p>
            <div className={styles.actions}>
                <button type="button" onClick={onRetry}>쏙쌤 다시 불러보기</button>
                <a href="/dashboard/learning/dm" onClick={prepareTeacherQuestion}>
                    선생님께 질문 남기기
                </a>
            </div>
            <small className={styles.notice}>질문은 바로 보내지지 않아요. 메시지함에서 확인한 뒤 전송해 주세요.</small>
        </section>
    );
}
