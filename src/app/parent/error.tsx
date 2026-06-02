"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { reportError } from "@/lib/error-reporter";

export default function ParentError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        reportError({
            source: "client",
            message: error.message,
            stack: error.stack,
            metadata: { digest: error.digest, page: "parent" },
        });
    }, [error]);

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-5 py-10 text-center font-[Pretendard,sans-serif]">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="w-[72px] h-[72px] rounded-[20px] bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center mx-auto mb-5">
                    <span className="material-symbols-outlined text-4xl text-red-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                        error
                    </span>
                </div>
                <h2 className="text-lg font-extrabold text-slate-900 mb-2">
                    오류가 발생했습니다
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                    잠시 후 다시 시도해주세요.
                </p>
                <button
                    onClick={reset}
                    className="px-8 py-3 rounded-[14px] border-none bg-gradient-to-br from-blue-600 to-blue-700 text-white text-sm font-bold cursor-pointer"
                >
                    다시 시도
                </button>
            </motion.div>
        </div>
    );
}
