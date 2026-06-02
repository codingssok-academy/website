"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * ParticleBG — Canvas 기반 인터랙티브 파티클 배경
 * 마우스에 반응하는 연결선 + 부유 파티클 (외부 라이브러리 불필요)
 */
export function ParticleBG({
    particleCount = 60,
    color = "59, 130, 246",
    maxDistance = 120,
    speed = 0.3,
    mouseRadius = 150,
}: {
    particleCount?: number;
    color?: string;
    maxDistance?: number;
    speed?: number;
    mouseRadius?: number;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: -1000, y: -1000 });
    const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number; opacity: number }>>([]);
    const rafRef = useRef<number>(0);

    const init = useCallback((canvas: HTMLCanvasElement) => {
        const particles: typeof particlesRef.current = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * speed,
                vy: (Math.random() - 0.5) * speed,
                size: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.2,
            });
        }
        particlesRef.current = particles;
    }, [particleCount, speed]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };

        resize();
        init(canvas);

        const handleMouse = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };

        const handleMouseLeave = () => { mouseRef.current = { x: -1000, y: -1000 }; };

        canvas.addEventListener("mousemove", handleMouse);
        canvas.addEventListener("mouseleave", handleMouseLeave);
        window.addEventListener("resize", resize);

        const w = () => canvas.offsetWidth;
        const h = () => canvas.offsetHeight;

        const animate = () => {
            ctx.clearRect(0, 0, w(), h());
            const particles = particlesRef.current;
            const mouse = mouseRef.current;

            for (const p of particles) {
                // Move
                p.x += p.vx;
                p.y += p.vy;

                // Bounce
                if (p.x < 0 || p.x > w()) p.vx *= -1;
                if (p.y < 0 || p.y > h()) p.vy *= -1;

                // Mouse repulsion
                const dx = p.x - mouse.x;
                const dy = p.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouseRadius) {
                    const force = (mouseRadius - dist) / mouseRadius;
                    p.vx += (dx / dist) * force * 0.3;
                    p.vy += (dy / dist) * force * 0.3;
                }

                // Dampening
                p.vx *= 0.99;
                p.vy *= 0.99;

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${color}, ${p.opacity})`;
                ctx.fill();
            }

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < maxDistance) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(${color}, ${0.15 * (1 - dist / maxDistance)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }

            rafRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(rafRef.current);
            canvas.removeEventListener("mousemove", handleMouse);
            canvas.removeEventListener("mouseleave", handleMouseLeave);
            window.removeEventListener("resize", resize);
        };
    }, [color, maxDistance, speed, mouseRadius, init]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "auto",
                zIndex: 0,
            }}
        />
    );
}
