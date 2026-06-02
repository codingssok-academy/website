import { describe, it, expect, beforeAll } from 'vitest'
import { JSDOM } from 'jsdom'

// DOMPurify needs a DOM environment
beforeAll(() => {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
    global.window = dom.window as unknown as Window & typeof globalThis
    global.document = dom.window.document
})

describe('sanitizeHTML', () => {
    let sanitizeHTML: (dirty: string) => string

    beforeAll(async () => {
        const mod = await import('@/lib/sanitize')
        sanitizeHTML = mod.sanitizeHTML
    })

    it('preserves safe HTML', () => {
        const html = '<p>Hello <strong>World</strong></p>'
        expect(sanitizeHTML(html)).toBe(html)
    })

    it('removes script tags', () => {
        const html = '<p>Hello</p><script>alert("xss")</script>'
        expect(sanitizeHTML(html)).toBe('<p>Hello</p>')
    })

    it('removes onerror attributes', () => {
        const html = '<img src="x" onerror="alert(1)">'
        const result = sanitizeHTML(html)
        expect(result).not.toContain('onerror')
    })

    it('removes javascript: URIs', () => {
        const html = '<a href="javascript:alert(1)">click</a>'
        const result = sanitizeHTML(html)
        expect(result).not.toContain('javascript:')
    })

    it('allows iframe tags', () => {
        const html = '<iframe src="https://example.com"></iframe>'
        const result = sanitizeHTML(html)
        expect(result).toContain('<iframe')
    })

    it('allows data-code attributes', () => {
        const html = '<button data-code="printf()">Run</button>'
        const result = sanitizeHTML(html)
        expect(result).toContain('data-code')
    })

    it('allows class and style attributes', () => {
        const html = '<div class="highlight" style="color:red">text</div>'
        const result = sanitizeHTML(html)
        expect(result).toContain('class="highlight"')
        expect(result).toContain('style="color:red"')
    })

    it('handles empty string', () => {
        expect(sanitizeHTML('')).toBe('')
    })

    it('strips nested script injection', () => {
        const html = '<div><img src=x onerror="eval(atob(\'YWxlcnQoMSk=\'))"></div>'
        const result = sanitizeHTML(html)
        expect(result).not.toContain('onerror')
        expect(result).not.toContain('eval')
    })
})
