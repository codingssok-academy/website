import { MOCK_PARENT_WEEKLY_REPORT } from "@/features/growth-v2/data/parent-weekly-report.mock";
import type { TeacherWeeklyEvaluationData } from "@/features/growth-v2/types/teacher-weekly-evaluation";

export const MOCK_TEACHER_WEEKLY_EVALUATION = {
  dataKind: "mock",
  studentName: MOCK_PARENT_WEEKLY_REPORT.studentName,
  period: MOCK_PARENT_WEEKLY_REPORT.period,
  summary: {
    attendance: `${MOCK_PARENT_WEEKLY_REPORT.attendance.attended}회 / ${MOCK_PARENT_WEEKLY_REPORT.attendance.scheduled}회`,
    assignmentCompletion: MOCK_PARENT_WEEKLY_REPORT.assignmentCompletion,
    weeklyGoalProgress: MOCK_PARENT_WEEKLY_REPORT.weeklyGoalProgress,
    projectProgress: MOCK_PARENT_WEEKLY_REPORT.project.progress,
  },
  understandingOptions: [
    { id: "needs-help", label: "도움이 더 필요해요" },
    { id: "understands-basics", label: "기본 개념을 이해했어요" },
    { id: "solves-independently", label: "스스로 문제를 풀 수 있어요" },
    { id: "applies-elsewhere", label: "다른 문제에도 활용할 수 있어요" },
  ],
  participationOptions: [
    { id: "listened", label: "설명을 들으며 참여했어요" },
    { id: "asked-questions", label: "질문하며 참여했어요" },
    { id: "tried-independently", label: "스스로 해결을 시도했어요" },
    { id: "explained-to-friend", label: "친구에게 설명할 수 있었어요" },
  ],
  homeworkOptions: [
    { id: "not-submitted", label: "미제출" },
    { id: "partly-complete", label: "일부 완료" },
    { id: "complete", label: "완료" },
    { id: "extra-challenge", label: "추가 도전까지 완료" },
  ],
  learnedConcepts: MOCK_PARENT_WEEKLY_REPORT.learnedConcepts.map(
    (concept) => concept.name,
  ),
  defaults: {
    understanding: "solves-independently",
    participation: "asked-questions",
    homework: "complete",
    evaluation: {
      strength: MOCK_PARENT_WEEKLY_REPORT.teacherEvaluation.strength,
      improvement: MOCK_PARENT_WEEKLY_REPORT.teacherEvaluation.improvement,
      nextLessonGoal: MOCK_PARENT_WEEKLY_REPORT.teacherEvaluation.nextLessonGoal,
    },
    project: {
      recentWork: MOCK_PARENT_WEEKLY_REPORT.project.recentWork,
      nextWork: MOCK_PARENT_WEEKLY_REPORT.project.nextWork,
    },
  },
  recommendations: {
    strength: [
      {
        label: "질문하는 습관이 좋아졌어요",
        sentence: "모르는 부분을 바로 질문하며 해결하는 습관이 좋아졌습니다.",
      },
      {
        label: "오류를 스스로 찾았어요",
        sentence: "코드의 오류를 스스로 찾고 고치는 힘이 자랐습니다.",
      },
      {
        label: "끝까지 다시 도전했어요",
        sentence: "어려운 문제가 있어도 포기하지 않고 끝까지 다시 도전했습니다.",
      },
      {
        label: "배운 내용을 설명할 수 있어요",
        sentence: "배운 내용을 자신의 말로 차근차근 설명할 수 있습니다.",
      },
    ],
    improvement: [
      {
        label: "실행 순서를 먼저 정리해요",
        sentence: "문제를 풀기 전에 실행 순서를 먼저 정리하는 연습이 필요합니다.",
      },
      {
        label: "변수 이름을 더 분명하게 지어요",
        sentence: "변수의 역할이 드러나도록 이름을 더 분명하게 짓는 연습이 필요합니다.",
      },
      {
        label: "코드를 한 단계씩 확인해요",
        sentence: "코드를 한 단계씩 실행하며 결과를 확인하는 습관을 길러 봅니다.",
      },
      {
        label: "과제를 조금 더 꾸준히 해요",
        sentence: "과제를 조금 더 꾸준히 마무리하는 연습이 필요합니다.",
      },
    ],
    nextLessonGoal: [
      {
        label: "조건문이 들어간 프로그램 만들기",
        sentence: "조건문이 들어간 간단한 프로그램을 완성합니다.",
      },
      {
        label: "반복문 문제를 혼자 완성하기",
        sentence: "반복문 문제를 도움 없이 혼자 완성합니다.",
      },
      {
        label: "프로젝트 점수 기능 추가하기",
        sentence: "프로젝트에 점수 계산 기능을 추가합니다.",
      },
      {
        label: "작성한 코드를 직접 설명하기",
        sentence: "작성한 코드를 실행 순서에 따라 직접 설명합니다.",
      },
    ],
  },
  projectName: MOCK_PARENT_WEEKLY_REPORT.project.name,
} satisfies TeacherWeeklyEvaluationData;
