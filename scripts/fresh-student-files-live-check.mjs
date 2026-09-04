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
const fakeName = `가짜파일${runId.slice(-4)}`;
const fakeSchool = "가짜테스트초등학교";
const parentCode = "53842";
const studentPin = "2468";
const teacherEmail = `fake_teacher_${runId}@codingssok.local`;
const teacherPassword = `FakeTeacher!${runId}`;
const teacherName = `가짜선생님${runId.slice(-5)}`;
const adminEmail = `fake_admin_${runId}@codingssok.local`;
const adminPassword = `FakeAdmin!${runId}`;
const adminName = `가짜관리자${runId.slice(-5)}`;

let studentId = null;
let studentAuthUserId = null;
let teacherAuthUserId = null;
let adminAuthUserId = null;
let uploadedFile = null;
let adminUploadedFile = null;

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

async function loadStoragePath(fileId) {
    const { data, error } = await admin
        .from("student_files")
        .select("storage_path")
        .eq("id", fileId)
        .maybeSingle();
    if (error || !data?.storage_path) throw error || new Error("가짜 파일의 정리 경로를 확인하지 못했습니다.");
    return data.storage_path;
}

async function cleanup() {
    if (adminUploadedFile?.storagePath) {
        await admin.storage.from("student-files").remove([adminUploadedFile.storagePath]);
    }
    if (uploadedFile?.storagePath) {
        await admin.storage.from("student-files").remove([uploadedFile.storagePath]);
    }
    if (adminUploadedFile?.id) {
        await admin.from("student_files").delete().eq("id", adminUploadedFile.id);
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
    if (adminAuthUserId) {
        await admin.auth.admin.deleteUser(adminAuthUserId);
    }
}

async function verifyStorageObjectRemoved(file) {
    if (!file?.storagePath) return;
    const segments = file.storagePath.split("/");
    const fileName = segments.pop();
    const folder = segments.join("/");
    const { data, error } = await admin.storage.from("student-files").list(folder, { search: fileName, limit: 10 });
    if (error) throw error;
    assert(!(data || []).some(item => item.name === fileName), "가짜 저장소 파일이 남아 있습니다.");
}

async function verifyCleanup() {
    const [studentCheck, fileCheck, adminFileCheck, studentProfileCheck, teacherProfileCheck, adminProfileCheck] = await Promise.all([
        studentId
            ? admin.from("students").select("id", { count: "exact", head: true }).eq("id", studentId)
            : Promise.resolve({ count: 0, error: null }),
        uploadedFile?.id
            ? admin.from("student_files").select("id", { count: "exact", head: true }).eq("id", uploadedFile.id)
            : Promise.resolve({ count: 0, error: null }),
        adminUploadedFile?.id
            ? admin.from("student_files").select("id", { count: "exact", head: true }).eq("id", adminUploadedFile.id)
            : Promise.resolve({ count: 0, error: null }),
        studentAuthUserId
            ? admin.from("profiles").select("id", { count: "exact", head: true }).eq("id", studentAuthUserId)
            : Promise.resolve({ count: 0, error: null }),
        teacherAuthUserId
            ? admin.from("profiles").select("id", { count: "exact", head: true }).eq("id", teacherAuthUserId)
            : Promise.resolve({ count: 0, error: null }),
        adminAuthUserId
            ? admin.from("profiles").select("id", { count: "exact", head: true }).eq("id", adminAuthUserId)
            : Promise.resolve({ count: 0, error: null }),
    ]);
    const cleanupError = studentCheck.error || fileCheck.error || adminFileCheck.error || studentProfileCheck.error || teacherProfileCheck.error || adminProfileCheck.error;
    if (cleanupError) throw cleanupError;
    assert(studentCheck.count === 0, "가짜 학생 자료가 남아 있습니다.");
    assert(fileCheck.count === 0, "가짜 파일 자료가 남아 있습니다.");
    assert(adminFileCheck.count === 0, "가짜 관리자 업로드 파일이 남아 있습니다.");
    assert(studentProfileCheck.count === 0, "가짜 학생 계정 자료가 남아 있습니다.");
    assert(teacherProfileCheck.count === 0, "가짜 선생님 계정 자료가 남아 있습니다.");
    assert(adminProfileCheck.count === 0, "가짜 관리자 계정 자료가 남아 있습니다.");
    await verifyStorageObjectRemoved(uploadedFile);
    await verifyStorageObjectRemoved(adminUploadedFile);
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
    const fakePng = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"));
    form.set("file", new File([fakePng], "fake-preview.png", { type: "image/png" }));
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
        storagePath: await loadStoragePath(upload.body.file.id),
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

    const parentDashboard = await jsonRequest(`/api/parent/v2/dashboard?name=${encodeURIComponent(fakeName)}`, {
        headers: { cookie: parentCookie },
    });
    assert(parentDashboard.response.status === 200 && parentDashboard.body?.found, `학부모 현황판 조회 실패: ${parentDashboard.body?.error || parentDashboard.response.status}`);
    assert(parentDashboard.body?.files?.some(file => file.id === uploadedFile.id), "학부모 현황판에서 공개 결과물을 찾지 못했습니다.");
    assert(!JSON.stringify(parentDashboard.body.files).includes("storage_path"), "학부모 현황판에 내부 저장 경로가 노출됐습니다.");
    assert(!JSON.stringify(parentDashboard.body.files).includes("storagePath"), "학부모 현황판에 내부 저장 경로가 노출됐습니다.");

    const parentDownload = await fetch(`${baseUrl}/api/student/files/${uploadedFile.id}`, {
        headers: { cookie: parentCookie },
        redirect: "manual",
    });
    assert(parentDownload.status === 307, `학부모 공개 파일 다운로드 실패: ${parentDownload.status}`);
    assert(parentDownload.headers.get("location")?.includes("/storage/v1/object/sign/student-files/"), "임시 다운로드 주소가 아닙니다.");

    const parentPreview = await fetch(`${baseUrl}/api/student/files/${uploadedFile.id}?mode=preview`, {
        headers: { cookie: parentCookie },
        redirect: "manual",
    });
    const parentPreviewLocation = parentPreview.headers.get("location") || "";
    assert(parentPreview.status === 307, `학부모 공개 이미지 미리보기 실패: ${parentPreview.status}`);
    assert(parentPreviewLocation.includes("/storage/v1/object/sign/student-files/"), "미리보기가 임시 주소를 사용하지 않습니다.");
    assert(!parentPreviewLocation.includes("download="), "미리보기가 파일 다운로드를 강제하고 있습니다.");

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

    const teacherVisibilityUpdate = await jsonRequest("/api/teacher/student-files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", cookie: teacherCookie },
        body: JSON.stringify({ fileId: uploadedFile.id, visibility: "staff_only" }),
    });
    assert(teacherVisibilityUpdate.response.status === 403, `일반 선생님의 공개 범위 변경이 차단되지 않았습니다: ${teacherVisibilityUpdate.response.status}`);

    const { data: adminUser, error: adminCreateError } = await admin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { name: adminName, role: "admin" },
        app_metadata: { role: "admin" },
    });
    if (adminCreateError || !adminUser.user) throw adminCreateError || new Error("가짜 관리자를 준비하지 못했습니다.");
    adminAuthUserId = adminUser.user.id;

    const { error: adminApprovalError } = await admin
        .from("profiles")
        .update({
            name: adminName,
            display_name: adminName,
            role: "admin",
            approval_status: "approved",
        })
        .eq("id", adminAuthUserId);
    if (adminApprovalError) throw adminApprovalError;

    const { data: adminLogin, error: adminLoginError } = await publicClient.auth.signInWithPassword({
        email: adminEmail,
        password: adminPassword,
    });
    if (adminLoginError || !adminLogin.session) throw adminLoginError || new Error("가짜 관리자 로그인이 실패했습니다.");
    const adminCookie = await makeSessionCookie(adminLogin.session);

    const adminUploadForm = new FormData();
    adminUploadForm.set("studentId", studentId);
    adminUploadForm.set("file", new File(["fake admin result for fresh DB integration check\n"], "fake-admin-result.ent", { type: "application/octet-stream" }));
    adminUploadForm.set("category", "entry");
    adminUploadForm.set("note", "가짜 관리자 파일 업로드 검사");
    adminUploadForm.set("visibility", "staff_only");
    const adminUpload = await jsonRequest("/api/teacher/student-files", {
        method: "POST",
        headers: { cookie: adminCookie },
        body: adminUploadForm,
    });
    assert(adminUpload.response.status === 201 && adminUpload.body?.file?.id, `관리자 파일 업로드 실패: ${adminUpload.body?.error || adminUpload.response.status}`);
    adminUploadedFile = {
        id: adminUpload.body.file.id,
        storagePath: await loadStoragePath(adminUpload.body.file.id),
    };
    assert(adminUpload.body.file.uploadedByRole === "admin", "관리자 업로드 기록의 등록자 역할이 올바르지 않습니다.");
    assert(adminUpload.body.file.visibility === "staff_only", "관리자 업로드 파일의 최초 공개 범위가 올바르지 않습니다.");

    const adminFileList = await jsonRequest("/api/teacher/student-files", {
        headers: { cookie: adminCookie },
    });
    assert(adminFileList.response.status === 200, `관리자 파일 목록 확인 실패: ${adminFileList.body?.error || adminFileList.response.status}`);
    assert(adminFileList.body?.files?.some(file => file.id === adminUploadedFile.id), "관리자가 올린 파일이 관리자 파일함에 보이지 않습니다.");

    const privateAdminFileDashboard = await jsonRequest(`/api/parent/v2/dashboard?name=${encodeURIComponent(fakeName)}`, {
        headers: { cookie: parentCookie },
    });
    assert(privateAdminFileDashboard.response.status === 200, `관리자 전용 파일 등록 후 학부모 현황판 조회 실패: ${privateAdminFileDashboard.body?.error || privateAdminFileDashboard.response.status}`);
    assert(!privateAdminFileDashboard.body?.files?.some(file => file.id === adminUploadedFile.id), "관리자가 선생님 전용으로 올린 파일이 학부모에게 노출됐습니다.");

    const hideFromParent = await jsonRequest("/api/teacher/student-files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", cookie: adminCookie },
        body: JSON.stringify({ fileId: uploadedFile.id, visibility: "staff_only" }),
    });
    assert(hideFromParent.response.status === 200 && hideFromParent.body?.file?.visibility === "staff_only", `관리자 비공개 변경 실패: ${hideFromParent.body?.error || hideFromParent.response.status}`);

    const hiddenDashboard = await jsonRequest(`/api/parent/v2/dashboard?name=${encodeURIComponent(fakeName)}`, {
        headers: { cookie: parentCookie },
    });
    assert(hiddenDashboard.response.status === 200, `비공개 변경 후 학부모 현황판 조회 실패: ${hiddenDashboard.body?.error || hiddenDashboard.response.status}`);
    assert(!hiddenDashboard.body?.files?.some(file => file.id === uploadedFile.id), "선생님 전용 파일이 학부모 현황판에 남아 있습니다.");

    const hiddenParentDownload = await fetch(`${baseUrl}/api/student/files/${uploadedFile.id}`, {
        headers: { cookie: parentCookie },
        redirect: "manual",
    });
    assert(hiddenParentDownload.status === 403, `선생님 전용 파일의 학부모 다운로드가 차단되지 않았습니다: ${hiddenParentDownload.status}`);

    const revealToParent = await jsonRequest("/api/teacher/student-files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", cookie: adminCookie },
        body: JSON.stringify({ fileId: uploadedFile.id, visibility: "student_parent" }),
    });
    assert(revealToParent.response.status === 200 && revealToParent.body?.file?.visibility === "student_parent", `관리자 공개 변경 실패: ${revealToParent.body?.error || revealToParent.response.status}`);

    const visibleDashboard = await jsonRequest(`/api/parent/v2/dashboard?name=${encodeURIComponent(fakeName)}`, {
        headers: { cookie: parentCookie },
    });
    assert(visibleDashboard.response.status === 200, `공개 변경 후 학부모 현황판 조회 실패: ${visibleDashboard.body?.error || visibleDashboard.response.status}`);
    assert(visibleDashboard.body?.files?.some(file => file.id === uploadedFile.id), "다시 공개한 파일이 학부모 현황판에 나타나지 않습니다.");

    const revealAdminFile = await jsonRequest("/api/teacher/student-files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", cookie: adminCookie },
        body: JSON.stringify({ fileId: adminUploadedFile.id, visibility: "student_parent" }),
    });
    assert(revealAdminFile.response.status === 200 && revealAdminFile.body?.file?.visibility === "student_parent", `관리자 업로드 파일 공개 실패: ${revealAdminFile.body?.error || revealAdminFile.response.status}`);

    const adminFileVisibleDashboard = await jsonRequest(`/api/parent/v2/dashboard?name=${encodeURIComponent(fakeName)}`, {
        headers: { cookie: parentCookie },
    });
    assert(adminFileVisibleDashboard.response.status === 200, `관리자 업로드 파일 공개 후 학부모 현황판 조회 실패: ${adminFileVisibleDashboard.body?.error || adminFileVisibleDashboard.response.status}`);
    assert(adminFileVisibleDashboard.body?.files?.some(file => file.id === adminUploadedFile.id), "관리자가 공개한 파일이 학부모 현황판에 나타나지 않습니다.");

    const projectFilePreview = await fetch(`${baseUrl}/api/student/files/${adminUploadedFile.id}?mode=preview`, {
        headers: { cookie: parentCookie },
        redirect: "manual",
    });
    assert(projectFilePreview.status === 400, `엔트리 프로젝트 파일 미리보기가 차단되지 않았습니다: ${projectFilePreview.status}`);

    console.log("PASS: fresh-test 홈페이지 학생 파일 연결 검사가 모두 통과했습니다.");
} finally {
    await cleanup();
    await verifyCleanup();
    console.log("CLEANUP: 가짜 학생·선생님·파일 자료를 모두 정리했습니다.");
}
