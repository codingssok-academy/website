'use client'

import {
    Code2,
    Terminal,
    Cpu,
    Layers,
    Braces,
    BookOpen,
} from 'lucide-react'

const trackIconMap: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
    'c-lang': Terminal,
    'python': Code2,
    'arduino': Cpu,
    'algorithm': Layers,
    'data-structure': Braces,
}

interface TrackIconProps {
    trackId: string
    size?: number
    className?: string
}

export function TrackIcon({ trackId, size = 24, className }: TrackIconProps) {
    const Icon = trackIconMap[trackId] || BookOpen
    return <Icon size={size} className={className} />
}
