"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/**
 * GenerativeAudio — Tone.js 기반 생성형 오디오
 * 
 * - 앰비언트 배경음: 시간대별 톤 변화 (아침=밝음, 밤=잔잔)
 * - 코스 호버 사운드: 코스 색상 → 주파수 매핑
 * - 달성 효과음: 코스 완료 시 팡파레
 * - 클릭 피드백: 부드러운 UI 사운드
 */

type ToneModule = typeof import("tone");

interface GenerativeAudioProps {
    /** 뮤트 상태 */
    muted?: boolean;
    /** 현재 시간 (0-23) */
    hour?: number;
    /** 전체 진행률 (0-100) */
    progress?: number;
}

// Note frequencies per course color
const COLOR_FREQ_MAP: Record<string, number> = {
    "#10b981": 523.25, // C5 — green
    "#f59e0b": 587.33, // D5 — amber
    "#3b82f6": 659.25, // E5 — blue
    "#ef4444": 698.46, // F5 — red
    "#ec4899": 783.99, // G5 — pink
    "#f97316": 880.00, // A5 — orange
    "#2563eb": 987.77, // B5 — purple
};

function getFreqForColor(color: string): number {
    // Try exact match first
    if (COLOR_FREQ_MAP[color]) return COLOR_FREQ_MAP[color];
    // Fallback: hash color to freq range C4-C6
    let hash = 0;
    for (let i = 0; i < color.length; i++) hash = color.charCodeAt(i) + ((hash << 5) - hash);
    return 261.63 + (Math.abs(hash) % 500);
}

export default function GenerativeAudio({ muted = false, hour = 12, progress = 0 }: GenerativeAudioProps) {
    const toneRef = useRef<ToneModule | null>(null);
    const synthRef = useRef<any>(null);
    const ambienceRef = useRef<any>(null);
    const reverbRef = useRef<any>(null);
    const startedRef = useRef(false);
    const [loaded, setLoaded] = useState(false);

    // Lazy load Tone.js (heavy module)
    useEffect(() => {
        let cancelled = false;
        import("tone").then((mod) => {
            if (cancelled) return;
            toneRef.current = mod;
            setLoaded(true);
        }).catch(() => {});
        return () => { cancelled = true; };
    }, []);

    // Initialize audio context on first user interaction
    const initAudio = useCallback(async () => {
        if (startedRef.current || !toneRef.current || muted) return;
        const Tone = toneRef.current;

        try {
            await Tone.start();
            startedRef.current = true;

            // Reverb for spacious feel
            const reverb = new Tone.Reverb({ decay: 4, wet: 0.5 }).toDestination();
            reverbRef.current = reverb;

            // Main synth for hover/click sounds
            const synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "sine" },
                envelope: { attack: 0.05, decay: 0.3, sustain: 0.1, release: 1.2 },
                volume: -18,
            }).connect(reverb);
            synthRef.current = synth;

            // Ambient drone — very subtle
            const isNight = hour < 6 || hour >= 20;
            const ambienceFreq = isNight ? 110 : 146.83; // A2 night, D3 day
            const ambience = new Tone.Synth({
                oscillator: { type: "sine" },
                envelope: { attack: 2, decay: 0, sustain: 1, release: 3 },
                volume: -30,
            }).connect(reverb);
            ambience.triggerAttack(ambienceFreq);
            ambienceRef.current = ambience;
        } catch (e) {
            console.warn("Audio init failed:", e);
        }
    }, [muted, hour]);

    // Register user interaction listener to start audio
    useEffect(() => {
        if (!loaded) return;
        const handler = () => { initAudio(); };
        document.addEventListener("click", handler, { once: true });
        document.addEventListener("keydown", handler, { once: true });
        return () => {
            document.removeEventListener("click", handler);
            document.removeEventListener("keydown", handler);
        };
    }, [loaded, initAudio]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            try {
                synthRef.current?.dispose();
                ambienceRef.current?.dispose();
                reverbRef.current?.dispose();
            } catch {}
        };
    }, []);

    // Mute/unmute
    useEffect(() => {
        if (!toneRef.current) return;
        const dest = toneRef.current.getDestination();
        if (dest) dest.mute = muted;
    }, [muted]);

    return null; // Audio-only component, no UI
}

/**
 * 호버 사운드 재생을 위한 hook
 * 
 * Usage:
 *   const playHover = useHoverSound();
 *   <div onMouseEnter={() => playHover("#3b82f6")} />
 */
export function useHoverSound() {
    const synthRef = useRef<any>(null);
    const toneRef = useRef<ToneModule | null>(null);
    const initRef = useRef(false);

    const init = useCallback(async () => {
        if (initRef.current) return;
        try {
            const Tone = await import("tone");
            toneRef.current = Tone;
            await Tone.start();
            synthRef.current = new Tone.Synth({
                oscillator: { type: "triangle" },
                envelope: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.3 },
                volume: -22,
            }).toDestination();
            initRef.current = true;
        } catch {}
    }, []);

    useEffect(() => {
        const h = () => init();
        document.addEventListener("pointerdown", h, { once: true });
        return () => document.removeEventListener("pointerdown", h);
    }, [init]);

    return useCallback((color: string) => {
        if (!synthRef.current) return;
        const freq = getFreqForColor(color);
        try { synthRef.current.triggerAttackRelease(freq, "16n"); } catch {}
    }, []);
}

/**
 * 달성 효과음
 */
export function useAchievementSound() {
    const synthRef = useRef<any>(null);
    const initRef = useRef(false);

    const init = useCallback(async () => {
        if (initRef.current) return;
        try {
            const Tone = await import("tone");
            await Tone.start();
            const reverb = new Tone.Reverb({ decay: 2, wet: 0.4 }).toDestination();
            synthRef.current = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: "sine" },
                envelope: { attack: 0.02, decay: 0.4, sustain: 0.2, release: 1 },
                volume: -14,
            }).connect(reverb);
            initRef.current = true;
        } catch {}
    }, []);

    useEffect(() => {
        const h = () => init();
        document.addEventListener("pointerdown", h, { once: true });
        return () => document.removeEventListener("pointerdown", h);
    }, [init]);

    return useCallback(() => {
        if (!synthRef.current) return;
        try {
            const now = synthRef.current.now?.() ?? 0;
            synthRef.current.triggerAttackRelease("C5", "8n", now);
            synthRef.current.triggerAttackRelease("E5", "8n", now + 0.1);
            synthRef.current.triggerAttackRelease("G5", "8n", now + 0.2);
            synthRef.current.triggerAttackRelease("C6", "4n", now + 0.3);
        } catch {}
    }, []);
}

/**
 * 클릭 사운드
 */
export function useClickSound() {
    const synthRef = useRef<any>(null);
    const initRef = useRef(false);

    const init = useCallback(async () => {
        if (initRef.current) return;
        try {
            const Tone = await import("tone");
            await Tone.start();
            synthRef.current = new Tone.Synth({
                oscillator: { type: "sine" },
                envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.1 },
                volume: -20,
            }).toDestination();
            initRef.current = true;
        } catch {}
    }, []);

    useEffect(() => {
        const h = () => init();
        document.addEventListener("pointerdown", h, { once: true });
        return () => document.removeEventListener("pointerdown", h);
    }, [init]);

    return useCallback(() => {
        if (!synthRef.current) return;
        try { synthRef.current.triggerAttackRelease(1200, "32n"); } catch {}
    }, []);
}
