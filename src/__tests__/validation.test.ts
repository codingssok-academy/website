import { describe, it, expect } from 'vitest'
import { compileRequestSchema, contactFormSchema, submitSolutionSchema, saveNoteSchema } from '@/lib/validation'

describe('Validation Schemas', () => {
    describe('compileRequestSchema', () => {
        it('validates valid compile request', () => {
            const result = compileRequestSchema.safeParse({
                code: '#include <stdio.h>\nint main() { return 0; }',
                language: 'c',
                stdin: '',
            })
            expect(result.success).toBe(true)
        })

        it('rejects empty code', () => {
            const result = compileRequestSchema.safeParse({ code: '', language: 'c' })
            expect(result.success).toBe(false)
        })

        it('rejects invalid language', () => {
            const result = compileRequestSchema.safeParse({ code: 'print(1)', language: 'ruby' })
            expect(result.success).toBe(false)
        })

        it('defaults language to c', () => {
            const result = compileRequestSchema.safeParse({ code: 'int main() {}' })
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.language).toBe('c')
            }
        })
    })

    describe('contactFormSchema', () => {
        it('validates valid contact form', () => {
            const result = contactFormSchema.safeParse({
                studentName: '홍길동',
                phone: '010-1234-5678',
                course: 'C언어',
            })
            expect(result.success).toBe(true)
        })

        it('rejects short name', () => {
            const result = contactFormSchema.safeParse({
                studentName: '홍',
                phone: '010-1234-5678',
                course: 'C언어',
            })
            expect(result.success).toBe(false)
        })

        it('rejects invalid phone', () => {
            const result = contactFormSchema.safeParse({
                studentName: '홍길동',
                phone: '123-456',
                course: 'C언어',
            })
            expect(result.success).toBe(false)
        })
    })

    describe('submitSolutionSchema', () => {
        it('validates valid submission', () => {
            const result = submitSolutionSchema.safeParse({
                problemId: '550e8400-e29b-41d4-a716-446655440000',
                answer: 'Hello World',
            })
            expect(result.success).toBe(true)
        })

        it('rejects invalid UUID', () => {
            const result = submitSolutionSchema.safeParse({
                problemId: 'not-a-uuid',
                answer: 'test',
            })
            expect(result.success).toBe(false)
        })
    })

    describe('saveNoteSchema', () => {
        it('validates valid note', () => {
            const result = saveNoteSchema.safeParse({
                materialId: '550e8400-e29b-41d4-a716-446655440000',
                content: '이것은 노트입니다.',
            })
            expect(result.success).toBe(true)
        })

        it('rejects empty content', () => {
            const result = saveNoteSchema.safeParse({
                materialId: '550e8400-e29b-41d4-a716-446655440000',
                content: '',
            })
            expect(result.success).toBe(false)
        })
    })
})
