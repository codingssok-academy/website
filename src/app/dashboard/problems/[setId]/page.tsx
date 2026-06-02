'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getProblemsInSet } from '@/lib/actions/problems'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, XCircle, Circle, Hash } from 'lucide-react'

interface Problem {
  id: string
  title: string
  difficulty: number
  sort_order: number
  xp_reward: number
  status?: { attempted: boolean; solved: boolean; attempts: number }
}

export default function ProblemSetPage() {
  const params = useParams()
  const setId = params.setId as string
  const [problems, setProblems] = useState<Problem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const result = await getProblemsInSet(setId)
      if (result.data) setProblems(result.data as Problem[])
      setLoading(false)
    }
    load()
  }, [setId])

  const difficultyStars = (d: number) => {
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#DC2626']
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-1.5 h-3 rounded-sm" style={{
            background: i < d ? colors[Math.min(d - 1, 4)] : 'rgba(255,255,255,0.1)',
          }} />
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/problems" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">문제 목록</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {problems.length}개 문제
          </p>
        </div>
      </div>

      {/* Problem Table */}
      <div className="glass-premium rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>상태</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                <Hash size={12} className="inline" /> 번호
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>제목</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>난이도</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>XP</th>
              <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>시도</th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem, idx) => (
              <tr key={problem.id} className="hover:bg-white/3 transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td className="px-5 py-3">
                  {problem.status?.solved ? (
                    <CheckCircle2 size={18} className="text-green-400" />
                  ) : problem.status?.attempted ? (
                    <XCircle size={18} className="text-orange-400" />
                  ) : (
                    <Circle size={18} style={{ color: 'var(--color-text-secondary)' }} />
                  )}
                </td>
                <td className="px-5 py-3 text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                  {idx + 1}
                </td>
                <td className="px-5 py-3">
                  <Link href={`/dashboard/problems/solve/${problem.id}`}
                    className="text-sm font-medium text-white hover:text-blue-400 transition-colors">
                    {problem.title}
                  </Link>
                </td>
                <td className="px-5 py-3">{difficultyStars(problem.difficulty)}</td>
                <td className="px-5 py-3 text-sm font-mono" style={{ color: 'var(--color-accent-cyan)' }}>
                  +{problem.xp_reward}
                </td>
                <td className="px-5 py-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {(problem.status?.attempts ?? 0) > 0 ? `${problem.status?.attempts}회` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
