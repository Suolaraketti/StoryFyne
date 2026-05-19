'use client';

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
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: '#666',
        fontSize: '15px',
      }}>
        No stories yet. Paste a Reddit URL above to get started.
      </div>
    );
  }

  const sorted = [...stories].sort((a, b) => b.id - a.id);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '20px',
    }}>
      {sorted.map((story) => (
        <StoryCard
          key={story.id}
          story={story}
          apiUrl={apiUrl}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
