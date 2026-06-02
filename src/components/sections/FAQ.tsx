"use client";

import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════
   FAQ — Cinematic Glass Ultra V3.1
   Aero-glass accordion · Depth-grid BG · 3D icons
   ═══════════════════════════════════════════ */

const FAQ_ITEMS = [
    {
        question: "수학이 약하면 코딩이 어렵지 않나요?",
        answer: "전혀 그렇지 않습니다. 코딩쏙의 커리큘럼은 수학 실력과 무관하게 논리적 사고력을 기르는 데 초점을 맞추고 있습니다. 오히려 코딩을 통해 수학적 개념을 자연스럽게 이해하게 되는 경우가 많습니다. 변수, 반복문, 조건문 등 코딩의 기본 개념이 수학적 사고의 기초가 됩니다.",
        icon: "functions",
    },
    {
        question: "저학년인데 타이핑이 느려도 괜찮을까요?",
        answer: "물론입니다. 저학년 학생들은 블록코딩부터 시작하여 마우스 드래그만으로 프로그래밍 개념을 배울 수 있습니다. 타이핑 속도는 자연스럽게 향상되며, 텍스트 코딩으로의 전환은 아이의 준비 상태에 맞춰 단계적으로 진행됩니다.",
        icon: "keyboard",
    },
    {
        question: "피드백은 어떻게 주시나요?",
        answer: "매 수업 후 학부모님께 카카오톡으로 수업 내용과 아이의 학습 상태를 상세히 보고드립니다. 월 1회 심층 학습 리포트를 제공하며, 분기별로 1:1 학부모 상담을 진행합니다. 아이의 성장 과정을 투명하게 공유합니다.",
        icon: "monitoring",
    },
    {
        question: "수업은 어떤 방식으로 진행되나요?",
        answer: "1:4~1:6 소수정예 대면 수업으로, 아이의 수준에 맞춘 개별 커리큘럼을 제공합니다. 90분 수업 중 처음 10분은 복습, 60분은 새로운 내용 실습, 마지막 20분은 자유 프로젝트 시간으로 운영됩니다. 선생님이 각 아이 옆에서 직접 코드를 함께 확인하며 밀착 지도합니다.",
        icon: "groups",
        defaultOpen: true,
    },
    {
        question: "체험 수업은 무료인가요?",
        answer: "네, 첫 체험 수업은 완전 무료입니다. 약 60분간 진행되며, 아이의 현재 수준을 파악하고 맞춤 커리큘럼을 제안드립니다. 부담 없이 편하게 방문해 주세요. 체험 수업 후 등록 여부는 자유롭게 결정하실 수 있습니다.",
        icon: "card_giftcard",
    },
    {
        question: "코딩을 배우면 학교 성적에 도움이 되나요?",
        answer: "코딩 학습은 논리적 사고력, 문제 분석력, 창의력을 종합적으로 향상시킵니다. 특히 수학과 과학 과목에서 눈에 띄는 성적 향상을 보이는 학생들이 많습니다. 또한 SW 관련 대회 수상 이력은 학생부에 기재할 수 있어 입시에도 도움이 됩니다.",
        icon: "school",
    },
];

function FAQItem({ item, index, isInView }: { item: typeof FAQ_ITEMS[0]; index: number; isInView: boolean }) {
    const [isOpen, setIsOpen] = useState(item.defaultOpen || false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.08 * index, duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
            className={`fq-item ${isOpen ? "fq-item-active" : ""}`}
            onClick={() => setIsOpen(!isOpen)}
        >
            {/* Active glow */}
            {isOpen && <div className="fq-active-glow" />}

            <div className="fq-row">
                <div className="fq-left">
                    <div className={`fq-icon-box ${isOpen ? "fq-icon-active" : ""}`}>
                        <span className="material-symbols-outlined fq-icon-sym">{item.icon}</span>
                    </div>
                    <h3 className="fq-question">{item.question}</h3>
                </div>
                <div className={`fq-toggle ${isOpen ? "fq-toggle-active" : ""}`}>
                    <span className="material-symbols-outlined fq-toggle-icon">
                        {isOpen ? "remove" : "add"}
                    </span>
                </div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                        style={{ overflow: "hidden" }}
                    >
                        <p className="fq-answer">{item.answer}</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default function FAQ() {
    const ref = useRef<HTMLElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-60px" });

    return (
        <section ref={ref} id="faq" className="fq-section">
                        
            {/* BG */}
            <div className="fq-bg" aria-hidden>
                <div className="fq-nebula" />
                <div className="fq-depth-grid" />
                <div className="fq-light-leak" />
                {/* 3D floating icons */}
                <div className="fq-3d-icon fq-3d-1"><span className="material-symbols-outlined fq-silver">calculate</span></div>
                <div className="fq-3d-icon fq-3d-2"><span className="material-symbols-outlined fq-silver">keyboard</span></div>
                <div className="fq-3d-icon fq-3d-3"><span className="material-symbols-outlined fq-silver">insert_chart</span></div>
            </div>

            <div className="fq-container">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.8 }}
                    className="fq-header"
                >
                    <div className="fq-header-icon">
                        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>chat_bubble</span>
                    </div>
                    <p className="fq-header-sub">Supreme Inquiry Interface</p>
                    <h2 className="fq-title">
                        학부모님이 자주<br />
                        <span className="fq-title-accent">묻는 질문</span>
                    </h2>
                </motion.div>

                {/* Items */}
                <div className="fq-list">
                    {FAQ_ITEMS.map((item, i) => (
                        <FAQItem key={i} item={item} index={i} isInView={isInView} />
                    ))}
                </div>
            </div>

            <style>{`
/* ═══ Section ═══ */
.fq-section { position: relative; overflow: hidden; padding: clamp(80px,10vw,140px) 0; background: #fff; font-family: 'Noto Sans KR', sans-serif; color: #1e293b; }
.fq-container { max-width: 900px; margin: 0 auto; padding: 0 clamp(16px,4vw,40px); position: relative; z-index: 10; }

/* BG */
.fq-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; background: #ffffff; }
.fq-nebula { display: none; }
.fq-depth-grid { display: none; }
.fq-light-leak { display: none; }

/* 3D floating icons */
.fq-3d-icon { position: absolute; z-index: 4; pointer-events: none; mix-blend-mode: luminosity; }
.fq-silver { font-size: 80px; background: linear-gradient(135deg, #e0e0e0 0%, #f5f5f5 50%, #d4d4d4 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.15)); opacity: 0.6; }
.fq-3d-1 { top: 15%; left: 8%; transform: rotate(-15deg) perspective(500px) rotateY(20deg); }
.fq-3d-2 { top: 40%; right: 6%; transform: rotate(10deg) perspective(500px) rotateY(-30deg) rotateX(20deg); }
.fq-3d-3 { bottom: 15%; left: 12%; transform: rotate(5deg) perspective(500px) rotateY(15deg) rotateX(-10deg); }

/* Header */
.fq-header { text-align: center; margin-bottom: clamp(40px,6vw,72px); position: relative; z-index: 20; }
.fq-header-icon { display: inline-flex; width: 64px; height: 64px; border-radius: 16px; background: rgba(255,255,255,0.4); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.6); align-items: center; justify-content: center; color: #5A8BBB; margin-bottom: 24px; box-shadow: 0 8px 32px rgba(31,38,135,0.1); }
.fq-header-sub { font-size: 11px; font-weight: 900; letter-spacing: 0.3em; text-transform: uppercase; color: #5A8BBB; margin-bottom: 16px; }
.fq-title { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 900; line-height: 1.15; letter-spacing: -0.02em; background: linear-gradient(to bottom, #1e293b 0%, #334155 50%, #475569 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.fq-title-accent { background: linear-gradient(to right, #5A8BBB, #FF6B6B); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.08)); }

/* FAQ Item */
.fq-list { display: flex; flex-direction: column; gap: 20px; position: relative; z-index: 20; }
.fq-item {
    position: relative; cursor: pointer;
    background: linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 100%);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.8); border-top: 1px solid #fff; border-left: 1px solid #fff;
    border-radius: 24px; padding: 24px 32px;
    box-shadow: 0 8px 32px rgba(31,38,135,0.1), inset 0 0 20px rgba(255,255,255,0.3);
    transform-style: preserve-3d;
    transition: all 0.5s cubic-bezier(0.25, 1, 0.5, 1);
    overflow: hidden;
}
.fq-item::before { content: ''; position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 15px rgba(90,139,187,0.2); pointer-events: none; }
.fq-item::after { content: ''; position: absolute; inset: -2px; border-radius: inherit; background: linear-gradient(90deg, rgba(255,0,0,0.15), rgba(0,255,0,0.15), rgba(0,0,255,0.15)); z-index: -1; filter: blur(4px); opacity: 0.4; pointer-events: none; }
.fq-item-active { background: linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.4) 100%); border-color: rgba(255,107,107,0.4); transform: scale(1.02) translateZ(20px); z-index: 3; box-shadow: 0 0 40px rgba(255,107,107,0.15), inset 0 0 20px rgba(255,255,255,0.5); }
.fq-item-active::before { box-shadow: inset 0 0 20px rgba(255,107,107,0.15); }
.fq-active-glow { position: absolute; top: 0; right: 0; width: 256px; height: 256px; background: rgba(255,107,107,0.08); border-radius: 50%; filter: blur(40px); transform: translate(33%, -50%); pointer-events: none; }

/* Row */
.fq-row { display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 10; }
.fq-left { display: flex; align-items: center; gap: 20px; }
.fq-icon-box { width: 56px; height: 56px; border-radius: 16px; background: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; color: #64748b; box-shadow: inset 0 0 10px rgba(255,255,255,0.3); transition: all 0.3s; flex-shrink: 0; }
.fq-icon-active { background: rgba(255,107,107,0.15); border-color: rgba(255,107,107,0.3); color: #FF6B6B; }
.fq-icon-sym { font-size: 24px; }
.fq-question { font-size: clamp(16px, 2.5vw, 22px); font-weight: 700; color: #1e293b; }
.fq-toggle { width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.5); border: 1px solid rgba(255,255,255,0.7); display: flex; align-items: center; justify-content: center; color: #64748b; flex-shrink: 0; transition: all 0.3s; }
.fq-toggle-active { background: #FF6B6B; color: #fff; border-color: transparent; box-shadow: 0 4px 16px rgba(255,107,107,0.4); }
.fq-toggle-icon { font-size: 20px; }

/* Answer */
.fq-answer { padding: 20px 0 8px 76px; font-size: 16px; color: #475569; line-height: 1.75; font-weight: 500; position: relative; z-index: 10; }
@media (max-width: 640px) {
  .fq-answer { padding-left: 0; font-size: 14px; }
  .fq-item { padding: 16px 18px; border-radius: 16px; }
  .fq-icon-box { width: 44px; height: 44px; }
  .fq-left { gap: 12px; }
  .fq-question { font-size: 15px; }
}

/* Keyframes */
@keyframes fqFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
            `}</style>
        </section>
    );
}
