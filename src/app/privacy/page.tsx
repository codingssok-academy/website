import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "개인정보 처리방침 | 코딩쏙학원",
    description: "코딩쏙학원 학부모포털 개인정보 처리방침",
    robots: { index: true, follow: true },
};

/**
 * 개인정보 처리방침 페이지 — Play Store 등록 필수.
 *
 * 담당자이 채워야 할 항목 (TODO 주석 표시):
 * - 사업자 정보 (상호, 대표자, 사업자 등록번호, 주소, 연락처)
 * - 개인정보 보호책임자 (이름, 직책, 이메일)
 * - 시행일자
 *
 * 자동으로 들어간 항목:
 * - 수집 정보 (가입 이메일, 자녀 학습 진행, 출석)
 * - 처리 위탁 (Supabase 클라우드 DB, Vercel 호스팅, Notion 피드백)
 * - 학생 데이터 보호 (만 14세 미만 보호자 동의)
 */
export default function PrivacyPolicyPage() {
    return (
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px 80px", fontSize: 14, lineHeight: 1.8, color: "#334155" }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>개인정보 처리방침</h1>
            <p style={{ color: "#64748b", marginBottom: 32 }}>
                시행일자: 2026년 5월 7일
            </p>

            <Section title="1. 총칙">
                코딩쏙학원(이하 &quot;학원&quot;)은 학생과 학부모의 개인정보를 중요시하며, 「개인정보 보호법」을 준수합니다.
                본 처리방침은 학부모포털 앱 및 코딩쏙학원 웹사이트(codingssok.com)에 적용됩니다.
            </Section>

            <Section title="2. 수집하는 개인정보 항목">
                <ul style={listStyle}>
                    <li><b>학생 가입 시</b>: 이름, 이메일, 학년, 학습 기록(완료 단원, 퀴즈/문제 응답, XP)</li>
                    <li><b>학부모 가입 시</b>: 이름, 이메일, 자녀와의 관계</li>
                    <li><b>자동 수집</b>: 접속 IP, 브라우저 종류, 쿠키, 학습 활동 시간</li>
                </ul>
            </Section>

            <Section title="3. 개인정보의 수집 및 이용 목적">
                <ul style={listStyle}>
                    <li>학습 콘텐츠 제공 및 개인 맞춤 학습 진행</li>
                    <li>학부모 대시보드를 통한 자녀 학습 현황 공유</li>
                    <li>출석, 과제, 성적, 선생님 피드백 알림</li>
                    <li>서비스 개선을 위한 통계 분석 (개인 식별 불가능 형태)</li>
                </ul>
            </Section>

            <Section title="4. 개인정보의 보유 및 이용 기간">
                회원 탈퇴 시 즉시 파기합니다. 단, 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
                <ul style={listStyle}>
                    <li>학습 기록: 회원 탈퇴 시까지 (탈퇴 후 30일 내 삭제)</li>
                    <li>접속 로그: 3개월 (통신비밀보호법)</li>
                </ul>
            </Section>

            <Section title="5. 개인정보의 처리 위탁">
                서비스 제공을 위해 다음 업체에 개인정보 처리를 위탁합니다.
                <ul style={listStyle}>
                    <li><b>Supabase (Supabase, Inc.)</b>: 데이터베이스 호스팅 (학습 기록 저장)</li>
                    <li><b>Vercel (Vercel, Inc.)</b>: 웹사이트 호스팅</li>
                    <li><b>Notion Labs, Inc.</b>: 학부모 피드백 수집</li>
                    <li><b>Google LLC (Web Push)</b>: 알림 전송</li>
                </ul>
                위탁받은 업체는 개인정보 보호법에 따라 안전하게 관리하며, 위탁 목적 외 이용을 금합니다.
            </Section>

            <Section title="6. 만 14세 미만 아동의 개인정보">
                학원은 만 14세 미만 아동의 개인정보를 수집할 때 법정대리인(부모/보호자)의 동의를 받습니다.
                법정대리인은 언제든지 자녀의 개인정보 열람·정정·삭제·처리정지를 요청할 수 있습니다.
            </Section>

            <Section title="7. 정보주체의 권리">
                정보주체는 언제든지 개인정보 열람·정정·삭제·처리정지를 요청할 수 있습니다.
                요청은 아래 개인정보 보호책임자에게 연락 또는 학부모포털의 &quot;설정&quot; 메뉴를 통해 가능합니다.
            </Section>

            <Section title="8. 개인정보의 안전성 확보 조치">
                <ul style={listStyle}>
                    <li>HTTPS(TLS) 통신 암호화</li>
                    <li>비밀번호 단방향 해시 저장</li>
                    <li>접근권한 관리 (최소 권한 원칙)</li>
                    <li>주요 작업 로그 보관</li>
                </ul>
            </Section>

            <Section title="9. 쿠키의 운영">
                서비스는 사용자 경험 향상을 위해 쿠키를 사용합니다. 쿠키 거부 시 일부 기능이 제한될 수 있습니다.
                브라우저 설정에서 쿠키를 거부할 수 있습니다.
            </Section>

            <Section title="10. 개인정보 보호책임자">
                <ul style={listStyle}>
                    <li>성명: 장민</li>
                    <li>직책: 원장</li>
                    <li>이메일: director@codingssok.com</li>
                    <li>전화: 010-7566-7229</li>
                </ul>
            </Section>

            <Section title="11. 사업자 정보">
                <ul style={listStyle}>
                    <li>상호: 코딩쏙학원</li>
                    <li>대표자: 장민</li>
                    <li>사업자 등록번호: 668-96-01962</li>
                    <li>주소: 대전 유성구 관평동 806, 5층</li>
                    <li>전화: 010-7566-7229</li>
                    <li>이메일: director@codingssok.com</li>
                </ul>
            </Section>

            <Section title="12. 처리방침 변경">
                본 처리방침은 법령·정책 또는 보안기술의 변경에 따라 내용 추가·삭제·수정될 수 있으며,
                변경 시 학부모포털 공지사항을 통해 사전 안내합니다.
            </Section>

            <p style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #e2e8f0", color: "#64748b", fontSize: 13 }}>
                본 개인정보 처리방침에 관한 문의는 위 개인정보 보호책임자 이메일로 연락 주시기 바랍니다.
            </p>
        </div>
    );
}

const listStyle: React.CSSProperties = {
    paddingLeft: 20,
    marginTop: 8,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1e293b", marginBottom: 12 }}>{title}</h2>
            <div style={{ color: "#475569" }}>{children}</div>
        </section>
    );
}
