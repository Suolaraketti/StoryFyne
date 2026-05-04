'use client';

import AudioPlayer from './AudioPlayer';

interface Story {
  id: number;
  title: string;
  subreddit: string;
  duration_seconds: number;
  created_at: string;
  audio_url: string;
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
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export default function StoryCard({ story, apiUrl, onDelete }: StoryCardProps) {
  const isComplete = story.status === 'complete';

  return (
    <div style={{
      backgroundColor: '#141414',
      border: '1px solid #333',
      borderRadius: '12px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
    }}>
      <div>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 600, color: '#e0e0e0' }}>
          {story.title || 'Untitled'}
        </h3>
        <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#888' }}>
          <span>r/{story.subreddit}</span>
          <span>{formatDuration(story.duration_seconds)}</span>
          <span>{formatDate(story.created_at)}</span>
        </div>
      </div>

      {isComplete && story.audio_url && (
        <AudioPlayer src={story.audio_url} title={story.title} />
      )}

      {!isComplete && (
        <div style={{
          padding: '12px',
          backgroundColor: '#1a1a1a',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#888',
          textTransform: 'capitalize',
        }}>
          Status: {story.status.replace('_', ' ')}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        {isComplete && (
          <a
            href={`${apiUrl}/api/download/${story.id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: '#1a1a1a',
              color: '#e0e0e0',
              textAlign: 'center',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 500,
              border: '1px solid #333',
            }}
          >
            Download
          </a>
        )}
        <button
          onClick={() => {
            if (confirm('Delete this story?')) {
              onDelete(story.id);
            }
          }}
          style={{
            flex: isComplete ? 1 : undefined,
            width: isComplete ? undefined : '100%',
            padding: '10px',
            borderRadius: '8px',
            backgroundColor: '#1a1a1a',
            color: '#ef4444',
            border: '1px solid #333',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
