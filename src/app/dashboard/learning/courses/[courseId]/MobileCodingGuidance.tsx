export default function MobileCodingGuidance() {
    return (
        <aside className="mobile-coding-guidance" aria-label="휴대폰 학습 안내">
            <span className="material-symbols-outlined" aria-hidden="true">devices</span>
            <div>
                <strong>휴대폰에서는 설명과 진도를 확인해요</strong>
                <p>코드를 직접 작성하고 실행할 때는 컴퓨터를 사용해주세요.</p>
            </div>

            <style>{`
                .mobile-coding-guidance {
                    display: none;
                }

                @media (max-width: 768px) {
                    .mobile-coding-guidance {
                        display: flex;
                        flex: 0 0 auto;
                        align-items: center;
                        gap: 10px;
                        margin: 0;
                        padding: 11px 14px;
                        border-bottom: 1px solid #bae6fd;
                        background: linear-gradient(90deg, #eff6ff, #f0f9ff);
                        color: #0f172a;
                        font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
                    }

                    .mobile-coding-guidance > .material-symbols-outlined {
                        display: grid;
                        width: 36px;
                        height: 36px;
                        flex: 0 0 36px;
                        place-items: center;
                        border-radius: 11px;
                        background: #2563eb;
                        color: #fff;
                        font-size: 20px;
                    }

                    .mobile-coding-guidance strong,
                    .mobile-coding-guidance p {
                        display: block;
                        margin: 0;
                        word-break: keep-all;
                    }

                    .mobile-coding-guidance strong {
                        color: #1e3a8a;
                        font-size: 12px;
                        font-weight: 900;
                        line-height: 1.4;
                    }

                    .mobile-coding-guidance p {
                        margin-top: 2px;
                        color: #475569;
                        font-size: 10px;
                        font-weight: 650;
                        line-height: 1.45;
                    }
                }
            `}</style>
        </aside>
    );
}
