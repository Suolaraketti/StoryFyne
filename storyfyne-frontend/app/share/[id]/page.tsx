'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
const AMBER = '#F5A623';
const DARK = '#0a0f1e';
const CARD = '#111a2e';
const BORDER = '#1a2744';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function DialfyneLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="48" stroke={AMBER} strokeWidth="4" />
      <path
        d="M30 28 L30 72 L55 72 C68 72 75 62 75 50 C75 38 68 28 55 28 Z"
        fill={AMBER}
      />
      <rect x="38" y="40" width="8" height="20" rx="2" fill={DARK} />
    </svg>
  );
}

function Waveform({ isPlaying }: { isPlaying: boolean }) {
  const bars = 24;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '3px',
        height: '40px',
        justifyContent: 'center',
      }}
    >
      {Array.from({ length: bars }).map((_, i) => {
        const delay = i * 0.05;
        const baseHeight = 20 + Math.sin(i * 1.3) * 15;
        return (
          <div
            key={i}
            style={{
              width: '3px',
              borderRadius: '2px',
              backgroundColor: isPlaying ? AMBER : '#334155',
              height: `${baseHeight}%`,
              transition: 'background-color 0.3s ease',
              animation: isPlaying
                ? `wave 0.8s ease-in-out ${delay}s infinite alternate`
                : 'none',
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes wave {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
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
  const [copied, setCopied] = useState(false);
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

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  const seek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const copyLink = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('Copy this link:', url);
    }
  }, []);

  if (loading) {
    return (
      <div style={pageStyle}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${BORDER}`,
            borderTopColor: AMBER,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <DialfyneLogo size={48} />
            <h2
              style={{
                color: '#fff',
                margin: '20px 0 8px 0',
                fontSize: '22px',
                fontWeight: 700,
              }}
            >
              Not Found
            </h2>
            <p style={{ color: '#64748b', margin: 0, fontSize: '15px' }}>
              This audio clip does not exist or has been removed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isSales = story.subreddit === 'sales';
  const tagLabel = isSales ? 'Sales Pitch' : 'Audio Story';
  const tagColor = isSales ? AMBER : '#0EA5E9';
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div style={pageStyle}>
      {/* Background glow */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: `radial-gradient(circle, ${AMBER}15 0%, transparent 70%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '560px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '28px',
          }}
        >
          <DialfyneLogo size={36} />
          <span
            style={{
              color: '#fff',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '-0.3px',
            }}
          >
            Dialfyne
          </span>
        </div>

        {/* Card */}
        <div style={cardStyle}>
          {/* Tag */}
          <div
            style={{
              alignSelf: 'flex-start',
              padding: '5px 14px',
              borderRadius: '20px',
              backgroundColor: `${tagColor}18`,
              color: tagColor,
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              border: `1px solid ${tagColor}30`,
            }}
          >
            {tagLabel}
          </div>

          {/* Title */}
          <h1
            style={{
              margin: 0,
              color: '#fff',
              fontSize: '26px',
              fontWeight: 700,
              lineHeight: 1.3,
              letterSpacing: '-0.3px',
            }}
          >
            {story.title || 'Untitled'}
          </h1>

          {/* Meta */}
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            {story.author || 'Unknown'} · {formatDuration(story.duration_seconds)} ·{' '}
            {formatDate(story.created_at)}
          </p>

          {/* Waveform */}
          <div style={{ margin: '8px 0' }}>
            <Waveform isPlaying={isPlaying} />
          </div>

          {/* Player controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginTop: '4px',
            }}
          >
            <button
              onClick={togglePlay}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.transform = 'scale(1.08)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.transform = 'scale(1)';
              }}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: AMBER,
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                boxShadow: `0 4px 20px ${AMBER}40`,
              }}
            >
              {isPlaying ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1.5" />
                  <rect x="14" y="4" width="4" height="16" rx="1.5" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6,3 20,12 6,21" />
                </svg>
              )}
            </button>

            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                position: 'relative',
              }}
            >
              {/* Progress track */}
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: '#1a2744',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    backgroundColor: AMBER,
                    borderRadius: '3px',
                    width: `${progressPercent}%`,
                    transition: 'width 0.1s linear',
                  }}
                />
              </div>
              {/* Invisible range input for seeking */}
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.1}
                value={currentTime}
                onChange={seek}
                style={{
                  position: 'absolute',
                  top: -8,
                  left: 0,
                  width: '100%',
                  height: '22px',
                  margin: 0,
                  padding: 0,
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span
                  style={{
                    color: '#64748b',
                    fontSize: '12px',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatDuration(Math.floor(currentTime))}
                </span>
                <span
                  style={{
                    color: '#64748b',
                    fontSize: '12px',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {formatDuration(Math.floor(duration))}
                </span>
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

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <a
              href={story.audio_url}
              download
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '10px',
                border: `1px solid ${BORDER}`,
                backgroundColor: 'transparent',
                color: '#94a3b8',
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.backgroundColor = '#1a2744';
                el.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.backgroundColor = 'transparent';
                el.style.color = '#94a3b8';
              }}
            >
              Download MP3
            </a>
            <button
              onClick={copyLink}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '10px',
                border: `1px solid ${BORDER}`,
                backgroundColor: copied ? `${AMBER}18` : 'transparent',
                color: copied ? AMBER : '#94a3b8',
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!copied) {
                  const el = e.currentTarget;
                  el.style.backgroundColor = '#1a2744';
                  el.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (!copied) {
                  const el = e.currentTarget;
                  el.style.backgroundColor = 'transparent';
                  el.style.color = '#94a3b8';
                }
              }}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
            Generated with{' '}
            <a
              href="https://dialfyne.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: AMBER,
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Dialfyne
            </a>
          </p>
          <p style={{ margin: '4px 0 0 0', color: '#334155', fontSize: '12px' }}>
            AI voice, automations, and sales training for small businesses.
          </p>
        </div>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: DARK,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: CARD,
  border: `1px solid ${BORDER}`,
  borderRadius: '20px',
  padding: '32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  boxShadow: `0 0 60px ${AMBER}08, 0 8px 32px rgba(0,0,0,0.4)`,
};
