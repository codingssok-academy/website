'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMaterials, deleteMaterial } from '@/lib/actions/materials'
import Link from 'next/link'
import { BookOpen, Upload, Trash2, FileText, Image, File, Search, FolderOpen } from 'lucide-react'

interface Material {
  id: string
  title: string
  description: string | null
  category: string | null
  file_url: string
  file_type: string
  file_name: string | null
  file_size: number | null
  created_at: string
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState('student')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setRole(user.user_metadata?.role || 'student')
      }

      const result = await getMaterials()
      if (result.data) setMaterials(result.data)
      setLoading(false)
    }
    load()
  }, [])

  const categories = Array.from(new Set(materials.map(m => m.category).filter(Boolean)))

  const filtered = materials.filter(m => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = selectedCategory === 'all' || m.category === selectedCategory
    return matchSearch && matchCategory
  })

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText size={20} />
    if (fileType.includes('image')) return <Image size={20} />
    return <File size={20} />
  }

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '-'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    await deleteMaterial(id)
    setMaterials(prev => prev.filter(m => m.id !== id))
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
          <h1 className="text-2xl font-bold">수업 자료</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            학습에 필요한 자료를 확인하세요
          </p>
        </div>
        {(role === 'teacher' || role === 'admin') && (
          <Link
            href="/dashboard/materials/upload"
            className="btn btn-primary"
          >
            <Upload size={18} />
            자료 업로드
          </Link>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-secondary)' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="자료 검색..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-transparent text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
            style={{ borderColor: 'var(--color-border)', background: 'rgba(255,255,255,0.03)' }}
          />
        </div>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-4 py-2.5 rounded-xl border bg-transparent text-white focus:outline-none"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}
        >
          <option value="all">전체</option>
          {categories.map(c => (
            <option key={c} value={c!}>{c}</option>
          ))}
        </select>
      </div>

      {/* Materials Grid */}
      {filtered.length === 0 ? (
        <div className="glass-premium rounded-2xl p-12 text-center">
          <FolderOpen size={48} className="mx-auto mb-4" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-lg font-semibold mb-2">등록된 자료가 없습니다</p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {role === 'teacher' ? '새 자료를 업로드해주세요.' : '선생님이 자료를 등록하면 여기에 표시됩니다.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(material => (
            <div key={material.id} className="glass-premium rounded-xl overflow-hidden group hover:border-blue-500/30 transition-all duration-300" style={{ border: '1px solid var(--color-border)' }}>
              <Link href={`/dashboard/study/${material.id}`} className="block p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(0,102,255,0.1)', color: 'var(--color-primary)' }}>
                    {getFileIcon(material.file_type)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate">
                      {material.title}
                    </h3>
                    {material.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                        style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--color-accent-cyan)' }}>
                        {material.category}
                      </span>
                    )}
                  </div>
                </div>
                {material.description && (
                  <p className="text-sm line-clamp-2 mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                    {material.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>{material.file_name}</span>
                  <span>{formatSize(material.file_size)}</span>
                </div>
              </Link>
              {(role === 'teacher' || role === 'admin') && (
                <div className="px-5 pb-4 flex gap-2">
                  <button
                    onClick={() => handleDelete(material.id)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                    삭제
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
