"use client";

import { useEffect, useRef } from "react";

export default function StudentLogoutStatus({ status, onRetry }: {
    status: "pending" | "error";
    onRetry: () => void;
}) {
    const heading = useRef<HTMLHeadingElement>(null);
    const failed = status === "error";

    useEffect(() => { heading.current?.focus(); }, [status]);

    return (
        <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-5 py-12 text-slate-900">
            <section
                aria-labelledby="student-logout-heading"
                aria-busy={!failed}
                className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
                <p className="mb-3 text-sm font-semibold text-blue-700">코딩쏙 · 안전한 로그아웃</p>
                <div role={failed ? "alert" : "status"}>
                    <h1 id="student-logout-heading" ref={heading} tabIndex={-1} className="text-xl font-bold leading-snug outline-none">
                        {failed ? "로그아웃을 완료하지 못했어요" : "로그아웃을 확인하고 있어요"}
                    </h1>
                    <p className="mt-3 text-base leading-relaxed text-slate-600">
                        {failed
                            ? "아직 이 기기에 로그인 정보가 남아 있을 수 있어요. 인터넷 연결을 확인하고 다시 시도해주세요."
                            : "로그인 정보가 지워졌는지 확인 중이에요. 잠시만 기다려주세요."}
                    </p>
                </div>
                {failed && <>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-6 min-h-12 w-full rounded-xl bg-blue-700 px-4 py-3 text-base font-semibold text-white hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
                    >
                        로그아웃 다시 시도
                    </button>
                    <p className="mt-4 text-sm leading-relaxed text-slate-600">
                        계속 안 되면 선생님께 알려주세요. 로그아웃이 끝나기 전에는 다른 사람에게 기기를 넘기지 마세요.
                    </p>
                </>}
            </section>
        </main>
    );
}
