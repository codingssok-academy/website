"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ── Cinematic Camera Rig — straight-on view ── */
interface CameraRigProps {
    targetPosition: [number, number, number] | null;
    isIntro: boolean;
    onIntroComplete: () => void;
}

export default function CameraRig({ targetPosition, isIntro, onIntroComplete }: CameraRigProps) {
    const { camera } = useThree();
    const introProgress = useRef(0);
    const introComplete = useRef(false);
    const currentPos = useRef(new THREE.Vector3(0, 0, 18));
    const lookTarget = useRef(new THREE.Vector3(0, 0, 0));

    // Final resting position — straight on
    const overviewPos = new THREE.Vector3(0, 0, 18);
    const overviewLook = new THREE.Vector3(0, 0, 0);

    // Intro start — zoomed out
    const introStartPos = new THREE.Vector3(0, 0, 40);

    useFrame((_, delta) => {
        const dt = Math.min(delta, 0.05);

        if (isIntro && !introComplete.current) {
            introProgress.current += dt * 0.6;
            const t = Math.min(introProgress.current, 1);
            const eased = 1 - Math.pow(1 - t, 3);

            currentPos.current.lerpVectors(introStartPos, overviewPos, eased);
            lookTarget.current.set(0, 0, 0);

            camera.position.copy(currentPos.current);
            camera.lookAt(lookTarget.current);

            if (camera instanceof THREE.PerspectiveCamera) {
                camera.fov = THREE.MathUtils.lerp(70, 45, eased);
                camera.updateProjectionMatrix();
            }

            if (t >= 1 && !introComplete.current) {
                introComplete.current = true;
                onIntroComplete();
            }
        } else if (targetPosition) {
            // Fly to selected course
            const flyTarget = new THREE.Vector3(
                targetPosition[0],
                targetPosition[1],
                targetPosition[2] + 5
            );
            currentPos.current.lerp(flyTarget, dt * 2);
            lookTarget.current.lerp(
                new THREE.Vector3(targetPosition[0], targetPosition[1], targetPosition[2]),
                dt * 2
            );
            camera.position.copy(currentPos.current);
            camera.lookAt(lookTarget.current);
        } else {
            // Idle — very subtle sway
            const time = performance.now() * 0.00008;
            const idlePos = new THREE.Vector3(
                Math.sin(time) * 0.3,
                Math.cos(time * 0.7) * 0.15,
                18
            );
            currentPos.current.lerp(idlePos, dt * 0.5);
            camera.position.copy(currentPos.current);
            camera.lookAt(overviewLook);
        }
    });

    return null;
}
