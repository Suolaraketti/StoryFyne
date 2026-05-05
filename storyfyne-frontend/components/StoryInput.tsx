'use client';

import { useState } from 'react';

interface StoryInputProps {
  onSubmitUrl: (url: string) => void;
  onSubmitText: (text: string, title: string, author: string, subreddit: string) => void;
  onSubmitSales: (text: string, title: string, author: string, voiceId: string, websiteUrl: string, taggedText: string) => void;
  onPreviewSales: (text: string, websiteUrl: string) => Promise<{ tagged_text: string; voice_assignments: Record<string, string> }>;
  isLoading: boolean;
}

const VOICES = [
  { id: 'rex', label: 'Rex — Confident, Clear (Male)', desc: 'Best for authoritative pitches' },
  { id: 'leo', label: 'Leo — Authoritative, Strong (Male)', desc: 'Best for commanding presence' },
  { id: 'ara', label: 'Ara — Warm, Friendly (Female)', desc: 'Best for approachable tone' },
  { id: 'eve', label: 'Eve — Energetic, Upbeat (Female)', desc: 'Best for enthusiastic delivery' },
  { id: 'sal', label: 'Sal — Smooth, Balanced (Neutral)', desc: 'Best for calm narration' },
];

export default function StoryInput({ onSubmitUrl, onSubmitText, onSubmitSales, onPreviewSales, isLoading }: StoryInputProps) {
  const [mode, setMode] = useState<'text' | 'url' | 'sales'>('text');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subreddit, setSubreddit] = useState('');

  // Sales mode state
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [voiceId, setVoiceId] = useState('rex');
  const [previewText, setPreviewText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const isSales = mode === 'sales';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'url' && url.trim()) {
      onSubmitUrl(url.trim());
    } else if (mode === 'text' && text.trim()) {
      onSubmitText(text.trim(), title.trim() || 'Untitled Story', author.trim() || 'Unknown', subreddit.trim() || 'pasted');
    } else if (mode === 'sales' && text.trim()) {
      onSubmitSales(text.trim(), title.trim() || 'Dialfyne Pitch', author.trim() || 'Dennis Kaczmarowski', voiceId, websiteUrl.trim(), previewText.trim());
    }
  };

  const handlePreview = async () => {
    if (!text.trim()) return;
    setIsPreviewing(true);
    try {
      const result = await onPreviewSales(text.trim(), websiteUrl.trim());
      setPreviewText(result.tagged_text);
      setShowPreview(true);
    } catch (e: any) {
      alert(e.message || 'Failed to generate preview');
    } finally {
      setIsPreviewing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', marginBottom: '24px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button type="button" onClick={() => { setMode('text'); setShowPreview(false); }}
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #333', backgroundColor: mode === 'text' ? '#2563eb' : '#141414', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
          Paste Text
        </button>
        <button type="button" onClick={() => { setMode('url'); setShowPreview(false); }}
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #333', backgroundColor: mode === 'url' ? '#2563eb' : '#141414', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
          Reddit URL
        </button>
        <button type="button" onClick={() => { setMode('sales'); setShowPreview(false); }}
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #333', backgroundColor: mode === 'sales' ? '#F5A623' : '#141414', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
          Sales Mode
        </button>
      </div>

      {isSales && (
        <div style={{ backgroundColor: '#1a1205', border: '1px solid #F5A623', borderRadius: '10px', padding: '14px 18px', marginBottom: '16px', fontSize: '14px', color: '#F5A623' }}>
          Sales Mode: Paste a story or idea, optionally add a prospect website, preview the pitch, then generate audio.
        </div>
      )}

      {mode === 'url' ? (
        <input type="url" placeholder="Paste Reddit URL here..." value={url} onChange={(e) => setUrl(e.target.value)} disabled={isLoading} required
          style={{ width: '100%', padding: '14px 18px', fontSize: '16px', borderRadius: '10px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none', boxSizing: 'border-box' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input type="text" placeholder={isSales ? "Pitch title (optional)" : "Title (optional)"} value={title} onChange={(e) => setTitle(e.target.value)} disabled={isLoading}
              style={{ flex: 1, padding: '12px 14px', fontSize: '15px', borderRadius: '10px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none' }} />
            <input type="text" placeholder={isSales ? "Your name (optional)" : "Author (optional)"} value={author} onChange={(e) => setAuthor(e.target.value)} disabled={isLoading}
              style={{ flex: 1, padding: '12px 14px', fontSize: '15px', borderRadius: '10px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none' }} />
            {!isSales && (
              <input type="text" placeholder="Subreddit (optional)" value={subreddit} onChange={(e) => setSubreddit(e.target.value)} disabled={isLoading}
                style={{ flex: 1, padding: '12px 14px', fontSize: '15px', borderRadius: '10px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none' }} />
            )}
          </div>

          {isSales && (
            <>
              <input type="url" placeholder="Prospect website URL (optional, e.g. https://example.com)" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} disabled={isLoading}
                style={{ width: '100%', padding: '12px 14px', fontSize: '15px', borderRadius: '10px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none', boxSizing: 'border-box' }} />

              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <label style={{ color: '#888', fontSize: '14px', whiteSpace: 'nowrap' }}>Voice:</label>
                <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)} disabled={isLoading}
                  style={{ flex: 1, padding: '12px 14px', fontSize: '15px', borderRadius: '10px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none' }}>
                  {VOICES.map((v) => (
                    <option key={v.id} value={v.id}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ color: '#666', fontSize: '13px', marginTop: '-8px' }}>
                {VOICES.find(v => v.id === voiceId)?.desc}
              </div>
            </>
          )}

          <textarea
            placeholder={isSales ? "Paste a cold email, story, idea, or bullet points (optional if you provided a website above)..." : "Paste story text here..."}
            value={text} onChange={(e) => setText(e.target.value)} disabled={isLoading} required={!isSales || !websiteUrl.trim()} rows={8}
            style={{ width: '100%', padding: '14px 18px', fontSize: '16px', borderRadius: '10px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
          />

          {isSales && !showPreview && (
            <button type="button" onClick={handlePreview} disabled={isPreviewing || !text.trim()}
              style={{ padding: '12px 24px', fontSize: '15px', fontWeight: 600, borderRadius: '10px', border: '1px solid #F5A623', backgroundColor: '#1a1205', color: '#F5A623', cursor: isPreviewing ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}>
              {isPreviewing ? 'Writing pitch...' : 'Preview Pitch'}
            </button>
          )}

          {isSales && showPreview && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ color: '#888', fontSize: '14px' }}>Review and edit the pitch below, then click Generate:</label>
              <textarea value={previewText} onChange={(e) => setPreviewText(e.target.value)} disabled={isLoading} rows={10}
                style={{ width: '100%', padding: '14px 18px', fontSize: '15px', borderRadius: '10px', border: '1px solid #F5A623', backgroundColor: '#1a1205', color: '#e0e0e0', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={handlePreview} disabled={isPreviewing}
                  style={{ padding: '10px 20px', fontSize: '14px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', cursor: 'pointer' }}>
                  Regenerate
                </button>
                <button type="submit" disabled={isLoading || !previewText.trim()}
                  style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 600, borderRadius: '8px', border: 'none', backgroundColor: '#F5A623', color: '#0a0a0a', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                  {isLoading ? 'Generating...' : 'Generate Audio'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!isSales && (
        <button type="submit" disabled={isLoading}
          style={{ marginTop: '16px', width: '100%', padding: '14px 28px', fontSize: '16px', fontWeight: 600, borderRadius: '10px', border: 'none', backgroundColor: isLoading ? '#333' : '#2563eb', color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
          {isLoading ? 'Generating...' : 'Generate Audio'}
        </button>
      )}
    </form>
  );
}
