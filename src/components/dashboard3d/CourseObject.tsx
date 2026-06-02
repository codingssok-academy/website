"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import * as THREE from "three";

/* ── Course 3D Object ── */
interface CourseObjectProps {
    position: [number, number, number];
    title: string;
    icon: string;
    color: string;
    progress: number; // 0-100
    index: number;
    isHovered: boolean;
    isSelected: boolean;
    onPointerOver: () => void;
    onPointerOut: () => void;
    onClick: () => void;
}

/* ── Progress-based material properties ── */
function getProgressMaterial(progress: number) {
    if (progress >= 100) return { roughness: 0.05, metalness: 0.9, emissiveIntensity: 0.8, transmission: 0.3 };
    if (progress >= 50) return { roughness: 0.15, metalness: 0.6, emissiveIntensity: 0.4, transmission: 0.5 };
    if (progress > 0) return { roughness: 0.3, metalness: 0.3, emissiveIntensity: 0.15, transmission: 0.2 };
    return { roughness: 0.5, metalness: 0.1, emissiveIntensity: 0.05, transmission: 0.1 };
}

export default function CourseObject({
    position, title, icon, color, progress, index,
    isHovered, isSelected, onPointerOver, onPointerOut, onClick,
}: CourseObjectProps) {
    const meshRef = useRef<THREE.Mesh>(null!);
    const glowRef = useRef<THREE.Mesh>(null!);
    const materialProps = useMemo(() => getProgressMaterial(progress), [progress]);
    const baseColor = useMemo(() => new THREE.Color(color), [color]);
    const emissiveColor = useMemo(() => new THREE.Color(color).multiplyScalar(0.5), [color]);

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.elapsedTime;

        // Slow 3D rotation on Y axis
        meshRef.current.rotation.y = Math.sin(t * 0.4 + index * 1.2) * 0.2;
        meshRef.current.rotation.x = 0;

        // Hover scale
        const targetScale = isHovered ? 1.08 : isSelected ? 1.12 : 1;
        meshRef.current.scale.lerp(
            new THREE.Vector3(targetScale, targetScale, targetScale),
            0.08
        );

        // Hover float up slightly
        const hoverY = isHovered ? 0.2 : 0;
        meshRef.current.position.y = THREE.MathUtils.lerp(
            meshRef.current.position.y,
            position[1] + hoverY,
            0.08
        );

        // Glow pulse
        if (glowRef.current) {
            const glowScale = 1.2 + Math.sin(t * 1.5 + index) * 0.05;
            glowRef.current.scale.setScalar(glowScale);
            (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
                (isHovered ? 0.15 : 0.04) + Math.sin(t * 2 + index) * 0.02;
        }
    });

    return (
        <group position={position}>
            <group>
                {/* Main object */}
                <mesh
                    ref={meshRef}
                    onPointerOver={(e) => { e.stopPropagation(); onPointerOver(); }}
                    onPointerOut={onPointerOut}
                    onClick={(e) => { e.stopPropagation(); onClick(); }}
                    castShadow
                >
                    <RoundedBox args={[2.4, 3, 0.4]} radius={0.18} smoothness={8}>
                        <meshPhysicalMaterial
                            color={baseColor}
                            emissive={emissiveColor}
                            emissiveIntensity={materialProps.emissiveIntensity}
                            roughness={materialProps.roughness}
                            metalness={materialProps.metalness}
                            transmission={materialProps.transmission}
                            thickness={0.5}
                            clearcoat={1}
                            clearcoatRoughness={0.1}
                            envMapIntensity={2}
                            ior={1.5}
                            transparent
                            opacity={0.92}
                        />
                    </RoundedBox>

                    {/* Course icon text */}
                    <Text
                        position={[0, 0.3, 0.22]}
                        fontSize={0.6}
                        anchorX="center"
                        anchorY="middle"
                    >
                        {icon}
                    </Text>

                    {/* Course title */}
                    <Text
                        position={[0, -0.5, 0.22]}
                        fontSize={0.2}
                        anchorX="center"
                        anchorY="middle"
                        color="#ffffff"
                        maxWidth={1.3}
                        textAlign="center"
                    >
                        {title}
                    </Text>

                    {/* Progress bar */}
                    {progress > 0 && (
                        <group position={[0, -0.95, 0.21]}>
                            {/* Background */}
                            <mesh>
                                <planeGeometry args={[1.8, 0.08]} />
                                <meshBasicMaterial color="#000000" opacity={0.3} transparent />
                            </mesh>
                            {/* Fill */}
                            <mesh position={[-(1.8 - (progress / 100) * 1.8) / 2, 0, 0.001]}>
                                <planeGeometry args={[(progress / 100) * 1.8, 0.08]} />
                                <meshBasicMaterial color={color} />
                            </mesh>
                        </group>
                    )}

                    {/* Top accent edge */}
                    <mesh position={[0, 1.5, 0]} scale={[2.4, 0.03, 0.4]}>
                        <boxGeometry />
                        <meshBasicMaterial color={color} />
                    </mesh>
                </mesh>

                {/* Outer glow sphere */}
                <mesh ref={glowRef} scale={1.3}>
                    <sphereGeometry args={[1.2, 16, 16]} />
                    <meshBasicMaterial color={color} transparent opacity={0.08} side={THREE.BackSide} />
                </mesh>

                {/* Point light per card */}
                <pointLight
                    color={color}
                    intensity={isHovered ? 3 : progress > 50 ? 1.5 : 0.5}
                    distance={4}
                    decay={2}
                />
            </group>
        </group>
    );
}
