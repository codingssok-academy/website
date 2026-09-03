export const GROWTH_ARTIFACT_TITLE_MAX_LENGTH = 120;
export const GROWTH_ARTIFACT_URL_MAX_LENGTH = 2000;

export function normalizeGrowthArtifactTitle(value: unknown) {
    if (typeof value !== "string") return "";
    return value.trim().replace(/\s+/g, " ").slice(0, GROWTH_ARTIFACT_TITLE_MAX_LENGTH);
}

export function normalizeGrowthArtifactUrl(value: unknown) {
    if (typeof value !== "string" || !value.trim()) return null;

    const input = value.trim();
    if (input.length > GROWTH_ARTIFACT_URL_MAX_LENGTH) {
        throw new Error("결과물 주소가 너무 깁니다.");
    }

    let url: URL;
    try {
        url = new URL(input);
    } catch {
        throw new Error("엔트리 결과물의 공유 주소를 정확히 입력해주세요.");
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
        throw new Error("결과물 주소는 http 또는 https 주소만 사용할 수 있습니다.");
    }

    return url.toString();
}

export function safeGrowthArtifactUrl(value: unknown) {
    try {
        return normalizeGrowthArtifactUrl(value);
    } catch {
        return null;
    }
}
