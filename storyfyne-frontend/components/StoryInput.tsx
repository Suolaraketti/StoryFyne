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
  onSubmitInfluencer: (text: string, title: string, author: string, voiceId: string, avatarId: string, aspectRatio: string, taggedText: string, context: string) => void;
  onSubmitExplainer: (text: string, title: string, author: string, voiceId: string, aspectRatio: string, scenesJson: string, logoUrl: string, primaryColor: string, secondaryColor: string, bgColor: string, textColor: string, accentColor: string, imageUrls: string[]) => void;
  onPreviewSales: (text: string, websiteUrl: string) => Promise<{ tagged_text: string; voice_assignments: Record<string, string> }>;
  onPreviewInfluencer: (text: string, context: string) => Promise<{ tagged_text: string }>;
  onPreviewExplainer: (text: string) => Promise<{ scenes: any[] }>;
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

export default function StoryInput({ onSubmitUrl, onSubmitText, onSubmitSales, onSubmitInfluencer, onSubmitExplainer, onPreviewSales, onPreviewInfluencer, onPreviewExplainer, onCreateAvatar, onUploadAsset, avatars, isLoading }: StoryInputProps) {
  const [mode, setMode] = useState<'text' | 'url' | 'sales' | 'influencer' | 'explainer'>('text');
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
  const [influencerContext, setInfluencerContext] = useState('');
  const [influencerTaggedText, setInfluencerTaggedText] = useState('');
  const [showInfluencerPreview, setShowInfluencerPreview] = useState(false);
  const [isPreviewingInfluencer, setIsPreviewingInfluencer] = useState(false);

  // Explainer mode state
  const [explainerScenes, setExplainerScenes] = useState<any[]>([]);
  const [showExplainerPreview, setShowExplainerPreview] = useState(false);
  const [isPreviewingExplainer, setIsPreviewingExplainer] = useState(false);
  const [explainerLogoUrl, setExplainerLogoUrl] = useState('');
  const [explainerPrimaryColor, setExplainerPrimaryColor] = useState('#4f46e5');
  const [explainerSecondaryColor, setExplainerSecondaryColor] = useState('#0ea5e9');
  const [explainerBgColor, setExplainerBgColor] = useState('#0f172a');
  const [explainerTextColor, setExplainerTextColor] = useState('#f8fafc');
  const [explainerAccentColor, setExplainerAccentColor] = useState('#6366f1');
  const [explainerImageUrls, setExplainerImageUrls] = useState<string[]>([]);

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
  const isExplainer = mode === 'explainer';

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
      onSubmitInfluencer(text.trim(), title.trim() || 'AI Influencer', author.trim() || 'Unknown', voiceId, avatarId, aspectRatio, influencerTaggedText.trim(), influencerContext.trim());
    } else if (mode === 'explainer' && text.trim()) {
      onSubmitExplainer(
        text.trim(),
        title.trim() || 'Explainer Video',
        author.trim() || 'Unknown',
        voiceId,
        aspectRatio,
        JSON.stringify(explainerScenes),
        explainerLogoUrl,
        explainerPrimaryColor,
        explainerSecondaryColor,
        explainerBgColor,
        explainerTextColor,
        explainerAccentColor,
        explainerImageUrls.filter(u => u.trim()),
      );
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

  const handlePreviewInfluencer = async () => {
    if (!text.trim()) return;
    setIsPreviewingInfluencer(true);
    try {
      const result = await onPreviewInfluencer(text.trim(), influencerContext.trim());
      setInfluencerTaggedText(result.tagged_text);
      setShowInfluencerPreview(true);
    } catch (e: any) {
      alert(e.message || 'Failed to generate preview');
    } finally {
      setIsPreviewingInfluencer(false);
    }
  };

  const handlePreviewExplainer = async () => {
    if (!text.trim()) return;
    setIsPreviewingExplainer(true);
    try {
      const result = await onPreviewExplainer(text.trim());
      setExplainerScenes(result.scenes || []);
      setShowExplainerPreview(true);
    } catch (e: any) {
      alert(e.message || 'Failed to generate scene preview');
    } finally {
      setIsPreviewingExplainer(false);
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
        <button type="button" onClick={() => { setMode('explainer'); setShowPreview(false); }}
          style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #333', backgroundColor: mode === 'explainer' ? '#6366f1' : '#141414', color: '#fff', cursor: 'pointer', fontSize: '14px' }}>
          Explainer
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
      {isExplainer && (
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #6366f1', borderRadius: '10px', padding: '14px 18px', marginBottom: '16px', fontSize: '14px', color: '#6366f1' }}>
          Explainer Mode: Turn your script into a motion-graphics explainer video with per-scene voiceover and animated visuals.
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
            {!isSales && !isInfluencer && !isExplainer && (
              <input type="text" placeholder="Subreddit (optional)" value={subreddit} onChange={(e) => setSubreddit(e.target.value)} disabled={isLoading}
                style={{ flex: 1, padding: '12px 14px', fontSize: '15px', borderRadius: '10px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none' }} />
            )}
          </div>

          {(isSales || isInfluencer || isExplainer) && (
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

              {isExplainer && (
                <>
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

                  {/* Brand Kit */}
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#6366f1' }}>Brand Kit</div>
                    <input type="url" placeholder="Logo URL (optional — transparent PNG recommended)" value={explainerLogoUrl} onChange={(e) => setExplainerLogoUrl(e.target.value)} disabled={isLoading}
                      style={{ width: '100%', padding: '12px 14px', fontSize: '15px', borderRadius: '10px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none', boxSizing: 'border-box' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="color" value={explainerPrimaryColor} onChange={(e) => setExplainerPrimaryColor(e.target.value)} disabled={isLoading}
                          style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid #333', padding: 2, backgroundColor: '#141414', cursor: 'pointer' }} />
                        <span style={{ fontSize: '13px', color: '#888' }}>Primary</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="color" value={explainerSecondaryColor} onChange={(e) => setExplainerSecondaryColor(e.target.value)} disabled={isLoading}
                          style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid #333', padding: 2, backgroundColor: '#141414', cursor: 'pointer' }} />
                        <span style={{ fontSize: '13px', color: '#888' }}>Secondary</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="color" value={explainerBgColor} onChange={(e) => setExplainerBgColor(e.target.value)} disabled={isLoading}
                          style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid #333', padding: 2, backgroundColor: '#141414', cursor: 'pointer' }} />
                        <span style={{ fontSize: '13px', color: '#888' }}>Background</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="color" value={explainerTextColor} onChange={(e) => setExplainerTextColor(e.target.value)} disabled={isLoading}
                          style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid #333', padding: 2, backgroundColor: '#141414', cursor: 'pointer' }} />
                        <span style={{ fontSize: '13px', color: '#888' }}>Text</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="color" value={explainerAccentColor} onChange={(e) => setExplainerAccentColor(e.target.value)} disabled={isLoading}
                          style={{ width: 36, height: 36, borderRadius: 6, border: '1px solid #333', padding: 2, backgroundColor: '#141414', cursor: 'pointer' }} />
                        <span style={{ fontSize: '13px', color: '#888' }}>Accent</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Scene images (optional — one per scene, max 3)</div>
                    {[0, 1, 2].map((i) => (
                      <input key={i} type="url" placeholder={`Scene ${i + 1} image URL (optional)`} value={explainerImageUrls[i] || ''}
                        onChange={(e) => {
                          const next = [...explainerImageUrls];
                          next[i] = e.target.value;
                          setExplainerImageUrls(next);
                        }} disabled={isLoading}
                        style={{ width: '100%', padding: '10px 12px', fontSize: '14px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none', boxSizing: 'border-box' }} />
                    ))}
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

              {isInfluencer && (
                <>
                  <input type="text" placeholder="What is this ad for? (e.g. roofing company, fitness app, SaaS demo) — helps Claude tag it better" value={influencerContext} onChange={(e) => setInfluencerContext(e.target.value)} disabled={isLoading}
                    style={{ width: '100%', padding: '12px 14px', fontSize: '15px', borderRadius: '10px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', outline: 'none', boxSizing: 'border-box' }} />
                </>
              )}
            </>
          )}

          <textarea
            placeholder={isSales ? "Paste a cold email, story, idea, or bullet points (optional if you provided a website above)..." : isInfluencer ? "Write your influencer script here..." : isExplainer ? "Paste your explainer script here... (e.g. 'Most small businesses lose 30% of leads to missed calls. Here is how AI fixes that...')" : "Paste story text here..."}
            value={text} onChange={(e) => setText(e.target.value)} disabled={isLoading} required={!isSales || !websiteUrl.trim()} rows={isInfluencer || isExplainer ? 10 : 8}
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

          {isInfluencer && !showInfluencerPreview && (
            <button type="button" onClick={handlePreviewInfluencer} disabled={isPreviewingInfluencer || !text.trim()}
              style={{ padding: '12px 24px', fontSize: '15px', fontWeight: 600, borderRadius: '10px', border: '1px solid #ec4899', backgroundColor: '#1a0512', color: '#ec4899', cursor: isPreviewingInfluencer ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}>
              {isPreviewingInfluencer ? 'Writing delivery...' : 'Preview Delivery'}
            </button>
          )}

          {isInfluencer && showInfluencerPreview && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ color: '#888', fontSize: '14px' }}>Review and edit the tagged delivery below, then click Generate:</label>
              <textarea value={influencerTaggedText} onChange={(e) => setInfluencerTaggedText(e.target.value)} disabled={isLoading} rows={10}
                style={{ width: '100%', padding: '14px 18px', fontSize: '15px', borderRadius: '10px', border: '1px solid #ec4899', backgroundColor: '#1a0512', color: '#e0e0e0', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={handlePreviewInfluencer} disabled={isPreviewingInfluencer}
                  style={{ padding: '10px 20px', fontSize: '14px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', cursor: 'pointer' }}>
                  Regenerate
                </button>
                <button type="submit" disabled={isLoading || !influencerTaggedText.trim()}
                  style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 600, borderRadius: '8px', border: 'none', backgroundColor: '#ec4899', color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                  {isLoading ? 'Generating...' : 'Generate Video'}
                </button>
              </div>
            </div>
          )}

          {isExplainer && !showExplainerPreview && (
            <button type="button" onClick={handlePreviewExplainer} disabled={isPreviewingExplainer || !text.trim()}
              style={{ padding: '12px 24px', fontSize: '15px', fontWeight: 600, borderRadius: '10px', border: '1px solid #6366f1', backgroundColor: '#0f172a', color: '#6366f1', cursor: isPreviewingExplainer ? 'not-allowed' : 'pointer', alignSelf: 'flex-start' }}>
              {isPreviewingExplainer ? 'Breaking into scenes...' : 'Preview Scenes'}
            </button>
          )}

          {isExplainer && showExplainerPreview && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ color: '#888', fontSize: '14px' }}>Review scenes below, then click Generate:</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', padding: '4px' }}>
                {explainerScenes.map((scene, idx) => (
                  <div key={idx} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 600 }}>Scene {idx + 1}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', backgroundColor: '#1e293b', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>{scene.type || 'feature'}</span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#e0e0e0', marginBottom: '6px' }}>{scene.scene_text}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>{scene.visual_direction}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={handlePreviewExplainer} disabled={isPreviewingExplainer}
                  style={{ padding: '10px 20px', fontSize: '14px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#141414', color: '#e0e0e0', cursor: 'pointer' }}>
                  Regenerate
                </button>
                <button type="submit" disabled={isLoading || explainerScenes.length === 0}
                  style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 600, borderRadius: '8px', border: 'none', backgroundColor: '#6366f1', color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                  {isLoading ? 'Generating...' : 'Generate Explainer Video'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!isSales && !isInfluencer && !isExplainer && (
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
      {isExplainer && !showExplainerPreview && (
        <button type="submit" disabled={isLoading}
          style={{ marginTop: '16px', width: '100%', padding: '14px 28px', fontSize: '16px', fontWeight: 600, borderRadius: '10px', border: 'none', backgroundColor: isLoading ? '#333' : '#6366f1', color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
          {isLoading ? 'Generating Explainer Video...' : 'Generate Explainer Video'}
        </button>
      )}
    </form>
  );
}
