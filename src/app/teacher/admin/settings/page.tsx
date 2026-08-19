"use client";

import { useState, useCallback, useEffect } from "react";
import { useAdmin } from "../context";
import type { TeacherAccount } from "../types";

/* ═══════════════════════════════════════
   계정 설정
   /teacher/admin/settings
   ═══════════════════════════════════════ */

const sortAccounts = (accounts: TeacherAccount[]) =>
    [...accounts].sort((a, b) => {
        const rc = (a.role || "").localeCompare(b.role || "");
        if (rc !== 0) return rc;
        return (a.display_name || a.name || a.email || "").localeCompare(
            b.display_name || b.name || b.email || "", "ko",
        );
    });

export default function SettingsPage() {
    const { currentTeacher } = useAdmin();

    const [name, setName] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [accounts, setAccounts] = useState<TeacherAccount[]>([]);

    const [accountLoading, setAccountLoading] = useState(false);
    const [accountSaving, setAccountSaving] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [formerAdminRemoving, setFormerAdminRemoving] = useState(false);
    const [accountMsg, setAccountMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null);
    const [warning, setWarning] = useState("");

    const loadAccount = useCallback(async () => {
        setAccountLoading(true); setAccountMsg(null);
        try {
            const res = await fetch("/api/teacher/account", { cache: "no-store" });
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || "불러오기 실패");
            const current = result.current as TeacherAccount | null;
            setAccounts(sortAccounts(result.accounts || (current ? [current] : [])));
            setName(current?.name || "");
            setDisplayName(current?.display_name || "");
            setWarning(result.warning || "");
        } catch (err: unknown) {
            setAccountMsg({ ok: false, text: `오류: ${err instanceof Error ? err.message : String(err)}` });
        } finally { setAccountLoading(false); }
    }, []);

    useEffect(() => { loadAccount(); }, [loadAccount]);

    const saveAccount = async () => {
        if (!displayName.trim()) { setAccountMsg({ ok: false, text: "표시 이름을 입력해주세요." }); return; }
        setAccountSaving(true); setAccountMsg(null);
        try {
            const res = await fetch("/api/teacher/account", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), displayName: displayName.trim() }),
            });
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || "저장 실패");
            setAccountMsg({ ok: true, text: result.message || "저장되었습니다." });
            loadAccount();
        } catch (err: unknown) {
            setAccountMsg({ ok: false, text: `오류: ${err instanceof Error ? err.message : String(err)}` });
        } finally { setAccountSaving(false); }
    };

    const changePassword = async () => {
        if (password.length < 8) { setPasswordMsg({ ok: false, text: "8자 이상" }); return; }
        if (password !== passwordConfirm) { setPasswordMsg({ ok: false, text: "비밀번호 불일치" }); return; }
        setPasswordSaving(true); setPasswordMsg(null);
        try {
            const res = await fetch("/api/teacher/account", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || "변경 실패");
            setPassword(""); setPasswordConfirm("");
            setPasswordMsg({ ok: true, text: result.message || "비밀번호가 변경되었습니다." });
        } catch (err: unknown) {
            setPasswordMsg({ ok: false, text: `오류: ${err instanceof Error ? err.message : String(err)}` });
        } finally { setPasswordSaving(false); }
    };

    const removeFormerAdministrator = async () => {
        if (!window.confirm("구자현 관리자 계정 3개를 모두 삭제합니다. 계속하시겠습니까?")) return;

        setFormerAdminRemoving(true);
        setAccountMsg(null);
        try {
            const res = await fetch("/api/teacher/account", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "removeFormerAdministrator",
                    confirmationName: "구자현",
                }),
            });
            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.error || "계정 삭제 실패");
            setAccountMsg({ ok: true, text: result.message || "구자현 관리자 계정을 삭제했습니다." });
            await loadAccount();
        } catch (err: unknown) {
            setAccountMsg({ ok: false, text: `오류: ${err instanceof Error ? err.message : String(err)}` });
        } finally {
            setFormerAdminRemoving(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: "100%", padding: "10px 14px", borderRadius: 10,
        border: "1px solid #e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box",
    };

    return (
        <div style={{ maxWidth: 600 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#172554", margin: "0 0 24px" }}>계정 설정</h2>

            {warning && (
                <div style={{
                    padding: "10px 14px", borderRadius: 10, marginBottom: 16,
                    background: "#FFFBEB", border: "1px solid #FDE68A",
                    fontSize: 12, color: "#92400e",
                }}>⚠️ {warning}</div>
            )}

            {/* 프로필 */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0", marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#172554", margin: "0 0 16px" }}>프로필 정보</h3>

                {accountLoading ? (
                    <div style={{ color: "#94a3b8", fontSize: 13 }}>불러오는 중...</div>
                ) : (
                    <>
                        <div style={{ marginBottom: 12 }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>이메일</label>
                            <div style={{ ...inputStyle, background: "#f8fafc", color: "#94a3b8" }}>
                                {currentTeacher?.email || "-"}
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>이름</label>
                                <input value={name} onChange={e => setName(e.target.value)} placeholder="이름" style={inputStyle} />
                            </div>
                            <div>
                                <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>표시 이름 *</label>
                                <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="표시 이름" style={inputStyle} />
                            </div>
                        </div>

                        {accountMsg && (
                            <div style={{
                                padding: "8px 12px", borderRadius: 8, marginBottom: 12,
                                background: accountMsg.ok ? "#F0FDF4" : "#FEF2F2",
                                fontSize: 12, color: accountMsg.ok ? "#16a34a" : "#DC2626",
                            }}>{accountMsg.text}</div>
                        )}

                        <button onClick={saveAccount} disabled={accountSaving} style={{
                            padding: "10px 20px", borderRadius: 10, border: "none",
                            background: accountSaving ? "#94a3b8" : "#2563eb",
                            color: "#fff", fontSize: 13, fontWeight: 700, cursor: accountSaving ? "not-allowed" : "pointer",
                        }}>
                            {accountSaving ? "저장 중..." : "프로필 저장"}
                        </button>
                    </>
                )}
            </div>

            {/* 비밀번호 */}
            <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0", marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#172554", margin: "0 0 16px" }}>비밀번호 변경</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>새 비밀번호</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="8자 이상" style={inputStyle} />
                    </div>
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", display: "block", marginBottom: 4 }}>비밀번호 확인</label>
                        <input type="password" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}
                            placeholder="비밀번호 확인" style={inputStyle} />
                    </div>
                </div>

                {passwordMsg && (
                    <div style={{
                        padding: "8px 12px", borderRadius: 8, marginBottom: 12,
                        background: passwordMsg.ok ? "#F0FDF4" : "#FEF2F2",
                        fontSize: 12, color: passwordMsg.ok ? "#16a34a" : "#DC2626",
                    }}>{passwordMsg.text}</div>
                )}

                <button onClick={changePassword} disabled={passwordSaving} style={{
                    padding: "10px 20px", borderRadius: 10, border: "none",
                    background: passwordSaving ? "#94a3b8" : "#475569",
                    color: "#fff", fontSize: 13, fontWeight: 700, cursor: passwordSaving ? "not-allowed" : "pointer",
                }}>
                    {passwordSaving ? "변경 중..." : "비밀번호 변경"}
                </button>
            </div>

            {/* 선생님 계정 목록 */}
            {accounts.length > 1 && (
                <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1px solid #e2e8f0" }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#172554", margin: "0 0 12px" }}>
                        선생님 계정 ({accounts.length})
                    </h3>
                    <div style={{ display: "grid", gap: 6 }}>
                        {accounts.map(acc => (
                            <div key={acc.id} style={{
                                padding: "10px 14px", borderRadius: 10, background: "#f8fafc",
                                border: acc.id === currentTeacher?.id ? "2px solid #2563eb" : "1px solid #f1f5f9",
                                display: "flex", alignItems: "center", gap: 10, fontSize: 13,
                            }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: 8, background: "#dbeafe",
                                    color: "#1d4ed8", fontSize: 11, fontWeight: 800,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    {(acc.display_name || acc.name || "?")[0]}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: "#172554" }}>{acc.display_name || acc.name || acc.email}</div>
                                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{acc.email}</div>
                                </div>
                                <span style={{
                                    fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                                    background: acc.role === "admin" ? "#FEF3C7" : "#DBEAFE",
                                    color: acc.role === "admin" ? "#92400e" : "#1d4ed8",
                                }}>
                                    {acc.role === "admin" ? "관리자" : "선생님"}
                                </span>
                            </div>
                        ))}
                    </div>
                    {accounts.some(acc => (acc.display_name || acc.name || "").startsWith("구자현")) && (
                        <button
                            onClick={removeFormerAdministrator}
                            disabled={formerAdminRemoving}
                            style={{
                                marginTop: 16, padding: "10px 16px", borderRadius: 10,
                                border: "1px solid #fecaca", background: "#fff1f2",
                                color: "#be123c", fontSize: 12, fontWeight: 700,
                                cursor: formerAdminRemoving ? "not-allowed" : "pointer",
                            }}
                        >
                            {formerAdminRemoving ? "삭제 중..." : "구자현 이전 관리자 계정 삭제"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
