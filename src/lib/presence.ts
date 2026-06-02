export type LearningActivityState = 'active' | 'attentive' | 'idle' | 'background' | 'offline'

export interface PresenceSnapshot {
    is_online: boolean
    last_heartbeat: string
    started_at?: string | null
    activity_state?: string | null
    activity_score?: number | null
    last_interaction_at?: string | null
    current_focus_label?: string | null
    session_origin?: string | null
    learning_context?: string | null
}

const ONLINE_WINDOW_MS = 120_000

export function isPresenceOnline(snapshot: PresenceSnapshot, now = Date.now()) {
    return snapshot.is_online && new Date(snapshot.last_heartbeat).getTime() > now - ONLINE_WINDOW_MS
}

export function getPresenceStudyMinutes(snapshot: PresenceSnapshot, now = Date.now()) {
    if (!snapshot.started_at || !isPresenceOnline(snapshot, now)) return 0
    return Math.max(0, Math.floor((now - new Date(snapshot.started_at).getTime()) / 60_000))
}

export function resolvePresenceStatus(snapshot: PresenceSnapshot, now = Date.now()) {
    if (!isPresenceOnline(snapshot, now)) {
        return {
            key: 'offline' as LearningActivityState,
            label: '오프라인',
            detail: '최근 접속 기록만 남아 있습니다.',
            color: '#94a3b8',
            bg: '#F8FAFC',
            border: '#E2E8F0',
            score: 0,
        }
    }

    const score = Math.max(0, Math.min(100, snapshot.activity_score ?? 0))
    const key = (snapshot.activity_state || 'attentive') as LearningActivityState

    if (key === 'active') {
        return {
            key,
            label: '활발히 학습 중',
            detail: '최근 입력과 화면 상호작용이 감지되었습니다.',
            color: '#059669',
            bg: '#F0FDF4',
            border: '#BBF7D0',
            score,
        }
    }

    if (key === 'idle') {
        return {
            key,
            label: '잠시 비활동',
            detail: '학습 화면은 열려 있지만 최근 입력은 적습니다.',
            color: '#f59e0b',
            bg: '#FFFBEB',
            border: '#FDE68A',
            score,
        }
    }

    if (key === 'background') {
        return {
            key,
            label: '백그라운드 상태',
            detail: '학습 화면이 다른 화면 뒤로 이동했습니다.',
            color: '#a855f7',
            bg: '#FAF5FF',
            border: '#E9D5FF',
            score,
        }
    }

    return {
        key: 'attentive' as LearningActivityState,
        label: '학습 화면 확인 중',
        detail: '현재 학습 화면에 머무르고 있습니다.',
        color: '#2563eb',
        bg: '#EFF6FF',
        border: '#BFDBFE',
        score,
    }
}
