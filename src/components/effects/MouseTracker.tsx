"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";

interface MouseContextType {
    x: number;
    y: number;
    progressX: number;
    progressY: number;
    angle: number;
    diffX: number;
    diffY: number;
}

const MouseContext = createContext<MouseContextType>({
    x: 0, y: 0, progressX: 0.5, progressY: 0.5,
    angle: 0, diffX: 0, diffY: 0,
});

export function useMousePosition() {
    return useContext(MouseContext);
}

export default function MouseTracker({ children }: { children: ReactNode }) {
    const [mouse, setMouse] = useState<MouseContextType>({
        x: 0, y: 0, progressX: 0.5, progressY: 0.5,
        angle: 0, diffX: 0, diffY: 0,
    });
    const prevRef = useRef({ x: 0, y: 0 });
    const rafRef = useRef<number>(0);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;

        const handleMouseMove = (e: MouseEvent) => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => {
                if (!mountedRef.current) return;
                const { clientX, clientY } = e;
                const { innerWidth, innerHeight } = window;
                const px = clientX / innerWidth;
                const py = clientY / innerHeight;
                const dx = clientX - prevRef.current.x;
                const dy = clientY - prevRef.current.y;
                const angle = Math.atan2(clientY - innerHeight / 2, clientX - innerWidth / 2) * (180 / Math.PI);
                prevRef.current = { x: clientX, y: clientY };
                setMouse({
                    x: clientX,
                    y: clientY,
                    progressX: px,
                    progressY: py,
                    angle,
                    diffX: dx,
                    diffY: dy,
                });
            });
        };

        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        return () => {
            mountedRef.current = false;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, []);

    return (
        <MouseContext.Provider value={mouse}>
            <div
                style={{
                    // @ts-expect-error CSS custom properties
                    "--mouse-x": mouse.x,
                    "--mouse-y": mouse.y,
                    "--mouse-progress-x": mouse.progressX,
                    "--mouse-progress-y": mouse.progressY,
                    "--mouse-angle": mouse.angle,
                    "--abs-diff-x": Math.abs(mouse.diffX),
                    "--abs-diff-y": Math.abs(mouse.diffY),
                    "--diff-x": mouse.diffX,
                    "--diff-y": mouse.diffY,
                }}
            >
                {children}
            </div>
        </MouseContext.Provider>
    );
}

