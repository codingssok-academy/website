"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * FloatingParticles — R3F 기반 3D 파티클 시스템
 */
function FloatingParticles({ count = 200, color = "#0ea5e9" }: { count?: number; color?: string }) {
    const meshRef = useRef<THREE.Points>(null!);

    const [positions, sizes] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const siz = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 10;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
            siz[i] = Math.random() * 3 + 1;
        }
        return [pos, siz];
    }, [count]);

    useFrame((state) => {
        if (!meshRef.current) return;
        meshRef.current.rotation.y = state.clock.elapsedTime * 0.03;
        meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.02) * 0.1;

        const posAttr = meshRef.current.geometry.attributes.position;
        for (let i = 0; i < count; i++) {
            const y = posAttr.getY(i);
            posAttr.setY(i, y + Math.sin(state.clock.elapsedTime + i) * 0.001);
        }
        posAttr.needsUpdate = true;
    });

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} args={[positions, 3]} />
                <bufferAttribute attach="attributes-size" count={count} array={sizes} itemSize={1} args={[sizes, 1]} />
            </bufferGeometry>
            <pointsMaterial
                size={0.03}
                color={color}
                transparent
                opacity={0.6}
                sizeAttenuation
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}

/**
 * ThreeBG — 3D 배경 래퍼
 */
export function ThreeBG({
    particleCount = 200,
    color = "#0ea5e9",
    style,
}: {
    particleCount?: number;
    color?: string;
    style?: React.CSSProperties;
}) {
    return (
        <div style={{
            position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none",
            ...style,
        }}>
            <Canvas
                camera={{ position: [0, 0, 5], fov: 60 }}
                gl={{ antialias: false, alpha: true }}
                dpr={[1, 1.5]}
                style={{ background: "transparent" }}
            >
                <FloatingParticles count={particleCount} color={color} />
                <ambientLight intensity={0.5} />
            </Canvas>
        </div>
    );
}
