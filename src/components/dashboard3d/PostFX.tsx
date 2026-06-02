"use client";

import { EffectComposer, Bloom } from "@react-three/postprocessing";
import type { PerformanceTier } from "./AdaptiveEnvironment";

interface PostFXProps {
    tier?: PerformanceTier;
}

/* ── Minimal Post-Processing — no flicker ── */
export default function PostFX({ tier = "medium" }: PostFXProps) {
    // low tier — 포스트프로세싱 전체 비활성화
    if (tier === "low") return null;

    // medium tier — bloom 강도/품질 낮춤
    const bloomIntensity = tier === "medium" ? 0.2 : 0.4;
    const bloomLuminanceThreshold = tier === "medium" ? 0.8 : 0.6;
    const bloomMipmapBlur = tier === "high";

    return (
        <EffectComposer multisampling={0}>
            <Bloom
                intensity={bloomIntensity}
                luminanceThreshold={bloomLuminanceThreshold}
                luminanceSmoothing={0.9}
                mipmapBlur={bloomMipmapBlur}
            />
        </EffectComposer>
    );
}
