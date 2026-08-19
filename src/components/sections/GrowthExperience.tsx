"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, ClipboardCheck, HeartHandshake } from "lucide-react";
import styles from "./GrowthExperience.module.css";

const roleCards = [
  {
    icon: ClipboardCheck,
    title: "선생님",
    description: "수업에서 배운 개념과 다음 목표를 기록하고 공개합니다.",
  },
  {
    icon: CalendarDays,
    title: "학생",
    description: "이번 주 성장과 월별 출석을 스스로 확인합니다.",
  },
  {
    icon: HeartHandshake,
    title: "학부모",
    description: "자녀의 변화와 집에서 이어갈 대화 방법을 확인합니다.",
  },
];

export default function GrowthExperience() {
  return (
    <section id="growth" className={styles.section} aria-labelledby="growth-experience-title">
      <div className={styles.inner}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>CODINGSSOK GROWTH 2.0</span>
          <h2 id="growth-experience-title">매주 성장하고, 매달 출석을 확인해요</h2>
          <p>
            선생님의 수업 기록을 학생과 학부모가 같은 화면에서 이해하기 쉽게 확인합니다.
            학습 평가는 주간 단위로, 출석은 수강 결제 주기에 맞춘 월간 단위로 보여드립니다.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primaryAction} href="/growth">
              성장관리 살펴보기 <ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className={styles.secondaryAction} href="/parent/feedback">
              학부모 포털 열기
            </Link>
          </div>
        </div>

        <div className={styles.preview} aria-label="성장관리 주요 기능">
          <div className={styles.previewTop}>
            <div>
              <span>2026년 8월</span>
              <strong>월간 출석 현황</strong>
            </div>
            <em>월 수강 기준</em>
          </div>
          <div className={styles.metrics}>
            <div><strong>8/8</strong><span>수업 이수</span></div>
            <div><strong>7회</strong><span>정규 출석</span></div>
            <div><strong>1회</strong><span>보강 완료</span></div>
          </div>
          <div className={styles.progressLabel}><span>수업 이수율</span><strong>100%</strong></div>
          <div className={styles.progressTrack}><span /></div>
          <div className={styles.roleGrid}>
            {roleCards.map(({ icon: Icon, title, description }) => (
              <article key={title}>
                <span><Icon size={19} aria-hidden="true" /></span>
                <div><strong>{title}</strong><p>{description}</p></div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
