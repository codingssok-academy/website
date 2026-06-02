"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { PerformanceTier } from "./AdaptiveEnvironment";

/* ── tier별 파티클 수 ── */
const PARTICLE_COUNT_BY_TIER: Record<PerformanceTier, number> = {
    low: 500,
    medium: 1500,
    high: 3000,
};

interface GpuParticlesProps {
    progress?: number;
    tier?: PerformanceTier;
}

export default function GpuParticles({ progress = 0, tier = "medium" }: GpuParticlesProps) {
    const particleCount = PARTICLE_COUNT_BY_TIER[tier];

    const meshRef = useRef<THREE.InstancedMesh>(null!);
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // particleCount가 바뀌면 재생성
    const particles = useMemo(() => {
        const arr = [];
        for (let i = 0; i < particleCount; i++) {
            arr.push({
                x: (Math.random() - 0.5) * 40,
                y: (Math.random() - 0.5) * 25,
                z: (Math.random() - 0.5) * 40,
                speedY: Math.random() * 0.003 + 0.001,
                scale: Math.random() * 0.04 + 0.01,
                // 파티클별 sin/cos 오프셋 — 매 프레임 계산 최소화용 캐시값
                sinFreqX: 0.3,
                cosFreqZ: 0.2,
                phase: Math.random() * Math.PI * 2,
                pulseFreq: 2,
            });
        }
        return arr;
    }, [particleCount]);

    // Color based on progress — useMemo로 재계산 방지
    const baseColor = useMemo(() => {
        if (progress >= 80) return new THREE.Color("#3b82f6");
        if (progress >= 40) return new THREE.Color("#60a5fa");
        return new THREE.Color("#93c5fd");
    }, [progress]);

    // low tier — 프레임 스킵용 카운터
    const frameSkipRef = useRef(0);

    useFrame((state) => {
        if (!meshRef.current) return;

        // low tier: 2프레임에 1번만 업데이트
        if (tier === "low") {
            frameSkipRef.current++;
            if (frameSkipRef.current % 2 !== 0) return;
        }

        const t = state.clock.elapsedTime;

        for (let i = 0; i < particleCount; i++) {
            const p = particles[i];
            const x = p.x + Math.sin(t * p.sinFreqX + p.phase) * 0.5;
            const y = ((p.y + t * p.speedY * 20) % 25) - 12.5;
            const z = p.z + Math.cos(t * p.cosFreqZ + p.phase) * 0.5;
            const pulsedScale = p.scale * (1 + Math.sin(t * p.pulseFreq + p.phase) * 0.3);

            dummy.position.set(x, y, z);
            dummy.scale.setScalar(pulsedScale);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix);
        }
        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshBasicMaterial color={baseColor} transparent opacity={0.4} />
        </instancedMesh>
    );
}
