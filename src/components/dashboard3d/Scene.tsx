"use client";

import { Suspense, useState, useCallback, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import CourseObject from "./CourseObject";
import CameraRig from "./CameraRig";
import GpuParticles from "./GpuParticles";
import PostFX from "./PostFX";
import { usePerformanceTier, TIER_MAX_DPR } from "./AdaptiveEnvironment";

interface Course3D {
    id: string;
    title: string;
    icon: string;
    color: string;
    progress: number;
}

/* ── Flat grid — cards fill viewport width ── */
const GRID_POSITIONS: [number, number, number][] = [
    // Top row — 4 cards spanning full width
    [-11, 2.5, 0],
    [-3.7, 2.5, 0],
    [3.7, 2.5, 0],
    [11, 2.5, 0],
    // Bottom row — 3 cards centered between top positions
    [-7.5, -3, 0],
    [0, -3, 0],
    [7.5, -3, 0],
];

function extractColor(gradient: string): string {
    const match = gradient.match(/#[0-9a-fA-F]{6}/);
    return match ? match[0] : "#3b82f6";
}

interface SceneProps {
    courses: { id: string; title: string; icon: string; gradient: string }[];
    courseProgress: Record<string, number>;
    onCourseSelect: (courseId: string) => void;
}

export default function Scene({ courses, courseProgress, onCourseSelect }: SceneProps) {
    const tier = usePerformanceTier();

    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [introComplete, setIntroComplete] = useState(false);
    const [targetPos, setTargetPos] = useState<[number, number, number] | null>(null);

    const avgProgress = useMemo(() => {
        const values = Object.values(courseProgress);
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    }, [courseProgress]);

    const course3DData: Course3D[] = useMemo(() =>
        courses.map(c => ({
            id: c.id,
            title: c.title,
            icon: c.icon,
            color: extractColor(c.gradient),
            progress: courseProgress[c.id] || 0,
        })), [courses, courseProgress]
    );

    const handleCourseClick = useCallback((courseId: string, index: number) => {
        setSelectedId(courseId);
        setTargetPos(GRID_POSITIONS[index % GRID_POSITIONS.length]);
        setTimeout(() => onCourseSelect(courseId), 1500);
    }, [onCourseSelect]);

    // tier별 dpr 상한 적용
    const maxDpr = TIER_MAX_DPR[tier];

    // low tier — 그림자 비활성화, antialias 비활성화로 추가 절감
    const isLow = tier === "low";

    return (
        <Canvas
            shadows={false}
            dpr={[1, maxDpr]}
            gl={{
                antialias: !isLow,
                toneMapping: THREE.ACESFilmicToneMapping,
                toneMappingExposure: 1.5,
                powerPreference: "high-performance",
            }}
            /* Camera straight on, looking at center of grid */
            camera={{ position: [0, 0, 18], fov: 45, near: 0.1, far: 200 }}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
            performance={{ min: 0.5 }}
        >
            <color attach="background" args={["#f0f4ff"]} />

            <Suspense fallback={null}>
                <CameraRig
                    targetPosition={targetPos}
                    isIntro={!introComplete}
                    onIntroComplete={() => setIntroComplete(true)}
                />

                {/* Lighting */}
                <ambientLight intensity={0.8} color="#f8faff" />
                <directionalLight position={[5, 8, 10]} intensity={1.0} color="#ffffff" />
                {/* low tier — 포인트 라이트 1개만 유지 */}
                <pointLight position={[-5, 5, 8]} color="#93c5fd" intensity={0.6} distance={25} />
                {!isLow && (
                    <pointLight position={[5, -3, 8]} color="#60a5fa" intensity={0.4} distance={20} />
                )}

                {/* GPU Particles */}
                <GpuParticles progress={avgProgress} tier={tier} />

                {/* Course Objects — flat grid */}
                {course3DData.map((course, idx) => {
                    const pos = GRID_POSITIONS[idx % GRID_POSITIONS.length];
                    return (
                        <CourseObject
                            key={course.id}
                            position={pos}
                            title={course.title}
                            icon={course.icon}
                            color={course.color}
                            progress={course.progress}
                            index={idx}
                            isHovered={hoveredId === course.id}
                            isSelected={selectedId === course.id}
                            onPointerOver={() => setHoveredId(course.id)}
                            onPointerOut={() => setHoveredId(null)}
                            onClick={() => handleCourseClick(course.id, idx)}
                        />
                    );
                })}

                <PostFX tier={tier} />
            </Suspense>
        </Canvas>
    );
}
