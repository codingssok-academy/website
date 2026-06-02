"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { shaderMaterial } from "@react-three/drei";
import { extend } from "@react-three/fiber";

/* ── White+Blue Nebula Shader ── */
const NebulaMaterialImpl = shaderMaterial(
    { uTime: 0, uProgress: 0 },
    // Vertex
    `varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
    // Fragment — soft white-blue gradient with subtle animation
    `uniform float uTime;
    uniform float uProgress;
    varying vec2 vUv;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
        const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main() {
        vec2 uv = vUv;
        float t = uTime * 0.05;

        float n1 = snoise(vec3(uv * 1.5, t)) * 0.5 + 0.5;
        float n2 = snoise(vec3(uv * 3.0 + 10.0, t * 1.2)) * 0.5 + 0.5;

        // White-blue palette
        vec3 white = vec3(0.96, 0.97, 1.0);
        vec3 lightBlue = vec3(0.88, 0.93, 1.0);
        vec3 skyBlue = vec3(0.56, 0.78, 1.0);
        vec3 accentBlue = vec3(0.35, 0.58, 0.96);

        vec3 base = mix(white, lightBlue, uv.y * 0.8 + n1 * 0.2);
        vec3 highlight = mix(skyBlue, accentBlue, n2);

        float cloudShape = smoothstep(0.35, 0.65, n1) * 0.15;
        vec3 finalColor = mix(base, highlight, cloudShape);

        // Subtle brightness from progress
        finalColor = mix(finalColor, vec3(1.0), uProgress * 0.001);

        gl_FragColor = vec4(finalColor, 1.0);
    }`
);

extend({ NebulaMaterialImpl });

declare module "@react-three/fiber" {
    interface ThreeElements {
        nebulaMaterialImpl: any;
    }
}

export default function NebulaBg({ hour = 12, progress = 0 }: { hour?: number; progress?: number }) {
    const matRef = useRef<any>(null);

    useFrame((state) => {
        if (matRef.current) {
            matRef.current.uTime = state.clock.elapsedTime;
            matRef.current.uProgress = progress;
        }
    });

    return (
        <mesh position={[0, 0, -25]} scale={[80, 50, 1]}>
            <planeGeometry args={[1, 1]} />
            <nebulaMaterialImpl ref={matRef} side={THREE.DoubleSide} />
        </mesh>
    );
}
