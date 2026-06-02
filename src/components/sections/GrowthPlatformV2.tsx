"use client";

import { motion } from "framer-motion";
import {
    BarChart3,
    Bot,
    BookOpen,
    CheckCircle2,
    ClipboardCheck,
    Code2,
    Database,
    FileText,
    Folder,
    Github,
    Image,
    ListChecks,
    MessageSquare,
    Monitor,
    PenLine,
    Route,
    Upload,
    UserPlus,
    Users,
    Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Item = {
    title: string;
    desc: string;
    icon: LucideIcon;
};

const courseShelves = [
    { title: "공통기초", desc: "컴퓨터기초 · 코딩기초 · 사고력 · AI 체험", color: "#2563eb" },
    { title: "Python", desc: "읽기 · 수정 · 작은 프로젝트 · AI 비교", color: "#0f766e" },
    { title: "C++", desc: "구현력 · 배열 · 함수 · vector · sort", color: "#7c3aed" },
    { title: "피지컬컴퓨팅", desc: "전기/회로 · 아두이노 · 센서 · 작품", color: "#c2410c" },
    { title: "정올", desc: "완전탐색 · DFS/BFS · 그리디 · DP 기초", color: "#b91c1c" },
];

const proofTimeline: Item[] = [
    { title: "코드 파일", desc: "학생이 작성한 원본 코드", icon: Code2 },
    { title: "실행 결과", desc: "화면 캡처와 결과 이미지", icon: Monitor },
    { title: "학생 설명 3줄", desc: "자기 말로 이해를 증명", icon: PenLine },
    { title: "AI 비교 기록", desc: "내 코드와 AI 코드 차이 설명", icon: Bot },
    { title: "오답/개선 기록", desc: "틀린 코드 수정 과정 저장", icon: Wrench },
    { title: "GitHub/영상", desc: "저장소, 발표 영상, 결과물 링크", icon: Github },
];

const roleMenus = [
    {
        role: "학생 화면",
        icon: Users,
        accent: "#2563eb",
        menus: ["오늘 할 일", "내 커리큘럼", "시험 보기", "과제 제출", "내 코드", "내 프로젝트", "AI 코치", "내 성장 기록"],
    },
    {
        role: "학부모 화면",
        icon: FileText,
        accent: "#0f766e",
        menus: ["이번 달 요약", "수업 기록", "시험 결과", "과제 결과", "프로젝트 보기", "선생님 피드백", "성장 리포트", "노션 연동", "상담 요청"],
    },
    {
        role: "선생님 화면",
        icon: ClipboardCheck,
        accent: "#c2410c",
        menus: ["학생 관리", "진단 테스트 관리", "수업 기록 입력", "과제/시험 관리", "결과물 업로드", "리포트 생성", "트랙 추천"],
    },
];

const firstBuild: Item[] = [
    { title: "학생 등록", desc: "신규 학생 기본 정보와 보호자 연결", icon: UserPlus },
    { title: "진단 테스트", desc: "컴퓨터기초, 코딩기초, 사고력, 언어 반응, 성향 확인", icon: ClipboardCheck },
    { title: "커리큘럼 단계 배정", desc: "공통기초 시작 단계와 4주 체크 기준 지정", icon: Route },
    { title: "수업 기록 입력", desc: "오늘 수업 주제, 코드 파일, 실행 결과 이미지, 학생 설명 3줄, AI 사용 여부, 오답/개선 기록 저장", icon: PenLine },
    { title: "과제/시험 결과 저장", desc: "HTML/React 문제 풀이, 채점, 결과 보관", icon: ListChecks },
    { title: "결과물 업로드", desc: "프로젝트, GitHub, 발표 영상, 시연 자료 연결", icon: Upload },
    { title: "학부모 리포트 화면", desc: "이번 달 배운 내용과 성장 증거를 월간 리포트로 자동 생성", icon: BarChart3 },
];

const aiCoach: Item[] = [
    { title: "정답 대신 힌트", desc: "학생이 직접 생각할 여지를 남긴다", icon: MessageSquare },
    { title: "오류 설명", desc: "에러 원인과 수정 방향을 쉬운 말로 정리한다", icon: Wrench },
    { title: "AI 코드 비교", desc: "내 코드와 AI 코드의 차이를 설명하게 만든다", icon: Bot },
    { title: "리포트 초안", desc: "학부모 리포트 초안을 선생님 검토용으로 만든다", icon: FileText },
];

const dataRules = [
    { title: "PNG", desc: "수업자료, 교재 표지, 개념 카드처럼 보여주는 자료", icon: Image },
    { title: "HTML", desc: "시험, 과제 제출, 코드 작성처럼 학생이 행동하는 화면", icon: Monitor },
    { title: "DB", desc: "제목, 단원, 핵심개념, 점수, 설명, 개선 기록의 원본", icon: Database },
];

function IconLine({ item }: { item: Item }) {
    const Icon = item.icon;
    return (
        <div className="gp-line">
            <span className="gp-line-icon">
                <Icon size={18} strokeWidth={2.2} />
            </span>
            <span>
                <strong>{item.title}</strong>
                <em>{item.desc}</em>
            </span>
        </div>
    );
}

export default function GrowthPlatformV2() {
    return (
        <section id="growth-platform" className="gp-section">
            <div className="gp-wrap">
                <div className="gp-head">
                    <span className="gp-kicker">학습 플랫폼 V2</span>
                    <h2>학생이 어디까지 성장했는지 증명하는 시스템</h2>
                    <p>
                        코딩쏙 플랫폼은 무엇을 배웠는지 나열하는 곳이 아니다.
                        진단, 공통기초, 트랙, 수업 기록, 결과물, 학부모 리포트가 연결되는 성장 기록장이다.
                    </p>
                </div>

                <div className="gp-dashboard" aria-label="코딩쏙 성장 대시보드 예시">
                    <div className="gp-dash-top">
                        <div>
                            <span className="gp-small">학생</span>
                            <strong>샘플 학생</strong>
                        </div>
                        <div>
                            <span className="gp-small">현재 트랙</span>
                            <strong>공통기초 3단계 / 컴퓨팅 사고력</strong>
                        </div>
                        <div>
                            <span className="gp-small">이번 달 성장률</span>
                            <strong>수업 8회 · 결과물 6개 · 수정 4개 · AI 비교 2개 · 테스트 2회 · 피드백 4개</strong>
                        </div>
                    </div>

                    <div className="gp-dash-grid">
                        <div className="gp-main-panel">
                            <div className="gp-panel-title">
                                <BookOpen size={20} />
                                내 성장 로드맵
                            </div>
                            <div className="gp-shelves">
                                {courseShelves.map((s, i) => (
                                    <motion.div
                                        key={s.title}
                                        className="gp-shelf"
                                        initial={{ opacity: 0, y: 16 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.05 }}
                                        style={{ borderColor: `${s.color}55` }}
                                    >
                                        <span style={{ background: s.color }} />
                                        <strong>{s.title}</strong>
                                        <em>{s.desc}</em>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <aside className="gp-side-panel">
                            <div>
                                <div className="gp-panel-title">
                                    <CheckCircle2 size={20} />
                                    오늘 할 일
                                </div>
                                <ul className="gp-tasks">
                                    <li>조건문 실행 결과 예측하기</li>
                                    <li>틀린 코드 1개 직접 고치기</li>
                                    <li>학생 설명 3줄 남기기</li>
                                </ul>
                            </div>
                            <div className="gp-mini-result">
                                <span>최근 테스트</span>
                                <strong>조건문 3단계 / 6단계</strong>
                                <em>다음 목표: 조건문 문제를 혼자 설명하기</em>
                            </div>
                        </aside>
                    </div>

                    <div className="gp-timeline">
                        {proofTimeline.map((item) => (
                            <IconLine key={item.title} item={item} />
                        ))}
                    </div>
                </div>

                <div className="gp-role-grid">
                    {roleMenus.map((group) => {
                        const Icon = group.icon;
                        return (
                            <div key={group.role} className="gp-role" style={{ borderTopColor: group.accent }}>
                                <div className="gp-role-title" style={{ color: group.accent }}>
                                    <Icon size={20} />
                                    {group.role}
                                </div>
                                <div className="gp-menu-list">
                                    {group.menus.map((m) => (
                                        <span key={m}>{m}</span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="gp-parent-proof">
                    <strong>학부모 포털의 기준</strong>
                    <span>우리 아이가 그냥 앉아 있다 온 게 아니라 진짜 성장했구나.</span>
                </div>

                <div className="gp-build-grid">
                    <div className="gp-build-panel">
                        <div className="gp-panel-title">
                            <Folder size={20} />
                            1차로 먼저 만들 기능 7개
                        </div>
                        <div className="gp-lines">
                            {firstBuild.map((item) => (
                                <IconLine key={item.title} item={item} />
                            ))}
                        </div>
                    </div>

                    <div className="gp-build-panel">
                        <div className="gp-panel-title">
                            <Bot size={20} />
                            학원 AI의 역할
                        </div>
                        <div className="gp-lines">
                            {aiCoach.map((item) => (
                                <IconLine key={item.title} item={item} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="gp-data-rule">
                    <div>
                        <span className="gp-kicker">자료 저장 원칙</span>
                        <h3>PNG는 교재, HTML은 시험장, DB는 성장기록장</h3>
                        <p>
                            수업자료 PNG는 버리지 않고 디지털 교재 자산으로 쓴다.
                            수업 중 화면, 태블릿, PDF, 학부모 포털, 복습 자료로 쓰되 제목·단원·핵심개념·문제 텍스트·학생 목표는 DB에 따로 저장한다.
                            PNG 안에만 내용이 있으면 검색, 채점, AI 분석, 문제 재사용, 진도 연결, 리포트 생성이 막힌다.
                        </p>
                    </div>
                    <div className="gp-data-items">
                        {dataRules.map((item) => (
                            <IconLine key={item.title} item={item} />
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
.gp-section {
    background: #f8fafc;
    color: #0f172a;
    padding: 96px 20px;
}
.gp-wrap {
    max-width: 1180px;
    margin: 0 auto;
}
.gp-head {
    max-width: 760px;
    margin-bottom: 40px;
}
.gp-kicker {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 12px;
    border-radius: 999px;
    background: #e0f2fe;
    color: #075985;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0;
}
.gp-head h2,
.gp-data-rule h3 {
    margin: 16px 0 12px;
    font-size: 40px;
    line-height: 1.18;
    font-weight: 900;
    letter-spacing: 0;
}
.gp-head p,
.gp-data-rule p {
    margin: 0;
    color: #475569;
    font-size: 16px;
    line-height: 1.75;
}
.gp-dashboard {
    background: #ffffff;
    border: 1px solid #dbe3ef;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
}
.gp-dash-top {
    display: grid;
    grid-template-columns: 1fr 1.4fr 1.5fr;
    gap: 1px;
    background: #dbe3ef;
}
.gp-dash-top > div {
    background: #ffffff;
    padding: 18px 20px;
}
.gp-small {
    display: block;
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 6px;
}
.gp-dash-top strong {
    display: block;
    font-size: 15px;
    line-height: 1.45;
}
.gp-dash-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 320px;
    gap: 0;
    border-top: 1px solid #dbe3ef;
}
.gp-main-panel,
.gp-side-panel {
    padding: 24px;
}
.gp-side-panel {
    border-left: 1px solid #dbe3ef;
    background: #fbfdff;
    display: flex;
    flex-direction: column;
    gap: 20px;
}
.gp-panel-title,
.gp-role-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 0;
}
.gp-shelves {
    margin-top: 18px;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
}
.gp-shelf {
    min-height: 158px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 16px 14px;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.gp-shelf > span {
    width: 38px;
    height: 5px;
    border-radius: 999px;
}
.gp-shelf strong {
    font-size: 18px;
    font-weight: 900;
}
.gp-shelf em,
.gp-line em,
.gp-mini-result em {
    color: #64748b;
    font-size: 13px;
    line-height: 1.55;
    font-style: normal;
}
.gp-tasks {
    margin: 14px 0 0;
    padding-left: 18px;
    color: #334155;
    line-height: 1.8;
    font-size: 14px;
}
.gp-mini-result {
    border: 1px solid #bfdbfe;
    background: #eff6ff;
    border-radius: 8px;
    padding: 16px;
}
.gp-mini-result span,
.gp-mini-result strong,
.gp-mini-result em {
    display: block;
}
.gp-mini-result span {
    color: #2563eb;
    font-size: 12px;
    font-weight: 900;
    margin-bottom: 6px;
}
.gp-mini-result strong {
    font-size: 15px;
    margin-bottom: 6px;
}
.gp-timeline {
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 1px;
    background: #dbe3ef;
    border-top: 1px solid #dbe3ef;
}
.gp-timeline .gp-line {
    background: #ffffff;
    padding: 16px;
}
.gp-line {
    display: flex;
    align-items: flex-start;
    gap: 12px;
}
.gp-line-icon {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: #f1f5f9;
    color: #0f172a;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
}
.gp-line strong,
.gp-line em {
    display: block;
}
.gp-line strong {
    font-size: 14px;
    line-height: 1.35;
    margin-bottom: 3px;
}
.gp-role-grid {
    margin-top: 24px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
}
.gp-role,
.gp-build-panel,
.gp-data-rule {
    background: #ffffff;
    border: 1px solid #dbe3ef;
    border-radius: 8px;
}
.gp-role {
    border-top: 4px solid;
    padding: 20px;
}
.gp-menu-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
}
.gp-menu-list span {
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 999px;
    padding: 7px 10px;
    color: #334155;
    font-size: 12px;
    font-weight: 700;
}
.gp-parent-proof {
    margin-top: 16px;
    border: 1px solid #bbf7d0;
    background: #f0fdf4;
    border-radius: 8px;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}
.gp-parent-proof strong {
    color: #166534;
    font-size: 14px;
    font-weight: 900;
}
.gp-parent-proof span {
    color: #14532d;
    font-size: 15px;
    font-weight: 800;
    line-height: 1.5;
}
.gp-build-grid {
    margin-top: 16px;
    display: grid;
    grid-template-columns: 1.25fr 0.75fr;
    gap: 16px;
}
.gp-build-panel {
    padding: 22px;
}
.gp-lines {
    margin-top: 18px;
    display: grid;
    gap: 14px;
}
.gp-data-rule {
    margin-top: 16px;
    padding: 28px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 420px;
    gap: 28px;
    align-items: start;
}
.gp-data-rule h3 {
    font-size: 28px;
}
.gp-data-items {
    display: grid;
    gap: 14px;
}
@media (max-width: 980px) {
    .gp-section { padding: 72px 16px; }
    .gp-head h2 { font-size: 32px; }
    .gp-dash-top,
    .gp-dash-grid,
    .gp-role-grid,
    .gp-parent-proof,
    .gp-build-grid,
    .gp-data-rule {
        grid-template-columns: 1fr;
    }
    .gp-parent-proof {
        display: grid;
    }
    .gp-side-panel {
        border-left: 0;
        border-top: 1px solid #dbe3ef;
    }
    .gp-shelves,
    .gp-timeline {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
@media (max-width: 560px) {
    .gp-head h2 { font-size: 28px; }
    .gp-shelves,
    .gp-timeline {
        grid-template-columns: 1fr;
    }
    .gp-main-panel,
    .gp-side-panel,
    .gp-build-panel,
    .gp-data-rule {
        padding: 18px;
    }
}
            `}</style>
        </section>
    );
}
