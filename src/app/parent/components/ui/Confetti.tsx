"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    rotation: number;
    rotationSpeed: number;
    opacity: number;
    decay: number;
}

const COLORS = ["#2563eb", "#7c3aed", "#f59e0b", "#22c55e", "#ef4444", "#ec4899", "#06b6d4"];

export default function Confetti({ trigger, duration = 3000 }: { trigger: boolean; duration?: number }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const rafRef = useRef<number>(0);

    const createParticles = useCallback(() => {
        const particles: Particle[] = [];
        for (let i = 0; i < 60; i++) {
            particles.push({
                x: Math.random() * (canvasRef.current?.width || 400),
                y: -10 - Math.random() * 40,
                vx: (Math.random() - 0.5) * 6,
                vy: Math.random() * 3 + 2,
                size: Math.random() * 6 + 3,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 8,
                opacity: 1,
                decay: 0.003 + Math.random() * 0.005,
            });
        }
        return particles;
    }, []);

    useEffect(() => {
        if (!trigger) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        ctx.scale(2, 2);

        particlesRef.current = createParticles();

        function animate() {
            if (!ctx || !canvas) return;
            ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

            particlesRef.current = particlesRef.current.filter(p => p.opacity > 0.01);

            for (const p of particlesRef.current) {
                p.x += p.vx;
                p.vy += 0.08;
                p.y += p.vy;
                p.rotation += p.rotationSpeed;
                p.opacity -= p.decay;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate((p.rotation * Math.PI) / 180);
                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            }

            if (particlesRef.current.length > 0) {
                rafRef.current = requestAnimationFrame(animate);
            }
        }

        rafRef.current = requestAnimationFrame(animate);

        const timeout = setTimeout(() => {
            cancelAnimationFrame(rafRef.current);
        }, duration);

        return () => {
            cancelAnimationFrame(rafRef.current);
            clearTimeout(timeout);
        };
    }, [trigger, duration, createParticles]);

    if (!trigger) return null;

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 9999,
            }}
        />
    );
}
