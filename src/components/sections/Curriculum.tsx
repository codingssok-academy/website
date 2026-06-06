"use client";

import {
    Bot,
    Brain,
    CheckCircle2,
    ClipboardCheck,
    Code2,
    Cpu,
    FileText,
    GitBranch,
    Hammer,
    MonitorCheck,
    Route,
    Trophy,
    Video,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Track = {
    code: string;
    title: string;
    desc: string;
    flow: string[];
    icon: LucideIcon;
    accent: string;
};

const foundation = ["어린이 IT / 컴퓨터기초", "코딩기초", "컴퓨팅 사고력", "AI 체험"];

const onboarding = [
    "신규 등록",
    "진단 테스트",
    "공통기초 시작",
    "4주 단위 체크",
    "성향 분석",
    "트랙 추천",
    "A/B/C/D 선택",
    "학부모 포털 기록",
];

const tracks: Track[] = [
    {
        code: "A",
        title: "상위권 대회형",
        desc: "정올과 상위권 학생은 Python 맛보기 이후 C++ 중심으로 고정한다.",
        flow: ["C++", "구현력", "알고리즘", "정올 기출", "GitHub 풀이 기록", "대회 기록"],
        icon: Trophy,
        accent: "#b91c1c",
    },
    {
        code: "B",
        title: "일반 프로젝트형",
        desc: "Python 기본기와 AI 협업을 결과물, 포트폴리오, 캠프 준비로 연결한다.",
        flow: ["Python 기초", "미니 프로젝트", "AI 협업", "GitHub", "포트폴리오", "대기업 청소년 캠프"],
        icon: Code2,
        accent: "#2563eb",
    },
    {
        code: "C",
        title: "흥미형 초등",
        desc: "텍스트 코딩 공포를 줄이고 엔트리, AI 체험, Python 맛보기로 연결한다.",
        flow: ["컴퓨터기초", "코딩기초", "엔트리/AI 체험", "Python 맛보기", "작품 발표"],
        icon: Brain,
        accent: "#0f766e",
    },
    {
        code: "D",
        title: "만들기형",
        desc: "손으로 만드는 아이는 회로, 센서, 아두이노, 시연 영상까지 증명한다.",
        flow: ["피지컬컴퓨팅", "전기/회로 기초", "아두이노/센서", "작품 제작", "시연 영상"],
        icon: Hammer,
        accent: "#c2410c",
    },
];

const growthLevels = [
    "보고 따라 친다",
    "코드를 읽고 설명한다",
    "조건을 바꿔 고친다",
    "작은 문제를 혼자 푼다",
    "AI 코드와 비교한다",
    "결과물을 만든다",
];

const capabilityChecks = [
    "코드 읽기",
    "실행 예측",
    "오류 수정",
    "조건 변경",
    "자기 말로 3줄 설명",
    "내 코드와 AI 코드 차이 설명",
];

const pythonRoadmap = ["출력", "변수", "연산자", "조건문", "반복문", "리스트", "문자열", "함수", "파일 입출력 기초", "간단한 프로젝트", "AI 협업", "GitHub 저장"];
const cppRoadmap = ["입출력", "변수", "연산자", "조건문", "반복문", "배열", "문자열", "함수", "vector 기초", "sort 기초"];
const koiRoadmap = ["배열", "문자열", "완전탐색", "정렬", "누적합", "재귀", "DFS/BFS", "그리디", "이분탐색", "DP 기초"];

const proofItems = [
    "코드 파일",
    "실행 결과",
    "GitHub 기록",
    "학생 설명 3줄",
    "AI 사용 기록",
    "오답/개선 기록",
    "발표 영상",
    "프로젝트 결과물",
    "학부모 리포트",
];

function ChipList({ items }: { items: string[] }) {
    return (
        <div className="curr-chip-list">
            {items.map((item) => (
                <span key={item}>{item}</span>
            ))}
        </div>
    );
}

export default function Curriculum() {
    return (
        <section id="curriculum" className="curr-section">
            <div className="curr-wrap">
                <header className="curr-head">
                    <span className="curr-kicker">커리큘럼</span>
                    <h2>아이에게 맞는 경로로 탄탄하게 배웁니다</h2>
                    <p>
                        코딩쏙은 먼저 공통기초로 기준을 맞추고, 4주 체크와 성향 분석 뒤 A/B/C/D 트랙을 추천한다.
                        학생은 코드, 설명, 수정, AI 비교, 결과물로 성장했다는 증거를 남긴다.
                    </p>
                </header>

                <div className="curr-foundation">
                    <div>
                        <div className="curr-title">
                            <Route size={22} />
                            신규 학생 첫 흐름
                        </div>
                        <div className="curr-flow">
                            {onboarding.map((step, index) => (
                                <div key={step} className="curr-flow-step">
                                    <span>{String(index + 1).padStart(2, "0")}</span>
                                    <strong>{step}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="curr-foundation-side">
                        <div className="curr-title">
                            <ClipboardCheck size={22} />
                            공통 기초
                        </div>
                        <ChipList items={foundation} />
                        <p>
                            새 학생에게 바로 트랙을 고르게 하지 않는다. 시험 느낌보다 성향 진단과 기초 확인에 가깝게 시작한다.
                        </p>
                    </div>
                </div>

                <div className="curr-track-grid">
                    {tracks.map((track) => {
                        const Icon = track.icon;
                        return (
                            <article key={track.code} className="curr-track" style={{ borderTopColor: track.accent }}>
                                <div className="curr-track-top">
                                    <span style={{ background: track.accent }}>{track.code}</span>
                                    <Icon size={24} color={track.accent} />
                                </div>
                                <h3>{track.title}</h3>
                                <p>{track.desc}</p>
                                <div className="curr-track-flow">
                                    {track.flow.map((item, index) => (
                                        <div key={item} className="curr-track-node">
                                            <strong>{item}</strong>
                                            {index < track.flow.length - 1 && <em>→</em>}
                                        </div>
                                    ))}
                                </div>
                                <div className="curr-app-note">학원 앱과 학부모 포털에 성장 기록으로 표시</div>
                            </article>
                        );
                    })}
                </div>

                <div className="curr-mid-grid">
                    <div className="curr-panel">
                        <div className="curr-title">
                            <MonitorCheck size={22} />
                            6단계 성장 기준
                        </div>
                        <div className="curr-levels">
                            {growthLevels.map((level, index) => (
                                <div key={level}>
                                    <span>{index + 1}</span>
                                    <strong>{level}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="curr-panel">
                        <div className="curr-title">
                            <CheckCircle2 size={22} />
                            수업에서 확인할 능력
                        </div>
                        <ChipList items={capabilityChecks} />
                        <p className="curr-note">
                            “혼자 설명·수정·변형·검증 가능하냐”가 진도 기준이다.
                        </p>
                    </div>
                </div>

                <div className="curr-roadmap-grid">
                    <div className="curr-panel">
                        <div className="curr-title">
                            <Code2 size={22} />
                            Python 기초
                        </div>
                        <p className="curr-note">초등 입문/일반반, 정올 맛보기반의 사고력·구현 감각 훈련에 사용한다.</p>
                        <ChipList items={pythonRoadmap} />
                    </div>
                    <div className="curr-panel">
                        <div className="curr-title">
                            <Cpu size={22} />
                            C++ 기본
                        </div>
                        <p className="curr-note">정올 본격반은 C++ 필수, 상위권반은 C++ 고정이다.</p>
                        <ChipList items={cppRoadmap} />
                    </div>
                    <div className="curr-panel">
                        <div className="curr-title">
                            <Trophy size={22} />
                            C++ 정올
                        </div>
                        <p className="curr-note">Python은 입문용 사고력 도구로 쓰고, 본격 대회는 C++로 갈아탄다.</p>
                        <ChipList items={koiRoadmap} />
                    </div>
                </div>

                <div className="curr-bottom-grid">
                    <div className="curr-panel curr-diagnosis">
                        <div className="curr-title">
                            <FileText size={22} />
                            진단 테스트 예시
                        </div>
                        <dl>
                            <div><dt>컴퓨터기초</dt><dd>보통</dd></div>
                            <div><dt>코딩기초</dt><dd>약함</dd></div>
                            <div><dt>사고력</dt><dd>좋음</dd></div>
                            <div><dt>문제풀이 집중력</dt><dd>좋음</dd></div>
                            <div><dt>만들기 흥미</dt><dd>낮음</dd></div>
                        </dl>
                        <div className="curr-recommend">
                            추천 경로: 공통기초 4주 → C++ 기초 → 정올 맛보기반
                        </div>
                    </div>
                    <div className="curr-panel">
                        <div className="curr-title">
                            <GitBranch size={22} />
                            성장 증명으로 저장할 것
                        </div>
                        <ChipList items={proofItems} />
                        <div className="curr-ai-box">
                            <Bot size={22} />
                            <span>학원 AI는 바로 정답을 주지 않고 힌트, 오류 설명, AI 코드 비교, 학부모 리포트 초안을 맡는다.</span>
                        </div>
                        <div className="curr-ai-box">
                            <Video size={22} />
                            <span>프로젝트형과 만들기형은 결과물, 발표 영상, 시연 영상을 앱에 남긴다.</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
.curr-section {
    background: #ffffff;
    color: #0f172a;
    padding: 96px 20px;
}
.curr-wrap {
    max-width: 1180px;
    margin: 0 auto;
}
.curr-head {
    max-width: 780px;
    margin-bottom: 36px;
}
.curr-kicker {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 12px;
    border-radius: 999px;
    background: #fef3c7;
    color: #92400e;
    font-size: 12px;
    font-weight: 900;
    letter-spacing: 0;
}
.curr-head h2 {
    margin: 16px 0 12px;
    font-size: 40px;
    line-height: 1.18;
    font-weight: 900;
    letter-spacing: 0;
}
.curr-head p,
.curr-panel p,
.curr-foundation-side p,
.curr-track p,
.curr-note {
    color: #475569;
    font-size: 15px;
    line-height: 1.75;
    margin: 0;
}
.curr-title {
    display: flex;
    align-items: center;
    gap: 9px;
    color: #0f172a;
    font-size: 17px;
    font-weight: 900;
    margin-bottom: 16px;
    letter-spacing: 0;
}
.curr-foundation {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(280px, 0.6fr);
    gap: 16px;
    margin-bottom: 16px;
}
.curr-foundation > div,
.curr-panel,
.curr-track {
    border: 1px solid #dbe3ef;
    border-radius: 8px;
    background: #ffffff;
    padding: 22px;
}
.curr-foundation {
    align-items: stretch;
}
.curr-flow {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
}
.curr-flow-step {
    min-height: 82px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #f8fafc;
    padding: 12px;
}
.curr-flow-step span {
    display: block;
    color: #64748b;
    font-size: 12px;
    font-weight: 900;
    margin-bottom: 8px;
}
.curr-flow-step strong {
    display: block;
    font-size: 14px;
    line-height: 1.35;
}
.curr-chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}
.curr-chip-list span {
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 999px;
    padding: 7px 10px;
    color: #334155;
    font-size: 12px;
    font-weight: 800;
}
.curr-foundation-side .curr-chip-list {
    margin-bottom: 16px;
}
.curr-track-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
}
.curr-track {
    border-top: 4px solid;
}
.curr-track-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
}
.curr-track-top span {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    color: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
}
.curr-track h3 {
    margin: 0 0 8px;
    font-size: 22px;
    line-height: 1.25;
}
.curr-track-flow {
    margin-top: 18px;
    display: grid;
    gap: 7px;
}
.curr-track-node {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    color: #334155;
    font-size: 13px;
    line-height: 1.35;
}
.curr-track-node strong {
    font-weight: 800;
}
.curr-track-node em {
    color: #94a3b8;
    font-style: normal;
}
.curr-app-note,
.curr-recommend {
    margin-top: 18px;
    border-radius: 8px;
    background: #ecfeff;
    border: 1px solid #a5f3fc;
    color: #155e75;
    font-size: 12px;
    font-weight: 900;
    line-height: 1.5;
    padding: 10px;
}
.curr-mid-grid {
    margin-top: 16px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}
.curr-levels {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
}
.curr-levels div {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 12px;
    min-height: 82px;
    background: #f8fafc;
}
.curr-levels span {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 999px;
    background: #0f172a;
    color: #ffffff;
    font-size: 12px;
    font-weight: 900;
    margin-bottom: 9px;
}
.curr-levels strong {
    display: block;
    font-size: 13px;
    line-height: 1.4;
}
.curr-roadmap-grid {
    margin-top: 16px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
}
.curr-panel .curr-chip-list {
    margin-top: 16px;
}
.curr-bottom-grid {
    margin-top: 16px;
    display: grid;
    grid-template-columns: 0.9fr 1.1fr;
    gap: 16px;
}
.curr-diagnosis dl {
    margin: 0;
    display: grid;
    gap: 8px;
}
.curr-diagnosis dl div {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 8px;
}
.curr-diagnosis dt,
.curr-diagnosis dd {
    margin: 0;
    font-size: 14px;
}
.curr-diagnosis dt {
    color: #64748b;
    font-weight: 800;
}
.curr-diagnosis dd {
    color: #0f172a;
    font-weight: 900;
}
.curr-ai-box {
    margin-top: 14px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    border: 1px solid #e2e8f0;
    background: #f8fafc;
    border-radius: 8px;
    padding: 12px;
    color: #334155;
    font-size: 13px;
    line-height: 1.6;
    font-weight: 700;
}
.curr-ai-box svg {
    flex: 0 0 auto;
    color: #2563eb;
}
@media (max-width: 1050px) {
    .curr-track-grid,
    .curr-roadmap-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .curr-flow {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
@media (max-width: 760px) {
    .curr-section { padding: 72px 16px; }
    .curr-head h2 { font-size: 30px; }
    .curr-foundation,
    .curr-track-grid,
    .curr-mid-grid,
    .curr-roadmap-grid,
    .curr-bottom-grid {
        grid-template-columns: 1fr;
    }
    .curr-levels {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
@media (max-width: 480px) {
    .curr-head h2 { font-size: 28px; }
    .curr-flow,
    .curr-levels {
        grid-template-columns: 1fr;
    }
    .curr-foundation > div,
    .curr-panel,
    .curr-track {
        padding: 18px;
    }
}
            `}</style>
        </section>
    );
}
