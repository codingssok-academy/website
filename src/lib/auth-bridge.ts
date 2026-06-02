import { env } from "@/lib/env";

export const TEACHER_DISPLAY_NAME = env.TEACHER_DISPLAY_NAME;
export const TEACHER_CONTACT_EMAIL = env.TEACHER_CONTACT_EMAIL;

export function buildStudentAuthEmail(studentId: string) {
  return `student_${studentId}@codingssok.local`;
}

export function buildStudentAuthPassword(studentId: string, pin: string) {
  const safeId = studentId.replace(/-/g, "");
  return `cs_student_${safeId}_${pin}`;
}

export function isTeacherContactEmail(email?: string | null) {
  if (!email || !TEACHER_CONTACT_EMAIL) return false;
  return email.trim().toLowerCase() === TEACHER_CONTACT_EMAIL.trim().toLowerCase();
}
