"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Play } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
    findLatestLearningResume,
    type LearningActivityRow,
    type LearningResume,
} from "@/lib/learning-resume";

export default function LearningResumeCard({ userId }: { userId?: string }) {
    const supabase = useMemo(() => createClient(), []);
    const [resume, setResume] = useState<LearningResume | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadFailed, setLoadFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function loadResume() {
            if (!userId) {
                if (!cancelled) setLoading(false);
                return;
            }

            setLoading(true);
            setLoadFailed(false);

            const { data, error } = await supabase
                .from("student_activity_log")
                .select("course_id, course_title, unit_id, unit_title, page_id, page_title, started_at")
                .eq("user_id", userId)
                .not("page_id", "is", null)
                .order("started_at", { ascending: false })
                .limit(12);

            if (cancelled) return;

            if (error) {
                if (process.env.NODE_ENV === "development") {
                    console.warn("[LearningResumeCard] load failed:", error.message);
                }
                setLoadFailed(true);
                setLoading(false);
                return;
            }

            setResume(findLatestLearningResume((data ?? []) as LearningActivityRow[]));
            setLoading(false);
        }

        loadResume();
        return () => { cancelled = true; };
    }, [supabase, userId]);

    if (loading) {
        return (
            <div
                aria-label="지난 학습 불러오는 중"
                style={{
                    position: "relative",
                    zIndex: 20,
                    width: "calc(100% - 48px)",
                    maxWidth: 1120,
                    height: 128,
                    margin: "0 auto 12px",
                    borderRadius: 22,
                    background: "#e2e8f0",
                }}
            />
        );
    }

    if (loadFailed) return null;

    return <LearningResumeCardView resume={resume} />;
}

export function LearningResumeCardView({ resume }: { resume: LearningResume | null }) {
    return (
        <section className="learning-resume-card" aria-label={resume ? "지난 학습 이어하기" : "첫 학습 시작하기"}>
            <div className="learning-resume-icon" aria-hidden="true">
                {resume ? <Play size={25} fill="currentColor" /> : <BookOpen size={24} />}
            </div>

            {resume ? (
                <>
                    <div className="learning-resume-content">
                        <span className="learning-resume-eyebrow">지난 학습 이어하기</span>
                        <h2>{resume.courseTitle}</h2>
                        <p>{resume.unitTitle} · {resume.pageTitle}</p>
                        <div className="learning-resume-progress-row">
                            <div
                                className="learning-resume-progress"
                                role="progressbar"
                                aria-label="현재 단원 학습 위치"
                                aria-valuemin={1}
                                aria-valuemax={resume.totalSteps}
                                aria-valuenow={resume.currentStep}
                            >
                                <span style={{ width: `${resume.progressPercent}%` }} />
                            </div>
                            <strong>{resume.currentStep}/{resume.totalSteps}단계</strong>
                        </div>
                        <small>
                            {resume.remainingSteps === 0
                                ? "현재 이 단원의 마지막 단계입니다."
                                : `현재 위치 뒤로 ${resume.remainingSteps}단계가 더 있습니다.`}
                        </small>
                    </div>
                    <Link href={resume.href} className="learning-resume-button">
                        이어서 학습하기
                        <ArrowRight size={18} aria-hidden="true" />
                    </Link>
                </>
            ) : (
                <>
                    <div className="learning-resume-content">
                        <span className="learning-resume-eyebrow">첫 학습 시작하기</span>
                        <h2>아직 저장된 학습 위치가 없어요.</h2>
                        <p>코스를 한 번 열면 다음부터 이 자리에서 바로 이어갈 수 있습니다.</p>
                    </div>
                    <Link href="/dashboard/learning/courses" className="learning-resume-button">
                        코스 선택하기
                        <ArrowRight size={18} aria-hidden="true" />
                    </Link>
                </>
            )}

            <style>{`
                .learning-resume-card {
                    position: relative;
                    z-index: 20;
                    width: calc(100% - 48px);
                    max-width: 1120px;
                    margin: 0 auto 12px;
                    padding: 18px 20px;
                    border: 1px solid #bfdbfe;
                    border-radius: 22px;
                    background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
                    box-shadow: 0 14px 34px rgba(37, 99, 235, .12);
                    display: grid;
                    grid-template-columns: auto minmax(0, 1fr) auto;
                    align-items: center;
                    gap: 16px;
                    color: #0f172a;
                    font-family: Pretendard, system-ui, sans-serif;
                }
                .learning-resume-icon {
                    width: 50px;
                    height: 50px;
                    border-radius: 16px;
                    display: grid;
                    place-items: center;
                    color: #fff;
                    background: linear-gradient(135deg, #2563eb, #4f46e5);
                    box-shadow: 0 10px 24px rgba(37, 99, 235, .25);
                }
                .learning-resume-content { min-width: 0; }
                .learning-resume-eyebrow { display: block; margin-bottom: 3px; color: #2563eb; font-size: 11px; font-weight: 900; letter-spacing: .04em; }
                .learning-resume-content h2 { margin: 0; font-size: 19px; line-height: 1.3; font-weight: 900; letter-spacing: -.03em; }
                .learning-resume-content p { margin: 4px 0 8px; overflow: hidden; color: #475569; font-size: 13px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
                .learning-resume-progress-row { display: flex; align-items: center; gap: 10px; }
                .learning-resume-progress { width: min(280px, 45vw); height: 7px; overflow: hidden; border-radius: 999px; background: #dbeafe; }
                .learning-resume-progress > span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #2563eb, #6366f1); }
                .learning-resume-progress-row strong { color: #1d4ed8; font-size: 12px; font-weight: 900; white-space: nowrap; }
                .learning-resume-content small { display: block; margin-top: 5px; color: #64748b; font-size: 11px; font-weight: 700; }
                .learning-resume-button {
                    min-height: 44px;
                    padding: 0 16px;
                    border-radius: 13px;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                    color: #fff;
                    background: #2563eb;
                    text-decoration: none;
                    font-size: 13px;
                    font-weight: 900;
                    white-space: nowrap;
                }
                .learning-resume-button:hover { background: #1d4ed8; }
                .learning-resume-button:focus-visible { outline: 3px solid rgba(37, 99, 235, .3); outline-offset: 3px; }
                .learning-resume-skeleton {
                    position: relative;
                    z-index: 20;
                    width: calc(100% - 48px);
                    max-width: 1120px;
                    height: 128px;
                    margin: 0 auto 12px;
                    border-radius: 22px;
                    background: linear-gradient(90deg, #e2e8f0, #f8fafc, #e2e8f0);
                    background-size: 200% 100%;
                    animation: learning-resume-loading 1.2s linear infinite;
                }
                @keyframes learning-resume-loading { to { background-position: -200% 0; } }
                @media (max-width: 767px) {
                    .learning-resume-card {
                        width: 100%;
                        margin: 0 0 14px;
                        padding: 17px;
                        grid-template-columns: auto minmax(0, 1fr);
                        gap: 12px;
                        border-radius: 20px;
                    }
                    .learning-resume-icon { width: 44px; height: 44px; border-radius: 14px; align-self: start; }
                    .learning-resume-content h2 { font-size: 17px; }
                    .learning-resume-content p { font-size: 12px; white-space: normal; line-height: 1.45; }
                    .learning-resume-progress { width: 100%; }
                    .learning-resume-button { grid-column: 1 / -1; width: 100%; min-height: 48px; }
                    .learning-resume-skeleton { width: 100%; height: 180px; margin: 0 0 14px; }
                }
            `}</style>
        </section>
    );
}
