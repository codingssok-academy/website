import { NextRequest } from "next/server";
import {
  readLocalStudentConfig,
  readSafeStudentJson,
  studentLocalJson,
} from "../local-student-guard";

const STUDENTS = {
  "student-a": {
    emailEnv: "GROWTH_PREVIEW_STUDENT_A_EMAIL",
    passwordEnv: "GROWTH_PREVIEW_STUDENT_A_PASSWORD",
  },
  "student-b": {
    emailEnv: "GROWTH_PREVIEW_STUDENT_B_EMAIL",
    passwordEnv: "GROWTH_PREVIEW_STUDENT_B_PASSWORD",
  },
} as const;

type StudentCode = keyof typeof STUDENTS;

export async function POST(request: NextRequest) {
  const config = readLocalStudentConfig(request);
  if (!config.ok) return config.error;

  const body = (await request.json().catch(() => null)) as
    | { studentCode?: unknown }
    | null;
  if (
    !body ||
    Object.keys(body).length !== 1 ||
    typeof body.studentCode !== "string" ||
    !(body.studentCode in STUDENTS)
  ) {
    return studentLocalJson({ code: "INVALID_STUDENT_CODE" }, 400);
  }

  const account = STUDENTS[body.studentCode as StudentCode];
  const email = process.env[account.emailEnv] ?? "";
  const password = process.env[account.passwordEnv] ?? "";
  if (!email || !password) {
    return studentLocalJson({ code: "LOCAL_PREVIEW_NOT_READY" }, 503);
  }

  try {
    const response = await fetch(`${config.apiUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      cache: "no-store",
      headers: { apikey: config.anonKey, "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const result = await readSafeStudentJson(response);
    const accessToken = typeof result?.access_token === "string" ? result.access_token : "";
    const expiresIn = typeof result?.expires_in === "number" ? result.expires_in : 3600;
    if (!response.ok || !accessToken) {
      return studentLocalJson({ code: "LOCAL_STUDENT_LOGIN_FAILED" }, 401);
    }
    return studentLocalJson({ accessToken, expiresIn });
  } catch {
    return studentLocalJson({ code: "LOCAL_BACKEND_UNAVAILABLE" }, 503);
  }
}
