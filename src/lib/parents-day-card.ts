/**
 * Parent card slug generation and seasonal display helpers.
 *
 * A matching card image should be placed at
 * public/parents-day-card/<slug>.png for display on Parents' Day.
 */

export async function slugifyStudentName(name: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(name);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 8);
}

/** Checks May 8 in Asia/Seoul time. */
export function isParentsDay(): boolean {
    const seoulDate = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
    return seoulDate.endsWith("-05-08");
}

export function getCardImageUrl(slug: string): string {
    return `/parents-day-card/${slug}.png`;
}
