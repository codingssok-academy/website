export const MAX_CUSTOM_CONCEPTS = 5;
export const MIN_CUSTOM_CONCEPT_LENGTH = 2;
export const MAX_CUSTOM_CONCEPT_LENGTH = 40;

const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;

export function normalizeCustomConcept(value: string) {
  return value.trim().replace(/ {2,}/g, " ");
}

export function customConceptKey(value: string) {
  return normalizeCustomConcept(value).toLocaleLowerCase("ko-KR");
}

export function validateCustomConcept(
  rawValue: string,
  customConcepts: string[],
  selectedLabels: string[],
) {
  const value = normalizeCustomConcept(rawValue);
  if (!value) return { value, error: "추가할 개념을 입력해 주세요." };
  if (CONTROL_CHARACTER.test(rawValue)) {
    return { value, error: "개념에는 줄바꿈을 넣을 수 없어요." };
  }
  if (value.length < MIN_CUSTOM_CONCEPT_LENGTH) {
    return { value, error: "개념은 2자 이상 적어 주세요." };
  }
  if (value.length > MAX_CUSTOM_CONCEPT_LENGTH) {
    return { value, error: "개념은 40자 이하로 적어 주세요." };
  }
  if (customConcepts.length >= MAX_CUSTOM_CONCEPTS) {
    return { value, error: "직접 입력 개념은 최대 5개까지 추가할 수 있어요." };
  }
  const key = customConceptKey(value);
  if (customConcepts.some((concept) => customConceptKey(concept) === key)) {
    return { value, error: "이미 직접 추가한 개념이에요." };
  }
  if (selectedLabels.some((label) => customConceptKey(label) === key)) {
    return { value, error: "준비된 개념에서 이미 선택했어요." };
  }
  return { value, error: "" };
}

export function validateCustomConceptList(values: unknown) {
  if (!Array.isArray(values) || values.some((value) => typeof value !== "string")) {
    return null;
  }
  const normalized: string[] = [];
  for (const rawValue of values) {
    const result = validateCustomConcept(rawValue, normalized, []);
    if (result.error) return null;
    normalized.push(result.value);
  }
  return normalized;
}
