"use client";

import { useRef, useEffect } from "react";
import type { Side, Mesh, ShaderMaterial, Material, Sprite, BufferAttribute } from "three";

/*
  NEXUS CORE — Three.js IT Planet Interlude
  Custom shader planet with vertex displacement, animated live texture,
  atmosphere glow, orbital rings, satellites, and code sprites.
  Replaces the bubbles interlude.
*/

export default function NexusPlanet() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const bgCanvasRef = useRef<HTMLCanvasElement>(null);
    const codeLayerRef = useRef<HTMLDivElement>(null);
    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        const canvas = canvasRef.current;
        const bgCanvas = bgCanvasRef.current;
        const codeLayer = codeLayerRef.current;
        if (!container || !canvas || !bgCanvas || !codeLayer) return;

        let destroyed = false;

        async function init() {
            const THREE = await import("three");
            if (destroyed) return;

            const W = () => container!.clientWidth;
            const H = () => container!.clientHeight;

            // ── BG grid
            const bgCtx = bgCanvas!.getContext("2d")!;
            function drawBG() {
                const w = W(), h = H();
                bgCanvas!.width = w; bgCanvas!.height = h;
                bgCtx.clearRect(0, 0, w, h);
                bgCtx.strokeStyle = "rgba(60,120,240,.05)"; bgCtx.lineWidth = 0.6;
                for (let x = 0; x < w; x += 80) { bgCtx.beginPath(); bgCtx.moveTo(x, 0); bgCtx.lineTo(x, h); bgCtx.stroke(); }
                for (let y = 0; y < h; y += 80) { bgCtx.beginPath(); bgCtx.moveTo(0, y); bgCtx.lineTo(w, y); bgCtx.stroke(); }
                const bS = 55, bO = 30;
                const corners: [number, number, number, number][] = [[bO, bO, 1, 1], [w - bO, bO, -1, 1], [bO, h - bO, 1, -1], [w - bO, h - bO, -1, -1]];
                bgCtx.strokeStyle = "rgba(50,110,240,.18)"; bgCtx.lineWidth = 1.2;
                corners.forEach(([x, y, sx, sy]) => { bgCtx.beginPath(); bgCtx.moveTo(x, y + sy * bS); bgCtx.lineTo(x, y); bgCtx.lineTo(x + sx * bS, y); bgCtx.stroke(); });
            }
            drawBG();

            // ── FLOATING CODE UI
            const SNIPS = [
                { code: "async function deploy() {\n  await cloud.push(planet);\n  return Status.ONLINE;\n}", col: "rgba(30,90,220,.55)" },
                { code: "class Planet extends Star {\n  constructor(name: string) {\n    super(name, 2100);\n  }\n}", col: "rgba(20,70,200,.5)" },
                { code: "interface NexusCore {\n  data: Infinity;\n  nodes: Node[];\n  status: \"ONLINE\";\n}", col: "rgba(40,100,220,.48)" },
                { code: "import tensorflow as tf\nmodel = tf.Nexus()\nmodel.fit(universe,\n  epochs=2100)", col: "rgba(20,75,200,.5)" },
            ];
            const KWS = ["TypeScript", "Python", "Rust", "React", "Kubernetes", "Docker", "PostgreSQL", "GraphQL", "WebGL", "TensorFlow", "Node.js", "Golang"];

            function spawnSnip() {
                if (destroyed) return;
                const s = SNIPS[Math.floor(Math.random() * SNIPS.length)];
                const el = document.createElement("div");
                el.style.cssText = `position:absolute;font-family:'JetBrains Mono',monospace;font-weight:300;font-size:8.5px;line-height:1.7;white-space:pre;pointer-events:none;opacity:0;color:${s.col};border-left:1.5px solid ${s.col.replace(/[\d.]+\)$/, "0.2)")};padding-left:9px;`;
                el.textContent = s.code;
                const side = Math.random() > 0.5;
                el.style.left = (side ? 2 + Math.random() * 17 : 80 + Math.random() * 18) + "%";
                el.style.top = (20 + Math.random() * 65) + "%";
                const dur = 18 + Math.random() * 14;
                el.style.animation = `nxDrift ${dur}s linear forwards`;
                codeLayer!.appendChild(el);
                setTimeout(() => { if (!destroyed) el.remove(); }, (dur + 1) * 1000);
            }
            function spawnKW() {
                if (destroyed) return;
                const el = document.createElement("div");
                el.style.cssText = `position:absolute;font-family:'JetBrains Mono',monospace;font-weight:300;font-size:9px;letter-spacing:2px;pointer-events:none;opacity:0;text-transform:uppercase;`;
                el.textContent = KWS[Math.floor(Math.random() * KWS.length)];
                const z = Math.floor(Math.random() * 4);
                let x: number, y: number;
                if (z === 0) { x = 3 + Math.random() * 14; y = 15 + Math.random() * 70; }
                else if (z === 1) { x = 82 + Math.random() * 15; y = 15 + Math.random() * 70; }
                else if (z === 2) { x = 20 + Math.random() * 60; y = 5 + Math.random() * 8; }
                else { x = 20 + Math.random() * 60; y = 88 + Math.random() * 8; }
                el.style.left = x + "%"; el.style.top = y + "%";
                el.style.color = `rgba(40,100,220,${0.18 + Math.random() * 0.22})`;
                const dur = 12 + Math.random() * 10;
                el.style.animation = `nxFloatKW ${dur}s linear forwards`;
                codeLayer!.appendChild(el);
                setTimeout(() => { if (!destroyed) el.remove(); }, (dur + 1) * 1000);
            }
            for (let i = 0; i < 3; i++) setTimeout(spawnSnip, i * 800);
            for (let i = 0; i < 5; i++) setTimeout(spawnKW, i * 600);
            const snipInt = setInterval(spawnSnip, 3200);
            const kwInt = setInterval(spawnKW, 1800);

            // ── THREE.JS
            const renderer = new THREE.WebGLRenderer({ canvas: canvas!, antialias: true, alpha: true });
            renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
            renderer.setSize(W(), H());
            renderer.setClearColor(0x000000, 0);
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.1;

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(38, W() / H(), 0.1, 500);
            camera.position.set(0, 0, 8.5);

            // Stars
            {
                const geo = new THREE.BufferGeometry();
                const N = 1400, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
                for (let i = 0; i < N; i++) {
                    const r = 100 + Math.random() * 200, t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
                    pos[i * 3] = r * Math.sin(p) * Math.cos(t); pos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t); pos[i * 3 + 2] = r * Math.cos(p);
                    const b = 0.4 + Math.random() * 0.4;
                    col[i * 3] = 0.35 * b; col[i * 3 + 1] = 0.5 * b; col[i * 3 + 2] = b;
                }
                geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
                geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
                scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.16, vertexColors: true, transparent: true, opacity: 0.4 })));
            }

            // ── Texture builders
            function buildHeight() {
                const S = 512, cv = document.createElement("canvas"); cv.width = S; cv.height = S;
                const ctx = cv.getContext("2d")!;
                ctx.fillStyle = "#404060"; ctx.fillRect(0, 0, S, S);
                [[S * .22, S * .35, 90], [S * .72, S * .28, 80], [S * .55, S * .65, 100], [S * .15, S * .7, 70], [S * .82, S * .72, 85]].forEach(([cx, cy, r]) => {
                    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, "#e8e8ff"); g.addColorStop(0.5, "#a0a0cc"); g.addColorStop(1, "transparent");
                    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
                });
                return new THREE.CanvasTexture(cv);
            }

            function buildSurface() {
                const S = 1024, cv = document.createElement("canvas"); cv.width = S; cv.height = S;
                const ctx = cv.getContext("2d")!;
                const bg2 = ctx.createRadialGradient(S * .38, S * .35, 0, S / 2, S / 2, S * .88);
                bg2.addColorStop(0, "#ddeeff"); bg2.addColorStop(0.3, "#c8deff"); bg2.addColorStop(0.65, "#a2c4ee"); bg2.addColorStop(1, "#7aa0d0");
                ctx.fillStyle = bg2; ctx.fillRect(0, 0, S, S);
                // Oceans
                for (let i = 0; i < 9; i++) { const x = Math.random() * S, y = Math.random() * S, r = 80 + Math.random() * 240; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, "rgba(15,60,190,.32)"); g.addColorStop(1, "transparent"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
                // City blocks
                [[S * .22, S * .35, 90], [S * .72, S * .28, 80], [S * .55, S * .65, 100], [S * .15, S * .7, 70], [S * .82, S * .72, 85]].forEach(([cx, cy, r]) => {
                    const dg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); dg.addColorStop(0, "rgba(30,80,200,.25)"); dg.addColorStop(1, "transparent"); ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
                    for (let bx = cx - r; bx < cx + r; bx += 10) { for (let by = cy - r; by < cy + r; by += 10) { const dx = bx - cx, dy = by - cy; if (dx * dx + dy * dy > r * r || Math.random() > 0.45) continue; ctx.fillStyle = `rgba(40,110,255,${(0.15 + Math.random() * 0.55) * 0.5})`; ctx.fillRect(bx, by, 7, 7); } }
                });
                // Hex grid
                ctx.strokeStyle = "rgba(50,120,255,.06)"; ctx.lineWidth = 0.8;
                const HS = 50;
                for (let row = -1; row < S / HS * 1.5 + 1; row++) { for (let col2 = -1; col2 < S / HS + 1; col2++) { const xo = col2 * HS * 1.5, yo = row * HS * 0.866 + (col2 & 1) * HS * 0.433; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 - Math.PI / 6; const px = xo + HS * 0.52 * Math.cos(a), py = yo + HS * 0.52 * Math.sin(a); k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); } ctx.closePath(); ctx.stroke(); } }
                // Source code tiling
                const CODE_BLOCKS = ["interface NexusCore {\n  data: Infinity;\n  nodes: Node[];\n}", "async function deploy() {\n  await cloud.push(p);\n  return Status.ONLINE;\n}", "class Planet extends Star {\n  constructor(n:string){\n    super(n, 2100);\n  }\n}"];
                ctx.font = "300 13px JetBrains Mono,monospace";
                let bi = 0;
                for (let bx = -320; bx < S + 320; bx += 320) { for (let by = -280; by < S + 280; by += 280) { const code = CODE_BLOCKS[bi % CODE_BLOCKS.length]; bi++; code.split("\n").forEach((line, li) => { ctx.fillStyle = `rgba(20,80,220,${0.5 * (0.82 + Math.random() * 0.36)})`; ctx.fillText(line, bx, by + li * 17); }); } }
                // Atmosphere veil
                const atmG = ctx.createRadialGradient(S * .35, S * .3, S * .1, S / 2, S / 2, S * .62);
                atmG.addColorStop(0, "rgba(255,255,255,.13)"); atmG.addColorStop(0.45, "rgba(200,225,255,.04)"); atmG.addColorStop(1, "rgba(10,40,120,.18)");
                ctx.fillStyle = atmG; ctx.fillRect(0, 0, S, S);
                return new THREE.CanvasTexture(cv);
            }

            function buildEmissive() {
                const S = 1024, cv = document.createElement("canvas"); cv.width = S; cv.height = S;
                const ctx = cv.getContext("2d")!;
                ctx.fillStyle = "#020a18"; ctx.fillRect(0, 0, S, S);
                [[S * .22, S * .35, 85], [S * .72, S * .28, 70], [S * .55, S * .65, 95], [S * .15, S * .7, 65], [S * .82, S * .72, 75]].forEach(([cx, cy, r]) => {
                    for (let bx = cx - r; bx < cx + r; bx += 7) { for (let by = cy - r; by < cy + r; by += 7) { const dx = bx - cx, dy = by - cy; if (dx * dx + dy * dy > r * r || Math.random() > 0.48) continue; const bright = 0.3 + Math.random() * 0.7; ctx.fillStyle = `rgba(80,160,255,${bright * 0.58})`; ctx.fillRect(bx, by, 4, 4); } }
                });
                // Crack glow
                function emCrack(x1: number, y1: number, x2: number, y2: number, d: number) {
                    if (d <= 0) return;
                    const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * Math.hypot(x2 - x1, y2 - y1) * 0.3;
                    const my = (y1 + y2) / 2 + (Math.random() - 0.5) * Math.hypot(x2 - x1, y2 - y1) * 0.3;
                    ctx.strokeStyle = "rgba(100,180,255,.85)"; ctx.lineWidth = 2; ctx.shadowColor = "rgba(80,160,255,1)"; ctx.shadowBlur = 10;
                    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x2, y2); ctx.stroke();
                    ctx.shadowBlur = 0;
                    if (d > 1 && Math.random() > 0.4) emCrack(mx, my, mx + (Math.random() - 0.5) * 130, my + (Math.random() - 0.5) * 130, d - 1);
                }
                [[S * .1, S * .3], [S * .9, S * .2], [S * .5, S * .8], [S * .2, S * .7], [S * .8, S * .6]].forEach(([sx, sy]) => { for (let i = 0; i < 3; i++) emCrack(sx, sy, sx + (Math.random() - 0.5) * S * 0.55, sy + (Math.random() - 0.5) * S * 0.55, 3); });
                ctx.shadowBlur = 0;
                // Reactor cores
                for (let i = 0; i < 10; i++) { const x = Math.random() * S, y = Math.random() * S, r = 15 + Math.random() * 45; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, "rgba(160,210,255,.9)"); g.addColorStop(0.4, "rgba(80,160,255,.5)"); g.addColorStop(1, "transparent"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
                return new THREE.CanvasTexture(cv);
            }

            // ── Live animated texture
            const LIVE_S = 512;
            const liveCv = document.createElement("canvas"); liveCv.width = LIVE_S; liveCv.height = LIVE_S;
            const liveCtx = liveCv.getContext("2d")!;
            const liveTex = new THREE.CanvasTexture(liveCv);

            const CODE_LINES = [
                "interface NexusCore {", "  data: Infinity;", "  nodes: Node[];", "}", "",
                "async function deploy() {", "  await cloud.push(p);", "  return Status.ONLINE;", "}", "",
                "class Planet extends Star {", "  constructor(n: string) {", "    super(n, 2100);", "  }", "}", "",
                "fn compute(c: &Core)", "  -> Result<∞> {", "  Ok(c.run())", "}", "",
            ];
            const NUM_COLS = 5;
            const COLS = Array.from({ length: NUM_COLS }, (_, i) => ({
                x: i * (LIVE_S / NUM_COLS) + 5,
                scrollY: Math.random() * -200,
                speed: 0.35 + Math.random() * 0.5,
                alpha: 0.35 + Math.random() * 0.3,
                fontSize: 8 + Math.floor(Math.random() * 3),
                lineStart: Math.floor(Math.random() * CODE_LINES.length),
            }));
            const PULSES = Array.from({ length: 18 }, () => ({
                angle: Math.random() * Math.PI * 2, speed: 0.008 + Math.random() * 0.012,
                r: 20 + Math.random() * (LIVE_S / 2 - 30), alpha: 0.6 + Math.random() * 0.4, size: 2 + Math.random() * 3,
                cx: LIVE_S / 2, cy: LIVE_S / 2,
            }));
            const NODE_PULSES = Array.from({ length: 20 }, () => ({
                x: 20 + Math.random() * (LIVE_S - 40), y: 20 + Math.random() * (LIVE_S - 40),
                phase: Math.random() * Math.PI * 2, r: 3 + Math.random() * 5,
            }));

            function updateLiveTexture(t: number) {
                liveCtx.clearRect(0, 0, LIVE_S, LIVE_S);
                COLS.forEach(col2 => {
                    liveCtx.font = `300 ${col2.fontSize}px JetBrains Mono,monospace`;
                    col2.scrollY += col2.speed; if (col2.scrollY > LIVE_S + 200) col2.scrollY = -200;
                    const lineH = col2.fontSize * 1.6;
                    for (let li = 0; li < Math.ceil((LIVE_S + 400) / lineH); li++) {
                        const lineIdx = (col2.lineStart + li) % CODE_LINES.length;
                        const line = CODE_LINES[lineIdx]; if (!line) continue;
                        const y = col2.scrollY + li * lineH - 200;
                        if (y < -lineH || y > LIVE_S + lineH) continue;
                        const fade = Math.min(1, Math.max(0, y / 60)) * Math.min(1, Math.max(0, (LIVE_S - y) / 60));
                        liveCtx.fillStyle = `rgba(30,100,240,${col2.alpha * fade})`;
                        liveCtx.fillText(line, col2.x, y);
                    }
                });
                PULSES.forEach(p => {
                    p.angle += p.speed;
                    const px = p.cx + Math.cos(p.angle) * p.r, py = p.cy + Math.sin(p.angle) * p.r;
                    const g = liveCtx.createRadialGradient(px, py, 0, px, py, p.size * 3);
                    g.addColorStop(0, `rgba(120,200,255,${p.alpha})`); g.addColorStop(1, "transparent");
                    liveCtx.fillStyle = g; liveCtx.beginPath(); liveCtx.arc(px, py, p.size * 3, 0, Math.PI * 2); liveCtx.fill();
                });
                NODE_PULSES.forEach(n => {
                    const pulse = 0.4 + Math.sin(t * 2.2 + n.phase) * 0.4; if (pulse < 0.1) return;
                    const g = liveCtx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 3);
                    g.addColorStop(0, `rgba(80,180,255,${pulse * 0.6})`); g.addColorStop(1, "transparent");
                    liveCtx.fillStyle = g; liveCtx.beginPath(); liveCtx.arc(n.x, n.y, n.r * 3, 0, Math.PI * 2); liveCtx.fill();
                });
                liveTex.needsUpdate = true;
            }

            // ── SHADERS
            const VERT = `
                uniform sampler2D tHeight; uniform float time; uniform float dispScale;
                varying vec2 vUv; varying vec3 vNormal; varying vec3 vViewDir; varying float vHeight;
                float hash(float n){ return fract(sin(n)*43758.5453); }
                float noise2(vec2 p){ vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i.x+i.y*57.0),hash(i.x+1.0+i.y*57.0),f.x),mix(hash(i.x+(i.y+1.0)*57.0),hash(i.x+1.0+(i.y+1.0)*57.0),f.x),f.y);}
                void main(){
                    vUv=uv; float h=texture2D(tHeight,uv).r;
                    float pulse1=sin(uv.x*45.0+time*1.8)*0.0025; float pulse2=sin(uv.y*38.0+time*1.4)*0.002;
                    float breath=sin(time*1.2+h*12.0)*0.006*smoothstep(0.5,0.9,h);
                    float micro=noise2(uv*18.0)*0.008;
                    float disp=(h-0.4)*dispScale+pulse1+pulse2+breath+micro; vHeight=disp;
                    vec3 newPos=position+normal*disp;
                    vNormal=normalize(normalMatrix*normal);
                    vec4 mvPos=modelViewMatrix*vec4(newPos,1.0);
                    vViewDir=normalize(-mvPos.xyz);
                    gl_Position=projectionMatrix*mvPos;
                }`;
            const FRAG = `
                uniform sampler2D tDay; uniform sampler2D tEmit; uniform sampler2D tLive; uniform float time; uniform vec3 sunDir;
                varying vec2 vUv; varying vec3 vNormal; varying vec3 vViewDir; varying float vHeight;
                void main(){
                    vec4 dayCol=texture2D(tDay,vUv); vec4 emitCol=texture2D(tEmit,vUv); vec4 liveCol=texture2D(tLive,vUv);
                    vec3 sun=normalize(sunDir); float diff=max(0.0,dot(vNormal,sun));
                    float nightSide=1.0-smoothstep(0.0,0.35,diff);
                    float ndv=max(0.0,dot(vNormal,vViewDir)); float fresnel=pow(1.0-ndv,4.5);
                    vec3 rimGlow=mix(vec3(0.3,0.6,1.0),vec3(0.6,0.85,1.0),fresnel)*fresnel*1.4;
                    float wave1=sin(vUv.x*60.0-time*3.5)*0.5+0.5; float wave2=sin(vUv.y*50.0+time*2.8)*0.5+0.5;
                    float circuitPulse=emitCol.r*(0.2+(wave1*wave2)*0.5);
                    vec3 cityLights=mix(vec3(0.3,0.6,1.0),vec3(0.8,0.9,1.0),emitCol.g)*emitCol.b*nightSide*2.0;
                    vec3 liveGlow=liveCol.rgb*(liveCol.r+liveCol.g+liveCol.b)*0.33*(0.5+diff*0.5)*0.6;
                    vec3 halfV=normalize(sun+vViewDir); float spec=pow(max(0.0,dot(vNormal,halfV)),40.0)*0.15;
                    vec3 litSurface=dayCol.rgb*(0.28+diff*0.88);
                    vec3 final=litSurface+cityLights+vec3(0.2,0.5,1.0)*circuitPulse*0.5+emitCol.rgb*0.25+liveGlow+rimGlow+vec3(0.7,0.85,1.0)*spec;
                    final=mix(final,final*vec3(0.88,0.94,1.0),0.25);
                    gl_FragColor=vec4(clamp(final,0.0,1.0),1.0);
                }`;

            const pShader = new THREE.ShaderMaterial({
                uniforms: {
                    tDay: { value: buildSurface() }, tEmit: { value: buildEmissive() }, tLive: { value: liveTex },
                    tHeight: { value: buildHeight() }, time: { value: 0 }, dispScale: { value: 0.14 },
                    sunDir: { value: new THREE.Vector3(5, 4, 5).normalize() },
                },
                vertexShader: VERT, fragmentShader: FRAG,
            });
            const planet = new THREE.Mesh(new THREE.SphereGeometry(2.2, 200, 200), pShader);
            scene.add(planet);

            // ── Atmosphere
            const gVert = "varying vec3 vN;varying vec3 vV;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.0);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}";
            function mkAtm(r: number, col: number, c: number, p: number, side: Side, mult: number) {
                return new THREE.Mesh(new THREE.SphereGeometry(r, 96, 96), new THREE.ShaderMaterial({
                    uniforms: { c: { value: c }, p: { value: p }, glowColor: { value: new THREE.Color(col) } },
                    vertexShader: gVert,
                    fragmentShader: `uniform float c;uniform float p;uniform vec3 glowColor;varying vec3 vN;varying vec3 vV;void main(){float i=pow(max(0.0,c-dot(vN,vV)),p);gl_FragColor=vec4(glowColor,i*${mult.toFixed(2)});}`,
                    side, blending: THREE.NormalBlending, transparent: true, depthWrite: false,
                }));
            }
            const atmInner = mkAtm(2.28, 0x3388ff, 0.38, 5.2, THREE.FrontSide, 0.92);
            const atmOuter = mkAtm(2.76, 0x4499ff, 0.22, 3.5, THREE.BackSide, 0.44);
            const atmRim = mkAtm(2.24, 0xaaddff, 0.42, 8.5, THREE.FrontSide, 0.62);
            scene.add(atmInner, atmOuter, atmRim);

            // ── Rings
            const RG = new THREE.Group(); RG.rotation.x = Math.PI * 0.25;
            function mkRing(ri: number, ro: number, hex: string, op: number) {
                const rg = new THREE.RingGeometry(ri, ro, 400);
                const pa = rg.attributes.position as BufferAttribute, cols = new Float32Array(pa.count * 3);
                const c = new THREE.Color(hex);
                for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), r = Math.sqrt(x * x + y * y); const fade = Math.sin(((r - ri) / (ro - ri)) * Math.PI); cols[i * 3] = c.r * fade; cols[i * 3 + 1] = c.g * fade; cols[i * 3 + 2] = c.b * fade; }
                rg.setAttribute("color", new THREE.BufferAttribute(cols, 3));
                return new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false }));
            }
            const r1 = mkRing(2.85, 3.12, "#4488ee", 0.55), r2 = mkRing(3.28, 3.48, "#2255cc", 0.4), r3 = mkRing(3.62, 3.74, "#6699ff", 0.3);
            RG.add(r1, r2, r3); scene.add(RG);

            // ── Satellites
            const satData: { sat: Mesh; orR: number; spd: number; tilt: number; ang: number }[] = [];
            for (let i = 0; i < 6; i++) {
                const orR = 2.55 + i * 0.18, spd = 0.4 + Math.random() * 0.55, tilt = (Math.random() - 0.5) * 2, ang = Math.random() * Math.PI * 2;
                const sat = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 8), new THREE.MeshBasicMaterial({ color: 0x4488ff }));
                scene.add(sat); satData.push({ sat, orR, spd, tilt, ang });
            }

            // ── Code sprites
            const CS = ["if(∞)", "AI++", "<IT/>", "0xFF", "nexus()", "async", "class", "v2100", "NEXUS", "deploy()"];
            const code3D: { sp: Sprite; oa: number; or: number; os: number; ot: number }[] = [];
            for (let i = 0; i < 35; i++) {
                const cv2 = document.createElement("canvas"); cv2.width = 220; cv2.height = 44;
                const ct2 = cv2.getContext("2d")!;
                ct2.font = "300 14px JetBrains Mono,monospace";
                ct2.fillStyle = `rgba(${20 + Math.floor(Math.random() * 40)},${80 + Math.floor(Math.random() * 50)},${200 + Math.floor(Math.random() * 55)},0.9)`;
                ct2.fillText(CS[i % CS.length], 6, 30);
                const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv2), transparent: true, opacity: 0.5, depthWrite: false }));
                const r = 4 + Math.random() * 5.5, t = Math.random() * Math.PI * 2, p2 = Math.acos(2 * Math.random() - 1);
                sp.position.set(r * Math.sin(p2) * Math.cos(t), r * Math.sin(p2) * Math.sin(t), r * Math.cos(p2));
                sp.scale.set(0.65, 0.16, 1); scene.add(sp);
                code3D.push({ sp, oa: t, or: r, os: (Math.random() - 0.5) * 0.003, ot: p2 });
            }

            // ── Lighting
            scene.add(new THREE.DirectionalLight(0xffffff, 3.0).translateOnAxis(new THREE.Vector3(5, 4, 5).normalize(), 10));
            scene.add(new THREE.DirectionalLight(0x88bbff, 2.4).translateOnAxis(new THREE.Vector3(-5, -2, -4).normalize(), 10));
            scene.add(new THREE.AmbientLight(0xaabbdd, 1.5));

            // ── Mouse
            let rmx = 0, rmy = 0;
            const onMouse = (e: MouseEvent) => { rmx = (e.clientX / W() - 0.5) * 2; rmy = (e.clientY / H() - 0.5) * 2; };
            container!.addEventListener("mousemove", onMouse);

            // ── Resize
            const onResize = () => { camera.aspect = W() / H(); camera.updateProjectionMatrix(); renderer.setSize(W(), H()); drawBG(); };
            window.addEventListener("resize", onResize);

            // ── Animate
            const clock = new THREE.Clock();
            let rx = 0, ry = 0, animId = 0;
            function render() {
                if (destroyed) return;
                animId = requestAnimationFrame(render);
                const dt = clock.getDelta(), t = clock.elapsedTime;
                updateLiveTexture(t);
                planet.rotation.y += 0.0032;
                pShader.uniforms.time.value = t;
                (atmInner.material as ShaderMaterial).uniforms.c.value = 0.36 + Math.sin(t * 0.7) * 0.026;
                (atmRim.material as ShaderMaterial).uniforms.c.value = 0.40 + Math.sin(t * 0.9 + 0.5) * 0.022;
                r1.rotation.z += 0.0008; r2.rotation.z -= 0.0005; r3.rotation.z += 0.0003;
                satData.forEach(s => { s.ang += s.spd * dt; s.sat.position.set(Math.cos(s.ang) * s.orR, Math.sin(s.ang) * s.tilt * 0.22, Math.sin(s.ang) * s.orR); });
                code3D.forEach(c => { c.oa += c.os; c.sp.position.set(Math.sin(c.ot) * Math.cos(c.oa) * c.or, Math.cos(c.ot) * c.or * 0.45, Math.sin(c.ot) * Math.sin(c.oa) * c.or); c.sp.material.opacity = 0.25 + Math.sin(t * 1.8 + c.oa) * 0.2; });
                rx += (rmx * 0.16 - rx) * 0.018; ry += (rmy * 0.09 - ry) * 0.018;
                scene.rotation.y = rx; scene.rotation.x = ry;
                renderer.render(scene, camera);
            }
            render();

            // ── Cleanup
            cleanupRef.current = () => {
                destroyed = true;
                cancelAnimationFrame(animId);
                clearInterval(snipInt); clearInterval(kwInt);
                container!.removeEventListener("mousemove", onMouse);
                window.removeEventListener("resize", onResize);
                renderer.dispose();
                scene.traverse((obj) => {
                    if ((obj as Mesh).geometry) (obj as Mesh).geometry.dispose();
                    if ((obj as Mesh).material) {
                        const mat = (obj as Mesh).material;
                        if (Array.isArray(mat)) mat.forEach(m => m.dispose());
                        else (mat as Material).dispose();
                    }
                });
            };
        }

        init();

        return () => { cleanupRef.current?.(); };
    }, []);

    return (
        <section className="nx-planet-section">
            <div ref={containerRef} className="nx-planet-container">
                <canvas ref={bgCanvasRef} className="nx-bg-canvas" />
                <canvas ref={canvasRef} className="nx-main-canvas" />
                <div ref={codeLayerRef} className="nx-code-layer" />

                {/* HUD labels */}
                <div className="nx-hud nx-hud-top">NEXUS CORE · IT PLANET · v2100</div>
                <div className="nx-hud nx-hud-bottom">Digital World</div>
                <div className="nx-hud nx-hud-left">
                    CORE TEMP<br />──────────<br />12,847 °K<br /><br />
                    DATA FLOW<br />──────────<br />1.2 PB/s<br /><br />
                    NEURAL NET<br />──────────<br />∞ QFLOPS
                </div>
                <div className="nx-hud nx-hud-right">
                    ORBIT RING ×3<br />──────────────<br />ACTIVE<br /><br />
                    SATELLITES<br />──────────────<br />6 IN ORBIT<br /><br />
                    AI CORES<br />──────────────<br />FULLY ONLINE
                </div>
            </div>

            <style>{`
.nx-planet-section { position: relative; width: 100%; overflow: hidden; background: #fff; }
.nx-planet-container { position: relative; width: 100%; height: 100vh; min-height: 600px; max-height: 900px; overflow: hidden; }
.nx-bg-canvas { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.nx-main-canvas { position: absolute; inset: 0; z-index: 2; display: block; width: 100%; height: 100%; }
.nx-code-layer { position: absolute; inset: 0; z-index: 3; pointer-events: none; overflow: hidden; }

.nx-hud { position: absolute; font-family: 'Orbitron', monospace; font-weight: 300; letter-spacing: 11px; text-transform: uppercase; pointer-events: none; z-index: 20; animation: nxPulse 7s ease-in-out infinite; }
.nx-hud-top { top: 42px; left: 50%; transform: translateX(-50%); font-size: 8.5px; color: rgba(30,80,200,.3); }
.nx-hud-bottom { bottom: 48px; left: 50%; transform: translateX(-50%); font-size: 8px; letter-spacing: 13px; color: rgba(30,80,200,.2); animation-duration: 5s; }
.nx-hud-left, .nx-hud-right { top: 50%; transform: translateY(-50%); font-family: 'JetBrains Mono', monospace; font-size: 7.5px; line-height: 1.9; letter-spacing: 1px; color: rgba(40,100,220,.22); animation-duration: 6s; display: none; }
@media (min-width: 1024px) { .nx-hud-left, .nx-hud-right { display: block; } }
.nx-hud-left { left: 36px; } .nx-hud-right { right: 36px; text-align: right; }

@keyframes nxPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
@keyframes nxDrift { 0% { opacity: 0; transform: translateY(0); } 8% { opacity: 1; } 88% { opacity: 0.7; } 100% { opacity: 0; transform: translateY(-90px); } }
@keyframes nxFloatKW { 0% { opacity: 0; } 10% { opacity: 1; } 85% { opacity: 0.5; } 100% { opacity: 0; transform: translateY(-55px); } }
            `}</style>
        </section>
    );
}
