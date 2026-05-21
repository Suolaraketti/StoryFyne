'use client';

import { useState, useEffect, useRef } from 'react';

interface Avatar {
  id: string;
  name?: string;
  preview_image_url?: string;
  gender?: string;
  status?: string;
  avatar_type?: string;
}

interface StoryInputProps {
  onSubmitUrl: (url: string) => void;
  onSubmitText: (text: string, title: string, author: string, subreddit: string) => void;
  onSubmitSales: (text: string, title: string, author: string, voiceId: string, websiteUrl: string, taggedText: string) => void;
  onSubmitInfluencer: (text: string, title: string, author: string, voiceId: string, avatarId: string, aspectRatio: string) => void;
  onPreviewSales: (text: string, websiteUrl: string) => Promise<{ tagged_text: string; voice_assignments: Record<string, string> }>;
  onCreateAvatar: (name: string, avatarType: string, fileUrl: string) => Promise<{ avatar_item?: any; avatar_group?: any }>;
  onUploadAsset: (file: File) => Promise<{ url: string }>;
  avatars: Avatar[];
  isLoading: boolean;
}

const VOICES = [
  { id: 'Puck', label: 'Puck — Smooth, Balanced (Male)', desc: 'Best for calm narration and pitches' },
  { id: 'Fenrir', label: 'Fenrir — Deep, Confident (Male)', desc: 'Best for authoritative presence' },
  { id: 'Kore', label: 'Kore — Warm, Friendly (Female)', desc: 'Best for approachable tone' },
  { id: 'Leda', label: 'Leda — Energetic, Bright (Female)', desc: 'Best for enthusiastic delivery' },
  { id: 'Zephyr', label: 'Zephyr — Soft, Calm (Female)', desc: 'Best for gentle, soothing delivery' },
  { id: 'Achernar', label: 'Achernar — Soft, Higher pitch', desc: 'Best for gentle, higher-pitched delivery' },
];

const AVATAR_TYPES = [
  { id: 'photo', label: 'Photo Avatar', desc: 'Single headshot image' },
  { id: 'digital_twin', label: 'Digital Twin', desc: 'Video footage (15-600s)' },
  { id: 'prompt', label: 'AI Prompt', desc: 'Text description' },
];

const ASPECT_RATIOS = [
  { id: '9:16', label: '9:16 — Vertical (TikTok / Reels / Shorts)', desc: 'Portrait, mobile-first' },
  { id: '16:9', label: '16:9 — Horizontal (YouTube / Desktop)', desc: 'Landscape, widescreen' },
  { id: '1:1', label: '1:1 — Square (Instagram / Feed)', desc: 'Equal width and height' },
  { id: '4:5', label: '4:5 — Portrait Social (Instagram)', desc: 'Slightly taller than wide' },
  { id: 'auto', label: 'Auto — Match avatar source', desc: 'Preserve original aspect ratio' },
];

export default function StoryInput({ onSubmitUrl, onSubmitText, onSubmitSales, onSubmitInfluencer, onPreviewSales, onCreateAvatar, onUploadAsset, avatars, isLoading }: StoryInputProps) {
  const [mode, setMode] = useState<'text' | 'url' | 'sales' | 'influencer'>('text');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subreddit, setSubreddit] = useState('');

  // Sales mode state
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [voiceId, setVoiceId] = useState('Puck');
  const [previewText, setPreviewText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Influencer mode state
  const [avatarId, setAvatarId] = useState('');
  const [aspectRatio, setAspectRatio] = useState('9:16');

  // Avatar creation state
  const [showCreateAvatar, setShowCreateAvatar] = useState(false);
  const [newAvatarName, setNewAvatarName] = useState('');
  const [newAvatarType, setNewAvatarType] = useState('photo');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [isCreatingAvatar, setIsCreatingAvatar] = useState(false);
  const [createAvatarStatus, setCreateAvatarStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSales = mode === 'sales';
  const isInfluencer = mode === 'influencer';

  // Default to first avatar when avatars load
  useEffect(() => {
    if (avatars.length > 0 && !avatarId) {
      setAvatarId(avatars[0].id);
    }
  }, [avatars, avatarId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'url' && url.trim()) {
      onSubmitUrl(url.trim());
    } else if (mode === 'text' && text.trim()) {
      onSubmitText(text.trim(), title.trim() || 'Untitled Story', author.trim() || 'Unknown', subreddit.trim() || 'pasted');
    } else if (mode === 'sales' && text.trim()) {
      onSubmitSales(text.trim(), title.trim() || 'Dialfyne Pitch', author.trim() || 'Dennis Kaczmarowski', voiceId, websiteUrl.trim(), previewText.trim());
    } else if (mode === 'influencer' && text.trim()) {
      onSubmitInfluencer(text.trim(), title.trim() || 'AI Influencer', author.trim() || 'Unknown', voiceId, avatarId, aspectRatio);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCreateAvatarStatus('Uploading file...');
    try {
      const result = await onUploadAsset(file);
      setNewAvatarUrl(result.url);
      setCreateAvatarStatus('File uploaded. Ready to create avatar.');
    } catch (e: any) {
      setCreateAvatarStatus(`Upload failed: ${e.message || 'Unknown error'}`);
    }
  };

  const handleCreateAvatar = async () => {
    const name = newAvatarName.trim();
    const fileUrl = newAvatarUrl.trim();
    if (!name) {
      setCreateAvatarStatus('Please enter an avatar name.');
      return;
    }
    if (!fileUrl) {
      setCreateAvatarStatus('Please provide an image URL or upload a file.');
      return;
    }
    setIsCreatingAvatar(true);
    setCreateAvatarStatus('Creating avatar on HeyGen...');
    try {
      const result = await onCreateAvatar(name, newAvatarType, fileUrl);
      const lookId = result.avatar_item?.id;
      setCreateAvatarStatus(
        lookId
          ? `Avatar "${name}" created! ID: ${lookId}. It may take a few minutes to train. Refresh avatars to see it.`
          : `Avatar "${name}" submitted for training. Refresh avatars to check status.`
      );
      setNewAvatarName('');
      setNewAvatarUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e: any) {
      setCreateAvatarStatus(`Failed: ${e.message || 'Unknown error'}`);
    } finally {
      setIsCreatingAvatar(false);
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
        <button type="button" onClick={() => { setMode('influencer'); setShowPreview(false); }}
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #333', backgroundColor: mode === 'influencer' ? '#ec4899' : '#141414', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
          Influencer
        </button>
      </div>

      {isSales && (
        <div style={{ backgroundColor: '#1a1205', border: '1px solid #F5A623', borderRadius: '10px', padding: '14px 18px', marginBottom: '16px', fontSize: '14px', color: '#F5A623' }}>
          Sales Mode: Paste a story or idea, optionally add a prospect website, preview the pitch, then generate audio.
        </div>
      )}
      {isInfluencer && (
        <div style={{ backgroundColor: '#1a0512', border: '1px solid #ec4899', borderRadius: '10px', padding: '14px 18px', marginBottom: '16px', fontSize: '14px', color: '#ec4899' }}>
          Influencer Mode: Generate a 9:16 vertical video (TikTok / Reels) with your Dialfyne voice + HeyGen AI avatar.
        </div>
      )}

      {mode === 'url' ? (
        <input type="url" placeholder="Paste Reddit URL here..." value={url} onChange={(e) => setUrl(e.target.value)} disabled={isLoading} required
          style={{ width: '100%', padding: '14px 18px', fontSize: '16px', borderRadius: '10px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none', boxSizing: 'border-box' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input type="text" placeholder={isSales ? "Pitch title (optional)" : isInfluencer ? "Video title (optional)" : "Title (optional)"} value={title} onChange={(e) => setTitle(e.target.value)} disabled={isLoading}
              style={{ flex: 1, padding: '12px 14px', fontSize: '15px', borderRadius: '10px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none' }} />
            <input type="text" placeholder={isSales ? "Your name (optional)" : isInfluencer ? "Influencer name (optional)" : "Author (optional)"} value={author} onChange={(e) => setAuthor(e.target.value)} disabled={isLoading}
              style={{ flex: 1, padding: '12px 14px', fontSize: '15px', borderRadius: '10px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none' }} />
            {!isSales && !isInfluencer && (
              <input type="text" placeholder="Subreddit (optional)" value={subreddit} onChange={(e) => setSubreddit(e.target.value)} disabled={isLoading}
                style={{ flex: 1, padding: '12px 14px', fontSize: '15px', borderRadius: '10px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none' }} />
            )}
          </div>

          {(isSales || isInfluencer) && (
            <>
              {isSales && (
                <input type="url" placeholder="Prospect website URL (optional, e.g. https://example.com)" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} disabled={isLoading}
                  style={{ width: '100%', padding: '12px 14px', fontSize: '15px', borderRadius: '10px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none', boxSizing: 'border-box' }} />
              )}

              {isInfluencer && (
                <>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label style={{ color: '#888', fontSize: '14px', whiteSpace: 'nowrap' }}>Avatar:</label>
                    <select value={avatarId} onChange={(e) => setAvatarId(e.target.value)} disabled={isLoading || avatars.length === 0}
                      style={{ flex: 1, padding: '12px 14px', fontSize: '15px', borderRadius: '10px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none' }}>
                      {avatars.length === 0 && (
                        <option value="">Loading avatars...</option>
                      )}
                      {avatars.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name || a.id}
                          {a.gender ? ` (${a.gender})` : ''}
                          {a.status && a.status !== 'completed' ? ` [${a.status}]` : ''}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={() => setShowCreateAvatar(!showCreateAvatar)}
                      style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '8px', border: '1px solid #ec4899', backgroundColor: '#1a0512', color: '#ec4899', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {showCreateAvatar ? 'Cancel' : 'Create New'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label style={{ color: '#888', fontSize: '14px', whiteSpace: 'nowrap' }}>Ratio:</label>
                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)} disabled={isLoading}
                      style={{ flex: 1, padding: '12px 14px', fontSize: '15px', borderRadius: '10px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none' }}>
                      {ASPECT_RATIOS.map((r) => (
                        <option key={r.id} value={r.id}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ color: '#666', fontSize: '13px', marginTop: '-8px' }}>
                    {ASPECT_RATIOS.find(r => r.id === aspectRatio)?.desc}
                  </div>
                </>
              )}

              {isInfluencer && showCreateAvatar && (
                <div style={{ backgroundColor: '#1a0512', border: '1px solid #ec4899', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#ec4899' }}>Create Custom Avatar</div>

                  <input type="text" placeholder="Avatar name (e.g. Dennis AI)" value={newAvatarName} onChange={(e) => setNewAvatarName(e.target.value)} disabled={isCreatingAvatar}
                    style={{ width: '100%', padding: '12px 14px', fontSize: '15px', borderRadius: '10px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none', boxSizing: 'border-box' }} />

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label style={{ color: '#888', fontSize: '14px', whiteSpace: 'nowrap' }}>Type:</label>
                    <select value={newAvatarType} onChange={(e) => setNewAvatarType(e.target.value)} disabled={isCreatingAvatar}
                      style={{ flex: 1, padding: '12px 14px', fontSize: '15px', borderRadius: '10px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none' }}>
                      {AVATAR_TYPES.map((t) => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ color: '#666', fontSize: '13px', marginTop: '-8px' }}>
                    {AVATAR_TYPES.find(t => t.id === newAvatarType)?.desc}
                  </div>

                  {newAvatarType !== 'prompt' ? (
                    <>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <input type="url" placeholder="Public image/video URL (optional if uploading)" value={newAvatarUrl} onChange={(e) => setNewAvatarUrl(e.target.value)} disabled={isCreatingAvatar}
                          style={{ flex: 1, padding: '12px 14px', fontSize: '15px', borderRadius: '10px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none' }} />
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*" style={{ display: 'none' }} />
                        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isCreatingAvatar}
                          style={{ padding: '10px 16px', fontSize: '13px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          Upload File
                        </button>
                      </div>
                      {newAvatarUrl && (
                        <div style={{ color: '#888', fontSize: '12px' }}>Source: {newAvatarUrl}</div>
                      )}
                    </>
                  ) : (
                    <textarea placeholder="Describe your avatar in detail... (e.g. Professional male in his 30s, clean-shaven, wearing a navy blazer)" value={newAvatarUrl} onChange={(e) => setNewAvatarUrl(e.target.value)} disabled={isCreatingAvatar} rows={4}
                      style={{ width: '100%', padding: '14px 18px', fontSize: '15px', borderRadius: '10px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  )}

                  <button type="button" onClick={handleCreateAvatar} disabled={isCreatingAvatar}
                    style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 600, borderRadius: '10px', border: 'none', backgroundColor: isCreatingAvatar ? '#333' : '#ec4899', color: '#fff', cursor: isCreatingAvatar ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}>
                    {isCreatingAvatar ? 'Creating...' : 'Create Avatar'}
                  </button>

                  {createAvatarStatus && (
                    <div style={{ fontSize: '13px', color: createAvatarStatus.startsWith('Failed') || createAvatarStatus.startsWith('Please') ? '#ef4444' : '#22c55e' }}>
                      {createAvatarStatus}
                    </div>
                  )}
                </div>
              )}

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
            placeholder={isSales ? "Paste a cold email, story, idea, or bullet points (optional if you provided a website above)..." : isInfluencer ? "Write your influencer script here..." : "Paste story text here..."}
            value={text} onChange={(e) => setText(e.target.value)} disabled={isLoading} required={!isSales || !websiteUrl.trim()} rows={isInfluencer ? 10 : 8}
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

      {!isSales && !isInfluencer && (
        <button type="submit" disabled={isLoading}
          style={{ marginTop: '16px', width: '100%', padding: '14px 28px', fontSize: '16px', fontWeight: 600, borderRadius: '10px', border: 'none', backgroundColor: isLoading ? '#333' : '#2563eb', color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
          {isLoading ? 'Generating...' : 'Generate Audio'}
        </button>
      )}
      {isInfluencer && (
        <button type="submit" disabled={isLoading}
          style={{ marginTop: '16px', width: '100%', padding: '14px 28px', fontSize: '16px', fontWeight: 600, borderRadius: '10px', border: 'none', backgroundColor: isLoading ? '#333' : '#ec4899', color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
          {isLoading ? 'Generating Avatar Video...' : 'Generate Influencer Video'}
        </button>
      )}
    </form>
  );
}
