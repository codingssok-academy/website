"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { PARENT_STUDENT_KEY } from "@/lib/parent-client-auth";

const APP_VERSION = "2.0.0";

const cardClass =
    "bg-white rounded-[20px] overflow-hidden shadow-[0_1px_8px_rgba(0,0,0,0.06),0_0_0_1px_rgba(226,232,240,0.8)]";
const sectionLabel =
    "text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2.5 pl-1";

export default function ParentSettingsPage() {
    const [studentName, setStudentName] = useState("");

    useEffect(() => {
        setStudentName(localStorage.getItem(PARENT_STUDENT_KEY) ?? "");
    }, []);

    return (
        <div className="px-4 pt-5 pb-2 max-w-[480px] mx-auto">
            <div className="mb-7">
                <div className="text-[13px] text-slate-500 font-semibold mb-0.5">앱 설정</div>
                <div className="text-xl font-black text-slate-900">설정</div>
            </div>

            <section className="mb-5">
                <div className={sectionLabel}>학생 정보</div>
                <div className={cardClass}>
                    <SettingsRow
                        icon="person"
                        iconBg="bg-blue-50"
                        iconColor="text-blue-600"
                        label="연결된 학생"
                        value={studentName || "-"}
                        divider={false}
                    />
                </div>
            </section>

            <section className="mb-5">
                <div className={sectionLabel}>앱 정보</div>
                <div className={cardClass}>
                    <SettingsRow
                        icon="info"
                        iconBg="bg-blue-50"
                        iconColor="text-blue-600"
                        label="버전"
                        value={`v${APP_VERSION}`}
                    />
                    <SettingsRow
                        icon="school"
                        iconBg="bg-green-50"
                        iconColor="text-green-600"
                        label="서비스"
                        value="코딩쏙 학부모 앱"
                        divider={false}
                    />
                </div>
            </section>

            <div className="text-center mt-8 text-[11px] text-slate-300 font-semibold">
                코딩쏙 학부모 앱 v{APP_VERSION}
            </div>
        </div>
    );
}

function SettingsRow({
    icon,
    iconBg,
    iconColor,
    label,
    value,
    divider = true,
}: {
    icon: string;
    iconBg: string;
    iconColor: string;
    label: string;
    value: string;
    divider?: boolean;
}) {
    return (
        <div className={`flex items-center gap-3.5 px-5 py-3.5 ${divider ? "border-b border-slate-50" : ""}`}>
            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined text-xl ${iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {icon}
                </span>
            </div>
            <div className="text-sm font-bold text-gray-700 flex-1">{label}</div>
            <div className="text-[13px] text-slate-500 font-semibold">{value}</div>
        </div>
    );
}
