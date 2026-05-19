'use client';

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

      {isComplete && story.video_url && (
        <video
          src={story.video_url}
          controls
          style={{ width: '100%', borderRadius: '8px', border: '1px solid #333' }}
        />
      )}

      {isComplete && story.audio_url && !story.video_url && (
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
          {(story as any).error && (
            <div style={{ marginTop: '8px', color: '#f87171', fontSize: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {(story as any).error}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
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
              {story.video_url ? 'Download Video' : 'Download Audio'}
            </a>
            <button
              onClick={async () => {
                const url = `${window.location.origin}/share/${story.id}`;
                try {
                  await navigator.clipboard.writeText(url);
                  alert('Share link copied!');
                } catch {
                  prompt('Copy this link:', url);
                }
              }}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: '#1a1a1a',
                color: '#F5A623',
                border: '1px solid #333',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Copy Link
            </button>
          </>
        )}
        <button
          onClick={() => {
            if (confirm('Delete this story?')) {
              onDelete(story.id);
            }
          }}
          style={{
            flex: isComplete ? undefined : 1,
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
