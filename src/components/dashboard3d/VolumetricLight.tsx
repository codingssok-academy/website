"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ── Volumetric Light Rays ── */
interface VolumetricLightProps {
    position: [number, number, number];
    color: string;
    intensity?: number;
}

export default function VolumetricLight({ position, color, intensity = 1 }: VolumetricLightProps) {
    const coneRef = useRef<THREE.Mesh>(null!);
    const baseColor = new THREE.Color(color);

    useFrame((state) => {
        if (!coneRef.current) return;
        const t = state.clock.elapsedTime;
        // Pulse opacity
        (coneRef.current.material as THREE.MeshBasicMaterial).opacity =
            0.03 * intensity + Math.sin(t * 1.5) * 0.01;
        // Slight rotation
        coneRef.current.rotation.y = t * 0.1;
    });

    return (
        <group position={position}>
            {/* Light cone going upward */}
            <mesh ref={coneRef} rotation={[Math.PI, 0, 0]}>
                <coneGeometry args={[3, 12, 32, 1, true]} />
                <meshBasicMaterial
                    color={baseColor}
                    transparent
                    opacity={0.04}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Core point light */}
            <pointLight color={color} intensity={intensity * 2} distance={8} decay={2} />

            {/* Ground glow disc */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
                <circleGeometry args={[2, 32]} />
                <meshBasicMaterial
                    color={baseColor}
                    transparent
                    opacity={0.06 * intensity}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}
