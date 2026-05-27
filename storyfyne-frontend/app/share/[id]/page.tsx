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
  video_url?: string;
  created_at: string;
  voice_assignments: Record<string, string>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const CYAN = '#0EA5E9';
const CYAN_GLOW = 'rgba(14, 165, 233, 0.15)';
const DARK_BG = '#0a0e1a';
const CARD_BG = 'rgba(17, 24, 39, 0.8)';
const BORDER = 'rgba(30, 41, 59, 0.6)';
const TEXT_MUTED = '#94a3b8';
const TEXT_DIM = '#64748b';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function DialfyneLogo({ height = 40 }: { height?: number }) {
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

function Waveform({ isPlaying, progress }: { isPlaying: boolean; progress: number }) {
  const bars = 32;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '48px', justifyContent: 'center', width: '100%' }}>
      {Array.from({ length: bars }).map((_, i) => {
        const barProgress = i / bars;
        const isActive = barProgress <= progress;
        const baseHeight = 15 + Math.abs(Math.sin(i * 0.8)) * 75;
        const delay = i * 0.03;
        return (
          <div
            key={i}
            style={{
              width: '3px',
              borderRadius: '2px',
              backgroundColor: isActive ? CYAN : '#1e3a5f',
              height: `${baseHeight}%`,
              transition: 'background-color 0.2s ease',
              animation: isPlaying ? `wave 0.6s ease-in-out ${delay}s infinite alternate` : 'none',
              opacity: isPlaying || isActive ? 1 : 0.4,
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

function PlayIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="8,5 20,12 8,19" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <rect x="7" y="5" width="4" height="14" rx="1.5" />
      <rect x="13" y="5" width="4" height="14" rx="1.5" />
    </svg>
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
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!storyId) return;
    fetch(`${API_URL}/api/stories/${storyId}`)
      .then((r) => { if (!r.ok) throw new Error('Story not found'); return r.json(); })
      .then((data) => { setStory(data); setDuration(data.duration_seconds || 0); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [storyId]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) { setAudioError('Audio player not ready.'); return; }
    if (isPlaying) { audioRef.current.pause(); }
    else {
      const promise = audioRef.current.play();
      if (promise !== undefined) {
        promise.catch((err: any) => { console.error('Play error:', err.name, err.message); setAudioError(`${err.name}: ${err.message}`); setIsPlaying(false); });
      }
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => { if (audioRef.current) setCurrentTime(audioRef.current.currentTime); }, []);
  const handleLoadedMetadata = useCallback(() => { if (audioRef.current) setDuration(audioRef.current.duration); }, []);
  const handleEnded = useCallback(() => { setIsPlaying(false); setCurrentTime(0); }, []);

  const seek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) { audioRef.current.currentTime = time; setCurrentTime(time); }
  }, []);

  const copyLink = useCallback(async () => {
    try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { prompt('Copy this link:', window.location.href); }
  }, []);

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={{ width: '44px', height: '44px', border: `2px solid ${BORDER}`, borderTopColor: CYAN, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={{ textAlign: 'center' }}>
            <DialfyneLogo height={52} />
            <h2 style={{ color: '#fff', margin: '24px 0 8px', fontSize: '22px', fontWeight: 700 }}>Audio Not Found</h2>
            <p style={{ color: TEXT_DIM, margin: 0, fontSize: '15px', lineHeight: 1.5 }}>This clip may have been removed or the link is incorrect.</p>
          </div>
        </div>
      </div>
    );
  }

  const isSales = story.subreddit === 'sales';
  const isInfluencer = story.subreddit === 'influencer';
  const isExplainer = story.subreddit === 'explainer' || (story as any).mode === 'explainer';
  const tagLabel = isExplainer ? 'Explainer Video' : isInfluencer ? 'AI Influencer' : isSales ? 'Sales Pitch' : 'Audio Story';
  const tagColor = isExplainer ? '#6366f1' : isInfluencer ? '#ec4899' : isSales ? CYAN : '#8B5CF6';
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div style={pageStyle}>
      {/* Ambient background */}
      <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(ellipse at 50% 0%, ${CYAN_GLOW} 0%, transparent 50%)`, pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, background: `radial-gradient(ellipse at 50% 100%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)`, pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '560px', padding: '0 20px' }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
          <DialfyneLogo height={36} />
          <span style={{ color: '#fff', fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px' }}>Dialfyne</span>
        </header>

        {/* Main Card */}
        <div style={cardStyle}>
          {/* Tag */}
          <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 14px', borderRadius: '999px', backgroundColor: `${tagColor}12`, color: tagColor, fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', border: `1px solid ${tagColor}20` }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: tagColor, display: 'inline-block' }} />
            {tagLabel}
          </div>

          {/* Title */}
          <h1 style={{ margin: '4px 0 0', color: '#fff', fontSize: '26px', fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.4px' }}>
            {story.title || 'Untitled'}
          </h1>

          {/* Meta */}
          <p style={{ margin: 0, color: TEXT_DIM, fontSize: '14px' }}>
            {story.author || 'Unknown'} · {formatDuration(story.duration_seconds)} · {formatDate(story.created_at)}
          </p>

          {story.video_url ? (
            <video
              src={story.video_url}
              controls
              style={{ width: '100%', borderRadius: '12px', border: `1px solid ${BORDER}` }}
              playsInline
            />
          ) : (
            <>
              {/* Waveform */}
              <div style={{ margin: '8px 0' }}>
                <Waveform isPlaying={isPlaying} progress={progressPercent / 100} />
              </div>

              {/* Player controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: CYAN,
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                    boxShadow: `0 4px 20px ${CYAN}50`,
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.06)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 28px ${CYAN}60`; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 20px ${CYAN}50`; }}
                  onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)'; }}
                  onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.06)'; }}
                >
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>

                {/* Progress area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Progress bar */}
                  <div style={{ position: 'relative', width: '100%', height: '6px', backgroundColor: '#1a2744', borderRadius: '3px', overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', backgroundColor: CYAN, borderRadius: '3px', width: `${progressPercent}%`, transition: 'width 0.08s linear' }} />
                    <input
                      type="range"
                      min={0}
                      max={duration || 1}
                      step={0.1}
                      value={currentTime}
                      onChange={seek}
                      style={{ position: 'absolute', top: '-6px', left: 0, width: '100%', height: '18px', margin: 0, padding: 0, opacity: 0, cursor: 'pointer' }}
                    />
                  </div>
                  {/* Times */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: TEXT_DIM, fontSize: '12px', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{formatDuration(Math.floor(currentTime))}</span>
                    <span style={{ color: TEXT_DIM, fontSize: '12px', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>{formatDuration(Math.floor(duration))}</span>
                  </div>
                </div>
              </div>

              {/* Audio element */}
              <audio
                ref={audioRef}
                src={story?.audio_url || ''}
                onPlay={() => { setIsPlaying(true); setAudioError(''); }}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
                onError={(e) => {
                  const el = e.currentTarget as HTMLAudioElement;
                  console.error('Audio error:', el.error?.code, el.error?.message);
                  setAudioError('Unable to play this audio file.');
                }}
                preload="auto"
                playsInline
              />
            </>
          )}

          {/* Error */}
          {audioError && (
            <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', fontSize: '13px', textAlign: 'center' }}>
              {audioError}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <a
              href={story.audio_url}
              download
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: '999px',
                border: 'none',
                backgroundColor: CYAN,
                color: '#fff',
                textAlign: 'center',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: `0 4px 14px ${CYAN}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.9'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {story.video_url ? 'Download Video' : 'Download MP3'}
            </a>
            <button
              onClick={copyLink}
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: '999px',
                border: `1px solid ${BORDER}`,
                backgroundColor: copied ? `${CYAN}10` : 'transparent',
                color: copied ? CYAN : TEXT_MUTED,
                textAlign: 'center',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => { if (!copied) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(30, 41, 59, 0.8)'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}}
              onMouseLeave={(e) => { if (!copied) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = TEXT_MUTED; }}}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              {copied ? 'Link Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ textAlign: 'center', marginTop: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '1px', backgroundColor: BORDER, marginBottom: '4px' }} />
          <p style={{ margin: 0, color: TEXT_DIM, fontSize: '13px' }}>
            Generated with <a href="https://dialfyne.com" target="_blank" rel="noopener noreferrer" style={{ color: CYAN, textDecoration: 'none', fontWeight: 600 }}>Dialfyne</a>
          </p>
          <p style={{ margin: 0, color: '#475569', fontSize: '12px', maxWidth: '280px', lineHeight: 1.5 }}>
            AI voice, automations, and sales training for small businesses.
          </p>
        </footer>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: DARK_BG,
  backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(14, 165, 233, 0.08) 0%, transparent 60%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '48px 0',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: CARD_BG,
  border: `1px solid ${BORDER}`,
  borderRadius: '20px',
  padding: '32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  boxShadow: '0 0 0 1px rgba(14, 165, 233, 0.05), 0 20px 60px rgba(0, 0, 0, 0.5)',
  backdropFilter: 'blur(20px)',
};
