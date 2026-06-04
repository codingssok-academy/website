export const FAMILY_GROUPS: string[][] = [
    ["한보윤", "한보리"],
];

export function normalizeStudentName(name: string) {
    return name.replace(/\s+/g, "").trim();
}

export function getLinkedStudentNames(name: string) {
    const normalized = normalizeStudentName(name);
    const trimmedName = name.trim();
    const group = FAMILY_GROUPS.find(names => names.some(item => normalizeStudentName(item) === normalized));
    return group ? [...group] : trimmedName ? [trimmedName] : [];
}
