'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getMaterialById, recordMaterialView } from '@/lib/actions/materials'
import { getNote, saveNote } from '@/lib/actions/notes'
import { Maximize2, Minimize2, ArrowLeft, Save, GripVertical, FileText, StickyNote } from 'lucide-react'

export default function StudyPage() {
  const params = useParams()
  const router = useRouter()
  const materialId = params.materialId as string

  const [material, setMaterial] = useState<{
    id: string; title: string; file_url: string; file_type: string; description: string | null
  } | null>(null)
  const [noteContent, setNoteContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [splitRatio, setSplitRatio] = useState(60)
  const [loading, setLoading] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const saveTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    async function load() {
      const result = await getMaterialById(materialId)
      if (result.data) {
        setMaterial(result.data)
        recordMaterialView(materialId)
      }
      const noteResult = await getNote(materialId)
      if (noteResult.data) {
        setNoteContent(noteResult.data.content)
      }
      setLoading(false)
    }
    load()
  }, [materialId])

  // Auto-save note
  const autoSave = useCallback(async (content: string) => {
    setSaving(true)
    await saveNote(materialId, content)
    setSaving(false)
    setLastSaved(new Date())
  }, [materialId])

  const handleNoteChange = (value: string) => {
    setNoteContent(value)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => autoSave(value), 1500)
  }

  const handleManualSave = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    await autoSave(noteContent)
  }

  // Split pane drag
  const handleMouseDown = () => { isDragging.current = true }
  const handleMouseUp = () => { isDragging.current = false }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const ratio = ((e.clientX - rect.left) / rect.width) * 100
    setSplitRatio(Math.max(30, Math.min(70, ratio)))
  }

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        router.push('/dashboard/materials')
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        handleManualSave()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--color-bg-dark)' }}>
        <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!material) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--color-bg-dark)' }}>
        <p>자료를 찾을 수 없습니다.</p>
      </div>
    )
  }

  const isPdf = material.file_type.includes('pdf')
  const isImage = material.file_type.includes('image')

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen w-screen fixed inset-0 z-50"
      style={{ background: 'var(--color-bg-dark)' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ background: 'var(--color-bg-card)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard/materials')} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" title="돌아가기 (Esc)">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <FileText size={16} style={{ color: 'var(--color-primary)' }} />
            <span className="font-semibold text-sm truncate max-w-xs">{material.title}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {saving ? '저장 중...' : lastSaved ? `마지막 저장: ${lastSaved.toLocaleTimeString('ko-KR')}` : 'Ctrl+S로 저장'}
          </span>
          <button onClick={handleManualSave} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" title="저장 (Ctrl+S)">
            <Save size={16} className={saving ? 'animate-pulse' : ''} />
          </button>
          <button onClick={toggleFullscreen} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" title="전체화면">
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Split Pane Content */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Material Viewer */}
        <div className="min-h-0 overflow-hidden" style={{ width: `${splitRatio}%` }}>
          {isPdf ? (
            <iframe
              src={`${material.file_url}#toolbar=1&navpanes=0`}
              className="w-full h-full border-0"
              title={material.title}
            />
          ) : isImage ? (
            <div className="w-full h-full overflow-auto flex items-center justify-center p-4" style={{ background: '#0d0d12' }}>
              <img
                src={material.file_url}
                alt={material.title}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <iframe
              src={material.file_url}
              className="w-full h-full border-0"
              title={material.title}
            />
          )}
        </div>

        {/* Splitter */}
        <div
          className="w-2 cursor-col-resize flex items-center justify-center shrink-0 hover:bg-blue-500/20 transition-colors group"
          style={{ background: 'var(--color-border)' }}
          onMouseDown={handleMouseDown}
        >
          <GripVertical size={14} className="text-gray-500 group-hover:text-blue-400" />
        </div>

        {/* Right: Note Editor */}
        <div className="min-h-0 flex flex-col" style={{ width: `${100 - splitRatio}%` }}>
          <div className="flex items-center gap-2 px-4 py-2 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <StickyNote size={16} style={{ color: 'var(--color-accent-cyan)' }} />
            <span className="text-sm font-semibold">학습 노트</span>
          </div>
          <textarea
            value={noteContent}
            onChange={e => handleNoteChange(e.target.value)}
            placeholder="여기에 학습 노트를 작성하세요...&#10;&#10;- 중요한 개념 정리&#10;- 모르는 부분 메모&#10;- 질문 사항"
            className="flex-1 w-full p-4 bg-transparent text-white resize-none focus:outline-none font-mono text-sm leading-relaxed"
            style={{ background: 'rgba(255,255,255,0.02)' }}
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  )
}
