"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { C_PROBLEM_BOOK } from "@/data/problems/c-problem-book";
import { PY_PROBLEM_BOOK } from "@/data/problems/py-problem-book";
import type { ProblemBook } from "@/data/problems/types";

/* ── 책 두께/반경 상수 ── */
const T = 44; // thickness px
const R = 6;  // corner radius px

/* ── 책 메타 ── */
interface BookMeta {
  book: ProblemBook;
  spineColor: string;
  coverGradient: string;
  badgeColor: string;
  icon: string;
  description: string;
}

const BOOKS: BookMeta[] = [
  {
    book: C_PROBLEM_BOOK,
    spineColor: "#2563eb",
    coverGradient: "linear-gradient(160deg, #1d4ed8 0%, #3b82f6 60%, #60a5fa 100%)",
    badgeColor: "rgba(37,99,235,0.9)",
    icon: "terminal",
    description: "printf, scanf부터 포인터, 구조체까지 C언어의 모든 것",
  },
  {
    book: PY_PROBLEM_BOOK,
    spineColor: "#059669",
    coverGradient: "linear-gradient(160deg, #065f46 0%, #10b981 60%, #34d399 100%)",
    badgeColor: "rgba(5,150,105,0.9)",
    icon: "code",
    description: "입출력부터 클래스, 자료구조까지 파이썬 완전 정복",
  },
];

/* ── 3D 책 카드 ── */
function BookCard({ meta, index }: { meta: BookMeta; index: number }) {
  const router = useRouter();
  const [flipped, setFlipped] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const isTouchRef = useRef(false);

  const spineColorDark = `color-mix(in srgb, ${meta.spineColor} 65%, #000)`;
  const totalProblems = meta.book.levels.reduce((acc, l) => acc + l.problems.length, 0);
  const levelCount = meta.book.levels.length;

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !bookRef.current || flipped) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotY = -35 + (x - 0.5) * 20;
    const rotX = 10 - (y - 0.5) * 12;
    bookRef.current.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;
  }, [flipped]);

  const handleMouseLeave = useCallback(() => {
    if (!bookRef.current || isTouchRef.current) return;
    if (flipped) return;
    bookRef.current.style.transform = "rotateY(-35deg) rotateX(10deg)";
  }, [flipped]);

  const handleClick = useCallback(() => {
    if (!flipped) {
      setFlipped(true);
      if (bookRef.current) {
        bookRef.current.style.transform = "rotateY(160deg) rotateX(0deg)";
      }
    } else {
      router.push(`/dashboard/learning/problem-book/${meta.book.id}`);
    }
  }, [flipped, meta.book.id, router]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    isTouchRef.current = true;
    handleClick();
  }, [handleClick]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}
    >
      {/* 책 씬 */}
      <div
        ref={containerRef}
        style={{
          width: 200,
          height: 280,
          perspective: 1000,
          cursor: "pointer",
          userSelect: "none",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={bookRef}
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            transformStyle: "preserve-3d",
            transform: "rotateY(-35deg) rotateX(10deg)",
            transition: "transform 0.5s cubic-bezier(0.25,0.46,0.45,0.94)",
            filter: `drop-shadow(0 30px 60px ${meta.spineColor}55)`,
          }}
        >
          {/* ── 앞표지 ── */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backfaceVisibility: "hidden",
              borderRadius: `${R}px ${R}px ${R}px ${R}px`,
              overflow: "hidden",
            }}
          >
            {/* 배경 */}
            <div style={{ position: "absolute", inset: 0, background: meta.coverGradient }} />

            {/* 광택 */}
            <div style={{
              position: "absolute", inset: 0, zIndex: 1,
              background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)",
              pointerEvents: "none",
            }} />

            {/* 아래 그라데이션 */}
            <div style={{
              position: "absolute", inset: 0, zIndex: 1,
              background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55) 100%)",
            }} />

            {/* 아이콘 */}
            <div style={{
              position: "absolute", top: 28, left: "50%", transform: "translateX(-50%)",
              zIndex: 2,
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: 16,
                background: "rgba(255,255,255,0.2)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color: "#fff" }}>{meta.icon}</span>
              </div>
            </div>

            {/* 제목 */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 3,
              padding: "10px 12px 14px",
            }}>
              <div style={{ fontSize: 15, fontWeight: 900, color: "#fff", lineHeight: 1.3, marginBottom: 4 }}>
                {meta.book.title}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
                {levelCount}단계 · {totalProblems}문제
              </div>
            </div>

            {/* 배지 */}
            <div style={{
              position: "absolute", top: 12, right: 10, zIndex: 4,
              background: meta.badgeColor,
              color: "#fff", fontSize: 10, fontWeight: 800,
              padding: "3px 8px", borderRadius: 6,
              backdropFilter: "blur(4px)",
            }}>
              {meta.book.language === "c" ? "C언어" : "Python"}
            </div>
          </div>

          {/* ── 뒷표지 ── */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              borderRadius: `${R}px ${R}px ${R}px ${R}px`,
              overflow: "hidden",
              background: `linear-gradient(160deg, ${spineColorDark}, ${meta.spineColor})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              padding: 20,
            }}
          >
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", textAlign: "center", lineHeight: 1.6 }}>
              {meta.description}
            </div>
            <div style={{
              background: "rgba(255,255,255,0.15)",
              borderRadius: 10,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 800,
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.3)",
            }}>
              풀기 시작 →
            </div>
          </div>

          {/* ── 책등 (spine) ── */}
          <div
            style={{
              position: "absolute",
              width: T,
              height: "100%",
              left: -T,
              top: 0,
              transformOrigin: "right center",
              transform: "rotateY(-90deg)",
              backfaceVisibility: "hidden",
              background: `linear-gradient(to bottom, ${meta.spineColor}, ${spineColorDark})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              fontSize: 12,
              fontWeight: 900,
              color: "rgba(255,255,255,0.9)",
              letterSpacing: 2,
            }}>
              {meta.book.title}
            </span>
          </div>

          {/* ── 윗면 ── */}
          <div
            style={{
              position: "absolute",
              width: "100%",
              height: T,
              top: -T,
              transformOrigin: "bottom center",
              transform: "rotateX(90deg)",
              backfaceVisibility: "hidden",
              background: "rgba(241,245,249,0.9)",
              borderTop: "1px solid rgba(0,0,0,0.06)",
            }}
          />
        </div>
      </div>

      {/* 책 정보 */}
      <div style={{ textAlign: "center", maxWidth: 220 }}>
        <h2 style={{ fontSize: 18, fontWeight: 900, color: "#0f172a", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
          {meta.book.title}
        </h2>
        <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 12px", lineHeight: 1.6 }}>
          {meta.description}
        </p>

        {/* 레벨 미리보기 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center", marginBottom: 16 }}>
          {meta.book.levels.slice(0, 5).map((level) => (
            <span key={level.id} style={{
              fontSize: 10, fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 99,
              background: `${level.color}18`,
              color: level.color,
              border: `1px solid ${level.color}40`,
            }}>
              {level.title}
            </span>
          ))}
          {meta.book.levels.length > 5 && (
            <span style={{
              fontSize: 10, fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 99,
              background: "#f1f5f9",
              color: "#94a3b8",
            }}>
              +{meta.book.levels.length - 5}개
            </span>
          )}
        </div>

        {/* 힌트 텍스트 */}
        {flipped ? (
          <p style={{ fontSize: 12, color: meta.spineColor, fontWeight: 700 }}>
            한 번 더 클릭하면 입장!
          </p>
        ) : (
          <p style={{ fontSize: 12, color: "#94a3b8" }}>
            책을 클릭해 뒤집어보세요
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ── 메인 페이지 ── */
export default function ProblemBookPage() {
  const router = useRouter();

  // 이 페이지는 사이드바에서 제거됨 — 직접 접근 시 courses/6으로 리다이렉트
  useEffect(() => {
    router.replace("/dashboard/learning/courses/6");
  }, [router]);

  // 리다이렉트 전 잠깐 보이는 로딩 상태
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100%", flexDirection: "column", gap: 12,
      color: "#94a3b8", fontSize: 14,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 40, color: "#cbd5e1" }}>
        hourglass_top
      </span>
      이동 중...
    </div>
  );
}

/* ── 아래는 더 이상 사용되지 않는 3D 책 선택 UI (참조용 보존) ── */
function _UnusedBookSelectUI() {
  return (
    <div style={{ padding: "40px 24px 80px", maxWidth: 900, margin: "0 auto" }}>
      {/* 헤더 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 60, textAlign: "center" }}
      >
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(16,185,129,0.08))",
          border: "1px solid rgba(59,130,246,0.15)",
          borderRadius: 99, padding: "6px 16px",
          fontSize: 12, fontWeight: 700, color: "#3b82f6",
          marginBottom: 16,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>menu_book</span>
          코딩쏙 문제집
        </div>
        <h1 style={{
          fontSize: 32, fontWeight: 900, color: "#0f172a",
          margin: "0 0 12px", letterSpacing: "-0.03em",
        }}>
          어떤 언어로 연습할까요?
        </h1>
        <p style={{ fontSize: 15, color: "#64748b", margin: 0, lineHeight: 1.7 }}>
          C언어와 파이썬 문제집으로 실력을 키워보세요.<br />
          단계별 문제로 차근차근 레벨업!
        </p>
      </motion.div>

      {/* 책 그리드 */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: 60,
        justifyItems: "center",
        maxWidth: 600,
        margin: "0 auto",
      }}>
        {BOOKS.map((meta, i) => (
          <BookCard key={meta.book.id} meta={meta} index={i} />
        ))}
      </div>

      {/* 하단 안내 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        style={{
          marginTop: 80,
          display: "flex",
          gap: 16,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {[
          { icon: "school", text: "단계별 학습", desc: "L1부터 차근차근" },
          { icon: "auto_fix_high", text: "즉시 채점", desc: "테스트케이스 자동 채점" },
          { icon: "code", text: "실시간 컴파일", desc: "브라우저에서 바로 실행" },
        ].map((item) => (
          <div key={item.icon} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 20px",
            background: "#f8fafc",
            borderRadius: 14,
            border: "1px solid #e2e8f0",
            minWidth: 180,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: "linear-gradient(135deg, #e0f2fe, #dbeafe)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: "#3b82f6" }}>{item.icon}</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item.text}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
