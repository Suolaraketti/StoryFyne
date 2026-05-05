'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

interface Story {
  id: number;
  title: string;
  author: string;
  subreddit: string;
  duration_seconds: number;
  audio_url: string;
  created_at: string;
  voice_assignments: Record<string, string>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const BRAND = {
  amber: '#F5A623',
  navy: '#0B1A3A',
  dark: '#0B1120',
  card: '#141e33',
  border: '#1e2d4d',
  text: '#e2e8f0',
  muted: '#94a3b8',
  muted2: '#64748b',
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SharePage() {
  const params = useParams();
  const storyId = params.id as string;
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!storyId) return;
    fetch(`${API_URL}/api/stories/${storyId}`)
      .then((r) => {
        if (!r.ok) throw new Error('Story not found');
        return r.json();
      })
      .then((data) => {
        setStory(data);
        setDuration(data.duration_seconds || 0);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [storyId]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  if (loading) {
    return (
      <div style={{ ...styles.page, justifyContent: 'center' }}>
        <div style={styles.loading}>Loading…</div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2 style={{ color: BRAND.text, margin: '0 0 8px 0' }}>Not Found</h2>
          <p style={{ color: BRAND.muted, margin: 0 }}>
            This audio clip does not exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const isSales = story.subreddit === 'sales';
  const tagLabel = isSales ? 'Sales Pitch' : 'Audio Story';
  const tagColor = isSales ? BRAND.amber : '#0EA5E9';
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <img
            src="/dialfyne-logo.png"
            alt="Dialfyne"
            style={styles.logo}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span style={styles.logoText}>Dialfyne</span>
        </div>

        {/* Card */}
        <div style={styles.card}>
          <div style={{ ...styles.tag, backgroundColor: tagColor }}>{tagLabel}</div>
          <h1 style={styles.title}>{story.title || 'Untitled'}</h1>
          <p style={styles.meta}>
            {story.author || 'Unknown'} · {formatDuration(story.duration_seconds)}
          </p>

          {/* Player */}
          <div style={styles.player}>
            <button onClick={togglePlay} style={styles.playButton}>
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </button>

            <div style={styles.progressArea}>
              <div style={styles.progressTrack}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${progressPercent}%`,
                  }}
                />
              </div>
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.1}
                value={currentTime}
                onChange={seek}
                style={styles.progressInput}
              />
              <div style={styles.timeRow}>
                <span style={styles.time}>{formatDuration(Math.floor(currentTime))}</span>
                <span style={styles.time}>{formatDuration(Math.floor(duration))}</span>
              </div>
            </div>
          </div>

          <audio
            ref={audioRef}
            src={story.audio_url}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            preload="metadata"
          />

          {/* Download */}
          <a
            href={story.audio_url}
            download
            style={styles.downloadButton}
          >
            Download MP3
          </a>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Generated with{' '}
            <a
              href="https://dialfyne.com"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.footerLink}
            >
              Dialfyne
            </a>
          </p>
          <p style={styles.footerSub}>
            AI voice, automations, and sales training for small businesses.
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: BRAND.dark,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    width: '100%',
    maxWidth: '560px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '32px',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    height: '40px',
    width: 'auto',
    filter: 'brightness(0) invert(1)',
  },
  logoText: {
    color: '#fff',
    fontSize: '22px',
    fontWeight: 700,
    letterSpacing: '-0.5px',
  },
  card: {
    width: '100%',
    backgroundColor: BRAND.card,
    border: `1px solid ${BRAND.border}`,
    borderRadius: '16px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  tag: {
    display: 'inline-block',
    alignSelf: 'flex-start',
    padding: '4px 12px',
    borderRadius: '20px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  title: {
    margin: 0,
    color: '#fff',
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: 1.3,
  },
  meta: {
    margin: 0,
    color: BRAND.muted,
    fontSize: '14px',
  },
  player: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginTop: '8px',
  },
  playButton: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: BRAND.amber,
    color: '#fff',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'transform 0.15s ease, opacity 0.15s ease',
  },
  progressArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    position: 'relative',
  },
  progressTrack: {
    width: '100%',
    height: '6px',
    backgroundColor: '#1e293b',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BRAND.amber,
    borderRadius: '3px',
    transition: 'width 0.1s linear',
  },
  progressInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '6px',
    margin: 0,
    padding: 0,
    opacity: 0,
    cursor: 'pointer',
  },
  timeRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  time: {
    color: BRAND.muted,
    fontSize: '12px',
    fontVariantNumeric: 'tabular-nums',
  },
  downloadButton: {
    marginTop: '8px',
    padding: '12px 20px',
    borderRadius: '10px',
    border: `1px solid ${BRAND.border}`,
    backgroundColor: 'transparent',
    color: BRAND.text,
    textAlign: 'center',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  footer: {
    textAlign: 'center',
  },
  footerText: {
    margin: 0,
    color: BRAND.muted,
    fontSize: '14px',
  },
  footerLink: {
    color: BRAND.amber,
    textDecoration: 'none',
    fontWeight: 600,
  },
  footerSub: {
    margin: '4px 0 0 0',
    color: BRAND.muted2,
    fontSize: '12px',
  },
  loading: {
    color: BRAND.muted,
    fontSize: '16px',
  },
};
