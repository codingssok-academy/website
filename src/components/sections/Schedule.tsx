"use client";

/* ═══════════════════════════════════════════════════════════════
   Schedule — Future Lab Scheduler Ultra V2
   Faithful 1:1 port from reference HTML
   ═══════════════════════════════════════════════════════════════ */

const steps = [
    {
        num: "01", code: "PAYMENT", title: "결제 완료",
        desc: "매월 1일 시스템 자동 결제 처리.",
        procId: "#PAY-01", progress: 100, progressLabel: "Proc.ID",
        icon: "credit_card",
        colorFrom: "from-blue-500", colorTo: "to-blue-600",
        borderColor: "#3b82f6", dotColor: "bg-blue-500",
        textColor: "text-blue-600", barColor: "bg-blue-500",
        glowColor: "#3b82f6", cardBorderColor: "border-blue-500",
    },
    {
        num: "02", code: "FORM", title: "폼 수신",
        desc: "스케줄 설정 구글 폼 자동 발송.",
        procId: "Active", progress: 66, progressLabel: "Status",
        icon: "mail",
        colorFrom: "from-cyan-500", colorTo: "to-cyan-600",
        borderColor: "#06b6d4", dotColor: "bg-cyan-500",
        textColor: "text-cyan-600", barColor: "bg-cyan-500",
        glowColor: "#06b6d4", cardBorderColor: "border-cyan-500",
    },
    {
        num: "03", code: "SYNC", title: "시간표 확정",
        desc: "최적화된 맞춤 시간표 자동 배치.",
        procId: "Complete", progress: 100, progressLabel: "Sync",
        icon: "check_circle",
        colorFrom: "from-blue-500", colorTo: "to-blue-600",
        borderColor: "#2563eb", dotColor: "bg-blue-500",
        textColor: "text-blue-600", barColor: "bg-blue-500",
        glowColor: "#2563eb", cardBorderColor: "border-blue-500",
    },
];

export default function Schedule() {
    return (
        <>
                        
            <section id="schedule" className="fls-section">
                {/* BG */}
                <div className="fls-bg">
                    <div className="fls-hex-pattern" />
                    <div className="fls-grad-bottom" />
                    <div className="fls-blob fls-blob-1" />
                    <div className="fls-blob fls-blob-2" />
                </div>

                <div className="container-nod fls-main">
                    {/* Header */}
                    <div className="fls-header">
                        <div className="fls-status-badge">
                            <div className="fls-badge-glow" />
                            <div className="fls-badge-inner">
                                <span className="fls-pulse-dot" />
                                <span className="fls-badge-text">Lab Module V2.0 Active</span>
                            </div>
                        </div>
                        <h1 className="fls-title">
                            <span className="fls-title-watermark">LAB</span>
                            아이의 스케줄에<br />
                            <span className="fls-title-accent">교육을 맞춥니다</span>
                        </h1>
                        <p className="fls-subtitle">
                            <span className="fls-subtitle-line" />
                            <span className="fls-subtitle-text">Precision Scheduling</span>
                            <span className="fls-subtitle-line" />
                        </p>
                    </div>

                    {/* Steps */}
                    <div className="fls-steps-area">
                        {/* Connector line */}
                        <div className="fls-connector">
                            <div className="fls-connector-line" />
                            <div className="fls-shimmer fls-shimmer-1" />
                            <div className="fls-shimmer fls-shimmer-2" />
                        </div>

                        <div className="fls-steps-grid">
                            {steps.map((s, i) => (
                                <div key={i} className="fls-step group">
                                    {/* Iso Pod */}
                                    <div className="fls-pod">
                                        <div className="fls-pod-ring" style={{ "--pod-color": s.glowColor } as React.CSSProperties} />
                                        <div className="fls-pod-core">
                                            <div className="fls-pod-inner">
                                                <div className="fls-pod-radial" style={{ background: `radial-gradient(circle at 50% 50%, ${s.glowColor}15, transparent)` }} />
                                                {/* Decorative lines */}
                                                <div className="fls-pod-crosshair" />
                                                <div className="fls-pod-orbit" />
                                            </div>
                                            {/* Icon */}
                                            <div className="fls-pod-icon" style={{ background: `linear-gradient(135deg, ${s.borderColor}, ${s.borderColor}dd)`, borderColor: `${s.borderColor}80` }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 28, color: "#fff" }}>{s.icon}</span>
                                            </div>
                                            {/* Bottom glow */}
                                            <div className="fls-pod-glow-bar" style={{ background: s.borderColor, boxShadow: `0 0 10px ${s.glowColor}` }} />
                                        </div>
                                        {/* Glass overlay */}
                                        <div className="fls-pod-glass" />
                                    </div>

                                    {/* Card */}
                                    <div className="fls-card">
                                        {/* Dots */}
                                        <div className="fls-card-dots">
                                            <div className={`fls-dot ${i === 0 ? "" : "fls-dot-dim"}`} />
                                            <div className={`fls-dot ${i === 1 ? s.dotColor : "fls-dot-dim"}`} />
                                            <div className={`fls-dot ${i === 2 ? s.dotColor : "fls-dot-dim"}`} style={i === 0 ? { background: s.borderColor, animation: "flsPulse 2s infinite" } : undefined} />
                                        </div>
                                        <div className="fls-card-label" style={{ borderLeftColor: s.borderColor }}>
                                            <span className="fls-card-code" style={{ color: s.borderColor }}>STEP {s.num} // {s.code}</span>
                                            <h3 className="fls-card-title">{s.title}</h3>
                                        </div>
                                        <p className="fls-card-desc">{s.desc}</p>
                                        <div className="fls-card-status">
                                            <div className="fls-status-row">
                                                <span>{s.progressLabel}</span>
                                                <span style={{ color: s.borderColor }}>{s.procId}</span>
                                            </div>
                                            <div className="fls-progress-track">
                                                <div className="fls-progress-bar" style={{ width: `${s.progress}%`, background: s.borderColor }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom Info Slab */}
                    <div className="fls-info-slab">
                        <div className="fls-info-decor" />
                        <div className="fls-info-content">
                            <div className="fls-info-icon-wrap">
                                <div className="fls-info-icon-bg" />
                                <span className="material-symbols-outlined fls-info-icon">assignment</span>
                                <div className="fls-scan-line" />
                            </div>
                            <div className="fls-info-text">
                                <div className="fls-info-title-row">
                                    <h2 className="fls-info-title">전용 구글 폼 스케줄링</h2>
                                    <span className="fls-info-badge">Auto-Form v1.2</span>
                                </div>
                                <p className="fls-info-desc">매월 1일 결제 후 발송되는 전용 구글 폼을 통해, 아이의 하교 시간과 타 학원 일정에 최적화된 시간표를 직접 설계하세요.</p>
                            </div>
                            <div className="fls-info-stats">
                                <div className="fls-stat">
                                    <div className="fls-stat-label">System Load</div>
                                    <div className="fls-stat-bars">
                                        <div className="fls-bar" style={{ height: 24, background: "#3b82f6" }} />
                                        <div className="fls-bar" style={{ height: 16, background: "#60a5fa" }} />
                                        <div className="fls-bar" style={{ height: 20, background: "#60a5fa" }} />
                                        <div className="fls-bar" style={{ height: 12, background: "#93c5fd" }} />
                                    </div>
                                </div>
                                <div className="fls-stat">
                                    <div className="fls-stat-label">Efficiency</div>
                                    <div className="fls-stat-value">99.9%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style>{`
/* ═══ SECTION ═══ */
.fls-section { position: relative; overflow: hidden; padding: clamp(60px,8vw,100px) 0; color: #1e293b; background: #fff; }
.fls-main { position: relative; z-index: 10; }

/* ── BG ── */
.fls-bg { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.fls-hex-pattern { position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg width='24' height='40' viewBox='0 0 24 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40c5.523 0 10-4.477 10-10V10c0-5.523-4.477-10-10-10s-10 4.477-10 10v20c0 5.523 4.477 10 10 10zM12 40c5.523 0 10-4.477 10-10V10c0-5.523-4.477-10-10-10S2 4.477 2 10v20c0 5.523 4.477 10 10 10z' fill='%2394a3b8' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E"); opacity: 0.6; }
.fls-grad-bottom { position: absolute; bottom: 0; left: 0; width: 100%; height: 50%; background: linear-gradient(to top, rgba(226,232,240,0.5), transparent); }
.fls-blob { position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none; }
.fls-blob-1 { top: 20%; left: 10%; width: 600px; height: 600px; background: rgba(147,197,253,0.1); }
.fls-blob-2 { bottom: 10%; right: 10%; width: 500px; height: 500px; background: rgba(103,232,249,0.1); }

/* ── Header ── */
.fls-header { text-align: center; margin-bottom: clamp(48px,6vw,100px); }
.fls-status-badge { display: inline-flex; align-items: center; justify-content: center; margin-bottom: 28px; position: relative; cursor: pointer; }
.fls-badge-glow { position: absolute; inset: 0; background: linear-gradient(90deg, #60a5fa, #22d3ee); filter: blur(16px); opacity: 0.2; transition: opacity 0.5s; }
.fls-status-badge:hover .fls-badge-glow { opacity: 0.4; }
.fls-badge-inner { position: relative; background: rgba(255,255,255,0.8); backdrop-filter: blur(8px); border: 1px solid #e2e8f0; padding: 8px 24px; border-radius: 999px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 12px; }
.fls-pulse-dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; animation: flsPulse 2s infinite; box-shadow: 0 0 8px #22c55e; }
.fls-badge-text { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.2em; color: #64748b; text-transform: uppercase; }

.fls-title { font-size: clamp(2.8rem,6vw,4.5rem); font-weight: 900; color: #1e293b; line-height: 1.1; letter-spacing: -0.02em; position: relative; display: inline-block; margin-bottom: 24px; }
.fls-title-watermark { position: absolute; top: -40px; left: -40px; font-size: clamp(5rem,10vw,9rem); font-weight: 700; color: #f1f5f9; z-index: -1; user-select: none; opacity: 0.5; font-family: 'JetBrains Mono', monospace; }
.fls-title-accent { background: linear-gradient(135deg, #2563eb, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.fls-subtitle { display: flex; align-items: center; justify-content: center; gap: 16px; color: #64748b; }
.fls-subtitle-line { display: inline-block; height: 1px; width: 48px; background: #cbd5e1; }
.fls-subtitle-text { font-family: 'JetBrains Mono', monospace; font-size: 13px; text-transform: uppercase; color: #94a3b8; }

/* ── Steps Area ── */
.fls-steps-area { position: relative; max-width: 1200px; margin: 0 auto 80px; }
.fls-connector { display: none; position: absolute; top: 96px; left: 16%; width: 68%; height: 2px; z-index: 0; }
@media (min-width: 1024px) { .fls-connector { display: block; } }
.fls-connector-line { position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(191,219,254,0.6), transparent); }
.fls-shimmer { position: absolute; top: -1px; height: 4px; width: 96px; border-radius: 999px; filter: blur(2px); animation: flsShimmer 4s linear infinite; }
.fls-shimmer-1 { left: 0; background: linear-gradient(90deg, transparent, #60a5fa, transparent); }
.fls-shimmer-2 { left: 33%; background: linear-gradient(90deg, transparent, #22d3ee, transparent); animation-delay: 1.5s; }

.fls-steps-grid { display: grid; grid-template-columns: 1fr; gap: 48px; }
@media (min-width: 768px) { .fls-steps-grid { grid-template-columns: repeat(3, 1fr); gap: 48px; } }
@media (min-width: 1024px) { .fls-steps-grid { gap: 64px; } }

/* ── Iso Pod ── */
.fls-step { position: relative; }
.fls-pod { position: relative; width: 192px; height: 192px; margin: 0 auto 40px; cursor: pointer; transition: transform 0.5s cubic-bezier(0.4,0,0.2,1); }
.fls-pod:hover { transform: scale(1.05) translateY(-8px); }
.fls-pod-ring { position: absolute; inset: -5px; border-radius: 50%; background: conic-gradient(from 180deg, transparent 0deg, var(--pod-color) 30deg, transparent 60deg); animation: flsSpin 4s linear infinite; mask-image: radial-gradient(circle, transparent 65%, black 70%); -webkit-mask-image: radial-gradient(circle, transparent 65%, black 70%); opacity: 0.6; }
.fls-pod-core { position: absolute; inset: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; z-index: 10; border: 1px solid rgba(255,255,255,0.5); background: linear-gradient(145deg, #fff, #e6e6e6); box-shadow: 20px 20px 60px #d1d5db, -20px -20px 60px #fff, inset 5px 5px 10px rgba(0,0,0,0.05), inset -5px -5px 10px rgba(255,255,255,0.8); }
.fls-pod-inner { position: absolute; inset: 16px; border-radius: 50%; background: linear-gradient(145deg, #eef2f7, #e2e8f0); box-shadow: inset 0 4px 12px rgba(0,0,0,0.1); overflow: hidden; display: flex; align-items: center; justify-content: center; }
.fls-pod-radial { position: absolute; inset: 0; }
.fls-pod-crosshair { position: absolute; width: 100%; height: 1px; background: #e2e8f0; }
.fls-pod-crosshair::after { content: ''; position: absolute; width: 1px; height: 192px; background: #e2e8f0; left: 50%; top: -50%; }
.fls-pod-orbit { width: 75%; height: 75%; border-radius: 50%; border: 1px dashed #e2e8f0; animation: flsSpin 20s linear infinite; }
.fls-pod-icon { position: relative; z-index: 20; width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(0,0,0,0.15); border: 1px solid; transition: transform 0.3s; }
.group:hover .fls-pod-icon { transform: rotate(12deg); }
.fls-pod-glow-bar { position: absolute; bottom: 24px; width: 48px; height: 4px; border-radius: 999px; filter: blur(2px); }
.fls-pod-glass { position: absolute; inset: -10px; border-radius: 50%; z-index: 20; pointer-events: none; background: linear-gradient(135deg, rgba(255,255,255,0.08), transparent); border: 1px solid rgba(255,255,255,0.3); box-shadow: inset 0 0 20px rgba(14,165,233,0.05), 0 4px 6px rgba(0,0,0,0.03); }

/* ── Card ── */
.fls-card { background: rgba(255,255,255,0.65); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.5); border-bottom: 4px solid rgba(200,210,230,0.4); border-right: 4px solid rgba(200,210,230,0.4); box-shadow: 10px 10px 30px rgba(0,0,0,0.05), -5px -5px 15px rgba(255,255,255,0.8); border-radius: 16px; padding: 28px; position: relative; overflow: hidden; transition: background 0.3s; }
.group:hover .fls-card { background: rgba(255,255,255,0.7); }
.fls-card-dots { position: absolute; top: 16px; right: 16px; display: flex; gap: 4px; }
.fls-dot { width: 4px; height: 4px; border-radius: 50%; background: #94a3b8; }
.fls-dot-dim { background: #94a3b8; }
.fls-card-label { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; border-left: 2px solid; padding-left: 14px; }
.fls-card-code { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; }
.fls-card-title { font-size: 22px; font-weight: 700; color: #1e293b; letter-spacing: -0.02em; }
.fls-card-desc { font-size: 14px; color: #64748b; font-weight: 500; line-height: 1.6; margin-bottom: 14px; }
.fls-card-status { background: rgba(248,250,252,0.5); border-radius: 6px; padding: 8px; border: 1px solid rgba(226,232,240,0.5); backdrop-filter: blur(4px); }
.fls-status-row { display: flex; justify-content: space-between; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #94a3b8; text-transform: uppercase; }
.fls-progress-track { width: 100%; height: 4px; background: #e2e8f0; border-radius: 999px; margin-top: 6px; overflow: hidden; }
.fls-progress-bar { height: 100%; border-radius: 999px; transition: width 1s ease; }

/* ── Info Slab ── */
.fls-info-slab { max-width: 960px; margin: 0 auto; background: rgba(255,255,255,0.65); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.5); border-bottom: 4px solid rgba(200,210,230,0.4); border-right: 4px solid rgba(200,210,230,0.4); box-shadow: 10px 10px 30px rgba(0,0,0,0.05), -5px -5px 15px rgba(255,255,255,0.8), 0 25px 50px -12px rgba(0,0,0,0.15); border-radius: 20px; padding: clamp(24px,4vw,48px); position: relative; overflow: hidden; transition: transform 0.5s; }
.fls-info-slab:hover { transform: scale(1.01); }
@media (max-width: 640px) {
  .fls-info-slab { border-radius: 16px; margin: 0 16px; }
  .fls-info-title { font-size: 18px !important; }
  .fls-info-desc { font-size: 14px !important; }
  .fls-info-icon-wrap { width: 72px !important; height: 72px !important; }
  .fls-pod { width: 140px !important; height: 140px !important; }
}
.fls-info-decor { position: absolute; top: 0; right: 0; width: 256px; height: 256px; opacity: 0.1; background-image: url("data:image/svg+xml,%3Csvg fill='none' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10 L 90 10 L 90 90' stroke='%230ea5e9' stroke-width='2'/%3E%3Ccircle cx='90' cy='90' fill='%230ea5e9' r='4'/%3E%3Cpath d='M30 30 L 70 30 L 70 70' stroke='%230ea5e9' stroke-width='2'/%3E%3Ccircle cx='70' cy='70' fill='%230ea5e9' r='3'/%3E%3C/svg%3E"); background-size: contain; background-repeat: no-repeat; }
.fls-info-content { display: flex; flex-direction: column; gap: 24px; position: relative; z-index: 10; }
@media (min-width: 768px) { .fls-info-content { flex-direction: row; align-items: center; gap: 36px; } }
.fls-info-icon-wrap { width: 96px; height: 96px; border-radius: 16px; background: linear-gradient(135deg, #f1f5f9, #fff); box-shadow: 20px 20px 60px #bebebe, -20px -20px 60px #fff, inset 2px 2px 5px rgba(255,255,255,0.8), inset -2px -2px 5px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; border: 1px solid #fff; flex-shrink: 0; position: relative; overflow: hidden; }
.fls-info-icon-bg { position: absolute; top: -40px; left: -40px; width: 80px; height: 80px; background: rgba(96,165,250,0.2); border-radius: 50%; filter: blur(20px); }
.fls-info-icon { font-size: 48px; color: #2563eb; position: relative; z-index: 10; }
.fls-scan-line { position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: rgba(96,165,250,0.5); filter: blur(2px); animation: flsScan 2s linear infinite; }
.fls-info-text { flex: 1; }
.fls-info-title-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
.fls-info-title { font-size: 22px; font-weight: 700; color: #1e293b; letter-spacing: -0.02em; }
.fls-info-badge { padding: 2px 8px; background: #dbeafe; color: #2563eb; font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border-radius: 4px; border: 1px solid #93c5fd; }
.fls-info-desc { font-size: 16px; color: #64748b; line-height: 1.7; font-weight: 500; }
.fls-info-stats { display: none; flex-direction: column; gap: 14px; min-width: 140px; border-left: 1px solid #cbd5e1; padding-left: 28px; }
@media (min-width: 768px) { .fls-info-stats { display: flex; } }
.fls-stat-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 4px; text-align: right; }
.fls-stat-bars { display: flex; gap: 4px; justify-content: flex-end; }
.fls-bar { width: 6px; border-radius: 2px; }
.fls-stat-value { font-family: 'JetBrains Mono', monospace; font-size: 22px; font-weight: 700; color: #2563eb; text-align: right; }

/* ═══ Keyframes ═══ */
@keyframes flsSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes flsPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
@keyframes flsShimmer { 0% { transform: translateX(0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateX(800px); opacity: 0; } }
@keyframes flsScan { 0% { top: 0; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
                `}</style>
            </section>
        </>
    );
}
