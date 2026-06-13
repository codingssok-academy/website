import { describe, expect, it } from 'vitest'
import { REFERENCE_PARENT_CODES, buildReferenceParentCodeRows, findReferenceParentCode } from '@/lib/parent-code-reference'

describe('parent-code-reference', () => {
    it('keeps the active student code list aligned to the current academy roster', () => {
        expect(REFERENCE_PARENT_CODES).toHaveLength(38)

        const names = REFERENCE_PARENT_CODES.map(row => row.name)
        expect(new Set(names).size).toBe(names.length)

        expect(names).toEqual([
            '탁규원',
            '김무성',
            '김주찬',
            '전예준',
            '윤유림',
            '김성윤',
            '한효제',
            '박하준',
            '이현구',
            '오서영',
            '민다온',
            '김우현',
            '박리현',
            '강지호',
            '김은별',
            '노현승',
            '김주원',
            '석정현',
            '유시호',
            '한보윤',
            '한보리',
            '김기석',
            '박지용',
            '임하준',
            '이다연',
            '길태웅',
            '하우빈',
            '김영호',
            '박도현',
            '서민호',
            '이세라',
            '엄찬유',
            '김윤호',
            '변승완',
            '김태현',
            '김민준',
            '조예준',
            '이시아',
        ])
    })

    it('does not include removed students from the old screenshot table', () => {
        const removedNames = ['길태용', '김시율', '서예준', '양하준', '정윤호']
        for (const name of removedNames) {
            expect(findReferenceParentCode(name)).toBeNull()
        }
    })

    it('keeps sibling students grouped under one parent code', () => {
        expect(findReferenceParentCode('한보윤')?.code).toBe('47864')
        expect(findReferenceParentCode('한보리')?.code).toBe('47864')
    })

    it('keeps class counts aligned to the current track roster', () => {
        const counts = REFERENCE_PARENT_CODES.reduce<Record<string, number>>((acc, row) => {
            acc[row.className] = (acc[row.className] || 0) + 1
            return acc
        }, {})

        expect(counts).toEqual({
            공통기초반: 8,
            흥미반: 5,
            만들기반: 3,
            프로젝트반: 10,
            대회반: 12,
        })
    })

    it('uses valid 5-digit parent codes and only allows the Han sibling duplicate', () => {
        for (const row of REFERENCE_PARENT_CODES) {
            expect(row.code).toMatch(/^\d{5}$/)
            expect(row.feedbackRows).toBeGreaterThanOrEqual(0)
        }

        const namesByCode = new Map<string, string[]>()
        for (const row of REFERENCE_PARENT_CODES) {
            namesByCode.set(row.code, [...(namesByCode.get(row.code) || []), row.name])
        }

        const duplicateGroups = [...namesByCode.values()]
            .filter(names => names.length > 1)
            .map(names => names.sort())

        expect(duplicateGroups).toEqual([['한보리', '한보윤']])
    })

    it('builds read-only local rows with the same active roster', () => {
        const rows = buildReferenceParentCodeRows()
        expect(rows).toHaveLength(38)
        expect(rows.every(row => row.source === 'reference')).toBe(true)
        expect(rows.find(row => row.name === '이다연')).toMatchObject({
            code: '78202',
            feedbackRows: 20,
            className: '프로젝트반',
        })
    })
})
