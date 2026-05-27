'use client';

import { useState, useEffect, useCallback } from 'react';
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

  useEffect(() => {
    fetchStories();
    fetchAvatars();
    const interval = setInterval(fetchStories, 5000);
    return () => clearInterval(interval);
  }, [fetchStories, fetchAvatars]);

  // Poll active story progress
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
    setCharCount(undefined);

    try {
      const res = await fetch(`${API_URL}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to process story');
        setIsLoading(false);
        setProgressStep('');
        return;
      }

      const data = await res.json();
      setActiveStoryId(data.story_id);
      setProgressStep('tagging');
      setProgressDetail('Analyzing with Claude...');
      fetchStories();
    } catch (e) {
      alert('Network error. Is the backend running?');
      setIsLoading(false);
      setProgressStep('');
    }
  };

  const handleSubmitText = async (text: string, title: string, author: string, subreddit: string) => {
    setIsLoading(true);
    setProgressMode('standard');
    setProgressStep('tagging');
    setProgressDetail('Analyzing with Claude...');
    setCharCount(text.length);

    try {
      const res = await fetch(`${API_URL}/api/process-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, title, author, subreddit }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to process story');
        setIsLoading(false);
        setProgressStep('');
        return;
      }

      const data = await res.json();
      setActiveStoryId(data.story_id);
      setProgressStep('generating');
      setProgressDetail('Synthesizing speech with Gemini TTS...');
      fetchStories();
    } catch (e) {
      alert('Network error. Is the backend running?');
      setIsLoading(false);
      setProgressStep('');
    }
  };

  const handlePreviewSales = async (text: string, websiteUrl: string) => {
    const res = await fetch(`${API_URL}/api/draft-sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, website_url: websiteUrl, title: 'Dialfyne Pitch', author: 'Dennis Kaczmarowski', voice_id: 'Puck' }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate preview');
    }

    return res.json();
  };

  const handleSubmitSales = async (text: string, title: string, author: string, voiceId: string, websiteUrl: string, taggedText: string) => {
    setIsLoading(true);
    setProgressMode('standard');
    setProgressStep('generating');
    setProgressDetail('Synthesizing speech with Gemini TTS...');
    setCharCount(text.length);

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
      setProgressStep('uploading');
      setProgressDetail('Saving to Cloudflare R2...');
      fetchStories();
    } catch (e) {
      alert('Network error. Is the backend running?');
      setIsLoading(false);
      setProgressStep('');
    }
  };

  const handleSubmitInfluencer = async (text: string, title: string, author: string, voiceId: string, avatarId: string, aspectRatio: string, taggedText: string, context: string) => {
    setIsLoading(true);
    setProgressMode('influencer');
    setProgressStep('generating');
    setProgressDetail('Synthesizing Dialfyne audio...');
    setCharCount(text.length);

    try {
      const res = await fetch(`${API_URL}/api/process-influencer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, title, author, voice_id: voiceId, avatar_id: avatarId, aspect_ratio: aspectRatio, tagged_text: taggedText, context }),
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
      setProgressStep('rendering');
      setProgressDetail('Rendering HeyGen avatar video...');
      fetchStories();
    } catch (e) {
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

  const handleSubmitExplainer = async (
    text: string, title: string, author: string, voiceId: string, aspectRatio: string, scenesJson: string,
    logoUrl: string, primaryColor: string, secondaryColor: string, bgColor: string, textColor: string, accentColor: string,
    imageUrls: string[],
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
    } catch (e) {
      alert('Network error. Is the backend running?');
      setIsLoading(false);
      setProgressStep('');
    }
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

  const handleCreateAvatar = async (name: string, avatarType: string, fileUrl: string) => {
    const res = await fetch(`${API_URL}/api/avatars`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, avatar_type: avatarType, file_url: fileUrl }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create avatar');
    }

    const data = await res.json();
    // Refresh avatars so the new one shows up
    fetchAvatars();
    return data;
  };

  const handleUploadAsset = async (file: File) => {
    const res = await fetch(`${API_URL}/api/upload-asset`, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
        'X-Filename': file.name,
      },
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
      const res = await fetch(`${API_URL}/api/stories/${id}`, {
        method: 'DELETE',
      });
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
    <main style={{
      maxWidth: '960px',
      margin: '0 auto',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          margin: '0 0 8px 0',
          fontSize: '32px',
          fontWeight: 700,
          letterSpacing: '-0.5px',
          color: '#e0e0e0',
        }}>
          StoryFyne
        </h1>
        <p style={{ margin: 0, fontSize: '15px', color: '#888' }}>
          Reddit story to expressive audio generator
        </p>
      </div>

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
      />

      <ProgressTracker
        step={progressStep}
        detail={progressDetail}
        charCount={charCount}
        mode={progressMode}
      />

      <div style={{ marginBottom: '16px' }}>
        <h2 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 600,
          color: '#e0e0e0',
        }}>
          Recent Stories
        </h2>
      </div>

      <StoryList
        stories={stories}
        apiUrl={API_URL}
        onDelete={handleDelete}
      />

      <div style={{ marginTop: '48px', marginBottom: '16px' }}>
        <h2 style={{
          margin: 0,
          fontSize: '18px',
          fontWeight: 600,
          color: '#e0e0e0',
        }}>
          My Avatars
        </h2>
        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#888' }}>
          Your HeyGen avatars and their training status. Use the ID in the Influencer tab.
        </p>
      </div>

      {avatars.length === 0 ? (
        <p style={{ color: '#666', fontSize: '14px' }}>No avatars loaded yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
          {avatars.map((avatar) => (
            <div key={avatar.id} style={{
              backgroundColor: '#141414',
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              {avatar.preview_image_url && (
                <img
                  src={avatar.preview_image_url}
                  alt={avatar.name || avatar.id}
                  style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', backgroundColor: '#222' }}
                />
              )}
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#e0e0e0' }}>
                {avatar.name || 'Unnamed'}
              </div>
              <div style={{ fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>
                ID: {avatar.id}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {avatar.gender && (
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#222', color: '#aaa' }}>
                    {avatar.gender}
                  </span>
                )}
                {avatar.avatar_type && (
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#222', color: '#aaa' }}>
                    {avatar.avatar_type.replace('_', ' ')}
                  </span>
                )}
                {avatar.status && (
                  <span style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: avatar.status === 'completed' ? '#064e3b' : avatar.status === 'failed' ? '#450a0a' : '#1e3a5f',
                    color: avatar.status === 'completed' ? '#4ade80' : avatar.status === 'failed' ? '#f87171' : '#60a5fa',
                  }}>
                    {avatar.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
