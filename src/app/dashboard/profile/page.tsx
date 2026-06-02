'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getProfileStats, getActivityHeatmap, getRecentActivity } from '@/lib/actions/profile'
import { getStudentXP } from '@/lib/actions/xp'
import { getTierInfo, getTierFrame, getLevelTitle, getDisplayTier } from '@/lib/xp-engine'
import TierIcon from '@/components/icons/TierIcon'
import ProfileEffect from '@/components/ui/ProfileEffect'
import { User, BarChart3, FileText, BookOpen, Zap, Award, Target, TrendingUp, Clock, ShoppingBag } from 'lucide-react'
import { useParentPin } from '@/hooks/useParentPin'
import { useProfileEffect } from '@/hooks/useProfileEffect'
import { useActivityLog } from '@/hooks/useLearningData'

// 상점 아이템 메타 (store page와 동일)
const STORE_ITEM_META: Record<string, { icon: string; name: string; category: string }> = {
  badge_star: { icon: "star", name: "스타 뱃지", category: "뱃지" },
  badge_fire: { icon: "local_fire_department", name: "파이어 뱃지", category: "뱃지" },
  badge_diamond: { icon: "diamond", name: "다이아몬드 뱃지", category: "뱃지" },
  title_coder: { icon: "workspace_premium", name: "코딩 마스터", category: "칭호" },
  frame_gold: { icon: "auto_awesome", name: "황금 프로필 테두리", category: "꾸미기" },
  theme_dark: { icon: "dark_mode", name: "다크 테마", category: "테마" },
  theme_neon: { icon: "palette", name: "네온 테마", category: "테마" },
}

interface ProfileData {
  profile: {
    id: string; name: string; email: string; role: string;
    display_name: string; avatar_url: string; bio: string;
    level: number; total_xp: number; rank: string; created_at: string;
  }
  stats: {
    totalSubmissions: number; solvedProblems: number; accuracy: number;
    notesCount: number; materialsViewed: number;
  }
  xpLogs: { amount: number; reason: string; created_at: string }[]
  rankExams: { status: string; score: number; created_at: string }[]
}

interface XPData {
  totalXp: number; level: number; currentLevelXp: number;
  nextLevelXp: number; progress: number; rank: string; canTakeRankExam: boolean;
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData | null>(null)
  const [xpData, setXpData] = useState<XPData | null>(null)
  const [heatmap, setHeatmap] = useState<Record<string, number>>({})
  const [recentActivity, setRecentActivity] = useState<{
    submissions: unknown[]; materialViews: unknown[]; notes: unknown[]
  }>({ submissions: [], materialViews: [], notes: [] })
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [purchasedItems, setPurchasedItems] = useState<string[]>([])
  const { pin, regeneratePin } = useParentPin(userId)
  const activeEffect = useProfileEffect()
  const { activities: activityLog, loading: activityLoading } = useActivityLog(10)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const [profileResult, xpResult, heatmapResult, activityResult] = await Promise.all([
        getProfileStats(user.id),
        getStudentXP(user.id),
        getActivityHeatmap(user.id),
        getRecentActivity(user.id),
      ])

      // 구매 아이템 로드
      try {
        const { data: purchases } = await supabase
          .from('store_purchases')
          .select('item_id')
          .eq('user_id', user.id)
        if (purchases) {
          setPurchasedItems(Array.from(new Set(purchases.map((p: { item_id: string }) => p.item_id))))
        }
      } catch {
        // store_purchases 테이블 미존재 시 무시
      }

      if (profileResult.data) setData(profileResult.data as ProfileData)
      if (xpResult.data) setXpData(xpResult.data)
      if (heatmapResult.data) setHeatmap(heatmapResult.data)
      if (activityResult.data) setRecentActivity(activityResult.data as typeof recentActivity)
      setLoading(false)
    }
    load()
  }, [])

  // Generate heatmap grid (last 365 days)
  const renderHeatmap = () => {
    const days = 365
    const cells = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const count = heatmap[dateStr] || 0

      let bg = 'rgba(255,255,255,0.05)'
      if (count >= 10) bg = 'rgba(0,102,255,0.8)'
      else if (count >= 5) bg = 'rgba(0,102,255,0.6)'
      else if (count >= 3) bg = 'rgba(0,102,255,0.4)'
      else if (count >= 1) bg = 'rgba(0,102,255,0.2)'

      cells.push(
        <div
          key={dateStr}
          className="w-2.5 h-2.5 rounded-sm"
          style={{ background: bg }}
          title={`${dateStr}: ${count}건`}
        />
      )
    }
    return cells
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) return <div className="text-center py-12">프로필을 불러올 수 없습니다.</div>

  const { profile, stats } = data
  const userLevel = xpData?.level || profile.level || 1
  const tierInfo = getDisplayTier(profile.rank || 'Iron', userLevel)
  const tierFrame = getTierFrame(tierInfo.name)
  const levelTitle = getLevelTitle(userLevel)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Profile Header */}
      <div className="glass-premium rounded-2xl p-6" style={{ border: '1px solid var(--color-border)' }}>
        <div className="flex items-start gap-5">
          <div className="shrink-0" style={{
            position: 'relative',
            ...(purchasedItems.includes('frame_gold') ? {
              borderRadius: '50%',
              boxShadow: '0 0 0 3px #fbbf24, 0 0 16px rgba(251,191,36,0.4)',
            } : {}),
          }}>
            <ProfileEffect effect={activeEffect} size={64}>
              <TierIcon tier={tierInfo.name} size={64} animated />
            </ProfileEffect>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              {purchasedItems.includes('title_coder') && (
                <span className="text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1"
                  style={{ background: 'linear-gradient(135deg, #f59e0b22, #fbbf2433)', color: '#d97706', border: '1px solid #fbbf2444' }}>
                  코딩 마스터
                </span>
              )}
              <span className="text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1"
                style={{ background: `${tierInfo.color}20`, color: tierInfo.color }}>
                <TierIcon tier={tierInfo.name} size={14} /> {tierInfo.nameKo}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Lv.{userLevel} · <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: "middle" }}>{levelTitle.icon}</span> {levelTitle.title}
            </p>

            {/* XP Progress Bar */}
            {xpData && (
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    XP: {xpData.currentLevelXp} / {xpData.nextLevelXp}
                  </span>
                  <span style={{ color: 'var(--color-accent-cyan)' }}>
                    총 {xpData.totalXp} XP
                  </span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${xpData.progress}%`, background: 'var(--gradient-primary)' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Parent Access PIN */}
      {pin && (
        <div className="glass-premium rounded-xl p-5" style={{ border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock</span>
                학부모 접속 코드
              </h2>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                학부모님께 이 코드를 알려드리면 학습 현황을 확인할 수 있습니다.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <code className="text-2xl font-bold tracking-[0.3em] px-4 py-2 rounded-xl" 
                style={{ background: 'rgba(99,102,241,0.1)', color: '#3b82f6', fontFamily: "'JetBrains Mono', monospace" }}>
                {pin}
              </code>
              <button onClick={regeneratePin} className="text-xs px-3 py-2 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
                title="새 코드 생성">
                재발급
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: '풀은 문제', value: stats.solvedProblems, icon: <Target size={16} />, color: '#10B981' },
          { label: '총 제출', value: stats.totalSubmissions, icon: <BarChart3 size={16} />, color: '#3B82F6' },
          { label: '정답률', value: `${stats.accuracy}%`, icon: <TrendingUp size={16} />, color: '#F59E0B' },
          { label: '학습 노트', value: stats.notesCount, icon: <FileText size={16} />, color: '#2563eb' },
          { label: '학습 자료', value: stats.materialsViewed, icon: <BookOpen size={16} />, color: '#06B6D4' },
        ].map((stat, i) => (
          <div key={i} className="glass-premium rounded-xl p-4 text-center" style={{ border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-center mb-2" style={{ color: stat.color }}>
              {stat.icon}
            </div>
            <div className="text-xl font-bold">{stat.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Purchased Items */}
      {purchasedItems.length > 0 && (
        <div className="glass-premium rounded-xl p-6" style={{ border: '1px solid var(--color-border)' }}>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <ShoppingBag size={16} style={{ color: '#f59e0b' }} />
            보유 아이템
          </h2>
          <div className="flex flex-wrap gap-2">
            {purchasedItems
              .filter(id => STORE_ITEM_META[id])
              .map(id => {
                const meta = STORE_ITEM_META[id]
                return (
                  <div key={id} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{meta.icon}</span>
                    <span className="font-medium">{meta.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                      {meta.category}
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* Activity Heatmap */}
      <div className="glass-premium rounded-xl p-6" style={{ border: '1px solid var(--color-border)' }}>
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Zap size={16} style={{ color: 'var(--color-primary)' }} />
          학습 활동
        </h2>
        <div className="flex flex-wrap gap-0.5 overflow-hidden">
          {renderHeatmap()}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          <span>적음</span>
          {['rgba(255,255,255,0.05)', 'rgba(0,102,255,0.2)', 'rgba(0,102,255,0.4)', 'rgba(0,102,255,0.6)', 'rgba(0,102,255,0.8)'].map((bg, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ background: bg }} />
          ))}
          <span>많음</span>
        </div>
      </div>

      {/* XP History */}
      {data.xpLogs.length > 0 && (
        <div className="glass-premium rounded-xl p-6" style={{ border: '1px solid var(--color-border)' }}>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Award size={16} style={{ color: 'var(--color-accent-cyan)' }} />
            경험치 이력
          </h2>
          <div className="space-y-2">
            {data.xpLogs.map((log, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold" style={{ color: 'var(--color-accent-cyan)' }}>+{log.amount}</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{log.reason}</span>
                </div>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {new Date(log.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rank Exams */}
      {data.rankExams.length > 0 && (
        <div className="glass-premium rounded-xl p-6" style={{ border: '1px solid var(--color-border)' }}>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <User size={16} style={{ color: 'var(--color-accent-purple)' }} />
            승급 시험 기록
          </h2>
          <div className="space-y-2">
            {data.rankExams.map((exam, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <span className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    background: exam.status === 'passed' ? 'rgba(16,185,129,0.2)' : exam.status === 'failed' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                    color: exam.status === 'passed' ? '#10B981' : exam.status === 'failed' ? '#EF4444' : '#F59E0B',
                  }}>
                  {exam.status === 'passed' ? '합격' : exam.status === 'failed' ? '불합격' : '대기'}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {exam.score != null && `${exam.score}점 | `}
                  {new Date(exam.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Log */}
      {!activityLoading && activityLog.length > 0 && (
        <div className="glass-premium rounded-xl p-6" style={{ border: '1px solid var(--color-border)' }}>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock size={16} style={{ color: 'var(--color-primary)' }} />
            최근 활동
          </h2>
          <div className="space-y-2">
            {activityLog.map((activity) => (
              <div key={activity.id} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: activity.icon_bg || 'rgba(99,102,241,0.1)', color: activity.icon_color || '#6366f1' }}>
                    {activity.icon || '~'}
                  </span>
                  <span style={{ color: 'var(--color-text-primary)' }}>{activity.action}</span>
                </div>
                <div className="flex items-center gap-3">
                  {activity.xp_earned > 0 && (
                    <span className="font-mono font-semibold text-xs" style={{ color: 'var(--color-accent-cyan)' }}>
                      +{activity.xp_earned} XP
                    </span>
                  )}
                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(activity.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
