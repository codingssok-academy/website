"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ensureGrowthOsStudentId, upsertLocalStudentRecord } from "@/lib/growth-os-client";
import { useAuth } from "@/contexts/AuthContext";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";

type AreaId = "computer" | "coding" | "thinking" | "language" | "interest";
type TrackId = "A" | "B" | "C" | "D";

interface AreaMeta {
    label: string;
    short: string;
    goal: string;
    color: string;
}

interface TrackMeta {
    title: string;
    desc: string;
    next: string;
}

interface Choice {
    text: string;
    track?: TrackId;
}

interface DiagnosticQuestion {
    id: string;
    number: number;
    area: AreaId;
    concept: string;
    prompt: string;
    choices: Choice[];
    answer?: number;
    evidence: string;
}

const AREA_ORDER: AreaId[] = ["computer", "coding", "thinking", "language", "interest"];
const TRACK_ORDER: TrackId[] = ["A", "B", "C", "D"];

const AREA_META: Record<AreaId, AreaMeta> = {
    computer: {
        label: "컴퓨터기초",
        short: "컴퓨터",
        goal: "폴더, 파일, 저장, 브라우저처럼 수업을 받기 전 꼭 필요한 사용 감각을 확인합니다.",
        color: "#2563eb",
    },
    coding: {
        label: "코딩기초",
        short: "코딩",
        goal: "순서, 조건, 반복, 변수, 디버깅의 기본 흐름을 확인합니다.",
        color: "#16a34a",
    },
    thinking: {
        label: "사고력",
        short: "사고",
        goal: "규칙 찾기, 경우 나누기, 절차 설명, 표 만들기 습관을 확인합니다.",
        color: "#7c3aed",
    },
    language: {
        label: "언어 감각",
        short: "언어",
        goal: "Python과 C++ 코드에 대한 첫 반응과 기초 문법 감각을 확인합니다.",
        color: "#ea580c",
    },
    interest: {
        label: "성향",
        short: "성향",
        goal: "대회형, 프로젝트형, 흥미형, 만들기형 중 어떤 성장 기록이 잘 맞는지 봅니다.",
        color: "#ca8a04",
    },
};

const TRACK_META: Record<TrackId, TrackMeta> = {
    A: {
        title: "A 트랙 · C++ / 정올 / 구현력",
        desc: "문제를 정확히 풀고 기록을 쌓는 방향입니다.",
        next: "공통기초 후 C++ 구현력과 알고리즘 문제 풀이로 이어갑니다.",
    },
    B: {
        title: "B 트랙 · Python / 프로젝트 / AI 협업",
        desc: "작품을 만들고 GitHub와 포트폴리오로 남기는 방향입니다.",
        next: "Python 미니 프로젝트와 AI 협업 기록을 같이 쌓습니다.",
    },
    C: {
        title: "C 트랙 · 기초 / 흥미 / 자신감",
        desc: "컴퓨터기초와 코딩기초를 천천히 다져 자신감을 만드는 방향입니다.",
        next: "엔트리, AI 체험, Python 맛보기로 성공 경험을 먼저 만듭니다.",
    },
    D: {
        title: "D 트랙 · 피지컬컴퓨팅 / 아두이노",
        desc: "센서와 부품을 연결해 눈에 보이는 작품을 만드는 방향입니다.",
        next: "전기회로 기초, 센서 실험, 시연 영상 기록으로 이어갑니다.",
    },
};

const QUESTIONS: DiagnosticQuestion[] = [
    {
        id: "computer-1",
        number: 1,
        area: "computer",
        concept: "파일과 폴더",
        prompt: "수업 자료를 다음 시간에도 쉽게 찾기 가장 좋은 방법은 무엇인가요?",
        choices: [
            { text: "바탕화면에 아무 이름으로 저장한다." },
            { text: "수업 폴더를 만들고 날짜와 제목을 붙여 저장한다." },
            { text: "다운로드 폴더에 그대로 둔다." },
            { text: "파일 이름을 모두 새 파일로 둔다." },
        ],
        answer: 1,
        evidence: "수업 자료와 결과물을 스스로 정리할 수 있는지 확인",
    },
    {
        id: "computer-2",
        number: 2,
        area: "computer",
        concept: "확장자",
        prompt: "다음 중 이미지 파일일 가능성이 가장 높은 확장자는 무엇인가요?",
        choices: [{ text: ".py" }, { text: ".cpp" }, { text: ".png" }, { text: ".html" }],
        answer: 2,
        evidence: "PNG 교재 자료와 코드 파일을 구분할 수 있는지 확인",
    },
    {
        id: "computer-3",
        number: 3,
        area: "computer",
        concept: "브라우저",
        prompt: "학습 사이트 주소를 입력해 페이지를 여는 프로그램은 무엇인가요?",
        choices: [{ text: "브라우저" }, { text: "그림판" }, { text: "계산기" }, { text: "압축 프로그램" }],
        answer: 0,
        evidence: "온라인 학습 플랫폼 접속 기초 확인",
    },
    {
        id: "computer-4",
        number: 4,
        area: "computer",
        concept: "저장 습관",
        prompt: "코드를 고친 뒤 결과를 남기려면 가장 먼저 해야 할 일은 무엇인가요?",
        choices: [{ text: "저장한다." }, { text: "컴퓨터를 끈다." }, { text: "파일 이름을 지운다." }, { text: "화면 밝기를 낮춘다." }],
        answer: 0,
        evidence: "코드와 실행 결과를 성장 기록으로 남길 준비 확인",
    },
    {
        id: "coding-1",
        number: 5,
        area: "coding",
        concept: "순서",
        prompt: "로봇에게 앞으로 1칸, 오른쪽 돌기, 앞으로 1칸을 시키려면 무엇이 가장 중요한가요?",
        choices: [{ text: "명령의 순서" }, { text: "글자 색" }, { text: "화면 크기" }, { text: "파일 이름 길이" }],
        answer: 0,
        evidence: "절차대로 실행되는 코딩의 기본 감각 확인",
    },
    {
        id: "coding-2",
        number: 6,
        area: "coding",
        concept: "조건",
        prompt: "점수가 80점 이상이면 합격이라고 판단하는 코딩 개념은 무엇인가요?",
        choices: [{ text: "반복" }, { text: "조건" }, { text: "주석" }, { text: "출력" }],
        answer: 1,
        evidence: "조건문 이해 반응 확인",
    },
    {
        id: "coding-3",
        number: 7,
        area: "coding",
        concept: "반복",
        prompt: "같은 명령을 10번 실행하고 싶을 때 가장 가까운 개념은 무엇인가요?",
        choices: [{ text: "변수" }, { text: "반복" }, { text: "폴더" }, { text: "이미지" }],
        answer: 1,
        evidence: "반복 구조 이해 확인",
    },
    {
        id: "coding-4",
        number: 8,
        area: "coding",
        concept: "변수",
        prompt: "x = 3 다음에 x = x + 2를 실행하면 x의 값은 무엇인가요?",
        choices: [{ text: "2" }, { text: "3" }, { text: "5" }, { text: "32" }],
        answer: 2,
        evidence: "값의 변화를 따라갈 수 있는지 확인",
    },
    {
        id: "coding-5",
        number: 9,
        area: "coding",
        concept: "디버깅",
        prompt: "코드가 예상과 다르게 움직일 때 가장 좋은 첫 행동은 무엇인가요?",
        choices: [
            { text: "전부 지우고 새로 만든다." },
            { text: "어느 줄부터 생각과 달랐는지 확인한다." },
            { text: "컴퓨터를 탓한다." },
            { text: "파일 이름만 바꾼다." },
        ],
        answer: 1,
        evidence: "오류 수정 기록을 남길 수 있는지 확인",
    },
    {
        id: "thinking-1",
        number: 10,
        area: "thinking",
        concept: "규칙 찾기",
        prompt: "2, 4, 8, 16 다음에 올 수는 무엇인가요?",
        choices: [{ text: "18" }, { text: "20" }, { text: "24" }, { text: "32" }],
        answer: 3,
        evidence: "패턴을 찾고 다음 값을 예측하는 힘 확인",
    },
    {
        id: "thinking-2",
        number: 11,
        area: "thinking",
        concept: "경우의 수",
        prompt: "상의 2벌과 하의 3벌이 있으면 서로 다른 옷 조합은 몇 가지인가요?",
        choices: [{ text: "3가지" }, { text: "5가지" }, { text: "6가지" }, { text: "9가지" }],
        answer: 2,
        evidence: "경우 나누기와 곱의 원리 감각 확인",
    },
    {
        id: "thinking-3",
        number: 12,
        area: "thinking",
        concept: "절차 설명",
        prompt: "친구에게 종이비행기 접는 법을 알려줄 때 가장 좋은 설명 방식은 무엇인가요?",
        choices: [
            { text: "대충 접으라고 말한다." },
            { text: "완성 사진만 보여준다." },
            { text: "1단계부터 순서대로 설명한다." },
            { text: "틀리면 다시 알아서 하라고 한다." },
        ],
        answer: 2,
        evidence: "문제를 단계로 나누어 설명하는 습관 확인",
    },
    {
        id: "thinking-4",
        number: 13,
        area: "thinking",
        concept: "표 만들기",
        prompt: "여러 경우를 빠뜨리지 않고 확인하려면 무엇을 쓰는 것이 가장 도움이 되나요?",
        choices: [{ text: "표" }, { text: "감" }, { text: "긴 문장만 보기" }, { text: "문제 숨기기" }],
        answer: 0,
        evidence: "문제 해결 도구를 선택하는지 확인",
    },
    {
        id: "language-1",
        number: 14,
        area: "language",
        concept: "Python 출력",
        prompt: "Python 코드 print(3 + 4)의 실행 결과는 무엇인가요?",
        choices: [{ text: "3 + 4" }, { text: "7" }, { text: "34" }, { text: "오류" }],
        answer: 1,
        evidence: "Python 기본 출력 반응 확인",
    },
    {
        id: "language-2",
        number: 15,
        area: "language",
        concept: "Python 조건",
        prompt: "x = 7일 때 if x > 5: print(\"크다\")는 무엇을 출력하나요?",
        choices: [{ text: "크다" }, { text: "작다" }, { text: "7" }, { text: "출력 없음" }],
        answer: 0,
        evidence: "조건문 실행 결과 예측 확인",
    },
    {
        id: "language-3",
        number: 16,
        area: "language",
        concept: "Python 반복",
        prompt: "for i in range(3)은 보통 몇 번 반복하나요?",
        choices: [{ text: "1번" }, { text: "2번" }, { text: "3번" }, { text: "4번" }],
        answer: 2,
        evidence: "반복 횟수 감각 확인",
    },
    {
        id: "language-4",
        number: 17,
        area: "language",
        concept: "C++ 출력",
        prompt: "C++에서 화면 출력에 자주 쓰는 것은 무엇인가요?",
        choices: [{ text: "cout" }, { text: "folder" }, { text: "paint" }, { text: "mouse" }],
        answer: 0,
        evidence: "C++ 기초 용어 반응 확인",
    },
    {
        id: "language-5",
        number: 18,
        area: "language",
        concept: "언어 선호",
        prompt: "새로운 코딩 언어를 볼 때 어떤 설명이 더 편한가요?",
        choices: [
            { text: "규칙과 문법을 정확히 정리해 주는 설명", track: "A" },
            { text: "만들 결과물을 먼저 보여주는 설명", track: "B" },
            { text: "짧은 예시와 그림으로 풀어주는 설명", track: "C" },
            { text: "센서나 장치를 움직여 보며 배우는 설명", track: "D" },
        ],
        evidence: "Python/C++ 이후 트랙 반응 확인",
    },
    {
        id: "interest-1",
        number: 19,
        area: "interest",
        concept: "동기",
        prompt: "가장 해보고 싶은 활동은 무엇인가요?",
        choices: [
            { text: "어려운 문제를 풀고 대회에 나가기", track: "A" },
            { text: "게임, 앱, 웹처럼 보이는 작품 만들기", track: "B" },
            { text: "쉽고 재미있는 체험부터 시작하기", track: "C" },
            { text: "센서와 부품으로 움직이는 작품 만들기", track: "D" },
        ],
        evidence: "A/B/C/D 트랙 선호 확인",
    },
    {
        id: "interest-2",
        number: 20,
        area: "interest",
        concept: "결과물",
        prompt: "수업이 끝났을 때 가장 남기고 싶은 결과물은 무엇인가요?",
        choices: [
            { text: "알고리즘 문제 풀이 기록", track: "A" },
            { text: "GitHub에 올릴 프로젝트", track: "B" },
            { text: "내가 이해한 개념 카드", track: "C" },
            { text: "시연 영상이 있는 하드웨어 작품", track: "D" },
        ],
        evidence: "학부모 포털에 보여줄 성장 증거 방향 확인",
    },
    {
        id: "interest-3",
        number: 21,
        area: "interest",
        concept: "AI 활용",
        prompt: "AI 도구를 쓴다면 어떤 방식이 가장 끌리나요?",
        choices: [
            { text: "내 풀이와 AI 풀이를 비교해 더 좋은 방법 찾기", track: "A" },
            { text: "아이디어와 코드를 함께 발전시키기", track: "B" },
            { text: "힌트를 받으며 기초 개념 이해하기", track: "C" },
            { text: "센서 연결 오류와 회로 문제를 설명받기", track: "D" },
        ],
        evidence: "AI 코치 사용 방향 확인",
    },
    {
        id: "interest-4",
        number: 22,
        area: "interest",
        concept: "수업 방식",
        prompt: "수업에서 가장 잘 맞을 것 같은 방식은 무엇인가요?",
        choices: [
            { text: "정답 기준이 분명한 문제를 많이 풀기", track: "A" },
            { text: "작은 기능을 붙여 하나의 작품 완성하기", track: "B" },
            { text: "천천히 따라 하며 성공 경험 쌓기", track: "C" },
            { text: "만지고 조립하며 결과를 바로 확인하기", track: "D" },
        ],
        evidence: "초기 수업 운영 방식 확인",
    },
];

const scoredQuestions = QUESTIONS.filter((question) => question.answer !== undefined);

function getLevelLabel(score: number, max: number) {
    if (max === 0) return "미측정";
    const ratio = score / max;
    if (ratio >= 0.8) return "좋음";
    if (ratio >= 0.5) return "보통";
    return "보강";
}

function getStartStage(percent: number, computerScore: number, codingScore: number) {
    if (computerScore <= 1 || codingScore <= 1) return "공통기초 1단계부터 시작";
    if (percent >= 78) return "공통기초 4주 체크 후 트랙 맛보기";
    if (percent >= 58) return "공통기초 3단계부터 시작";
    if (percent >= 36) return "공통기초 2단계부터 시작";
    return "공통기초 1단계부터 시작";
}

function getTopTrack(trackCounts: Record<TrackId, number>, percent: number): TrackId {
    const sorted = TRACK_ORDER.map((track) => [track, trackCounts[track]] as const).sort((a, b) => b[1] - a[1]);
    if (sorted[0][1] > 0) return sorted[0][0];
    if (percent >= 78) return "A";
    if (percent >= 58) return "B";
    return "C";
}

export default function LevelTestPage() {
    const { user } = useAuth();
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [showAnswers, setShowAnswers] = useState(false);
    const [savedAt, setSavedAt] = useState<string | null>(null);
    const [syncStatus, setSyncStatus] = useState<string | null>(null);

    const result = useMemo(() => {
        const areaMax = AREA_ORDER.reduce(
            (acc, area) => ({ ...acc, [area]: 0 }),
            {} as Record<AreaId, number>,
        );
        const areaScore = AREA_ORDER.reduce(
            (acc, area) => ({ ...acc, [area]: 0 }),
            {} as Record<AreaId, number>,
        );
        const trackCounts: Record<TrackId, number> = { A: 0, B: 0, C: 0, D: 0 };

        QUESTIONS.forEach((question) => {
            if (question.answer !== undefined) areaMax[question.area] += 1;

            const selected = answers[question.id];
            if (selected === undefined) return;

            if (question.answer !== undefined && selected === question.answer) {
                areaScore[question.area] += 1;
            }

            const track = question.choices[selected]?.track;
            if (track) trackCounts[track] += 1;
        });

        const total = AREA_ORDER.filter((area) => area !== "interest").reduce((sum, area) => sum + areaScore[area], 0);
        const max = AREA_ORDER.filter((area) => area !== "interest").reduce((sum, area) => sum + areaMax[area], 0);
        const percent = max ? Math.round((total / max) * 100) : 0;
        const startStage = getStartStage(percent, areaScore.computer, areaScore.coding);
        const topTrack = getTopTrack(trackCounts, percent);
        const answered = Object.keys(answers).length;

        return { areaMax, areaScore, trackCounts, total, max, percent, startStage, topTrack, answered };
    }, [answers]);

    const groupedQuestions = useMemo(
        () => AREA_ORDER.map((area) => ({
            area,
            questions: QUESTIONS.filter((question) => question.area === area),
        })),
        [],
    );

    const saveResult = async () => {
        const timestamp = new Date().toISOString();
        const diagnosticSnapshot = {
            studentId: user?.studentId ?? user?.id,
            studentName: user?.name,
            answers,
            result,
            savedAt: timestamp,
        };
        localStorage.setItem("codingssok_diagnostic_result", JSON.stringify(diagnosticSnapshot));
        if (user?.id) {
            upsertLocalStudentRecord("codingssok_diagnostic_results", diagnosticSnapshot);
        }
        setSavedAt(timestamp);
        setSyncStatus("이 브라우저에 진단 결과를 저장했습니다.");

        if (!isSupabaseConfigured()) return;

        try {
            const studentId = await ensureGrowthOsStudentId({
                name: user?.name ?? "",
                grade: user?.grade,
                status: "active",
            });
            if (!studentId) return;
            const supabase = createClient();
            const { data: userResult } = await supabase.auth.getUser();
            const { error } = await supabase.from("student_diagnostic_results").insert({
                student_id: studentId,
                total_score: result.total,
                max_score: result.max,
                percent: result.percent,
                recommended_track: result.topTrack,
                start_stage: result.startStage,
                area_scores: result.areaScore,
                track_counts: result.trackCounts,
                answered_count: result.answered,
                raw_answers: answers,
                created_by: userResult.user?.id ?? null,
            });

            if (error) throw error;
            setSyncStatus("Supabase 성장 OS에도 진단 결과를 연동했습니다.");
        } catch {
            setSyncStatus("로컬 저장은 완료했습니다. Supabase 연동은 권한/스키마 확인이 필요합니다.");
        }
    };

    return (
        <main className="diagnostic-page">
            <style>{`
                .diagnostic-page {
                    min-height: 100vh;
                    background: #eef4ff;
                    color: #0f172a;
                    padding: 24px;
                    font-family: Pretendard, Inter, system-ui, sans-serif;
                }
                .diagnostic-shell {
                    max-width: 1180px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 336px;
                    gap: 18px;
                }
                .diagnostic-card {
                    background: rgba(255, 255, 255, 0.94);
                    border: 1px solid #dbe4f0;
                    border-radius: 8px;
                    box-shadow: 0 14px 40px rgba(15, 23, 42, 0.07);
                }
                .diagnostic-head {
                    grid-column: 1 / -1;
                    padding: 24px;
                    display: flex;
                    justify-content: space-between;
                    gap: 18px;
                    align-items: flex-start;
                }
                .diagnostic-kicker {
                    color: #2563eb;
                    font-weight: 900;
                    font-size: 12px;
                    letter-spacing: 0.08em;
                }
                .diagnostic-head h1 {
                    margin: 6px 0 8px;
                    font-size: 28px;
                    letter-spacing: 0;
                    line-height: 1.18;
                }
                .diagnostic-head p {
                    margin: 0;
                    color: #475569;
                    font-size: 14px;
                    line-height: 1.65;
                    max-width: 760px;
                }
                .diagnostic-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 8px;
                    flex-wrap: wrap;
                    min-width: 260px;
                }
                .diagnostic-btn {
                    border: 1px solid #cbd5e1;
                    background: #fff;
                    color: #334155;
                    border-radius: 8px;
                    padding: 9px 12px;
                    font-size: 13px;
                    font-weight: 850;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    white-space: nowrap;
                }
                .diagnostic-btn.primary {
                    border-color: #2563eb;
                    background: #2563eb;
                    color: #fff;
                }
                .paper {
                    padding: 24px;
                }
                .paper-info {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 10px;
                    margin-bottom: 18px;
                }
                .blank {
                    border: 1px solid #dbe4f0;
                    border-radius: 8px;
                    padding: 10px 12px;
                    min-height: 40px;
                    font-size: 13px;
                    color: #475569;
                    background: #f8fafc;
                }
                .test-guide {
                    border: 1px solid #bfdbfe;
                    background: #eff6ff;
                    color: #1e3a8a;
                    border-radius: 8px;
                    padding: 12px 14px;
                    font-size: 13px;
                    line-height: 1.55;
                    margin-bottom: 18px;
                }
                .area-block {
                    border-top: 2px solid #e2e8f0;
                    padding-top: 18px;
                    margin-top: 20px;
                }
                .area-title {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    margin-bottom: 12px;
                }
                .area-mark {
                    width: 12px;
                    height: 12px;
                    border-radius: 3px;
                    flex: 0 0 auto;
                    margin-top: 5px;
                }
                .area-title h2 {
                    margin: 0;
                    font-size: 18px;
                    letter-spacing: 0;
                }
                .area-title p {
                    margin: 3px 0 0;
                    font-size: 12px;
                    color: #64748b;
                    line-height: 1.45;
                }
                .question {
                    border: 1px solid #dbe4f0;
                    background: #fff;
                    border-radius: 8px;
                    padding: 14px;
                    margin-bottom: 10px;
                    break-inside: avoid;
                }
                .question-meta {
                    display: inline-flex;
                    align-items: center;
                    border: 1px solid #e2e8f0;
                    border-radius: 999px;
                    padding: 3px 8px;
                    color: #64748b;
                    font-size: 11px;
                    font-weight: 800;
                    margin-bottom: 8px;
                }
                .question-title {
                    font-size: 14px;
                    line-height: 1.45;
                    font-weight: 850;
                    margin-bottom: 10px;
                }
                .choices {
                    display: grid;
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                    gap: 8px;
                }
                .choice {
                    border: 1px solid #dbe4f0;
                    border-radius: 8px;
                    padding: 9px 10px;
                    display: flex;
                    gap: 8px;
                    align-items: flex-start;
                    cursor: pointer;
                    font-size: 13px;
                    line-height: 1.4;
                    background: #f8fafc;
                    min-height: 42px;
                }
                .choice input {
                    margin-top: 2px;
                    flex: 0 0 auto;
                }
                .choice.selected {
                    border-color: #2563eb;
                    background: #eff6ff;
                }
                .choice.correct {
                    border-color: #16a34a;
                    background: #f0fdf4;
                }
                .evidence-note {
                    margin-top: 9px;
                    color: #64748b;
                    font-size: 11px;
                    line-height: 1.45;
                }
                .written-box {
                    border-top: 2px solid #e2e8f0;
                    margin-top: 22px;
                    padding-top: 18px;
                }
                .written-box h2 {
                    margin: 0 0 10px;
                    font-size: 18px;
                    letter-spacing: 0;
                }
                .written-lines {
                    display: grid;
                    gap: 10px;
                }
                .written-line {
                    border: 1px solid #dbe4f0;
                    border-radius: 8px;
                    min-height: 48px;
                    padding: 10px 12px;
                    color: #64748b;
                    font-size: 13px;
                    background: #fff;
                }
                .result-panel {
                    padding: 18px;
                    position: sticky;
                    top: 18px;
                    align-self: start;
                }
                .result-panel h2 {
                    margin: 0 0 12px;
                    font-size: 18px;
                    letter-spacing: 0;
                }
                .score-big {
                    border: 1px solid #dbe4f0;
                    background: #f8fafc;
                    border-radius: 8px;
                    padding: 14px;
                    margin-bottom: 12px;
                }
                .score-big strong {
                    display: block;
                    font-size: 34px;
                    line-height: 1;
                    margin-bottom: 6px;
                }
                .score-big span {
                    color: #64748b;
                    font-size: 12px;
                    font-weight: 800;
                }
                .score-row {
                    display: grid;
                    grid-template-columns: 62px minmax(0, 1fr) 42px;
                    gap: 8px;
                    align-items: center;
                    font-size: 12px;
                    margin-bottom: 10px;
                }
                .score-row span,
                .score-row strong {
                    white-space: nowrap;
                }
                .bar {
                    height: 7px;
                    border-radius: 999px;
                    background: #e2e8f0;
                    overflow: hidden;
                }
                .bar i {
                    display: block;
                    height: 100%;
                    border-radius: 999px;
                }
                .recommend {
                    border: 1px solid #bfdbfe;
                    background: #eff6ff;
                    color: #1e3a8a;
                    border-radius: 8px;
                    padding: 13px;
                    font-size: 13px;
                    line-height: 1.55;
                    margin-top: 14px;
                }
                .recommend strong {
                    display: block;
                    margin-bottom: 4px;
                    color: #172554;
                }
                .track-counts {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 6px;
                    margin-top: 8px;
                }
                .track-count {
                    border: 1px solid #dbe4f0;
                    border-radius: 8px;
                    padding: 7px 5px;
                    text-align: center;
                    background: #fff;
                    font-size: 12px;
                    color: #475569;
                }
                .track-count b {
                    display: block;
                    color: #0f172a;
                    font-size: 14px;
                }
                .saved-note {
                    color: #166534;
                    font-size: 12px;
                    margin: 10px 0 0;
                    line-height: 1.45;
                }
                .answer-key {
                    margin-top: 20px;
                    padding-top: 18px;
                    border-top: 2px solid #e2e8f0;
                    display: grid;
                    grid-template-columns: repeat(6, 1fr);
                    gap: 8px;
                }
                .answer-key div {
                    border: 1px solid #dbe4f0;
                    border-radius: 8px;
                    padding: 8px;
                    text-align: center;
                    font-size: 12px;
                    background: #fff;
                }
                @media (max-width: 980px) {
                    .diagnostic-shell {
                        grid-template-columns: 1fr;
                    }
                    .diagnostic-head {
                        flex-direction: column;
                    }
                    .diagnostic-actions {
                        justify-content: flex-start;
                        min-width: 0;
                    }
                    .result-panel {
                        position: static;
                    }
                }
                @media (max-width: 680px) {
                    .diagnostic-page {
                        padding: 12px;
                    }
                    .diagnostic-head,
                    .paper,
                    .result-panel {
                        padding: 16px;
                    }
                    .paper-info {
                        grid-template-columns: 1fr 1fr;
                    }
                    .choices {
                        grid-template-columns: 1fr;
                    }
                    .answer-key {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }
                @media print {
                    .diagnostic-page {
                        background: #fff;
                        padding: 0;
                    }
                    .diagnostic-shell {
                        display: block;
                        max-width: none;
                    }
                    .diagnostic-actions,
                    .result-panel,
                    .no-print {
                        display: none !important;
                    }
                    .diagnostic-card {
                        box-shadow: none;
                        border: 0;
                        border-radius: 0;
                    }
                    .diagnostic-head {
                        padding: 0 0 14px;
                        border-bottom: 3px solid #0f172a;
                        margin-bottom: 14px;
                    }
                    .paper {
                        padding: 0;
                    }
                    .choice {
                        background: #fff;
                    }
                    .choice input {
                        appearance: none;
                        width: 12px;
                        height: 12px;
                        border: 1px solid #0f172a;
                        border-radius: 999px;
                    }
                }
            `}</style>

            <div className="diagnostic-shell">
                <header className="diagnostic-card diagnostic-head">
                    <div>
                        <div className="diagnostic-kicker">CODINGSSOK DIAGNOSTIC TEST</div>
                        <h1>신규 학생 1차 진단 테스트 문제지</h1>
                        <p>
                            시험처럼 줄 세우는 화면이 아니라, 학생이 어디서 시작해야 하는지와 어떤 증거를 남겨야 하는지 판단하는 문제지입니다.
                            컴퓨터기초, 코딩기초, 사고력, 언어 감각, 성향을 함께 보고 공통기초 시작 단계와 A/B/C/D 트랙 후보를 정합니다.
                        </p>
                    </div>
                    <div className="diagnostic-actions no-print">
                        <Link className="diagnostic-btn" href="/dashboard/learning">학습 홈</Link>
                        <button className="diagnostic-btn" onClick={() => setShowAnswers((value) => !value)}>
                            {showAnswers ? "정답 숨기기" : "정답 보기"}
                        </button>
                        <button className="diagnostic-btn" onClick={saveResult}>결과 저장</button>
                        <button className="diagnostic-btn primary" onClick={() => window.print()}>인쇄 / PDF</button>
                    </div>
                </header>

                <section className="diagnostic-card paper">
                    <div className="paper-info">
                        <div className="blank">이름:</div>
                        <div className="blank">학년:</div>
                        <div className="blank">학교:</div>
                        <div className="blank">진단일:</div>
                    </div>

                    <div className="test-guide">
                        권장 시간은 25분입니다. 1번부터 18번까지는 기초 확인 점수로 계산하고, 18번부터 22번까지의 선택은 트랙 성향에 반영합니다.
                        마지막 3줄 기록은 학부모 리포트에 들어갈 학생 설명 초안으로 사용합니다.
                    </div>

                    {groupedQuestions.map(({ area, questions }) => (
                        <section className="area-block" key={area}>
                            <div className="area-title">
                                <span className="area-mark" style={{ background: AREA_META[area].color }} />
                                <div>
                                    <h2>{AREA_META[area].label}</h2>
                                    <p>{AREA_META[area].goal}</p>
                                </div>
                            </div>

                            {questions.map((question) => (
                                <article className="question" key={question.id}>
                                    <div className="question-meta">{question.concept}</div>
                                    <div className="question-title">{question.number}. {question.prompt}</div>
                                    <div className="choices">
                                        {question.choices.map((choice, index) => {
                                            const selected = answers[question.id] === index;
                                            const correct = showAnswers && question.answer === index;

                                            return (
                                                <label
                                                    className={`choice ${selected ? "selected" : ""} ${correct ? "correct" : ""}`}
                                                    key={`${question.id}-${choice.text}`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={question.id}
                                                        checked={selected}
                                                        onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: index }))}
                                                    />
                                                    <span>{index + 1}. {choice.text}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <div className="evidence-note">기록 기준: {question.evidence}</div>
                                </article>
                            ))}
                        </section>
                    ))}

                    <section className="written-box">
                        <h2>학생 설명 3줄</h2>
                        <div className="written-lines">
                            <div className="written-line">1. 오늘 가장 확실하게 이해한 것:</div>
                            <div className="written-line">2. 오늘 가장 헷갈렸던 것:</div>
                            <div className="written-line">3. 앞으로 만들어 보고 싶은 것:</div>
                        </div>
                    </section>

                    {showAnswers && (
                        <section className="answer-key">
                            {scoredQuestions.map((question) => (
                                <div key={question.id}>{question.number}번 · {question.answer! + 1}</div>
                            ))}
                        </section>
                    )}
                </section>

                <aside className="diagnostic-card result-panel">
                    <h2>진단 결과</h2>
                    <div className="score-big">
                        <strong>{result.total}/{result.max}</strong>
                        <span>기초 확인 점수 · {result.percent}% · 응답 {result.answered}/{QUESTIONS.length}</span>
                    </div>

                    {AREA_ORDER.filter((area) => area !== "interest").map((area) => {
                        const max = result.areaMax[area];
                        const score = result.areaScore[area];
                        const percent = max ? Math.round((score / max) * 100) : 0;

                        return (
                            <div className="score-row" key={area}>
                                <span>{AREA_META[area].short}</span>
                                <div className="bar">
                                    <i style={{ width: `${percent}%`, background: AREA_META[area].color }} />
                                </div>
                                <strong>{getLevelLabel(score, max)}</strong>
                            </div>
                        );
                    })}

                    <div className="recommend">
                        <strong>추천 시작 단계</strong>
                        {result.startStage}
                    </div>

                    <div className="recommend">
                        <strong>추천 트랙 후보</strong>
                        {TRACK_META[result.topTrack].title}<br />
                        {TRACK_META[result.topTrack].desc}<br />
                        {TRACK_META[result.topTrack].next}
                        <div className="track-counts">
                            {TRACK_ORDER.map((track) => (
                                <div className="track-count" key={track}>
                                    <b>{track}</b>
                                    {result.trackCounts[track]}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="recommend">
                        <strong>학부모 리포트 초안</strong>
                        컴퓨터기초는 {getLevelLabel(result.areaScore.computer, result.areaMax.computer)}, 코딩기초는 {getLevelLabel(result.areaScore.coding, result.areaMax.coding)}입니다.
                        먼저 {result.startStage}으로 배정하고, 4주 체크에서 코드, 실행 결과, 오류 수정 기록, 학생 설명 3줄을 근거로 트랙을 확정합니다.
                    </div>

                    {savedAt && (
                        <p className="saved-note">{syncStatus ?? "이 브라우저에 진단 결과를 저장했습니다."} 저장 시각: {new Date(savedAt).toLocaleString("ko-KR")}</p>
                    )}
                </aside>
            </div>
        </main>
    );
}
