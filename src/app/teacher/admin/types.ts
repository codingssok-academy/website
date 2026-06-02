/* ═══════════════════════════════════════
   관리자 앱 공유 타입
   ═══════════════════════════════════════ */

export interface Student {
    id: string;
    name: string;
    birthday: string;
    grade: string | null;
    class: string | null;
    avatar: string | null;
    pin?: string | null;
    auth_user_id?: string | null;
    created_at: string;
}

export interface ParentLink {
    id: string;
    student_id: string;
    parent_user_id?: string | null;
    parent_name: string;
    relation?: string | null;
    parent_phone?: string | null;
    kakao_recipient_key?: string | null;
    channel_user_key?: string | null;
    notifications_enabled?: boolean | null;
    receive_live_updates?: boolean | null;
    receive_feedback_updates?: boolean | null;
    created_at: string;
}

export interface TeacherAccount {
    id: string;
    email: string | null;
    role: string | null;
    name: string | null;
    display_name: string | null;
}

export interface PresenceRow {
    user_id: string;
    student_name: string;
    course_id: string | null;
    course_title: string | null;
    unit_id: string | null;
    unit_title: string | null;
    page_id: string | null;
    page_title: string | null;
    page_url: string | null;
    is_online: boolean;
    last_heartbeat: string;
    started_at: string;
    activity_state?: string | null;
    activity_score?: number | null;
    last_interaction_at?: string | null;
    current_focus_label?: string | null;
    session_origin?: string | null;
    learning_context?: string | null;
}

export interface HomeworkItem {
    id: string;
    title: string;
    description: string;
    due_date: string;
    course_id: string;
    assigned_to: string | null;
    is_active: boolean;
    created_at: string;
    html_url?: string;
    homework_type?: string;
}

export interface HomeworkSubmission {
    id: string;
    homework_id: string;
    user_id: string;
    content: string;
    score: number | null;
    feedback: string | null;
    submitted_at: string;
}

export interface FeedbackHistory {
    id: string;
    teacher_name: string;
    content: string;
    course_id: string | null;
    category: string;
    created_at: string;
    student_id: string;
    focus_score?: number | null;
    engagement_score?: number | null;
    understanding_score?: number | null;
    homework_summary?: string | null;
    next_plan?: string | null;
    delivery_status?: string | null;
}

export interface ChatStudent {
    id: string;
    name: string;
    lastMsg: string;
    unread: number;
    lastTime: string;
}

export interface ChatMessage {
    id: string;
    sender_id: string;
    receiver_id: string;
    sender_name: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    author_id: string | null;
    is_pinned: boolean;
    created_at: string;
}
