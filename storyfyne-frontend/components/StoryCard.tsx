'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Link2, Trash2, Clock, Calendar, Tag, AlertCircle } from 'lucide-react';
import AudioPlayer from './AudioPlayer';

interface Story {
  id: number;
  title: string;
  subreddit: string;
  duration_seconds: number;
  created_at: string;
  audio_url: string;
  video_url?: string;
  status: string;
}

interface StoryCardProps {
  story: Story;
  apiUrl: string;
  onDelete: (id: number) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return iso;
  }
}

const statusColors: Record<string, { bg: string; color: string; border: string }> = {
  complete: { bg: 'rgba(34,197,94,0.1)', color: '#4ade80', border: 'rgba(34,197,94,0.2)' },
  processing: { bg: 'rgba(14,165,233,0.1)', color: '#38bdf8', border: 'rgba(14,165,233,0.2)' },
  tag_failed: { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.2)' },
  generate_failed: { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.2)' },
  audio_only: { bg: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: 'rgba(245,158,11,0.2)' },
};

export default function StoryCard({ story, apiUrl, onDelete }: StoryCardProps) {
  const isComplete = story.status === 'complete';
  const [copied, setCopied] = useState(false);

  const statusStyle = statusColors[story.status] || statusColors.processing;

  const handleCopy = async () => {
    const url = `${window.location.origin}/share/${story.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('Copy this link:', url);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.1)' }}
      transition={{ duration: 0.2 }}
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4, flex: 1 }}>
            {story.title || 'Untitled'}
          </h3>
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '3px 10px',
            borderRadius: '100px',
            background: statusStyle.bg,
            color: statusStyle.color,
            border: `1px solid ${statusStyle.border}`,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}>
            {story.status.replace('_', ' ')}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Tag size={12} />
            {story.subreddit}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} />
            {formatDuration(story.duration_seconds)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} />
            {formatDate(story.created_at)}
          </span>
        </div>
      </div>

      {/* Media */}
      {isComplete && story.video_url && (
        <video
          src={story.video_url}
          controls
          style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: '#000' }}
        />
      )}

      {isComplete && story.audio_url && !story.video_url && (
        <AudioPlayer src={story.audio_url} title={story.title} />
      )}

      {!isComplete && (
        <div style={{
          padding: '16px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          color: 'var(--text-muted)',
          textTransform: 'capitalize',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertCircle size={14} color="var(--text-faint)" />
          {story.status.replace('_', ' ')}
          {(story as any).error && (
            <div style={{ marginTop: '8px', color: '#f87171', fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {(story as any).error}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {isComplete && (
          <>
            <a
              href={story.video_url || `${apiUrl}/api/download/${story.id}`}
              target="_blank"
              rel="noopener noreferrer"
              download
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-input)',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
            >
              <Download size={14} />
              {story.video_url ? 'Video' : 'Audio'}
            </a>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleCopy}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                background: copied ? 'rgba(34,197,94,0.1)' : 'var(--bg-input)',
                color: copied ? '#4ade80' : 'var(--text-secondary)',
                border: `1px solid ${copied ? 'rgba(34,197,94,0.2)' : 'var(--border-subtle)'}`,
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              <Link2 size={14} />
              {copied ? 'Copied!' : 'Share'}
            </motion.button>
          </>
        )}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => { if (confirm('Delete this story?')) onDelete(story.id); }}
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'transparent',
            color: '#ef4444',
            border: '1px solid rgba(239,68,68,0.15)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            opacity: 0.7,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0.7'; }}
        >
          <Trash2 size={14} />
        </motion.button>
      </div>
    </motion.div>
  );
}
