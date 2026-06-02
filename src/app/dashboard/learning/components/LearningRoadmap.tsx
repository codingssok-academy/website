"use client";
import { useState } from "react";
import { motion } from "framer-motion";

interface RoadmapNode {
    id: string; name: string; icon: string; color: string;
    status: "completed" | "current" | "locked";
    path: string; problems: number; desc: string;
}

interface Props {
    nodes: RoadmapNode[];
    onNodeClick: (node: RoadmapNode) => void;
}

export function LearningRoadmap({ nodes, onNodeClick }: Props) {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null);

    return (
        <div style={{ position: "relative", padding: "40px 20px", overflowX: "auto" }}>
            {/* Roadmap path line */}
            <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}>
                {nodes.map((node, i) => {
                    if (i === 0) return null;
                    const x1 = 80 + (i - 1) * 160;
                    const x2 = 80 + i * 160;
                    const y = 100;
                    const isCompleted = nodes[i - 1].status === "completed";
                    return (
                        <motion.line key={`line-${i}`} x1={x1} y1={y} x2={x2} y2={y}
                            stroke={isCompleted ? "#3b82f6" : "#e2e8f0"} strokeWidth={4} strokeLinecap="round"
                            strokeDasharray={isCompleted ? "0" : "8 8"}
                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                        />
                    );
                })}
            </svg>

            {/* Nodes */}
            <div style={{ display: "flex", gap: 80, position: "relative", zIndex: 1, minWidth: nodes.length * 160 }}>
                {nodes.map((node, i) => {
                    const isHovered = hoveredNode === node.id;
                    const statusColors = {
                        completed: { bg: "#dbeafe", border: "#3b82f6", shadow: "0 4px 20px rgba(59,130,246,0.3)" },
                        current: { bg: "#eff6ff", border: "#2563eb", shadow: "0 4px 24px rgba(37,99,235,0.4)" },
                        locked: { bg: "#f8fafc", border: "#e2e8f0", shadow: "0 2px 8px rgba(0,0,0,0.05)" },
                    };
                    const s = statusColors[node.status];

                    return (
                        <motion.div key={node.id}
                            initial={{ opacity: 0, y: 30, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: i * 0.12, type: "spring", stiffness: 200 }}
                            onClick={() => node.status !== "locked" && onNodeClick(node)}
                            onMouseEnter={() => setHoveredNode(node.id)}
                            onMouseLeave={() => setHoveredNode(null)}
                            style={{
                                display: "flex", flexDirection: "column", alignItems: "center", cursor: node.status !== "locked" ? "pointer" : "not-allowed",
                                minWidth: 80,
                            }}
                        >
                            {/* Node circle */}
                            <motion.div
                                animate={{
                                    scale: isHovered && node.status !== "locked" ? 1.15 : 1,
                                    boxShadow: isHovered ? s.shadow : "0 2px 8px rgba(0,0,0,0.08)",
                                }}
                                style={{
                                    width: 72, height: 72, borderRadius: "50%", background: s.bg,
                                    border: `3px solid ${s.border}`, display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 28, position: "relative", transition: "all 0.3s",
                                    filter: node.status === "locked" ? "grayscale(0.8) opacity(0.5)" : "none",
                                }}
                            >
                                {node.icon}
                                {node.status === "completed" && (
                                    <div style={{
                                        position: "absolute", top: -4, right: -4, width: 22, height: 22,
                                        background: "#22c55e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 12, color: "#fff", border: "2px solid #fff",
                                    }}>✓</div>
                                )}
                                {node.status === "current" && (
                                    <motion.div
                                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        style={{
                                            position: "absolute", inset: -6, borderRadius: "50%",
                                            border: "2px solid #2563eb", pointerEvents: "none",
                                        }}
                                    />
                                )}
                                {node.status === "locked" && (
                                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}></div>
                                )}
                            </motion.div>

                            {/* Label */}
                            <div style={{ marginTop: 12, textAlign: "center" }}>
                                <div style={{
                                    fontSize: 13, fontWeight: 700, color: node.status === "locked" ? "#94a3b8" : "#1e293b",
                                    whiteSpace: "nowrap",
                                }}>{node.name}</div>
                                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{node.problems}문제</div>
                            </div>

                            {/* Tooltip on hover */}
                            {isHovered && node.status !== "locked" && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        position: "absolute", top: -60, background: "#fff", border: "1px solid #e2e8f0",
                                        borderRadius: 12, padding: "10px 14px", boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                        fontSize: 11, color: "#475569", whiteSpace: "nowrap", zIndex: 10,
                                    }}
                                >
                                    {node.desc}
                                    <div style={{
                                        position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%) rotate(45deg)",
                                        width: 10, height: 10, background: "#fff", borderRight: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0",
                                    }} />
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
