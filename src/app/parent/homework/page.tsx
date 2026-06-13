import { redirect } from "next/navigation";

/**
 * 학부모 숙제 페이지 폐기 — 기존 링크 호환을 위해 피드백 화면으로 바로 이동.
 */
export default function ParentHomeworkPage() {
    redirect("/parent/feedback");
}
