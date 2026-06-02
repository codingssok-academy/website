import { z } from 'zod'

// ── 공통 스키마 ──
export const uuidSchema = z.string().uuid('유효하지 않은 ID 형식입니다.')

// ── 문제 제출 ──
export const submitSolutionSchema = z.object({
    problemId: uuidSchema,
    answer: z.string().min(1, '답안을 입력해주세요.').max(10000, '답안이 너무 깁니다.'),
})

// ── 노트 저장 ──
export const saveNoteSchema = z.object({
    materialId: uuidSchema,
    content: z.string().min(1, '내용을 입력해주세요.').max(50000, '내용이 너무 깁니다.'),
})

// ── 문제 세트 생성 ──
export const createProblemSetSchema = z.object({
    title: z.string().min(1, '제목을 입력해주세요.').max(200),
    description: z.string().max(5000).optional(),
    category: z.string().max(100).optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
})

// ── 컴파일 요청 ──
export const compileRequestSchema = z.object({
    code: z.string().min(1, '코드가 비어 있습니다.').max(50000, '코드가 너무 깁니다.'),
    language: z.enum(['c', 'cpp', 'python', 'javascript', 'java']).default('c'),
    stdin: z.string().max(10000).default(''),
})

// ── 상담 신청 ──
export const contactFormSchema = z.object({
    studentName: z.string().min(2, '학생 이름은 2자 이상이어야 합니다.').max(50),
    grade: z.string().max(20).optional(),
    phone: z.string().regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, '올바른 전화번호 형식이 아닙니다.'),
    course: z.string().min(1, '관심 과정을 선택해주세요.'),
    message: z.string().max(2000).optional(),
})

// ── 교재 업로드 ──
export const createMaterialSchema = z.object({
    title: z.string().min(1, '제목을 입력해주세요.').max(200),
    description: z.string().max(5000).optional(),
    category: z.string().max(100).optional(),
    track_id: z.string().max(100).optional(),
    sort_order: z.number().int().min(0).default(0),
})

// ── XP 지급 ──
export const grantXPSchema = z.object({
    studentId: uuidSchema,
    amount: z.number().int().positive('XP 양은 양수여야 합니다.').max(10000),
    reason: z.string().min(1).max(200),
    sourceType: z.string().max(50).optional(),
    sourceId: z.string().max(100).optional(),
})

// ── 선생님 피드백 ──
export const teacherFeedbackSchema = z.object({
    studentId: uuidSchema,
    courseId: z.string().max(100).nullable().optional(),
    courseTitle: z.string().max(200).nullable().optional(),
    parentName: z.string().max(80).nullable().optional(),
    parentPhone: z.string().regex(/^01[0-9]-?\d{3,4}-?\d{4}$/, '올바른 전화번호 형식이 아닙니다.').nullable().optional(),
    category: z.enum(['lesson', 'attitude', 'homework', 'achievement', 'attendance', 'custom']).default('lesson'),
    content: z.string().min(5, '피드백 내용을 입력해주세요.').max(5000, '피드백이 너무 깁니다.'),
    focusScore: z.number().int().min(1).max(5).nullable().optional(),
    engagementScore: z.number().int().min(1).max(5).nullable().optional(),
    understandingScore: z.number().int().min(1).max(5).nullable().optional(),
    homeworkSummary: z.string().max(1000).nullable().optional(),
    nextPlan: z.string().max(1000).nullable().optional(),
    notifyParent: z.boolean().default(true),
    deliveryChannel: z.enum(['kakao', 'portal']).default('kakao'),
})

// ── Helper: FormData → Object 변환 ──
export function formDataToObject(formData: FormData): Record<string, string> {
    const obj: Record<string, string> = {}
    formData.forEach((value, key) => {
        if (typeof value === 'string') obj[key] = value
    })
    return obj
}
