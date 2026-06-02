"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProgress } from "@/hooks/useUserProgress";
import { createClient } from "@/lib/supabase";
import TierIcon from "@/components/icons/TierIcon";
import { grantTierPromotion } from "@/lib/reward-engine";
import {
    TIERS,
    getNextTier,
    getTierInfo,
    RANK_EXAM_MIN_LEVEL,
    TIER_REWARDS,
    getTierReward,
    XP_REWARDS,
    calcLevel,
    PROMOTION_REQUIREMENTS,
} from "@/lib/xp-engine";
import { QUESTION_POOL, type ExamQuestion } from "@/data/exam-questions";

// ═══════════════════════════════════════
//  유틸
// ═══════════════════════════════════════

const COOLDOWN_KEY = 'codingssok_promo_cooldown';
const COOLDOWN_MS = 10 * 60 * 1000; // 10분

function getCooldownRemaining(): number {
    if (typeof window === 'undefined') return 0;
    const last = localStorage.getItem(COOLDOWN_KEY);
    if (!last) return 0;
    const elapsed = Date.now() - parseInt(last, 10);
    return Math.max(0, COOLDOWN_MS - elapsed);
}

function setCooldown() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
}

function getTierOrder(tierName: string): number {
    return TIERS.find(t => t.name === tierName)?.order ?? 0;
}

function selectQuestions(targetTier: string, count: number): ExamQuestion[] {
    const targetOrder = getTierOrder(targetTier);
    // Include questions at or below the target tier difficulty
    const eligible = QUESTION_POOL.filter(q => {
        const qOrder = getTierOrder(q.tier);
        // easy: all tiers, medium: Silver+, hard: Gold+
        if (q.difficulty === 'easy') return true;
        if (q.difficulty === 'medium') return targetOrder >= 2;
        if (q.difficulty === 'hard') return targetOrder >= 4;
        return true;
    });

    // Shuffle and pick
    const shuffled = [...eligible].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
}

function TierBadge({ tier, size = 64 }: { tier: string; size?: number }) {
    return <TierIcon tier={tier} size={size} animated />;
}

// ═══════════════════════════════════════
//  Confetti 파티클 (framer-motion)
// ═══════════════════════════════════════

function ConfettiEffect() {
    const particles = useMemo(() => {
        const colors = ['#0ea5e9', '#3b82f6', '#f59e0b', '#22c55e', '#ec4899', '#8b5cf6', '#ef4444'];
        return Array.from({ length: 60 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            color: colors[i % colors.length],
            delay: Math.random() * 0.8,
            rotation: Math.random() * 720 - 360,
            size: 6 + Math.random() * 8,
        }));
    }, []);

    return (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100, overflow: 'hidden' }}>
            {particles.map(p => (
                <motion.div
                    key={p.id}
                    initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
                    animate={{ y: '110vh', opacity: 0, rotate: p.rotation }}
                    transition={{ duration: 2.5 + Math.random(), delay: p.delay, ease: 'easeIn' }}
                    style={{
                        position: 'absolute',
                        width: p.size,
                        height: p.size,
                        borderRadius: p.size > 10 ? '50%' : '2px',
                        background: p.color,
                    }}
                />
            ))}
        </div>
    );
}

// ═══════════════════════════════════════
//  메인 페이지
// ═══════════════════════════════════════

type Stage = 'requirements' | 'exam' | 'result';

export default function PromotionExamPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { progress, update, addXP, logActivity, isSupabase } = useUserProgress();

    const [stage, setStage] = useState<Stage>('requirements');
    const [questions, setQuestions] = useState<ExamQuestion[]>([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState<(number | null)[]>([]);
    const [timeLeft, setTimeLeft] = useState(30);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [score, setScore] = useState(0);
    const [passed, setPassed] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [cooldown, setCooldownState] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const currentTier = progress.tier || 'Iron';
    const nextTier = getNextTier(currentTier);
    const nextTierInfo = nextTier ? getTierInfo(nextTier) : null;
    const currentTierInfo = getTierInfo(currentTier);
    const requirements = nextTier ? PROMOTION_REQUIREMENTS[nextTier] : null;

    // 쿨다운 체크
    useEffect(() => {
        const remaining = getCooldownRemaining();
        setCooldownState(remaining);
        if (remaining <= 0) return;
        const interval = setInterval(() => {
            const r = getCooldownRemaining();
            setCooldownState(r);
            if (r <= 0) clearInterval(interval);
        }, 1000);
        return () => clearInterval(interval);
    }, [stage]);

    // 요구사항 충족 여부
    const requirementChecks = useMemo(() => {
        if (!requirements || !nextTier) return [];
        const checks = [];

        checks.push({
            label: `레벨 ${requirements.minLevel} 이상`,
            met: progress.level >= requirements.minLevel,
            current: `현재 Lv.${progress.level}`,
        });

        if (requirements.minUnits > 0) {
            checks.push({
                label: `완료 유닛 ${requirements.minUnits}개 이상`,
                met: progress.completedCourses.length >= requirements.minUnits,
                current: `현재 ${progress.completedCourses.length}개`,
            });
        }

        if (requirements.minCodeRuns > 0) {
            checks.push({
                label: `코드 실행 ${requirements.minCodeRuns}회 이상`,
                met: progress.totalProblems >= requirements.minCodeRuns,
                current: `현재 ${progress.totalProblems}회`,
            });
        }

        if (requirements.minStreak > 0) {
            checks.push({
                label: `연속 출석 ${requirements.minStreak}일 이상`,
                met: progress.streak >= requirements.minStreak,
                current: `현재 ${progress.streak}일`,
            });
        }

        return checks;
    }, [requirements, nextTier, progress]);

    const allMet = requirementChecks.every(c => c.met);

    // 타이머
    useEffect(() => {
        if (stage !== 'exam') return;

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    // 시간 초과 → 다음 문제
                    handleAnswer(null);
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stage, currentQ]);

    // 시험 시작
    const startExam = useCallback(() => {
        if (!requirements || !nextTier) return;
        const selected = selectQuestions(nextTier, requirements.examQuestions);
        setQuestions(selected);
        setAnswers(new Array(selected.length).fill(null));
        setCurrentQ(0);
        setTimeLeft(30);
        setSelectedOption(null);
        setScore(0);
        setStage('exam');
    }, [requirements, nextTier]);

    // 답변 처리
    const handleAnswer = useCallback((optionIndex: number | null) => {
        if (timerRef.current) clearInterval(timerRef.current);

        setAnswers(prev => {
            const next = [...prev];
            next[currentQ] = optionIndex;
            return next;
        });

        setSelectedOption(optionIndex);

        // 0.8초 후 다음 문제
        setTimeout(() => {
            if (currentQ + 1 >= questions.length) {
                // 시험 완료 — 결과 계산
                finishExam(optionIndex);
            } else {
                setCurrentQ(prev => prev + 1);
                setTimeLeft(30);
                setSelectedOption(null);
            }
        }, 800);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentQ, questions]);

    // 시험 완료
    const finishExam = useCallback(async (lastAnswer: number | null) => {
        let correct = 0;
        const finalAnswers = [...answers];
        finalAnswers[currentQ] = lastAnswer;

        for (let i = 0; i < questions.length; i++) {
            if (finalAnswers[i] === questions[i].correct) correct++;
        }

        const pct = (correct / questions.length) * 100;
        const passThreshold = requirements?.passPercent ?? 70;
        const didPass = pct >= passThreshold;

        setScore(correct);
        setPassed(didPass);
        setStage('result');

        if (didPass && nextTier) {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 4000);

            // 티어 업데이트 (로컬)
            update({ tier: nextTier, placement_done: true });

            // reward-engine으로 통합 보상 지급 (Supabase + localStorage)
            if (user) {
                const reward = await grantTierPromotion(user.id, nextTier);
                if (reward) {
                    addXP(reward.xpBonus);
                } else {
                    addXP(XP_REWARDS.promotion_pass);
                }
            }

            // 활동 로그
            logActivity(`${nextTier} 티어 승급 성공`, XP_REWARDS.promotion_pass, 'military_tech');
        } else {
            setCooldown();
            logActivity(`승급전 실패 (${correct}/${questions.length})`, 0, 'cancel');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [answers, currentQ, questions, requirements, nextTier, isSupabase, user]);

    // ── 로딩 / 비로그인 ──
    if (authLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#0ea5e9', borderRadius: '50%' }}
                />
            </div>
        );
    }

    // ── 최대 티어 도달 ──
    if (!nextTier || !requirements) {
        return (
            <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        background: '#fff',
                        borderRadius: 20,
                        border: '1px solid #e2e8f0',
                        padding: '48px 32px',
                        textAlign: 'center',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                    }}
                >
                    <TierBadge tier={currentTier} size={80} />
                    <h2 style={{ fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, margin: '20px 0 8px', color: '#1e293b' }}>
                        최고 티어 달성!
                    </h2>
                    <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6 }}>
                        축하합니다! 이미 {currentTierInfo.nameKo} 티어로 최고 등급에 도달했습니다.
                    </p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        style={{
                            marginTop: 24,
                            padding: '12px 28px',
                            background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 12,
                            fontSize: 15,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                        }}
                    >
                        대시보드로 돌아가기
                    </button>
                </motion.div>
            </div>
        );
    }

    // ═══════════════════════════════════════
    //  Requirements Screen
    // ═══════════════════════════════════════

    if (stage === 'requirements') {
        return (
            <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 20px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    {/* 헤더 */}
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
                            <TierBadge tier={currentTier} size={56} />
                            <span className="material-symbols-outlined" style={{ fontSize: 28, color: '#94a3b8' }}>
                                arrow_forward
                            </span>
                            <TierBadge tier={nextTier} size={56} />
                        </div>
                        <h1 style={{
                            fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif",
                            fontSize: 26,
                            fontWeight: 800,
                            color: '#1e293b',
                            margin: '0 0 6px',
                        }}>
                            {nextTierInfo!.nameKo} 승급전
                        </h1>
                        <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                            {currentTierInfo.nameKo} → {nextTierInfo!.nameKo} 승급에 도전하세요
                        </p>
                    </div>

                    {/* 요구사항 카드 */}
                    <div style={{
                        background: '#fff',
                        borderRadius: 20,
                        border: '1px solid #e2e8f0',
                        padding: '28px 24px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                        marginBottom: 20,
                    }}>
                        <h3 style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#334155',
                            margin: '0 0 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#0ea5e9' }}>
                                checklist
                            </span>
                            승급 조건
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {requirementChecks.map((check, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        padding: '12px 16px',
                                        borderRadius: 12,
                                        background: check.met ? '#f0fdf4' : '#fef2f2',
                                        border: `1px solid ${check.met ? '#bbf7d0' : '#fecaca'}`,
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{
                                        fontSize: 22,
                                        color: check.met ? '#22c55e' : '#ef4444',
                                    }}>
                                        {check.met ? 'check_circle' : 'cancel'}
                                    </span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{check.label}</div>
                                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{check.current}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* 시험 정보 */}
                    <div style={{
                        background: '#fff',
                        borderRadius: 20,
                        border: '1px solid #e2e8f0',
                        padding: '28px 24px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                        marginBottom: 20,
                    }}>
                        <h3 style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#334155',
                            margin: '0 0 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#3b82f6' }}>
                                quiz
                            </span>
                            시험 정보
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {[
                                { icon: 'help', label: '문항 수', value: `${requirements.examQuestions}문항` },
                                { icon: 'percent', label: '합격 기준', value: `${requirements.passPercent}% 이상` },
                                { icon: 'timer', label: '제한 시간', value: '문항당 30초' },
                                { icon: 'category', label: '문제 유형', value: '4지선다' },
                            ].map((info, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '10px 14px',
                                    borderRadius: 10,
                                    background: '#f8fafc',
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#64748b' }}>
                                        {info.icon}
                                    </span>
                                    <div>
                                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{info.label}</div>
                                        <div style={{ fontSize: 14, color: '#334155', fontWeight: 600 }}>{info.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 보상 미리보기 */}
                    <div style={{
                        background: '#fff',
                        borderRadius: 20,
                        border: '1px solid #e2e8f0',
                        padding: '28px 24px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                        marginBottom: 28,
                    }}>
                        <h3 style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#334155',
                            margin: '0 0 16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#f59e0b' }}>
                                emoji_events
                            </span>
                            승급 보상
                        </h3>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            {(() => {
                                const reward = getTierReward(nextTier);
                                const items = [
                                    { icon: 'star', label: `+${reward?.xpBonus ?? XP_REWARDS.promotion_pass} XP`, color: '#f59e0b' },
                                    { icon: 'ac_unit', label: '스트릭 아이스 x3', color: '#0ea5e9' },
                                    { icon: 'lightbulb', label: '힌트 x5', color: '#8b5cf6' },
                                ];
                                if (reward?.title) {
                                    items.push({ icon: 'badge', label: `"${reward.title}" 칭호`, color: '#ec4899' });
                                }
                                if (reward?.themeUnlock) {
                                    items.push({ icon: 'palette', label: '테마 해금', color: '#22c55e' });
                                }
                                return items.map((item, i) => (
                                    <div key={i} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '8px 14px',
                                        borderRadius: 10,
                                        background: `${item.color}10`,
                                        border: `1px solid ${item.color}30`,
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 16, color: item.color }}>
                                            {item.icon}
                                        </span>
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{item.label}</span>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>

                    {/* 시작 버튼 */}
                    <div style={{ textAlign: 'center' }}>
                        {cooldown > 0 ? (
                            <div style={{
                                padding: '14px 28px',
                                background: '#f1f5f9',
                                borderRadius: 14,
                                color: '#64748b',
                                fontSize: 14,
                                fontWeight: 600,
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 6 }}>
                                    hourglass_top
                                </span>
                                재도전까지 {Math.ceil(cooldown / 1000)}초 남음
                            </div>
                        ) : !allMet ? (
                            <div style={{
                                padding: '14px 28px',
                                background: '#fef2f2',
                                borderRadius: 14,
                                color: '#dc2626',
                                fontSize: 14,
                                fontWeight: 600,
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 18, verticalAlign: 'middle', marginRight: 6 }}>
                                    lock
                                </span>
                                모든 조건을 충족해야 시험에 응시할 수 있습니다
                            </div>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={startExam}
                                style={{
                                    padding: '16px 40px',
                                    background: `linear-gradient(135deg, ${nextTierInfo!.color}, ${nextTierInfo!.color}cc)`,
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 14,
                                    fontSize: 17,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif",
                                    boxShadow: `0 4px 20px ${nextTierInfo!.color}40`,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                                    swords
                                </span>
                                승급전 시작
                            </motion.button>
                        )}

                        <button
                            onClick={() => router.push('/dashboard')}
                            style={{
                                display: 'block',
                                margin: '16px auto 0',
                                padding: '10px 20px',
                                background: 'none',
                                border: 'none',
                                color: '#64748b',
                                fontSize: 13,
                                cursor: 'pointer',
                                fontFamily: "'Plus Jakarta Sans', sans-serif",
                            }}
                        >
                            대시보드로 돌아가기
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // ═══════════════════════════════════════
    //  Exam Screen
    // ═══════════════════════════════════════

    if (stage === 'exam' && questions.length > 0) {
        const q = questions[currentQ];
        const progressPct = ((currentQ) / questions.length) * 100;
        const isAnswered = selectedOption !== null;

        return (
            <div style={{ maxWidth: 640, margin: '40px auto', padding: '0 20px' }}>
                {/* 상단 바 */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: 24 }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                            {currentQ + 1} / {questions.length}
                        </span>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 14px',
                            borderRadius: 10,
                            background: timeLeft <= 10 ? '#fef2f2' : '#f0f9ff',
                            border: `1px solid ${timeLeft <= 10 ? '#fecaca' : '#bae6fd'}`,
                        }}>
                            <span className="material-symbols-outlined" style={{
                                fontSize: 18,
                                color: timeLeft <= 10 ? '#ef4444' : '#0ea5e9',
                                animation: timeLeft <= 10 ? 'pulse 1s infinite' : 'none',
                            }}>
                                timer
                            </span>
                            <span style={{
                                fontSize: 16,
                                fontWeight: 700,
                                color: timeLeft <= 10 ? '#ef4444' : '#0ea5e9',
                                fontFamily: "'Space Grotesk', monospace",
                                minWidth: 24,
                                textAlign: 'center',
                            }}>
                                {timeLeft}
                            </span>
                        </div>
                    </div>

                    {/* 프로그레스 바 */}
                    <div style={{
                        width: '100%',
                        height: 6,
                        background: '#e2e8f0',
                        borderRadius: 3,
                        overflow: 'hidden',
                    }}>
                        <motion.div
                            initial={{ width: `${progressPct}%` }}
                            animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
                            transition={{ duration: 0.3 }}
                            style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, #0ea5e9, #3b82f6)',
                                borderRadius: 3,
                            }}
                        />
                    </div>
                </motion.div>

                {/* 문제 카드 */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQ}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            background: '#fff',
                            borderRadius: 20,
                            border: '1px solid #e2e8f0',
                            padding: '32px 28px',
                            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                        }}
                    >
                        {/* 난이도 태그 */}
                        <div style={{ marginBottom: 16 }}>
                            <span style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                background: q.difficulty === 'easy' ? '#dcfce7' : q.difficulty === 'medium' ? '#fef3c7' : '#fee2e2',
                                color: q.difficulty === 'easy' ? '#16a34a' : q.difficulty === 'medium' ? '#ca8a04' : '#dc2626',
                            }}>
                                {q.difficulty === 'easy' ? '기초' : q.difficulty === 'medium' ? '중급' : '고급'}
                            </span>
                        </div>

                        {/* 질문 */}
                        <h2 style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: 18,
                            fontWeight: 700,
                            color: '#1e293b',
                            lineHeight: 1.6,
                            margin: '0 0 24px',
                        }}>
                            {q.question}
                        </h2>

                        {/* 선택지 */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {q.options.map((opt, i) => {
                                const isCorrect = i === q.correct;
                                const isSelected = selectedOption === i;
                                let bg = '#f8fafc';
                                let borderColor = '#e2e8f0';
                                let textColor = '#334155';

                                if (isAnswered) {
                                    if (isSelected && isCorrect) {
                                        bg = '#f0fdf4';
                                        borderColor = '#22c55e';
                                        textColor = '#166534';
                                    } else if (isSelected && !isCorrect) {
                                        bg = '#fef2f2';
                                        borderColor = '#ef4444';
                                        textColor = '#991b1b';
                                    } else if (isCorrect) {
                                        bg = '#f0fdf4';
                                        borderColor = '#22c55e80';
                                    }
                                }

                                return (
                                    <motion.button
                                        key={i}
                                        whileHover={!isAnswered ? { scale: 1.01 } : {}}
                                        whileTap={!isAnswered ? { scale: 0.99 } : {}}
                                        onClick={() => !isAnswered && handleAnswer(i)}
                                        disabled={isAnswered}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: '14px 18px',
                                            background: bg,
                                            border: `2px solid ${borderColor}`,
                                            borderRadius: 14,
                                            cursor: isAnswered ? 'default' : 'pointer',
                                            textAlign: 'left',
                                            fontSize: 15,
                                            fontWeight: 500,
                                            color: textColor,
                                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <span style={{
                                            width: 28,
                                            height: 28,
                                            borderRadius: 8,
                                            background: isAnswered && isSelected
                                                ? (isCorrect ? '#22c55e' : '#ef4444')
                                                : '#e2e8f0',
                                            color: isAnswered && isSelected ? '#fff' : '#64748b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 13,
                                            fontWeight: 700,
                                            flexShrink: 0,
                                        }}>
                                            {isAnswered && isSelected
                                                ? (isCorrect ? '✓' : '✗')
                                                : String.fromCharCode(65 + i)}
                                        </span>
                                        <span style={{ lineHeight: 1.4 }}>{opt}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* 타이머 pulse 애니메이션 */}
                <style>{`
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                `}</style>
            </div>
        );
    }

    // ═══════════════════════════════════════
    //  Result Screen
    // ═══════════════════════════════════════

    if (stage === 'result') {
        const total = questions.length;
        const pct = total > 0 ? Math.round((score / total) * 100) : 0;
        const required = requirements?.passPercent ?? 70;
        const reward = nextTier ? getTierReward(nextTier) : null;

        return (
            <div style={{ maxWidth: 600, margin: '40px auto', padding: '0 20px' }}>
                {showConfetti && <ConfettiEffect />}

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, type: 'spring' }}
                    style={{
                        background: '#fff',
                        borderRadius: 24,
                        border: `2px solid ${passed ? '#22c55e' : '#e2e8f0'}`,
                        padding: '48px 32px',
                        textAlign: 'center',
                        boxShadow: passed
                            ? '0 8px 40px rgba(34,197,94,0.15)'
                            : '0 4px 24px rgba(0,0,0,0.06)',
                    }}
                >
                    {passed ? (
                        <>
                            {/* 성공 */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            >
                                <TierBadge tier={nextTier!} size={96} />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <h2 style={{
                                    fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif",
                                    fontSize: 28,
                                    fontWeight: 800,
                                    background: nextTierInfo?.gradient || 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    margin: '20px 0 4px',
                                }}>
                                    승급 성공!
                                </h2>
                                <p style={{ color: '#64748b', fontSize: 15, margin: '0 0 8px' }}>
                                    {nextTierInfo!.nameKo} 티어로 승급했습니다
                                </p>
                            </motion.div>

                            {/* 점수 */}
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'baseline',
                                gap: 4,
                                padding: '10px 24px',
                                borderRadius: 12,
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                margin: '16px 0 24px',
                            }}>
                                <span style={{ fontSize: 32, fontWeight: 800, color: '#16a34a', fontFamily: "'Space Grotesk', monospace" }}>
                                    {score}
                                </span>
                                <span style={{ fontSize: 16, color: '#22c55e', fontWeight: 600 }}>
                                    / {total} ({pct}%)
                                </span>
                            </div>

                            {/* 보상 목록 */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                style={{
                                    background: '#fffbeb',
                                    border: '1px solid #fde68a',
                                    borderRadius: 16,
                                    padding: '20px',
                                    margin: '0 0 28px',
                                }}
                            >
                                <h4 style={{
                                    fontSize: 14,
                                    fontWeight: 700,
                                    color: '#92400e',
                                    margin: '0 0 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                                        card_giftcard
                                    </span>
                                    획득 보상
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                                    <span style={{ padding: '6px 12px', borderRadius: 8, background: '#fef3c7', fontSize: 13, fontWeight: 600, color: '#92400e' }}>
                                        +{reward?.xpBonus ?? XP_REWARDS.promotion_pass} XP
                                    </span>
                                    <span style={{ padding: '6px 12px', borderRadius: 8, background: '#e0f2fe', fontSize: 13, fontWeight: 600, color: '#0369a1' }}>
                                        스트릭 아이스 x3
                                    </span>
                                    <span style={{ padding: '6px 12px', borderRadius: 8, background: '#ede9fe', fontSize: 13, fontWeight: 600, color: '#6d28d9' }}>
                                        힌트 x5
                                    </span>
                                    {reward?.title && (
                                        <span style={{ padding: '6px 12px', borderRadius: 8, background: '#fce7f3', fontSize: 13, fontWeight: 600, color: '#be185d' }}>
                                            &quot;{reward.title}&quot; 칭호
                                        </span>
                                    )}
                                    {reward?.themeUnlock && (
                                        <span style={{ padding: '6px 12px', borderRadius: 8, background: '#dcfce7', fontSize: 13, fontWeight: 600, color: '#166534' }}>
                                            테마 해금
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    ) : (
                        <>
                            {/* 실패 */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring' }}
                                style={{
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    background: '#fef2f2',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 20px',
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 40, color: '#ef4444' }}>
                                    sentiment_dissatisfied
                                </span>
                            </motion.div>

                            <h2 style={{
                                fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif",
                                fontSize: 24,
                                fontWeight: 700,
                                color: '#1e293b',
                                margin: '0 0 6px',
                            }}>
                                아쉽지만 다음 기회에!
                            </h2>
                            <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px', lineHeight: 1.6 }}>
                                포기하지 마세요! 조금 더 공부하고 다시 도전하면 반드시 합격할 수 있어요.
                            </p>

                            {/* 점수 */}
                            <div style={{
                                display: 'inline-flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '16px 32px',
                                borderRadius: 14,
                                background: '#fef2f2',
                                border: '1px solid #fecaca',
                                margin: '0 0 8px',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                    <span style={{ fontSize: 32, fontWeight: 800, color: '#ef4444', fontFamily: "'Space Grotesk', monospace" }}>
                                        {score}
                                    </span>
                                    <span style={{ fontSize: 16, color: '#f87171', fontWeight: 600 }}>
                                        / {total} ({pct}%)
                                    </span>
                                </div>
                                <span style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                                    합격 기준: {required}%
                                </span>
                            </div>
                        </>
                    )}

                    {/* 버튼 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginTop: 28 }}>
                        {passed ? (
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => router.push('/dashboard')}
                                style={{
                                    padding: '14px 36px',
                                    background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 14,
                                    fontSize: 16,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif",
                                    boxShadow: '0 4px 20px rgba(14,165,233,0.3)',
                                }}
                            >
                                대시보드로 돌아가기
                            </motion.button>
                        ) : (
                            <>
                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => {
                                        setStage('requirements');
                                        setSelectedOption(null);
                                    }}
                                    style={{
                                        padding: '14px 36px',
                                        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: 14,
                                        fontSize: 16,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        fontFamily: "'Space Grotesk', 'Plus Jakarta Sans', sans-serif",
                                        boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
                                    }}
                                >
                                    다시 도전하기
                                </motion.button>
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    style={{
                                        padding: '10px 20px',
                                        background: 'none',
                                        border: 'none',
                                        color: '#64748b',
                                        fontSize: 13,
                                        cursor: 'pointer',
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                    }}
                                >
                                    대시보드로 돌아가기
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        );
    }

    // Fallback
    return null;
}
