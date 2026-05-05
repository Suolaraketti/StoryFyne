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
const CYAN = '#0EA5E9';
const DARK_BG = '#0B1120';
const CARD_BG = '#111827';
const BORDER = '#1e293b';
const TEXT_MUTED = '#94a3b8';
const TEXT_DIM = '#64748b';

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

function DialfyneLogo({ height = 44 }: { height?: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <svg width={height} height={height} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="46" stroke={CYAN} strokeWidth="5" />
        <path d="M32 26 L32 74 L54 74 C66 74 72 65 72 50 C72 35 66 26 54 26 Z" fill={CYAN} />
        <rect x="40" y="40" width="8" height="20" rx="3" fill={DARK_BG} />
      </svg>
    );
  }
  return (
    <img
      src="/dialfyne-logo.png"
      alt="Dialfyne"
      height={height}
      style={{ height: `${height}px`, width: 'auto', display: 'block' }}
      onError={() => setFailed(true)}
    />
  );
}

function Waveform({ isPlaying }: { isPlaying: boolean }) {
  const bars = 28;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '44px', justifyContent: 'center' }}>
      {Array.from({ length: bars }).map((_, i) => {
        const delay = i * 0.04;
        const baseHeight = 25 + Math.sin(i * 1.4) * 18;
        return (
          <div
            key={i}
            style={{
              width: '3px',
              borderRadius: '2px',
              backgroundColor: isPlaying ? CYAN : '#334155',
              height: `${baseHeight}%`,
              transition: 'background-color 0.3s ease',
              animation: isPlaying ? `wave 0.7s ease-in-out ${delay}s infinite alternate` : 'none',
              opacity: isPlaying ? 1 : 0.5,
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes wave {
          0% { transform: scaleY(0.25); }
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
  const [audioError, setAudioError] = useState('');
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch story metadata
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

  // Fetch audio via fetch() + Blob URL to bypass <audio> CORS issues entirely
  useEffect(() => {
    if (!story?.audio_url) return;
    const audioUrl: string = story.audio_url;
    let cancelled = false;
    let objectUrl = '';

    async function loadAudio() {
      setAudioLoading(true);
      setAudioError('');
      try {
        const res = await fetch(audioUrl, { mode: 'cors' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setAudioBlobUrl(objectUrl);
        setAudioLoading(false);
      } catch (err: any) {
        if (cancelled) return;
        console.error('Audio fetch failed:', err);
        setAudioError(err.message || 'Could not load audio from R2.');
        setAudioLoading(false);
      }
    }

    loadAudio();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [story?.audio_url]);

  // Wire blob URL into audio element when ready
  useEffect(() => {
    if (audioRef.current && audioBlobUrl) {
      audioRef.current.src = audioBlobUrl;
      audioRef.current.load();
    }
  }, [audioBlobUrl]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      const promise = audioRef.current.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          console.error('Play error:', err);
          setAudioError('Playback blocked by browser.');
          setIsPlaying(false);
        });
      }
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) setDuration(audioRef.current.duration);
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
        <div style={{ width: '40px', height: '40px', border: `3px solid ${BORDER}`, borderTopColor: CYAN, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <DialfyneLogo height={56} />
            <h2 style={{ color: '#fff', margin: '20px 0 8px 0', fontSize: '22px', fontWeight: 700 }}>Not Found</h2>
            <p style={{ color: TEXT_DIM, margin: 0, fontSize: '15px' }}>This audio clip does not exist or has been removed.</p>
          </div>
        </div>
      </div>
    );
  }

  const isSales = story.subreddit === 'sales';
  const tagLabel = isSales ? 'Sales Pitch' : 'Audio Story';
  const tagColor = isSales ? CYAN : '#8B5CF6';
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const canPlay = !!audioBlobUrl && !audioLoading;

  return (
    <div style={pageStyle}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', width: '700px', height: '700px', background: `radial-gradient(circle, ${CYAN}10 0%, transparent 65%)`, pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '520px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <DialfyneLogo height={44} />
          <span style={{ color: '#fff', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px' }}>Dialfyne</span>
        </div>

        {/* Card */}
        <div style={cardStyle}>
          {/* Tag */}
          <div style={{ alignSelf: 'flex-start', padding: '5px 14px', borderRadius: '999px', backgroundColor: `${tagColor}15`, color: tagColor, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', border: `1px solid ${tagColor}25` }}>
            {tagLabel}
          </div>

          {/* Title */}
          <h1 style={{ margin: 0, color: '#fff', fontSize: '24px', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.3px' }}>
            {story.title || 'Untitled'}
          </h1>

          {/* Meta */}
          <p style={{ margin: 0, color: TEXT_DIM, fontSize: '14px' }}>
            {story.author || 'Unknown'} · {formatDuration(story.duration_seconds)} · {formatDate(story.created_at)}
          </p>

          {/* Waveform */}
          <div style={{ margin: '4px 0' }}>
            <Waveform isPlaying={isPlaying} />
          </div>

          {/* Player */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '2px' }}>
            {/* Play button */}
            <button
              onClick={togglePlay}
              disabled={!canPlay}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: canPlay ? CYAN : '#334155',
                color: '#fff',
                cursor: canPlay ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                boxShadow: canPlay ? `0 4px 16px ${CYAN}40` : 'none',
              }}
              onMouseDown={(e) => { if (canPlay) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)'; }}
              onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
            >
              {audioLoading ? (
                <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              ) : isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="5" width="3" height="14" rx="1.5" /><rect x="14" y="5" width="3" height="14" rx="1.5" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="7,5 19,12 7,19" /></svg>
              )}
            </button>

            {/* Progress */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
              <div style={{ width: '100%', height: '5px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', backgroundColor: CYAN, borderRadius: '3px', width: `${progressPercent}%`, transition: 'width 0.1s linear' }} />
              </div>
              <input
                type="range"
                min={0}
                max={duration || 1}
                step={0.1}
                value={currentTime}
                onChange={seek}
                style={{ position: 'absolute', top: -8, left: 0, width: '100%', height: '22px', margin: 0, padding: 0, opacity: 0, cursor: 'pointer' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: TEXT_DIM, fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>{formatDuration(Math.floor(currentTime))}</span>
                <span style={{ color: TEXT_DIM, fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>{formatDuration(Math.floor(duration))}</span>
              </div>
            </div>
          </div>

          {/* Audio element (src wired via blob URL in useEffect) */}
          <audio
            ref={audioRef}
            onPlay={() => { setIsPlaying(true); setAudioError(''); }}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            preload="metadata"
            playsInline
          />

          {/* Error message */}
          {audioError && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#ef444415', border: '1px solid #ef444430', color: '#f87171', fontSize: '13px', textAlign: 'center' }}>
              {audioError}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
            <a
              href={story.audio_url}
              download
              style={{ flex: 1, padding: '12px 20px', borderRadius: '999px', border: 'none', backgroundColor: CYAN, color: '#fff', textAlign: 'center', textDecoration: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.15s ease', boxShadow: `0 4px 12px ${CYAN}30` }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.9'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; }}
            >
              Download MP3
            </a>
            <button
              onClick={copyLink}
              style={{ flex: 1, padding: '12px 20px', borderRadius: '999px', border: `1px solid ${BORDER}`, backgroundColor: copied ? `${CYAN}12` : 'transparent', color: copied ? CYAN : TEXT_MUTED, textAlign: 'center', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}
              onMouseEnter={(e) => { if (!copied) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1e293b'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}}
              onMouseLeave={(e) => { if (!copied) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = TEXT_MUTED; }}}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: 0, color: TEXT_DIM, fontSize: '13px' }}>
            Generated with <a href="https://dialfyne.com" target="_blank" rel="noopener noreferrer" style={{ color: CYAN, textDecoration: 'none', fontWeight: 600 }}>Dialfyne</a>
          </p>
          <p style={{ margin: '4px 0 0 0', color: '#475569', fontSize: '12px' }}>AI voice, automations, and sales training for small businesses.</p>
        </div>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: DARK_BG,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 20px',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: CARD_BG,
  border: `1px solid ${BORDER}`,
  borderRadius: '16px',
  padding: '28px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
};
