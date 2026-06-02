import { describe, it, expect } from 'vitest'
import { compileRequestSchema } from '@/lib/validation'

describe('Compile API Validation', () => {
    it('accepts C code', () => {
        const result = compileRequestSchema.safeParse({
            code: '#include <stdio.h>\nint main() { return 0; }',
            language: 'c',
        })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.language).toBe('c')
            expect(result.data.stdin).toBe('')
        }
    })

    it('accepts C++ code', () => {
        const result = compileRequestSchema.safeParse({
            code: '#include <iostream>\nint main() { return 0; }',
            language: 'cpp',
        })
        expect(result.success).toBe(true)
    })

    it('accepts Python code', () => {
        const result = compileRequestSchema.safeParse({
            code: 'print("hello")',
            language: 'python',
        })
        expect(result.success).toBe(true)
    })

    it('accepts JavaScript code', () => {
        const result = compileRequestSchema.safeParse({
            code: 'console.log("hello")',
            language: 'javascript',
        })
        expect(result.success).toBe(true)
    })

    it('accepts Java code', () => {
        const result = compileRequestSchema.safeParse({
            code: 'public class Main { public static void main(String[] args) {} }',
            language: 'java',
        })
        expect(result.success).toBe(true)
    })

    it('rejects unsupported languages', () => {
        const languages = ['ruby', 'go', 'rust', 'kotlin', 'swift', '']
        for (const lang of languages) {
            const result = compileRequestSchema.safeParse({ code: 'x', language: lang })
            expect(result.success).toBe(false)
        }
    })

    it('rejects code over 50000 chars', () => {
        const result = compileRequestSchema.safeParse({
            code: 'x'.repeat(50001),
            language: 'c',
        })
        expect(result.success).toBe(false)
    })

    it('accepts code at exactly 50000 chars', () => {
        const result = compileRequestSchema.safeParse({
            code: 'x'.repeat(50000),
            language: 'c',
        })
        expect(result.success).toBe(true)
    })

    it('rejects stdin over 10000 chars', () => {
        const result = compileRequestSchema.safeParse({
            code: 'int main(){}',
            language: 'c',
            stdin: 'x'.repeat(10001),
        })
        expect(result.success).toBe(false)
    })

    it('handles missing optional fields with defaults', () => {
        const result = compileRequestSchema.safeParse({ code: 'test' })
        expect(result.success).toBe(true)
        if (result.success) {
            expect(result.data.language).toBe('c')
            expect(result.data.stdin).toBe('')
        }
    })
})
