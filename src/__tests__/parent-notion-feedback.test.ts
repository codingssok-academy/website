import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(relativePath: string) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("parent notion feedback access", () => {
  it("supports Notion-backed parent sessions without hardcoding the parent PIN", () => {
    const sessionRoute = read("src/app/api/parent/session/route.ts");
    const notionFeedback = read("src/lib/notion-feedback.ts");

    expect(sessionRoute).toContain("getNotionParentAccess");
    expect(sessionRoute).toContain("notionResult.exists");
    expect(sessionRoute).toContain("createNotionStudentId");
    expect(notionFeedback).toContain("학부모 인증번호");
    expect(notionFeedback).toContain("PARENT_PORTAL_SHARED_PIN");
    expect(notionFeedback).not.toContain('"74123"');
    expect(notionFeedback).not.toContain("'74123'");
  });

  it("paginates feedback lookup so all Notion rows for a student can be returned", () => {
    const lookupRoute = read("src/app/api/parent/lookup/route.ts");
    const notionFeedback = read("src/lib/notion-feedback.ts");

    expect(lookupRoute).toContain("queryNotionFeedbackPagesByStudent(name)");
    expect(lookupRoute).not.toContain("ACTIVE_PAGE_LIMIT");
    expect(lookupRoute).not.toContain(".slice(0, ACTIVE_PAGE_LIMIT)");
    expect(lookupRoute).not.toContain("page_size: 20");
    expect(notionFeedback).toContain("data.has_more");
    expect(notionFeedback).toContain("data.next_cursor");
  });
});
