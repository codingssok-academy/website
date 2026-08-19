import { BookOpenCheck, FolderKanban, MessageSquareQuote } from "lucide-react";
import type {
  EvaluationTextValues,
  ProjectEvaluationValues,
} from "@/features/growth-v2/types/teacher-weekly-evaluation";
import styles from "./TeacherWeeklyEvaluation.module.css";

interface ParentEvaluationPreviewProps {
  studentName: string;
  concepts: string[];
  evaluation: EvaluationTextValues;
  projectName: string;
  project: ProjectEvaluationValues;
}

export function ParentEvaluationPreview({
  studentName,
  concepts,
  evaluation,
  projectName,
  project,
}: ParentEvaluationPreviewProps) {
  return (
    <aside className={styles.previewPanel} aria-label="학부모 표시 미리보기">
      <div className={styles.previewHeading}>
        <span aria-hidden="true">
          <MessageSquareQuote size={20} strokeWidth={2.1} />
        </span>
        <div>
          <p>학부모에게 이렇게 보여요</p>
          <strong>{studentName} 학생 주간 평가 미리보기</strong>
        </div>
      </div>

      <div className={styles.previewEvaluation}>
        <section>
          <span>잘한 점</span>
          <p>{evaluation.strength}</p>
        </section>
        <section>
          <span>보완할 점</span>
          <p>{evaluation.improvement}</p>
        </section>
        <section>
          <span>다음 수업 목표</span>
          <p>{evaluation.nextLessonGoal}</p>
        </section>
      </div>

      <section className={styles.previewSection}>
        <div className={styles.previewSectionTitle}>
          <BookOpenCheck size={18} aria-hidden="true" />
          <strong>배운 개념</strong>
        </div>
        {concepts.length > 0 ? (
          <ul className={styles.previewConcepts}>
            {concepts.map((concept) => (
              <li key={concept}>{concept}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyPreview}>선택된 개념이 없습니다.</p>
        )}
      </section>

      <section className={styles.previewSection}>
        <div className={styles.previewSectionTitle}>
          <FolderKanban size={18} aria-hidden="true" />
          <strong>{projectName}</strong>
        </div>
        <dl className={styles.previewProject}>
          <div>
            <dt>최근 작업</dt>
            <dd>{project.recentWork}</dd>
          </div>
          <div>
            <dt>다음 작업</dt>
            <dd>{project.nextWork}</dd>
          </div>
        </dl>
      </section>
    </aside>
  );
}
