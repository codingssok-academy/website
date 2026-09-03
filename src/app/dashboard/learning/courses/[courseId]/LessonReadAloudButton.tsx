"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./LessonReadAloudButton.module.css";

type SpeechSupport = "checking" | "available" | "unavailable";

const SPEECH_IGNORED_ELEMENTS = [
    "pre",
    "code",
    "script",
    "style",
    "noscript",
    "iframe",
    "svg",
    "img",
    "button",
    "input",
    "textarea",
    "select",
    "[hidden]",
    "[aria-hidden='true']",
    ".material-symbols-outlined",
].join(",");

const SPEECH_BLOCK_ELEMENTS = "h1,h2,h3,h4,h5,h6,p,li,dt,dd,figcaption";

export function extractReadableLessonText(html: string) {
    if (typeof DOMParser === "undefined") return "";

    const parsed = new DOMParser().parseFromString(html, "text/html");
    parsed.body.querySelectorAll(SPEECH_IGNORED_ELEMENTS).forEach((element) => element.remove());
    parsed.body.querySelectorAll(SPEECH_BLOCK_ELEMENTS).forEach((element) => {
        element.append(parsed.createTextNode(". "));
    });

    return (parsed.body.textContent ?? "")
        .replace(/\s+/g, " ")
        .replace(/\s+([,.!?。！？])/g, "$1")
        .replace(/([,.!?。！？]){2,}/g, "$1")
        .trim();
}

export function splitLessonSpeech(text: string, maxLength = 180) {
    const sentences = text.match(/[^.!?。！？]+[.!?。！？]?/g) ?? [];
    const chunks: string[] = [];
    let current = "";

    const pushCurrent = () => {
        if (current.trim()) chunks.push(current.trim());
        current = "";
    };

    sentences.forEach((sentence) => {
        const cleanSentence = sentence.trim();
        if (!cleanSentence) return;

        if (cleanSentence.length > maxLength) {
            pushCurrent();
            const words = cleanSentence.split(/\s+/);
            let longChunk = "";
            words.forEach((word) => {
                const candidate = longChunk ? `${longChunk} ${word}` : word;
                if (candidate.length > maxLength && longChunk) {
                    chunks.push(longChunk);
                    longChunk = word;
                } else {
                    longChunk = candidate;
                }
            });
            if (longChunk) chunks.push(longChunk);
            return;
        }

        const candidate = current ? `${current} ${cleanSentence}` : cleanSentence;
        if (candidate.length > maxLength) pushCurrent();
        current = current ? `${current} ${cleanSentence}` : cleanSentence;
    });

    pushCurrent();
    return chunks;
}

export default function LessonReadAloudButton({
    title,
    html,
}: {
    title: string;
    html: string;
}) {
    const [support, setSupport] = useState<SpeechSupport>("checking");
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [feedback, setFeedback] = useState("");
    const playbackIdRef = useRef(0);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    const cancelOwnedSpeech = () => {
        playbackIdRef.current += 1;
        if (utteranceRef.current && typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        utteranceRef.current = null;
    };

    useEffect(() => {
        const timer = window.setTimeout(() => {
            const available = "speechSynthesis" in window
                && typeof window.SpeechSynthesisUtterance === "function";
            setSupport(available ? "available" : "unavailable");
        }, 0);
        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => () => {
        playbackIdRef.current += 1;
        if (utteranceRef.current && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }
        utteranceRef.current = null;
    }, []);

    const stopSpeech = () => {
        cancelOwnedSpeech();
        setIsSpeaking(false);
        setFeedback("설명 듣기를 멈췄어요.");
    };

    const startSpeech = () => {
        if (support !== "available") return;

        const readableText = extractReadableLessonText(html);
        const speechText = readableText.startsWith(title) ? readableText : `${title}. ${readableText}`;
        const chunks = splitLessonSpeech(speechText);
        if (chunks.length === 0) {
            setFeedback("읽어 줄 설명이 없어요.");
            return;
        }

        cancelOwnedSpeech();
        const playbackId = playbackIdRef.current;
        setIsSpeaking(true);
        setFeedback("설명을 읽고 있어요.");

        const speakChunk = (index: number) => {
            if (playbackIdRef.current !== playbackId) return;
            if (index >= chunks.length) {
                utteranceRef.current = null;
                setIsSpeaking(false);
                setFeedback("설명을 모두 들었어요.");
                return;
            }

            const utterance = new window.SpeechSynthesisUtterance(chunks[index]);
            utterance.lang = "ko-KR";
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.onend = () => speakChunk(index + 1);
            utterance.onerror = (event) => {
                if (playbackIdRef.current !== playbackId || event.error === "canceled") return;
                utteranceRef.current = null;
                setIsSpeaking(false);
                setFeedback("음성을 재생하지 못했어요. 다시 눌러 주세요.");
            };
            utteranceRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        };

        speakChunk(0);
    };

    const unavailable = support === "unavailable";

    return (
        <section className={styles.panel} aria-label="수업 설명 듣기">
            <span className={styles.icon} aria-hidden="true">🔊</span>
            <div className={styles.copy}>
                <strong>글이 길면 소리로 들어요</strong>
                <span>{unavailable ? "이 기기에서는 음성 듣기를 사용할 수 없어요." : "수업 설명만 읽고, 코드는 읽지 않아요."}</span>
            </div>
            <button
                type="button"
                className={isSpeaking ? styles.stopButton : styles.playButton}
                onClick={isSpeaking ? stopSpeech : startSpeech}
                disabled={support !== "available"}
                aria-pressed={isSpeaking}
            >
                <span aria-hidden="true">{isSpeaking ? "■" : "▶"}</span>
                {isSpeaking ? "듣기 중지" : "설명 듣기"}
            </button>
            <span className={styles.status} role="status" aria-live="polite">{feedback}</span>
        </section>
    );
}
