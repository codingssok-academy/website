"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Info, ShieldCheck, UserRound } from "lucide-react";
import { STUDENT_KEY } from "../lib/studentAccess";

const APP_VERSION = "2.0.0";

export default function ParentSettingsPage() {
    const [studentName, setStudentName] = useState("");

    useEffect(() => {
        setStudentName(localStorage.getItem(STUDENT_KEY) ?? "");
    }, []);

    return (
        <div style={pageStyle}>
            <header style={headerStyle}>
                <div style={eyebrowStyle}>앱 설정</div>
                <h1 style={titleStyle}>설정</h1>
            </header>

            <section style={cardStyle}>
                <div style={studentRowStyle}>
                    <div style={primaryIconStyle}>
                        <UserRound size={23} strokeWidth={2.4} />
                    </div>
                    <div style={studentTextStyle}>
                        <div style={labelStyle}>연결된 학생</div>
                        <div style={studentNameStyle}>{studentName || "-"}</div>
                    </div>
                </div>
            </section>

            <section style={infoCardStyle}>
                <SettingsRow
                    icon={<Info size={20} strokeWidth={2.3} />}
                    label="버전"
                    value={`v${APP_VERSION}`}
                />
                <SettingsRow
                    icon={<ShieldCheck size={20} strokeWidth={2.3} />}
                    label="서비스"
                    value="코딩쏙 학부모 앱"
                    divider={false}
                />
            </section>

            <div style={footerStyle}>코딩쏙 학부모 앱 v{APP_VERSION}</div>
        </div>
    );
}

function SettingsRow({
    icon,
    label,
    value,
    divider = true,
}: {
    icon: ReactNode;
    label: string;
    value: string;
    divider?: boolean;
}) {
    return (
        <div style={{ ...rowStyle, borderBottom: divider ? "1px solid #f1f5f9" : "none" }}>
            <div style={secondaryIconStyle}>{icon}</div>
            <div style={rowLabelStyle}>{label}</div>
            <div style={rowValueStyle}>{value}</div>
        </div>
    );
}

const pageStyle: CSSProperties = {
    maxWidth: 480,
    margin: "0 auto",
    padding: "20px 16px 16px",
};

const headerStyle: CSSProperties = {
    marginBottom: 20,
};

const eyebrowStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
    lineHeight: 1.35,
};

const titleStyle: CSSProperties = {
    margin: "2px 0 0",
    fontSize: 28,
    lineHeight: 1.15,
    fontWeight: 950,
    color: "#020617",
};

const cardStyle: CSSProperties = {
    marginBottom: 14,
    padding: 16,
    borderRadius: 8,
    background: "#fff",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 10px rgba(15,23,42,0.06)",
};

const studentRowStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 14,
    minHeight: 54,
};

const primaryIconStyle: CSSProperties = {
    width: 50,
    height: 50,
    borderRadius: 8,
    background: "#2563eb",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
};

const studentTextStyle: CSSProperties = {
    minWidth: 0,
    flex: 1,
};

const labelStyle: CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    color: "#64748b",
    lineHeight: 1.35,
};

const studentNameStyle: CSSProperties = {
    marginTop: 2,
    fontSize: 28,
    lineHeight: 1.12,
    fontWeight: 950,
    color: "#020617",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
};

const infoCardStyle: CSSProperties = {
    marginBottom: 14,
    overflow: "hidden",
    borderRadius: 8,
    background: "#fff",
    border: "1px solid #e2e8f0",
    boxShadow: "0 1px 10px rgba(15,23,42,0.06)",
};

const rowStyle: CSSProperties = {
    minHeight: 58,
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 14px",
};

const secondaryIconStyle: CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: 8,
    background: "#f1f5f9",
    color: "#334155",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
};

const rowLabelStyle: CSSProperties = {
    flex: 1,
    fontSize: 15,
    fontWeight: 900,
    color: "#1e293b",
};

const rowValueStyle: CSSProperties = {
    maxWidth: "58%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    textAlign: "right",
    fontSize: 13,
    fontWeight: 800,
    color: "#64748b",
};

const footerStyle: CSSProperties = {
    marginTop: 22,
    textAlign: "center",
    fontSize: 11,
    fontWeight: 800,
    color: "#cbd5e1",
};
