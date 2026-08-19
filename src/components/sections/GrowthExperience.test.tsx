import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GrowthExperience from "./GrowthExperience";

describe("GrowthExperience", () => {
  it("introduces monthly attendance and links to safe public routes", () => {
    render(<GrowthExperience />);

    expect(
      screen.getByRole("heading", { name: "매주 성장하고, 매달 출석을 확인해요" }),
    ).toBeInTheDocument();
    expect(screen.getByText("월간 출석 현황")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /성장관리 살펴보기/ })).toHaveAttribute(
      "href",
      "/growth",
    );
    expect(screen.getByRole("link", { name: "학부모 포털 열기" })).toHaveAttribute(
      "href",
      "/parent/feedback",
    );
  });
});
