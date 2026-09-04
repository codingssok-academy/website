import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const EXPECTED_TEST_URL = "https://opcdcuedhwyuyhzaubpu.supabase.co";
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const publishableKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
const secretKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
const baseUrl = (process.env.FRESH_TEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

assert(supabaseUrl === EXPECTED_TEST_URL, "안전 중단: 지정된 fresh-test DB가 아닙니다.");
assert(process.env.SUPABASE_ACCESS_CODE_MODE === "hashed", "안전 중단: hashed 시험 모드가 아닙니다.");
assert(publishableKey.startsWith("sb_publishable_"), "시험 DB 공개키가 없습니다.");
assert(secretKey.startsWith("sb_secret_"), "시험 DB 서버 키가 없습니다.");
assert(/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(baseUrl), "안전 중단: 로컬 홈페이지 주소가 아닙니다.");

const admin = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});
const publicClient = createClient(supabaseUrl, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const runId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
const fakeName = `가짜파일검사${runId.slice(-6)}`;
const fakeSchool = "가짜테스트초등학교";
const parentCode = "53842";
const studentPin = "2468";
const teacherEmail = `fake_teacher_${runId}@codingssok.local`;
const teacherPassword = `FakeTeacher!${runId}`;
const teacherName = `가짜선생님${runId.slice(-5)}`;

let studentId = null;
let studentAuthUserId = null;
let teacherAuthUserId = null;
let uploadedFile = null;

async function jsonRequest(path, init = {}) {
    const response = await fetch(`${baseUrl}${path}`, init);
    const body = await response.json().catch(() => null);
    return { response, body };
}

async function makeSessionCookie(session) {
    const jar = new Map();
    const client = createServerClient(supabaseUrl, publishableKey, {
        cookies: {
            getAll() {
                return [...jar].map(([name, value]) => ({ name, value }));
            },
            setAll(cookies) {
                for (const cookie of cookies) jar.set(cookie.name, cookie.value);
            },
        },
    });
    const { error } = await client.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
    });
    if (error) throw error;
    return [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
}

async function cleanup() {
    if (uploadedFile?.storagePath) {
        await admin.storage.from("student-files").remove([uploadedFile.storagePath]);
    }
    if (uploadedFile?.id) {
        await admin.from("student_files").delete().eq("id", uploadedFile.id);
    }
    if (studentId) {
        await admin.from("students").delete().eq("id", studentId);
    }
    if (studentAuthUserId) {
        await admin.auth.admin.deleteUser(studentAuthUserId);
    }
    if (teacherAuthUserId) {
        await admin.auth.admin.deleteUser(teacherAuthUserId);
    }
}

try {
    const { data: student, error: studentError } = await admin
        .from("students")
        .insert({
            name: fakeName,
            school: fakeSchool,
            grade: "3학년",
            class: "공통기초반",
            status: "active",
        })
        .select("id")
        .single();
    if (studentError || !student) throw studentError || new Error("가짜 학생을 준비하지 못했습니다.");
    studentId = student.id;

    const { error: codeError } = await admin.rpc("codingssok_issue_student_access_code", {
        p_student_id: studentId,
        p_purpose: "parent_access",
        p_code: parentCode,
    });
    if (codeError) throw codeError;

    const signup = await jsonRequest("/api/student/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": `fresh-signup-${runId}` },
        body: JSON.stringify({
            name: fakeName,
            parentCode,
            pin: studentPin,
            school: fakeSchool,
            grade: "3학년",
        }),
    });
    assert(signup.response.status === 200 && signup.body?.success, `학생 회원가입 실패: ${signup.body?.error || signup.response.status}`);
    studentAuthUserId = signup.body.student?.auth_user_id || null;
    assert(studentAuthUserId, "학생 인증계정 연결 결과가 없습니다.");

    const login = await jsonRequest("/api/student/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": `fresh-login-${runId}` },
        body: JSON.stringify({ name: fakeName, pin: studentPin }),
    });
    assert(login.response.status === 200 && login.body?.session, `학생 로그인 실패: ${login.body?.error || login.response.status}`);
    const studentCookie = await makeSessionCookie(login.body.session);
    assert(studentCookie, "학생 로그인 쿠키를 만들지 못했습니다.");

    const form = new FormData();
    form.set("file", new File(["fake student result for fresh DB integration check\n"], "fake-result.txt", { type: "text/plain" }));
    form.set("category", "result");
    form.set("note", "가짜 학생 파일 연결 검사");
    const upload = await jsonRequest("/api/student/files", {
        method: "POST",
        headers: { cookie: studentCookie },
        body: form,
    });
    assert(upload.response.status === 201 && upload.body?.file?.id, `학생 파일 업로드 실패: ${upload.body?.error || upload.response.status}`);
    uploadedFile = {
        id: upload.body.file.id,
        storagePath: upload.body.file.storagePath,
    };
    assert(upload.body.file.visibility === "student_parent", "학생 파일의 학부모 공개 설정이 올바르지 않습니다.");

    const studentList = await jsonRequest("/api/student/files", {
        headers: { cookie: studentCookie },
    });
    assert(studentList.response.status === 200, `학생 파일 목록 실패: ${studentList.body?.error || studentList.response.status}`);
    assert(studentList.body?.files?.some(file => file.id === uploadedFile.id), "학생 파일 목록에서 방금 올린 파일을 찾지 못했습니다.");

    const parentSession = await jsonRequest("/api/parent/session", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": `fresh-parent-${runId}` },
        body: JSON.stringify({ name: fakeName, pin: parentCode }),
    });
    assert(parentSession.response.status === 200 && parentSession.body?.success, `학부모 인증 실패: ${parentSession.body?.error || parentSession.response.status}`);
    const parentCookie = parentSession.response.headers.get("set-cookie")?.split(";")[0] || "";
    assert(parentCookie.startsWith("codingssok_parent_session="), "학부모 세션 쿠키가 없습니다.");

    const parentDownload = await fetch(`${baseUrl}/api/student/files/${uploadedFile.id}`, {
        headers: { cookie: parentCookie },
        redirect: "manual",
    });
    assert(parentDownload.status === 307, `학부모 공개 파일 다운로드 실패: ${parentDownload.status}`);
    assert(parentDownload.headers.get("location")?.includes("/storage/v1/object/sign/student-files/"), "임시 다운로드 주소가 아닙니다.");

    const parentDelete = await jsonRequest(`/api/student/files/${uploadedFile.id}`, {
        method: "DELETE",
        headers: { cookie: parentCookie },
    });
    assert(parentDelete.response.status === 403, `학부모 파일 삭제가 차단되지 않았습니다: ${parentDelete.response.status}`);

    const { data: teacherUser, error: teacherCreateError } = await admin.auth.admin.createUser({
        email: teacherEmail,
        password: teacherPassword,
        email_confirm: true,
        user_metadata: { name: teacherName, role: "teacher" },
        app_metadata: { role: "teacher" },
    });
    if (teacherCreateError || !teacherUser.user) throw teacherCreateError || new Error("가짜 선생님을 준비하지 못했습니다.");
    teacherAuthUserId = teacherUser.user.id;

    const { error: teacherApprovalError } = await admin
        .from("profiles")
        .update({
            name: teacherName,
            display_name: teacherName,
            role: "teacher",
            approval_status: "approved",
        })
        .eq("id", teacherAuthUserId);
    if (teacherApprovalError) throw teacherApprovalError;

    const { data: teacherProfile, error: teacherProfileError } = await admin
        .from("profiles")
        .select("role,approval_status")
        .eq("id", teacherAuthUserId)
        .maybeSingle();
    if (teacherProfileError) throw teacherProfileError;
    assert(
        teacherProfile?.role === "teacher" && teacherProfile?.approval_status === "approved",
        `가짜 선생님 프로필 준비 실패: ${teacherProfile?.role || "없음"}/${teacherProfile?.approval_status || "없음"}`,
    );

    const { data: teacherLogin, error: teacherLoginError } = await publicClient.auth.signInWithPassword({
        email: teacherEmail,
        password: teacherPassword,
    });
    if (teacherLoginError || !teacherLogin.session) throw teacherLoginError || new Error("가짜 선생님 로그인이 실패했습니다.");
    const { data: teacherRole, error: teacherRoleError } = await publicClient.rpc("codingssok_current_role");
    if (teacherRoleError) throw teacherRoleError;
    assert(teacherRole === "teacher", `가짜 선생님 DB 역할 확인 실패: ${teacherRole || "없음"}`);
    const teacherCookie = await makeSessionCookie(teacherLogin.session);

    const unassignedList = await jsonRequest("/api/teacher/student-files", {
        headers: { cookie: teacherCookie },
    });
    assert(unassignedList.response.status === 200, `미담당 선생님 목록 확인 실패: ${unassignedList.body?.error || unassignedList.response.status}`);
    assert(unassignedList.body?.students?.length === 0 && unassignedList.body?.files?.length === 0, "미담당 선생님에게 학생 파일 목록이 노출됐습니다.");

    const unassignedDownload = await fetch(`${baseUrl}/api/student/files/${uploadedFile.id}`, {
        headers: { cookie: teacherCookie },
        redirect: "manual",
    });
    assert(unassignedDownload.status === 403, `미담당 선생님 다운로드가 차단되지 않았습니다: ${unassignedDownload.status}`);

    const { error: assignmentError } = await admin.from("teacher_student_assignments").insert({
        teacher_id: teacherAuthUserId,
        student_id: studentId,
        status: "active",
    });
    if (assignmentError) throw assignmentError;

    const assignedList = await jsonRequest("/api/teacher/student-files", {
        headers: { cookie: teacherCookie },
    });
    assert(assignedList.response.status === 200, `담당 선생님 목록 확인 실패: ${assignedList.body?.error || assignedList.response.status}`);
    assert(assignedList.body?.files?.some(file => file.id === uploadedFile.id), "담당 선생님에게 배정 학생 파일이 보이지 않습니다.");

    const assignedDownload = await fetch(`${baseUrl}/api/student/files/${uploadedFile.id}`, {
        headers: { cookie: teacherCookie },
        redirect: "manual",
    });
    assert(assignedDownload.status === 307, `담당 선생님 다운로드 실패: ${assignedDownload.status}`);

    console.log("PASS: fresh-test 홈페이지 학생 파일 연결 검사가 모두 통과했습니다.");
} finally {
    await cleanup();
    console.log("CLEANUP: 가짜 학생·선생님·파일 자료를 모두 정리했습니다.");
}
