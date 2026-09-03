import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PasswordResetRequest from "./PasswordResetRequest";

describe("PasswordResetRequest", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("asks for the student name before sending", () => {
    render(<PasswordResetRequest studentName="" />);

    fireEvent.click(screen.getByRole("button", { name: "비밀번호를 잊었나요? 선생님께 요청하기" }));
    fireEvent.change(screen.getByLabelText("학부모 인증번호 5자리"), { target: { value: "12345" } });
    fireEvent.click(screen.getByRole("button", { name: "선생님께 요청 보내기" }));

    expect(screen.getByRole("status")).toHaveTextContent("위에 학생 이름을 먼저 입력해주세요.");
  });

  it("sends only the name and parent code and shows the success message", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true, message: "선생님께 요청을 보냈어요." }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<PasswordResetRequest studentName="테스트 학생" />);

    fireEvent.click(screen.getByRole("button", { name: "비밀번호를 잊었나요? 선생님께 요청하기" }));
    fireEvent.change(screen.getByLabelText("학부모 인증번호 5자리"), { target: { value: "12345" } });
    fireEvent.click(screen.getByRole("button", { name: "선생님께 요청 보내기" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      name: "테스트학생",
      parentCode: "12345",
    });
    expect(await screen.findByRole("status")).toHaveTextContent("선생님께 요청을 보냈어요.");
  });
});
