import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

vi.mock("./HomeClient", () => ({
  HomeClient: () => <div>기존 운영 홈페이지</div>,
}));

vi.mock("@/features/growth-v2/integrated/IntegratedGrowthPrototype", () => ({
  IntegratedGrowthPrototype: () => <div>Growth 2.0 통합 화면</div>,
}));

describe("홈페이지 환경 분기", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("Vercel staging target에서는 Growth 2.0 통합 화면을 표시한다", () => {
    vi.stubEnv("VERCEL_TARGET_ENV", "staging");
    vi.stubEnv("NEXT_PUBLIC_GROWTH_PREVIEW_ENV", "");

    render(<Home />);

    expect(screen.getByText("Growth 2.0 통합 화면")).toBeInTheDocument();
  });

  it("운영 target에서는 기존 홈페이지를 유지한다", () => {
    vi.stubEnv("VERCEL_TARGET_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_GROWTH_PREVIEW_ENV", "");

    render(<Home />);

    expect(screen.getByText("기존 운영 홈페이지")).toBeInTheDocument();
  });
});
