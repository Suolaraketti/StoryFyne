'use client';

import { motion } from 'framer-motion';
import { Film } from 'lucide-react';
import StoryCard from './StoryCard';

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

interface StoryListProps {
  stories: Story[];
  apiUrl: string;
  onDelete: (id: number) => void;
}

export default function StoryList({ stories, apiUrl, onDelete }: StoryListProps) {
  if (stories.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          borderRadius: 'var(--radius-xl)',
          border: '1px dashed var(--border-medium)',
          color: 'var(--text-muted)',
          fontSize: '15px',
        }}
      >
        <Film size={32} style={{ margin: '0 auto 16px', color: 'var(--text-faint)' }} />
        <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>No stories yet</div>
        <div style={{ fontSize: '13px' }}>Paste a Reddit URL or write some text above to get started.</div>
      </motion.div>
    );
  }

  const sorted = [...stories].sort((a, b) => b.id - a.id);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
      gap: '20px',
    }}>
      {sorted.map((story, i) => (
        <motion.div
          key={story.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.05 }}
        >
          <StoryCard story={story} apiUrl={apiUrl} onDelete={onDelete} />
        </motion.div>
      ))}
    </div>
  );
}
