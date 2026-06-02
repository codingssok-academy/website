'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createMaterial } from '@/lib/actions/materials'
import { Upload, ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'

export default function UploadMaterialPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const categories = ['Python', 'C언어', '알고리즘', '엔트리', '아두이노', '웹', '자격증', '기타']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setError('파일을 선택해주세요.'); return }
    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.set('title', title)
    formData.set('description', description)
    formData.set('category', category)
    formData.set('file', file)

    const result = await createMaterial(formData)
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      router.push('/dashboard/materials')
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/materials" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">수업 자료 업로드</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>PDF, 이미지, 문서 등 다양한 파일을 업로드할 수 있습니다</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-premium rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>제목 *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            placeholder="자료 제목"
            className="w-full px-4 py-3 rounded-xl border bg-transparent text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
            style={{ borderColor: 'var(--color-border)', background: 'rgba(255,255,255,0.03)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>설명</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="자료에 대한 설명 (선택)"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border bg-transparent text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 resize-none"
            style={{ borderColor: 'var(--color-border)', background: 'rgba(255,255,255,0.03)' }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>카테고리</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border bg-transparent text-white focus:outline-none"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}
          >
            <option value="">선택하세요</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>파일 *</label>
          <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed cursor-pointer hover:border-blue-500/50 transition-colors"
            style={{ borderColor: 'var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
            {file ? (
              <div className="flex items-center gap-3">
                <FileText size={24} style={{ color: 'var(--color-primary)' }} />
                <div>
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Upload size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-secondary)' }} />
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>파일을 선택하거나 드래그하세요</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>PDF, 이미지, 문서 등</p>
              </div>
            )}
            <input
              type="file"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx,.ppt,.pptx,.hwp,.txt"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Upload size={18} />
              업로드
            </>
          )}
        </button>
      </form>
    </div>
  )
}
