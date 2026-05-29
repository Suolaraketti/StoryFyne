'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Mic, Video, Wand2, Trash2, UserCircle } from 'lucide-react';
import StoryInput from '../components/StoryInput';
import ProgressTracker from '../components/ProgressTracker';
import StoryList from '../components/StoryList';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Story {
  id: number;
  title: string;
  subreddit: string;
  duration_seconds: number;
  created_at: string;
  audio_url: string;
  status: string;
}

interface Avatar {
  id: string;
  name?: string;
  preview_image_url?: string;
  gender?: string;
  status?: string;
  avatar_type?: string;
}

export default function Home() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStoryId, setActiveStoryId] = useState<number | null>(null);
  const [progressStep, setProgressStep] = useState('');
  const [progressDetail, setProgressDetail] = useState('');
  const [charCount, setCharCount] = useState<number | undefined>();
  const [progressMode, setProgressMode] = useState<'standard' | 'influencer' | 'explainer'>('standard');
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [musicTracks, setMusicTracks] = useState<any[]>([]);

  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/stories`);
      if (res.ok) {
        const data = await res.json();
        setStories(data.stories || []);
      }
    } catch {
      // silent fail
    }
  }, []);

  const fetchAvatars = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/heygen/avatars`);
      if (res.ok) {
        const data = await res.json();
        setAvatars(data.avatars || []);
      }
    } catch {
      // silent fail
    }
  }, []);

  const fetchMusic = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/music-library`);
      if (res.ok) {
        const data = await res.json();
        setMusicTracks(data.tracks || []);
      }
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    fetchStories();
    fetchAvatars();
    fetchMusic();
    const interval = setInterval(fetchStories, 5000);
    return () => clearInterval(interval);
  }, [fetchStories, fetchAvatars, fetchMusic]);

  useEffect(() => {
    if (!activeStoryId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/api/stories/${activeStoryId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.progress) {
            setProgressStep(data.progress.step);
            setProgressDetail(data.progress.detail);
          } else if (data.status === 'complete' || data.status === 'tag_failed' || data.status === 'generate_failed') {
            setProgressStep(data.status === 'complete' ? 'complete' : '');
            setActiveStoryId(null);
            setIsLoading(false);
            fetchStories();
          }
          if (data.char_count) {
            setCharCount(data.char_count);
          }
        }
      } catch {
        // silent fail
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [activeStoryId, fetchStories]);

  const handleSubmitUrl = async (url: string) => {
    setIsLoading(true);
    setProgressMode('standard');
    setProgressStep('scraping');
    setProgressDetail('Fetching Reddit post...');
    try {
      const res = await fetch(`${API_URL}/api/process-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to process URL');
        setIsLoading(false);
        setProgressStep('');
        return;
      }
      const data = await res.json();
      setActiveStoryId(data.story_id);
      setProgressStep('tagging');
      setProgressDetail('Tagging text with Claude...');
      fetchStories();
    } catch {
      alert('Network error. Is the backend running?');
      setIsLoading(false);
      setProgressStep('');
    }
  };

  const handleSubmitText = async (text: string, title: string, author: string, subreddit: string) => {
    setIsLoading(true);
    setProgressMode('standard');
    setProgressStep('tagging');
    setProgressDetail('Tagging text with Claude...');
    setCharCount(text.length);
    try {
      const res = await fetch(`${API_URL}/api/process-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, title, author, subreddit }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to process text');
        setIsLoading(false);
        setProgressStep('');
        return;
      }
      const data = await res.json();
      setActiveStoryId(data.story_id);
      setProgressStep('generating');
      setProgressDetail('Generating expressive audio with Gemini TTS...');
      fetchStories();
    } catch {
      alert('Network error. Is the backend running?');
      setIsLoading(false);
      setProgressStep('');
    }
  };

  const handleSubmitSales = async (text: string, title: string, author: string, voiceId: string, websiteUrl: string, taggedText: string) => {
    setIsLoading(true);
    setProgressMode('standard');
    setProgressStep('tagging');
    setProgressDetail('Generating sales pitch with Claude...');
    setCharCount(taggedText.length);
    try {
      const res = await fetch(`${API_URL}/api/process-sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, title, author, voice_id: voiceId, website_url: websiteUrl, tagged_text: taggedText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to process sales pitch');
        setIsLoading(false);
        setProgressStep('');
        return;
      }
      const data = await res.json();
      setActiveStoryId(data.story_id);
      setProgressStep('generating');
      setProgressDetail('Generating expressive audio with Gemini TTS...');
      fetchStories();
    } catch {
      alert('Network error. Is the backend running?');
      setIsLoading(false);
      setProgressStep('');
    }
  };

  const handleSubmitInfluencer = async (text: string, title: string, author: string, voiceId: string, avatarId: string, aspectRatio: string, taggedText: string, context: string) => {
    setIsLoading(true);
    setProgressMode('influencer');
    setProgressStep('generating');
    setProgressDetail('Generating audio with Gemini TTS...');
    setCharCount(taggedText.length);
    try {
      const res = await fetch(`${API_URL}/api/process-influencer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: taggedText, title, author, voice_id: voiceId, avatar_id: avatarId, aspect_ratio: aspectRatio, context }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to process influencer video');
        setIsLoading(false);
        setProgressStep('');
        return;
      }
      const data = await res.json();
      setActiveStoryId(data.story_id);
      setProgressStep('generating');
      setProgressDetail('Generating audio with Gemini TTS...');
      fetchStories();
    } catch {
      alert('Network error. Is the backend running?');
      setIsLoading(false);
      setProgressStep('');
    }
  };

  const handlePreviewSales = async (text: string, websiteUrl: string) => {
    const res = await fetch(`${API_URL}/api/preview-sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, website_url: websiteUrl }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate preview');
    }
    return res.json();
  };

  const handlePreviewInfluencer = async (text: string, context: string) => {
    const res = await fetch(`${API_URL}/api/preview-influencer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate preview');
    }
    return res.json();
  };

  const handleSubmitExplainer = async (
    text: string, title: string, author: string, voiceId: string, aspectRatio: string, scenesJson: string,
    logoUrl: string, primaryColor: string, secondaryColor: string, bgColor: string, textColor: string, accentColor: string,
    imageUrls: string[], renderQuality: string,
    musicEnabled: boolean, musicTrackId: string, musicVolume: number,
  ) => {
    setIsLoading(true);
    setProgressMode('explainer');
    setProgressStep('tagging');
    setProgressDetail('Breaking script into scenes...');
    setCharCount(text.length);
    try {
      const res = await fetch(`${API_URL}/api/process-explainer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text, title, author, voice_id: voiceId, aspect_ratio: aspectRatio,
          logo_url: logoUrl,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          bg_color: bgColor,
          text_color: textColor,
          accent_color: accentColor,
          image_urls: imageUrls,
          render_quality: renderQuality,
          scenes_json: scenesJson,
          music_enabled: musicEnabled,
          music_track_id: musicTrackId,
          music_volume: musicVolume,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to process explainer video');
        setIsLoading(false);
        setProgressStep('');
        return;
      }
      const data = await res.json();
      setActiveStoryId(data.story_id);
      setProgressStep('generating');
      setProgressDetail('Synthesizing scene audio...');
      fetchStories();
    } catch {
      alert('Network error. Is the backend running?');
      setIsLoading(false);
      setProgressStep('');
    }
  };

  const handlePreviewExplainer = async (text: string) => {
    const res = await fetch(`${API_URL}/api/preview-explainer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate scene preview');
    }
    return res.json();
  };

  const handleCreateAvatar = async (name: string, avatarType: string, fileUrl: string) => {
    const res = await fetch(`${API_URL}/api/heygen/avatars`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar_type: avatarType, file_url: fileUrl }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create avatar');
    }
    const data = await res.json();
    fetchAvatars();
    return data;
  };

  const handleUploadAsset = async (file: File) => {
    const res = await fetch(`${API_URL}/api/upload-asset`, {
      method: 'POST',
      body: file,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload file');
    }
    return res.json();
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/api/stories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStories((prev) => prev.filter((s) => s.id !== id));
        fetchStories();
      } else {
        alert('Failed to delete story');
      }
    } catch {
      alert('Network error during delete');
    }
  };

  return (
    <main style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Animated background blobs */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)',
          top: '-10%',
          left: '-10%',
          filter: 'blur(80px)',
          animation: 'blob 12s infinite ease-in-out',
        }} />
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
          top: '40%',
          right: '-5%',
          filter: 'blur(80px)',
          animation: 'blob 14s infinite ease-in-out reverse',
        }} />
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14,165,233,0.05) 0%, transparent 70%)',
          bottom: '5%',
          left: '30%',
          filter: 'blur(80px)',
          animation: 'blob 16s infinite ease-in-out',
        }} />
        {/* Subtle grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1040px', margin: '0 auto', padding: '32px 20px 80px' }}>
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ marginBottom: '40px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(56,189,248,0.3)',
            }}>
              <Sparkles size={22} color="#fff" />
            </div>
            <h1 style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              StoryFyne
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-muted)', fontWeight: 400 }}>
            Turn any story, pitch, or script into expressive audio and motion video — powered by AI.
          </p>
        </motion.header>

        {/* Mode badges */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            marginBottom: '32px',
          }}
        >
          {[
            { icon: Mic, label: 'Reddit Stories' },
            { icon: Wand2, label: 'Sales Pitches' },
            { icon: Video, label: 'AI Influencer' },
            { icon: Sparkles, label: 'Explainer Videos' },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '100px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              fontSize: '13px',
              color: 'var(--text-muted)',
              fontWeight: 500,
            }}>
              <item.icon size={14} />
              {item.label}
            </div>
          ))}
        </motion.div>

        {/* Main input */}
        <StoryInput
          onSubmitUrl={handleSubmitUrl}
          onSubmitText={handleSubmitText}
          onSubmitSales={handleSubmitSales}
          onSubmitInfluencer={handleSubmitInfluencer}
          onSubmitExplainer={handleSubmitExplainer}
          onPreviewSales={handlePreviewSales}
          onPreviewInfluencer={handlePreviewInfluencer}
          onPreviewExplainer={handlePreviewExplainer}
          onCreateAvatar={handleCreateAvatar}
          onUploadAsset={handleUploadAsset}
          avatars={avatars}
          isLoading={isLoading}
          musicTracks={musicTracks}
        />

        {/* Progress */}
        <AnimatePresence>
          {progressStep && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ProgressTracker
                step={progressStep}
                detail={progressDetail}
                charCount={charCount}
                mode={progressMode}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Stories section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ marginTop: '48px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(99,102,241,0.15))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(56,189,248,0.2)',
            }}>
              <Video size={16} color="#38bdf8" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Recent Stories
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                {stories.length} {stories.length === 1 ? 'item' : 'items'} generated
              </p>
            </div>
          </div>

          <StoryList stories={stories} apiUrl={API_URL} onDelete={handleDelete} />
        </motion.section>

        {/* Avatars section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{ marginTop: '56px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(168,85,247,0.15))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(236,72,153,0.2)',
            }}>
              <UserCircle size={16} color="#ec4899" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                My Avatars
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                HeyGen avatars for AI influencer videos
              </p>
            </div>
          </div>

          {avatars.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-medium)',
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}>
              No avatars loaded yet. Create one in the Influencer tab.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
              {avatars.map((avatar, i) => (
                <motion.div
                  key={avatar.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                    cursor: 'default',
                  }}
                  whileHover={{ borderColor: 'rgba(255,255,255,0.12)', transform: 'translateY(-2px)' }}
                >
                  {avatar.preview_image_url && (
                    <img
                      src={avatar.preview_image_url}
                      alt={avatar.name || avatar.id}
                      style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', backgroundColor: '#1a1a1a' }}
                    />
                  )}
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {avatar.name || 'Unnamed'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {avatar.id}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {avatar.gender && (
                      <span style={{
                        fontSize: '11px',
                        padding: '3px 10px',
                        borderRadius: '100px',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)',
                      }}>
                        {avatar.gender}
                      </span>
                    )}
                    {avatar.avatar_type && (
                      <span style={{
                        fontSize: '11px',
                        padding: '3px 10px',
                        borderRadius: '100px',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)',
                      }}>
                        {avatar.avatar_type.replace('_', ' ')}
                      </span>
                    )}
                    {avatar.status && (
                      <span style={{
                        fontSize: '11px',
                        padding: '3px 10px',
                        borderRadius: '100px',
                        fontWeight: 500,
                        background: avatar.status === 'completed' ? 'rgba(34,197,94,0.1)' : avatar.status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
                        color: avatar.status === 'completed' ? '#4ade80' : avatar.status === 'failed' ? '#f87171' : '#60a5fa',
                        border: `1px solid ${avatar.status === 'completed' ? 'rgba(34,197,94,0.2)' : avatar.status === 'failed' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'}`,
                      }}>
                        {avatar.status}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Footer */}
        <footer style={{ marginTop: '80px', paddingTop: '32px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-faint)' }}>
            StoryFyne — Built by Dialfyne
          </p>
        </footer>
      </div>
    </main>
  );
}
