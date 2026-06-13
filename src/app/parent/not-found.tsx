import Link from "next/link";

export default function ParentNotFound() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-5 py-10 text-center font-[Pretendard,sans-serif]">
            <div className="w-[72px] h-[72px] rounded-[20px] bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-4xl text-indigo-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                    search_off
                </span>
            </div>
            <h2 className="text-lg font-extrabold text-slate-900 mb-2">
                페이지를 찾을 수 없습니다
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
                주소가 잘못되었거나 삭제된 페이지입니다.
            </p>
            <Link
                href="/parent/feedback"
                className="inline-block px-8 py-3 rounded-[14px] bg-gradient-to-br from-blue-600 to-blue-700 text-white text-sm font-bold no-underline"
            >
                홈으로 이동
            </Link>
        </div>
    );
}
