export type GrowthPreviewEnvironment = "local" | "staging";

export type GrowthPreviewEnvironmentCopy = {
  mode: GrowthPreviewEnvironment;
  label: string;
  badge: string;
  description: string;
};

export function getGrowthPreviewEnvironment(
  value = process.env.NEXT_PUBLIC_GROWTH_PREVIEW_ENV,
): GrowthPreviewEnvironment {
  return value === "staging" ? "staging" : "local";
}

export function getGrowthPreviewEnvironmentCopy(
  value = process.env.NEXT_PUBLIC_GROWTH_PREVIEW_ENV,
): GrowthPreviewEnvironmentCopy {
  const mode = getGrowthPreviewEnvironment(value);

  if (mode === "staging") {
    return {
      mode,
      label: "Growth 2.0 시험 환경",
      badge: "시험 환경",
      description: "제한된 시험 운영을 위한 별도 환경입니다. 운영 홈페이지와 분리되어 있습니다.",
    };
  }

  return {
    mode,
    label: "Growth 2.0 로컬 연습 환경",
    badge: "로컬 데모",
    description: "이 화면은 실제 학생 정보가 아닌 로컬 테스트 자료를 사용합니다.",
  };
}

export function shouldShowGrowthPreviewDemoNavigation(
  value = process.env.NEXT_PUBLIC_GROWTH_PREVIEW_DEMO_NAV,
) {
  return value === "1";
}

export function formatStudentDisplayName(displayName: string) {
  return displayName.trim().replace(/\s+/g, " ");
}

function includesStudentHonorific(displayName: string) {
  return /(^|\s)학생($|\s)/.test(displayName);
}

export function formatStudentWithHonorific(displayName: string) {
  const normalizedName = formatStudentDisplayName(displayName);
  return includesStudentHonorific(normalizedName)
    ? normalizedName
    : `${normalizedName} 학생`;
}

export function formatStudentPossessive(displayName: string) {
  return `${formatStudentWithHonorific(displayName)}의`;
}
