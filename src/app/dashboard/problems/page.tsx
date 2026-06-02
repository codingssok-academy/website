'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getProblemSets } from '@/lib/actions/problems'
import Link from 'next/link'
import { BookOpen, Plus, Search, CheckCircle2, Circle, BarChart3 } from 'lucide-react'

interface ProblemSet {
  id: string
  title: string
  description: string | null
  category: string | null
  difficulty: string
  total_problems: number
  solved_count: number
}

export default function ProblemsPage() {
  const [sets, setSets] = useState<ProblemSet[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('student')
  const [search, setSearch] = useState('')

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

  const filtered = sets.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.description?.toLowerCase().includes(search.toLowerCase())
  )

  const difficultyColors: Record<string, string> = {
    beginner: '#10B981',
    intermediate: '#F59E0B',
    advanced: '#EF4444',
  }

  const difficultyLabels: Record<string, string> = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급',
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">문제 풀이</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            문제집을 선택하고 실력을 키워보세요
          </p>
        </div>
        {(role === 'teacher' || role === 'admin') && (
          <Link href="/dashboard/problems/manage" className="btn btn-primary">
            <Plus size={18} />
            문제집 추가
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-secondary)' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="문제집 검색..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-transparent text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
          style={{ borderColor: 'var(--color-border)', background: 'rgba(255,255,255,0.03)' }}
        />
      </div>

      {/* Problem Sets */}
      {filtered.length === 0 ? (
        <div className="glass-premium rounded-2xl p-12 text-center">
          <BookOpen size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-lg font-semibold mb-2">등록된 문제집이 없습니다</p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            문제집이 등록되면 여기에 표시됩니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(set => {
            const progress = set.total_problems > 0
              ? Math.round((set.solved_count / set.total_problems) * 100) : 0

            return (
              <Link key={set.id} href={`/dashboard/problems/${set.id}`}
                className="glass-premium rounded-xl p-5 group hover:border-blue-500/30 transition-all duration-300 block"
                style={{ border: '1px solid var(--color-border)' }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{set.title}</h3>
                    {set.description && (
                      <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                        {set.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium shrink-0"
                    style={{ background: `${difficultyColors[set.difficulty]}20`, color: difficultyColors[set.difficulty] }}>
                    {difficultyLabels[set.difficulty] || set.difficulty}
                  </span>
                </div>

                {/* Progress */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
                      <BarChart3 size={12} />
                      {set.solved_count} / {set.total_problems} 문제
                    </span>
                    <span style={{ color: progress === 100 ? '#10B981' : 'var(--color-text-secondary)' }}>
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        background: progress === 100 ? '#10B981' : 'var(--gradient-primary)',
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-green-400" />
                    {set.solved_count} 완료
                  </span>
                  <span className="flex items-center gap-1">
                    <Circle size={12} />
                    {set.total_problems - set.solved_count} 남음
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
