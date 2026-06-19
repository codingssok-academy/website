export type ReferenceParentCode = {
    name: string
    code: string
    feedbackRows: number
    className: string
}

export const REFERENCE_PARENT_CODES: ReferenceParentCode[] = [
    { className: '공통기초반', name: '탁규원', code: '87093', feedbackRows: 2 },
    { className: '공통기초반', name: '김무성', code: '80880', feedbackRows: 7 },
    { className: '공통기초반', name: '김주찬', code: '51517', feedbackRows: 11 },
    { className: '공통기초반', name: '전예준', code: '99696', feedbackRows: 5 },
    { className: '공통기초반', name: '윤유림', code: '28461', feedbackRows: 0 },
    { className: '공통기초반', name: '김성윤', code: '63792', feedbackRows: 0 },
    { className: '공통기초반', name: '한효제', code: '91834', feedbackRows: 0 },
    { className: '공통기초반', name: '박하준', code: '42658', feedbackRows: 0 },

    { className: '흥미반', name: '이현구', code: '77025', feedbackRows: 9 },
    { className: '흥미반', name: '오서영', code: '74202', feedbackRows: 8 },
    { className: '흥미반', name: '민다온', code: '14937', feedbackRows: 10 },
    { className: '흥미반', name: '김우현', code: '89234', feedbackRows: 12 },
    { className: '흥미반', name: '박리현', code: '96305', feedbackRows: 12 },

    { className: '만들기반', name: '강지호', code: '48316', feedbackRows: 9 },
    { className: '만들기반', name: '김은별', code: '39359', feedbackRows: 7 },
    { className: '만들기반', name: '노현승', code: '66618', feedbackRows: 4 },

    { className: '프로젝트반', name: '김주원', code: '13073', feedbackRows: 21 },
    { className: '프로젝트반', name: '석정현', code: '59873', feedbackRows: 10 },
    { className: '프로젝트반', name: '유시호', code: '40715', feedbackRows: 12 },
    { className: '프로젝트반', name: '한보윤', code: '47864', feedbackRows: 11 },
    { className: '프로젝트반', name: '한보리', code: '47864', feedbackRows: 11 },
    { className: '프로젝트반', name: '김기석', code: '46742', feedbackRows: 12 },
    { className: '프로젝트반', name: '박지용', code: '62703', feedbackRows: 12 },
    { className: '프로젝트반', name: '임하준', code: '45353', feedbackRows: 13 },
    { className: '프로젝트반', name: '이다연', code: '78202', feedbackRows: 20 },
    { className: '프로젝트반', name: '길태웅', code: '96923', feedbackRows: 3 },

    { className: '대회반', name: '하우빈', code: '69684', feedbackRows: 7 },
    { className: '대회반', name: '김영호', code: '15097', feedbackRows: 1 },
    { className: '대회반', name: '박도현', code: '53147', feedbackRows: 10 },
    { className: '대회반', name: '서민호', code: '24338', feedbackRows: 1 },
    { className: '대회반', name: '이세라', code: '72571', feedbackRows: 4 },
    { className: '대회반', name: '엄찬유', code: '49557', feedbackRows: 15 },
    { className: '대회반', name: '김윤호', code: '54456', feedbackRows: 16 },
    { className: '대회반', name: '변승완', code: '94902', feedbackRows: 19 },
    { className: '대회반', name: '김태현', code: '16006', feedbackRows: 12 },
    { className: '대회반', name: '김민준', code: '70082', feedbackRows: 5 },
    { className: '대회반', name: '조예준', code: '85678', feedbackRows: 11 },
    { className: '대회반', name: '이시아', code: '75244', feedbackRows: 5 },
]

export function findReferenceParentCode(name: string) {
    return REFERENCE_PARENT_CODES.find(row => row.name === name) || null
}

export function buildReferenceParentCodeRows() {
    return REFERENCE_PARENT_CODES.map(row => ({
        id: `reference-${row.name}`,
        studentId: null,
        authUserId: null,
        name: row.name,
        code: row.code,
        feedbackRows: row.feedbackRows,
        issuedAt: null,
        school: '',
        grade: '',
        className: row.className,
        linked: false,
        source: 'reference',
    }))
}
