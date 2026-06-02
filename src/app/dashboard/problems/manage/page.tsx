'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createProblemSet, createProblem, getProblemSets, getProblemsInSet } from '@/lib/actions/problems'
import Link from 'next/link'
import {
    ArrowLeft, Plus, BookOpen, ChevronDown, ChevronRight,
    Save, Trash2, FileText, Code2, Hash, Zap, Layers
} from 'lucide-react'

interface ProblemSet {
    id: string; title: string; description: string | null; category: string | null;
    difficulty: string; total_problems: number; solved_count: number;
}

interface Problem {
    id: string; title: string; difficulty: number; problem_type: string;
    xp_reward: number; sort_order: number;
    status?: { attempted: boolean; solved: boolean; attempts: number }
}

export default function ManageProblemsPage() {
    const [role, setRole] = useState('')
    const [sets, setSets] = useState<ProblemSet[]>([])
    const [expandedSet, setExpandedSet] = useState<string | null>(null)
    const [setProblems, setSetProblems] = useState<Record<string, Problem[]>>({})
    const [loading, setLoading] = useState(true)

    // New Set form
    const [showNewSet, setShowNewSet] = useState(false)
    const [newSet, setNewSet] = useState({ title: '', description: '', category: '', difficulty: 'beginner' })

    // New Problem form
    const [showNewProblem, setShowNewProblem] = useState<string | null>(null)
    const [newProblem, setNewProblem] = useState({
        title: '', description: '', input_description: '', output_description: '',
        sample_input: '', sample_output: '', answer: '', difficulty: '1',
        problem_type: 'short_answer', xp_reward: '10',
    })

    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

    useEffect(() => {
        async function load() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setRole(user.user_metadata?.role || 'student')

            const result = await getProblemSets()
            if (result.data) setSets(result.data as ProblemSet[])
            setLoading(false)
        }
        load()
    }, [])

    const loadProblems = async (setId: string) => {
        if (setProblems[setId]) {
            setExpandedSet(expandedSet === setId ? null : setId)
            return
        }

        const result = await getProblemsInSet(setId)
        if (result.data) {
            setSetProblems(prev => ({ ...prev, [setId]: result.data as Problem[] }))
        }
        setExpandedSet(setId)
    }

    const handleCreateSet = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        const formData = new FormData()
        formData.set('title', newSet.title)
        formData.set('description', newSet.description)
        formData.set('category', newSet.category)
        formData.set('difficulty', newSet.difficulty)

        const result = await createProblemSet(formData)
        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: '문제집이 생성되었습니다.' })
            setNewSet({ title: '', description: '', category: '', difficulty: 'beginner' })
            setShowNewSet(false)
            // Reload
            const refreshed = await getProblemSets()
            if (refreshed.data) setSets(refreshed.data as ProblemSet[])
        }
        setSaving(false)
    }

    const handleCreateProblem = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!showNewProblem) return
        setSaving(true)
        setMessage(null)

        const formData = new FormData()
        formData.set('set_id', showNewProblem)
        formData.set('title', newProblem.title)
        formData.set('description', newProblem.description)
        formData.set('input_description', newProblem.input_description)
        formData.set('output_description', newProblem.output_description)
        formData.set('sample_input', newProblem.sample_input)
        formData.set('sample_output', newProblem.sample_output)
        formData.set('answer', newProblem.answer)
        formData.set('difficulty', newProblem.difficulty)
        formData.set('problem_type', newProblem.problem_type)
        formData.set('xp_reward', newProblem.xp_reward)

        const result = await createProblem(formData)
        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: '문제가 추가되었습니다.' })
            setNewProblem({
                title: '', description: '', input_description: '', output_description: '',
                sample_input: '', sample_output: '', answer: '', difficulty: '1',
                problem_type: 'short_answer', xp_reward: '10',
            })
            setShowNewProblem(null)
            // Reload problems for this set
            const refreshed = await getProblemsInSet(showNewProblem)
            if (refreshed.data) {
                setSetProblems(prev => ({ ...prev, [showNewProblem!]: refreshed.data as Problem[] }))
            }
            // Also reload sets to update counts
            const refreshedSets = await getProblemSets()
            if (refreshedSets.data) setSets(refreshedSets.data as ProblemSet[])
        }
        setSaving(false)
    }

    const difficultyColors: Record<string, string> = {
        beginner: '#10B981', intermediate: '#F59E0B', advanced: '#EF4444',
    }
    const difficultyLabels: Record<string, string> = {
        beginner: '초급', intermediate: '중급', advanced: '고급',
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
        )
    }

    if (role !== 'teacher' && role !== 'admin') {
        return (
            <div className="text-center py-12">
                <Layers size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-semibold mb-2">접근 권한이 없습니다</p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>관리자만 접근할 수 있습니다.</p>
                <Link href="/dashboard/problems" className="btn btn-primary mt-4 inline-flex">돌아가기</Link>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/problems" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">문제 관리</h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                            문제집을 만들고 문제를 추가하세요
                        </p>
                    </div>
                </div>
                <button onClick={() => setShowNewSet(true)} className="btn btn-primary">
                    <Plus size={18} />
                    새 문제집
                </button>
            </div>

            {/* Status Message */}
            {message && (
                <div className="p-3 rounded-xl text-sm" style={{
                    background: message.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    color: message.type === 'success' ? '#10B981' : '#EF4444',
                    border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>
                    {message.text}
                </div>
            )}

            {/* New Problem Set Form */}
            {showNewSet && (
                <form onSubmit={handleCreateSet} className="glass-premium rounded-xl p-6 space-y-4" style={{ border: '1px solid var(--color-primary)', borderColor: 'rgba(0,102,255,0.3)' }}>
                    <h3 className="font-semibold flex items-center gap-2">
                        <BookOpen size={18} style={{ color: 'var(--color-primary)' }} />
                        새 문제집 만들기
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" value={newSet.title} onChange={e => setNewSet(p => ({ ...p, title: e.target.value }))}
                            placeholder="문제집 제목 *" required
                            className="w-full px-4 py-2.5 rounded-xl border bg-transparent text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
                            style={{ borderColor: 'var(--color-border)', background: 'rgba(255,255,255,0.03)' }} />
                        <input type="text" value={newSet.category} onChange={e => setNewSet(p => ({ ...p, category: e.target.value }))}
                            placeholder="카테고리 (예: C언어, Python)"
                            className="w-full px-4 py-2.5 rounded-xl border bg-transparent text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
                            style={{ borderColor: 'var(--color-border)', background: 'rgba(255,255,255,0.03)' }} />
                    </div>
                    <textarea value={newSet.description} onChange={e => setNewSet(p => ({ ...p, description: e.target.value }))}
                        placeholder="문제집 설명" rows={2}
                        className="w-full px-4 py-2.5 rounded-xl border bg-transparent text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                        style={{ borderColor: 'var(--color-border)', background: 'rgba(255,255,255,0.03)' }} />
                    <div className="flex items-center gap-3">
                        <select value={newSet.difficulty} onChange={e => setNewSet(p => ({ ...p, difficulty: e.target.value }))}
                            className="px-4 py-2.5 rounded-xl border bg-transparent text-white focus:outline-none"
                            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
                            <option value="beginner">초급</option>
                            <option value="intermediate">중급</option>
                            <option value="advanced">고급</option>
                        </select>
                        <div className="flex-1" />
                        <button type="button" onClick={() => setShowNewSet(false)} className="px-4 py-2 rounded-xl text-sm hover:bg-white/5 transition-colors">취소</button>
                        <button type="submit" disabled={saving} className="btn btn-primary">
                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={16} /> 생성</>}
                        </button>
                    </div>
                </form>
            )}

            {/* Problem Sets List */}
            {sets.length === 0 && !showNewSet ? (
                <div className="glass-premium rounded-2xl p-12 text-center">
                    <BookOpen size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-secondary)' }} />
                    <p className="text-lg font-semibold mb-2">문제집이 없습니다</p>
                    <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                        위 버튼을 클릭하여 첫 문제집을 만들어보세요.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sets.map(set => (
                        <div key={set.id} className="glass-premium rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                            {/* Set Header */}
                            <button onClick={() => loadProblems(set.id)}
                                className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors text-left">
                                <div className="flex items-center gap-3">
                                    {expandedSet === set.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{set.title}</h3>
                                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                                style={{ background: `${difficultyColors[set.difficulty]}20`, color: difficultyColors[set.difficulty] }}>
                                                {difficultyLabels[set.difficulty] || set.difficulty}
                                            </span>
                                        </div>
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                            {set.total_problems}개 문제 {set.category ? `· ${set.category}` : ''}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={e => { e.stopPropagation(); setShowNewProblem(set.id) }}
                                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg hover:bg-blue-500/10 text-blue-400 transition-colors">
                                    <Plus size={14} /> 문제 추가
                                </button>
                            </button>

                            {/* Problems List */}
                            {expandedSet === set.id && (
                                <div className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                                    {(setProblems[set.id] || []).length === 0 ? (
                                        <p className="p-4 text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
                                            아직 문제가 없습니다. 문제를 추가해주세요.
                                        </p>
                                    ) : (
                                        (setProblems[set.id] || []).map((problem, idx) => (
                                            <div key={problem.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors"
                                                style={{ borderBottom: idx < (setProblems[set.id] || []).length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="text-xs font-mono w-6 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                                                        {idx + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium truncate">{problem.title}</p>
                                                        <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                                                            <span className="flex items-center gap-0.5">
                                                                <Zap size={10} /> {problem.xp_reward} XP
                                                            </span>
                                                            <span>난이도 {problem.difficulty}</span>
                                                            <span className="capitalize">{problem.problem_type}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Link href={`/dashboard/problems/solve/${problem.id}`}
                                                    className="text-xs px-3 py-1 rounded-lg hover:bg-white/5 transition-colors"
                                                    style={{ color: 'var(--color-primary)' }}>
                                                    미리보기
                                                </Link>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* New Problem Form (inline) */}
                            {showNewProblem === set.id && (
                                <form onSubmit={handleCreateProblem} className="border-t p-5 space-y-4"
                                    style={{ borderColor: 'var(--color-border)', background: 'rgba(0,102,255,0.03)' }}>
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                        <FileText size={16} style={{ color: 'var(--color-accent-cyan)' }} />
                                        새 문제 추가 - {set.title}
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input type="text" value={newProblem.title} onChange={e => setNewProblem(p => ({ ...p, title: e.target.value }))}
                                            placeholder="문제 제목 *" required
                                            className="w-full px-3 py-2 rounded-lg border bg-transparent text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
                                            style={{ borderColor: 'var(--color-border)', background: 'rgba(255,255,255,0.03)' }} />
                                        <div className="flex gap-2">
                                            <select value={newProblem.problem_type} onChange={e => setNewProblem(p => ({ ...p, problem_type: e.target.value }))}
                                                className="px-3 py-2 rounded-lg border bg-transparent text-white text-sm focus:outline-none"
                                                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
                                                <option value="short_answer">단답형</option>
                                                <option value="text">서술형</option>
                                                <option value="code">코드</option>
                                                <option value="multiple_choice">객관식</option>
                                            </select>
                                            <select value={newProblem.difficulty} onChange={e => setNewProblem(p => ({ ...p, difficulty: e.target.value }))}
                                                className="px-3 py-2 rounded-lg border bg-transparent text-white text-sm focus:outline-none"
                                                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}>
                                                {[1, 2, 3, 4, 5].map(d => (
                                                    <option key={d} value={d}>난이도 {d}</option>
                                                ))}
                                            </select>
                                            <input type="number" value={newProblem.xp_reward} onChange={e => setNewProblem(p => ({ ...p, xp_reward: e.target.value }))}
                                                placeholder="XP" min="1" max="100"
                                                className="w-20 px-3 py-2 rounded-lg border bg-transparent text-white text-sm focus:outline-none"
                                                style={{ borderColor: 'var(--color-border)', background: 'rgba(255,255,255,0.03)' }} />
                                        </div>
                                    </div>
                                    <textarea value={newProblem.description} onChange={e => setNewProblem(p => ({ ...p, description: e.target.value }))}
                                        placeholder="문제 설명" rows={3}
                                        className="w-full px-3 py-2 rounded-lg border bg-transparent text-white text-sm placeholder:text-gray-500 focus:outline-none resize-none"
                                        style={{ borderColor: 'var(--color-border)', background: 'rgba(255,255,255,0.03)' }} />
                                    <div className="grid grid-cols-2 gap-3">
                                        <textarea value={newProblem.sample_input} onChange={e => setNewProblem(p => ({ ...p, sample_input: e.target.value }))}
                                            placeholder="예제 입력" rows={2}
                                            className="w-full px-3 py-2 rounded-lg border bg-transparent text-white text-sm font-mono placeholder:text-gray-500 focus:outline-none resize-none"
                                            style={{ borderColor: 'var(--color-border)', background: 'rgba(255,255,255,0.03)' }} />
                                        <textarea value={newProblem.sample_output} onChange={e => setNewProblem(p => ({ ...p, sample_output: e.target.value }))}
                                            placeholder="예제 출력" rows={2}
                                            className="w-full px-3 py-2 rounded-lg border bg-transparent text-white text-sm font-mono placeholder:text-gray-500 focus:outline-none resize-none"
                                            style={{ borderColor: 'var(--color-border)', background: 'rgba(255,255,255,0.03)' }} />
                                    </div>
                                    <input type="text" value={newProblem.answer} onChange={e => setNewProblem(p => ({ ...p, answer: e.target.value }))}
                                        placeholder="정답 (자동 채점용, 선택사항)"
                                        className="w-full px-3 py-2 rounded-lg border bg-transparent text-white text-sm placeholder:text-gray-500 focus:outline-none"
                                        style={{ borderColor: 'var(--color-border)', background: 'rgba(255,255,255,0.03)' }} />
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => setShowNewProblem(null)}
                                            className="px-4 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors">취소</button>
                                        <button type="submit" disabled={saving} className="btn btn-primary">
                                            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Plus size={16} /> 추가</>}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
