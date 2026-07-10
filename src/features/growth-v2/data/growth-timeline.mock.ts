import type { GrowthTimelineEntry } from "@/features/growth-v2/types/student-dashboard";

export const INITIAL_GROWTH_TIMELINE = [
  {
    id: "timeline-loop-mission",
    timeLabel: "오늘",
    type: "mission",
    title: "반복문 문제 3개 완료",
    xp: 30,
  },
  {
    id: "timeline-code-fix-mission",
    timeLabel: "오늘",
    type: "mission",
    title: "지난 수업 코드 수정 완료",
    xp: 20,
  },
  {
    id: "timeline-teacher-feedback",
    timeLabel: "어제",
    type: "feedback",
    title: "선생님 피드백을 받았어요",
    detail: "조건을 직접 질문하며 해결하는 습관이 좋아졌어요.",
  },
  {
    id: "timeline-space-project",
    timeLabel: "3일 전",
    type: "project",
    title: "나만의 우주 탐험 게임 프로젝트가 64%까지 완성됐어요.",
  },
  {
    id: "timeline-steady-badge",
    timeLabel: "5일 전",
    type: "badge",
    title: "꾸준한 탐험가 배지를 획득했어요.",
  },
] satisfies GrowthTimelineEntry[];

export const PREVIEW_MISSION_TIMELINE_ENTRY = {
  id: "timeline-project-log-mission",
  timeLabel: "방금",
  type: "mission",
  title: "프로젝트 진행 기록 작성 완료",
  xp: 25,
} satisfies GrowthTimelineEntry;
