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

export default function Home() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeStoryId, setActiveStoryId] = useState<number | null>(null);
  const [progressStep, setProgressStep] = useState('');
  const [progressDetail, setProgressDetail] = useState('');
  const [charCount, setCharCount] = useState<number | undefined>();

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

  useEffect(() => {
    fetchStories();
    const interval = setInterval(fetchStories, 5000);
    return () => clearInterval(interval);
  }, [fetchStories]);

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
      setProgressDetail('Synthesizing speech with xAI TTS...');
      fetchStories();
    } catch (e) {
      alert('Network error. Is the backend running?');
      setIsLoading(false);
      setProgressStep('');
    }
  };

  const handleSubmitSales = async (text: string, title: string, author: string, subreddit: string) => {
    setIsLoading(true);
    setProgressStep('tagging');
    setProgressDetail('Crafting Dialfyne sales pitch...');
    setCharCount(text.length);

    try {
      const res = await fetch(`${API_URL}/api/process-sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, title, author, subreddit }),
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
      setProgressDetail('Synthesizing speech with xAI TTS...');
      fetchStories();
    } catch (e) {
      alert('Network error. Is the backend running?');
      setIsLoading(false);
      setProgressStep('');
    }
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

      <StoryInput onSubmitUrl={handleSubmitUrl} onSubmitText={handleSubmitText} onSubmitSales={handleSubmitSales} isLoading={isLoading} />

      <ProgressTracker
        step={progressStep}
        detail={progressDetail}
        charCount={charCount}
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
    </main>
  );
}
