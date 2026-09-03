import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MobileCodingGuidance from "./MobileCodingGuidance";

describe("MobileCodingGuidance", () => {
    it("explains what students can do on a phone and when to use a computer", () => {
        render(<MobileCodingGuidance />);

        const guidance = screen.getByLabelText("휴대폰 학습 안내", { selector: "aside" });
        expect(guidance).toHaveClass("mobile-coding-guidance");
        expect(guidance).toHaveTextContent("휴대폰에서는 설명과 진도를 확인해요");
        expect(guidance).toHaveTextContent("코드를 직접 작성하고 실행할 때는 컴퓨터를 사용해주세요.");
    });
});
