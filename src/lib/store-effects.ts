/**
 * store-effects.ts
 * 구매 아이템 ID별 실제 효과 적용 함수
 */

export function applyTheme(itemId: string | null): void {
    if (typeof document === "undefined") return;
    if (!itemId) {
        document.documentElement.removeAttribute("data-theme");
        return;
    }
    const themeMap: Record<string, string> = {
        theme_dark: "dark",
        theme_neon: "neon",
    };
    const themeName = themeMap[itemId];
    if (themeName) {
        document.documentElement.setAttribute("data-theme", themeName);
    } else {
        document.documentElement.removeAttribute("data-theme");
    }
}

export function getActiveBoostMultiplier(purchased: string[]): number {
    return purchased.includes("boost_2x") ? 2 : 1;
}

export function getItemEffectDescription(itemId: string): string {
    if (itemId.startsWith("theme_")) return "구매 후 즉시 적용됩니다";
    if (itemId === "boost_2x") return "다음 로그인부터 XP 2배";
    return "프로필에 표시됩니다";
}
