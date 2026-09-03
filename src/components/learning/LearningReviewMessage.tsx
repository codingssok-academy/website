import Link from "next/link";
import { parseLearningReviewRequest } from "@/lib/learning-review-request";
import styles from "./LearningReviewMessage.module.css";

export default function LearningReviewMessage({ content }: { content: string }) {
    const request = parseLearningReviewRequest(content);
    if (!request) return <div className={styles.plain}>{content}</div>;

    return (
        <div className={styles.card}>
            <strong>선생님 확인 필요</strong>
            <span>{request.courseTitle}</span>
            <p>{request.unitTitle} · {request.pageTitle}</p>
            <small>{request.note || "이 화면을 다시 천천히 확인해 보세요."}</small>
            <Link href={request.href}>해당 학습 화면 열기</Link>
        </div>
    );
}
