'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getProblemById, submitSolution, getSubmissionHistory } from '@/lib/actions/problems'
import Link from 'next/link'
import { ArrowLeft, Send, CheckCircle2, XCircle, Clock, Code2 } from 'lucide-react'

interface Problem {
  id: string
  title: string
  description: string | null
  input_description: string | null
  output_description: string | null
  sample_input: string | null
  sample_output: string | null
  difficulty: number
  problem_type: string
  xp_reward: number
  problem_sets: { title: string } | null
}

interface Submission {
  id: string
  answer: string
  is_correct: boolean
  attempt_number: number
  submitted_at: string
}

export default function SolveProblemPage() {
  const params = useParams()
  const problemId = params.problemId as string
  const [problem, setProblem] = useState<Problem | null>(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ isCorrect: boolean; attemptNumber: number } | null>(null)
  const [history, setHistory] = useState<Submission[]>([])

  useEffect(() => {
    async function load() {
      const problemResult = await getProblemById(problemId)
      if (problemResult.data) setProblem(problemResult.data as Problem)

      const historyResult = await getSubmissionHistory(problemId)
      if (historyResult.data) setHistory(historyResult.data)

      setLoading(false)
    }
    load()
  }, [problemId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!answer.trim()) return
    setSubmitting(true)
    setResult(null)

    const res = await submitSolution(problemId, answer)
    if (!res.error && res.isCorrect !== undefined) {
      setResult({ isCorrect: res.isCorrect, attemptNumber: res.attemptNumber || 1 })
      // Refresh history
      const historyResult = await getSubmissionHistory(problemId)
      if (historyResult.data) setHistory(historyResult.data)
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!problem) {
    return <div className="text-center py-12">문제를 찾을 수 없습니다.</div>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/problems" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold">{problem.title}</h1>
          <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <span>+{problem.xp_reward} XP</span>
            <span>|</span>
            <span>난이도 {problem.difficulty}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Problem Description */}
        <div className="space-y-4">
          <div className="glass-premium rounded-xl p-6" style={{ border: '1px solid var(--color-border)' }}>
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Code2 size={16} style={{ color: 'var(--color-primary)' }} />
              문제 설명
            </h2>
            <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
              {problem.description || '문제 설명이 없습니다.'}
            </div>
          </div>

          {problem.input_description && (
            <div className="glass-premium rounded-xl p-6" style={{ border: '1px solid var(--color-border)' }}>
              <h3 className="font-semibold text-sm mb-2">입력 설명</h3>
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>{problem.input_description}</p>
            </div>
          )}

          {problem.output_description && (
            <div className="glass-premium rounded-xl p-6" style={{ border: '1px solid var(--color-border)' }}>
              <h3 className="font-semibold text-sm mb-2">출력 설명</h3>
              <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>{problem.output_description}</p>
            </div>
          )}

          {(problem.sample_input || problem.sample_output) && (
            <div className="glass-premium rounded-xl p-6" style={{ border: '1px solid var(--color-border)' }}>
              <h3 className="font-semibold text-sm mb-3">예제</h3>
              <div className="grid grid-cols-2 gap-4">
                {problem.sample_input && (
                  <div>
                    <span className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>입력</span>
                    <pre className="p-3 rounded-lg text-sm font-mono" style={{ background: 'rgba(0,0,0,0.3)' }}>{problem.sample_input}</pre>
                  </div>
                )}
                {problem.sample_output && (
                  <div>
                    <span className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>출력</span>
                    <pre className="p-3 rounded-lg text-sm font-mono" style={{ background: 'rgba(0,0,0,0.3)' }}>{problem.sample_output}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Answer & History */}
        <div className="space-y-4">
          {/* Answer Form */}
          <form onSubmit={handleSubmit} className="glass-premium rounded-xl p-6" style={{ border: '1px solid var(--color-border)' }}>
            <h2 className="font-semibold mb-3">답안 제출</h2>
            <textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder={problem.problem_type === 'code' ? '코드를 입력하세요...' : '답을 입력하세요...'}
              rows={8}
              className="w-full p-4 rounded-xl border bg-transparent text-white font-mono text-sm resize-none focus:outline-none focus:border-blue-500"
              style={{ borderColor: 'var(--color-border)', background: 'rgba(0,0,0,0.3)' }}
              spellCheck={false}
            />

            {result && (
              <div className="mt-3 p-3 rounded-lg text-sm flex items-center gap-2" style={{
                background: result.isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                color: result.isCorrect ? '#10B981' : '#EF4444',
                border: `1px solid ${result.isCorrect ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              }}>
                {result.isCorrect ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {result.isCorrect ? '정답입니다!' : `틀렸습니다. (시도 ${result.attemptNumber}회)`}
              </div>
            )}

            <button type="submit" disabled={submitting || !answer.trim()} className="btn btn-primary w-full justify-center mt-3">
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={16} />
                  제출
                </>
              )}
            </button>
          </form>

          {/* Submission History */}
          {history.length > 0 && (
            <div className="glass-premium rounded-xl p-6" style={{ border: '1px solid var(--color-border)' }}>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Clock size={14} />
                제출 기록
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
                    style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div className="flex items-center gap-2">
                      {sub.is_correct ?
                        <CheckCircle2 size={14} className="text-green-400" /> :
                        <XCircle size={14} className="text-red-400" />
                      }
                      <span>#{sub.attempt_number}</span>
                    </div>
                    <span style={{ color: 'var(--color-text-secondary)' }}>
                      {new Date(sub.submitted_at).toLocaleString('ko-KR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
