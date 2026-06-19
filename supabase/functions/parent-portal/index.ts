import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const PIN_COURSE = "__parent_pin__";

const headers = {
  "Content-Type": "application/json",
  "Connection": "keep-alive",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers });
}

function normalizeName(input: unknown) {
  return typeof input === "string" ? input.trim().replace(/\s+/g, "") : "";
}

function getAccountRoleForName(name: string) {
  return ["구자현", "장민"].includes(normalizeName(name)) ? "admin" : "student";
}

function normalizePin(input: unknown) {
  return typeof input === "string" ? input.replace(/\D/g, "").slice(0, 5) : "";
}

function normalizeStudentPin(input: unknown) {
  return typeof input === "string" ? input.replace(/\D/g, "").slice(0, 4) : "";
}

function assertName(name: string) {
  if (name.length < 2 || name.length > 20 || /[<>"';&\\]/.test(name)) {
    throw new HttpError(400, "학생 이름을 2~20자 한글 이름으로 입력해주세요.");
  }
}

function assertPin(pin: string) {
  if (!/^\d{5}$/.test(pin)) {
    throw new HttpError(400, "학부모 인증번호는 숫자 5자리여야 합니다.");
  }
}

function assertStudentPin(pin: string) {
  if (!/^\d{4}$/.test(pin)) {
    throw new HttpError(400, "로그인에 사용할 비밀번호 4자리를 입력해주세요.");
  }
}

function buildStudentAuthEmail(studentId: string) {
  return `student_${studentId}@codingssok.local`;
}

function buildStudentAuthPassword(studentId: string, pin: string) {
  return `cs_student_${studentId.replace(/-/g, "")}_${pin}`;
}

function getSecretKey() {
  const legacyKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacyKey) return legacyKey;

  const rawSecretKeys = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!rawSecretKeys) return "";
  const secretKeys = JSON.parse(rawSecretKeys) as Record<string, string>;
  return secretKeys.default || Object.values(secretKeys).find(Boolean) || "";
}

function createAdmin() {
  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = getSecretKey();
  if (!url || !key) {
    throw new HttpError(503, "Supabase Edge Function 관리자 키가 없습니다.");
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function normalizeAdminName(value: string | null | undefined) {
  return (value || "").replace(/\s+/g, "").trim().toLowerCase();
}

function isApprovedAdminStudent(row: { name?: string | null; class?: string | null; status?: string | null } | null) {
  if (!row || row.status === "deactivated") return false;
  const name = normalizeAdminName(row.name);
  const className = normalizeAdminName(row.class);
  return className === "admin" || ["구자현", "장민", "gujahyeon", "gujahyun", "jahyeon", "jangmin"].includes(name);
}

function getBearer(req: Request) {
  return (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
}

async function requireAdmin(req: Request) {
  const admin = createAdmin();
  const token = getBearer(req);
  if (!token) throw new HttpError(401, "관리자 로그인이 필요합니다.");

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  const user = userData.user;
  if (userError || !user) throw new HttpError(401, "관리자 세션을 확인하지 못했습니다.");

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw new HttpError(500, profileError.message);
  if (profile?.role !== "teacher" && profile?.role !== "admin") {
    const { data: linkedStudent, error: studentError } = await admin
      .from("students")
      .select("name, class, status")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (studentError) throw new HttpError(500, studentError.message);
    if (!isApprovedAdminStudent(linkedStudent)) {
      throw new HttpError(403, "관리자 권한이 필요합니다.");
    }
  }
  return { admin, role: (profile?.role || "admin") as string };
}

async function loadBaseData(admin = createAdmin()) {
  const [studentsRes, profilesRes, progressRes] = await Promise.all([
    admin
      .from("students")
      .select("id, name, birthday, school, grade, class, avatar, pin, auth_user_id, status, created_at")
      .order("name", { ascending: true }),
    admin.from("profiles").select("id, name, display_name, email, role"),
    admin
      .from("study_progress")
      .select("user_id, completed_units, updated_at")
      .eq("course_id", PIN_COURSE),
  ]);

  if (studentsRes.error) throw new HttpError(500, studentsRes.error.message);

  const profiles = (profilesRes.data || []).filter((profile) =>
    profile.role !== "teacher" && profile.role !== "admin"
  );

  return {
    success: true,
    students: (studentsRes.data || []).filter((student) => student.class !== "admin"),
    profiles,
    progress: progressRes.data || [],
    warning: profilesRes.error?.message || progressRes.error?.message || null,
  };
}

async function syncProgressPin(
  admin: ReturnType<typeof createAdmin>,
  userId: string | null | undefined,
  pin: string | null,
) {
  if (!userId) return;
  if (!pin) {
    const { error } = await admin
      .from("study_progress")
      .delete()
      .eq("user_id", userId)
      .eq("course_id", PIN_COURSE);
    if (error) throw new HttpError(500, error.message);
    return;
  }

  const { error } = await admin.from("study_progress").upsert(
    {
      user_id: userId,
      course_id: PIN_COURSE,
      completed_units: [pin],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_id" },
  );
  if (error) throw new HttpError(500, error.message);
}

async function findAuthUserByEmail(
  admin: ReturnType<typeof createAdmin>,
  email: string,
) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new HttpError(500, error.message);
    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < 1000) break;
  }
  return null;
}

async function handleStudentSignup(body: Record<string, unknown>) {
  const admin = createAdmin();
  const name = normalizeName(body.name);
  const parentCode = normalizePin(body.parentCode);
  const studentPin = normalizeStudentPin(body.pin);
  const school = typeof body.school === "string" ? body.school.trim().slice(0, 40) : "";
  const grade = typeof body.grade === "string" ? body.grade.trim().slice(0, 20) : "";
  assertName(name);
  assertPin(parentCode);
  assertStudentPin(studentPin);

  const { data: students, error: studentsError } = await admin
    .from("students")
    .select("id, name, birthday, school, grade, class, avatar, pin, auth_user_id, status")
    .eq("name", name)
    .limit(5);
  if (studentsError) throw new HttpError(500, studentsError.message);

  const student = students?.[0] || null;
  if (!student) throw new HttpError(401, "등록된 학생이 없습니다. 선생님에게 문의해주세요.");
  if (student.status === "deactivated") {
    throw new HttpError(403, "비활성화된 학생입니다. 선생님에게 문의해주세요.");
  }
  if (student.pin !== parentCode) {
    throw new HttpError(401, "학생 이름 또는 학부모 인증번호가 맞지 않습니다.");
  }

  const email = buildStudentAuthEmail(student.id);
  const password = buildStudentAuthPassword(student.id, studentPin);
  const accountRole = getAccountRoleForName(name);
  const existingByEmail = await findAuthUserByEmail(admin, email);
  let authUserId = existingByEmail?.id || student.auth_user_id || "";

  if (authUserId) {
    const { error } = await admin.auth.admin.updateUserById(authUserId, {
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: accountRole },
      app_metadata: { role: accountRole },
    });
    if (error) throw new HttpError(500, error.message);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: accountRole },
      app_metadata: { role: accountRole },
    });
    if (error || !data.user) {
      throw new HttpError(500, error?.message || "학생 인증 계정을 만들지 못했습니다.");
    }
    authUserId = data.user.id;
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: authUserId,
      email,
      name,
      display_name: name,
      role: accountRole,
      approval_status: "approved",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (profileError) throw new HttpError(500, profileError.message);

  const { data: updated, error: updateError } = await admin
    .from("students")
    .update({
      auth_user_id: authUserId,
      pin: parentCode,
      school: school || student.school || null,
      grade: grade || student.grade || null,
      status: "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", student.id)
    .select("id, name, school, grade, class, avatar, auth_user_id, status")
    .single();
  if (updateError || !updated) {
    throw new HttpError(500, updateError?.message || "학생 계정을 연결하지 못했습니다.");
  }

  await syncProgressPin(admin, authUserId, parentCode);

  return json({
    success: true,
    student: {
      id: updated.id,
      name: updated.name,
      school: updated.school || null,
      grade: updated.grade || null,
      avatar: updated.avatar || null,
      auth_user_id: updated.auth_user_id || null,
      status: updated.status || null,
    },
    message: "회원가입이 완료되었습니다.",
  });
}

async function upsertStudentCode(input: {
  admin: ReturnType<typeof createAdmin>;
  name: string;
  pin: string | null;
  school?: string | null;
  grade?: string | null;
  className?: string | null;
}) {
  assertName(input.name);
  if (input.pin) assertPin(input.pin);

  const admin = input.admin;
  const { data: students, error: studentsError } = await admin
    .from("students")
    .select("id, name, birthday, school, grade, class, avatar, pin, auth_user_id, status, created_at")
    .eq("name", input.name)
    .limit(5);
  if (studentsError) throw new HttpError(500, studentsError.message);

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, name, display_name, email, role")
    .or(`name.eq.${input.name},display_name.eq.${input.name}`)
    .limit(5);

  const existing = students?.[0] || null;
  const profile = existing?.auth_user_id
    ? profiles?.find((item) => item.id === existing.auth_user_id) || null
    : profiles?.find((item) => item.display_name === input.name || item.name === input.name) || null;
  const nextSchool = input.school !== undefined ? input.school || null : existing?.school || null;
  const nextGrade = input.grade !== undefined ? input.grade || null : existing?.grade || null;
  const nextClassName = input.className !== undefined ? input.className || null : existing?.class || null;

  const payload = {
    name: input.name,
    birthday: existing?.birthday || "2000-01-01",
    school: nextSchool,
    grade: nextGrade,
    class: nextClassName,
    pin: input.pin,
    auth_user_id: existing?.auth_user_id || profile?.id || null,
    status: "approved",
  };

  const query = existing
    ? admin.from("students").update(payload).eq("id", existing.id).select().single()
    : admin.from("students").insert(payload).select().single();

  const { data, error } = await query;
  if (error || !data) throw new HttpError(500, error?.message || "학생 코드를 저장하지 못했습니다.");

  await syncProgressPin(admin, data.auth_user_id || profile?.id || null, input.pin);
  return data;
}

async function handleAuth(body: Record<string, unknown>) {
  const admin = createAdmin();
  const name = normalizeName(body.name);
  const pin = normalizePin(body.pin);
  assertName(name);
  assertPin(pin);

  const { data: students, error } = await admin
    .from("students")
    .select("id, name, pin, auth_user_id, status")
    .eq("name", name)
    .limit(5);
  if (error) throw new HttpError(500, error.message);

  if ((students || []).some((student) => student.status === "deactivated")) {
    throw new HttpError(403, "비활성화된 학생입니다. 선생님에게 문의해주세요.");
  }

  const matchedStudent = (students || []).find((student) => student.pin === pin);
  if (!matchedStudent) {
    throw new HttpError(401, "학생 이름 또는 학부모 인증번호가 맞지 않습니다.");
  }

  return json({
    success: true,
    studentName: matchedStudent.name || name,
    studentId: matchedStudent.auth_user_id || matchedStudent.id,
  });
}

async function handleCanRead(body: Record<string, unknown>) {
  const admin = createAdmin();
  const name = normalizeName(body.name);
  const studentId = typeof body.studentId === "string" ? body.studentId : "";
  assertName(name);
  if (!studentId) return json({ success: true, canRead: false });

  const { data: students, error } = await admin
    .from("students")
    .select("id, name, pin, auth_user_id")
    .or(`id.eq.${studentId},auth_user_id.eq.${studentId}`)
    .limit(10);
  if (error) throw new HttpError(500, error.message);

  const canRead = Boolean((students || []).find((student) => student.name === name && student.pin));
  return json({ success: true, canRead });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return json({ success: false, error: "POST만 지원합니다." }, 405);

  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const action = typeof body.action === "string" ? body.action : "";

    if (action === "auth") return await handleAuth(body);
    if (action === "canRead") return await handleCanRead(body);
    if (action === "studentSignup") return await handleStudentSignup(body);

    const { admin, role } = await requireAdmin(req);
    if (action === "assertAdmin") return json({ success: true, role });
    if (action === "list") return json(await loadBaseData(admin));

    if (action === "seedBaseline") {
      const rows = Array.isArray(body.rows) ? body.rows : [];
      for (const row of rows) {
        const item = row as { name?: unknown; code?: unknown; pin?: unknown; className?: unknown };
        await upsertStudentCode({
          admin,
          name: normalizeName(item.name),
          pin: normalizePin(item.code || item.pin),
          className: typeof item.className === "string" ? item.className.trim() : null,
        });
      }
      return json(await loadBaseData(admin));
    }

    if (action === "issue" || action === "reissue") {
      await upsertStudentCode({
        admin,
        name: normalizeName(body.name),
        pin: normalizePin(body.pin),
        school: typeof body.school === "string" ? body.school.trim().slice(0, 40) : null,
        grade: typeof body.grade === "string" ? body.grade.trim() : null,
        className: typeof body.className === "string" ? body.className.trim() : null,
      });
      return json(await loadBaseData(admin));
    }

    if (action === "group") {
      const names = Array.isArray(body.names)
        ? body.names.map(normalizeName).filter(Boolean)
        : String(body.names || "").split(/[,\n]/).map(normalizeName).filter(Boolean);
      if (names.length < 2) throw new HttpError(400, "형제/자매로 묶을 학생 이름을 2명 이상 입력해주세요.");
      const pin = normalizePin(body.pin);
      assertPin(pin);
      for (const name of names) await upsertStudentCode({ admin, name, pin });
      return json(await loadBaseData(admin));
    }

    if (action === "delete") {
      const name = normalizeName(body.name);
      assertName(name);
      const { data: students, error } = await admin
        .from("students")
        .select("id, name, birthday, school, grade, class, auth_user_id")
        .eq("name", name)
        .limit(5);
      if (error) throw new HttpError(500, error.message);
      const existing = students?.[0] || null;
      if (existing) {
        const { error: updateError } = await admin
          .from("students")
          .update({ pin: null, status: "deactivated", updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (updateError) throw new HttpError(500, updateError.message);
        await syncProgressPin(admin, existing.auth_user_id || null, null);
      }
      return json(await loadBaseData(admin));
    }

    return json({ success: false, error: "지원하지 않는 작업입니다." }, 400);
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    const message = error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
    return json({ success: false, error: message }, status);
  }
});
