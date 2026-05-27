'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2, Type, Briefcase, UserCircle, Sparkles, Wand2,
  ChevronDown, Upload, Image, Palette, MonitorPlay, ArrowRight,
  Loader2
} from 'lucide-react';

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

const TABS = [
  { id: 'text' as const, label: 'Paste Text', icon: Type, desc: 'Raw story text', color: '#38bdf8' },
  { id: 'url' as const, label: 'Reddit URL', icon: Link2, desc: 'Auto-scrape post', color: '#38bdf8' },
  { id: 'sales' as const, label: 'Sales Pitch', icon: Briefcase, desc: 'AI pitch writer', color: '#f59e0b' },
  { id: 'influencer' as const, label: 'Influencer', icon: UserCircle, desc: 'AI avatar video', color: '#ec4899' },
  { id: 'explainer' as const, label: 'Explainer', icon: MonitorPlay, desc: 'Motion graphics', color: '#6366f1' },
];

const VOICES = [
  { id: 'Puck', label: 'Puck', desc: 'Smooth, balanced male voice', sub: 'Best for calm narration' },
  { id: 'Fenrir', label: 'Fenrir', desc: 'Deep, confident male voice', sub: 'Best for authority' },
  { id: 'Kore', label: 'Kore', desc: 'Warm, friendly female voice', sub: 'Best for approachability' },
  { id: 'Leda', label: 'Leda', desc: 'Energetic, bright female voice', sub: 'Best for enthusiasm' },
  { id: 'Zephyr', label: 'Zephyr', desc: 'Soft, calm female voice', sub: 'Best for gentle delivery' },
  { id: 'Achernar', label: 'Achernar', desc: 'Soft, higher pitch', sub: 'Best for higher-pitched delivery' },
];

const ASPECT_RATIOS = [
  { id: '9:16', label: '9:16', desc: 'Vertical — TikTok / Reels' },
  { id: '16:9', label: '16:9', desc: 'Horizontal — YouTube' },
  { id: '1:1', label: '1:1', desc: 'Square — Instagram' },
  { id: '4:5', label: '4:5', desc: 'Portrait — Social Feed' },
];

export default function StoryInput({ onSubmitUrl, onSubmitText, onSubmitSales, onSubmitInfluencer, onSubmitExplainer, onPreviewSales, onPreviewInfluencer, onPreviewExplainer, onCreateAvatar, onUploadAsset, avatars, isLoading }: StoryInputProps) {
  const [mode, setMode] = useState<'text' | 'url' | 'sales' | 'influencer' | 'explainer'>('text');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subreddit, setSubreddit] = useState('');

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [voiceId, setVoiceId] = useState('Puck');
  const [previewText, setPreviewText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const [avatarId, setAvatarId] = useState('');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [influencerContext, setInfluencerContext] = useState('');
  const [influencerTaggedText, setInfluencerTaggedText] = useState('');
  const [showInfluencerPreview, setShowInfluencerPreview] = useState(false);
  const [isPreviewingInfluencer, setIsPreviewingInfluencer] = useState(false);

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

  const [showCreateAvatar, setShowCreateAvatar] = useState(false);
  const [newAvatarName, setNewAvatarName] = useState('');
  const [newAvatarType, setNewAvatarType] = useState('photo');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [isCreatingAvatar, setIsCreatingAvatar] = useState(false);
  const [createAvatarStatus, setCreateAvatarStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const sceneFileRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  const isSales = mode === 'sales';
  const isInfluencer = mode === 'influencer';
  const isExplainer = mode === 'explainer';

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
        text.trim(), title.trim() || 'Explainer Video', author.trim() || 'Unknown',
        voiceId, aspectRatio, JSON.stringify(explainerScenes),
        explainerLogoUrl, explainerPrimaryColor, explainerSecondaryColor,
        explainerBgColor, explainerTextColor, explainerAccentColor,
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

  const handleImageUpload = async (file: File, setter: (url: string) => void) => {
    try {
      const result = await onUploadAsset(file);
      setter(result.url);
    } catch (e: any) {
      alert(`Upload failed: ${e.message || 'Unknown error'}`);
    }
  };

  const handleCreateAvatar = async () => {
    const name = newAvatarName.trim();
    const fileUrl = newAvatarUrl.trim();
    if (!name) { setCreateAvatarStatus('Please enter an avatar name.'); return; }
    setIsCreatingAvatar(true);
    setCreateAvatarStatus('Creating avatar...');
    try {
      await onCreateAvatar(name, newAvatarType, fileUrl);
      setCreateAvatarStatus('Avatar created successfully!');
      setNewAvatarName('');
      setNewAvatarUrl('');
      setShowCreateAvatar(false);
    } catch (e: any) {
      setCreateAvatarStatus(`Failed: ${e.message || 'Unknown error'}`);
    } finally {
      setIsCreatingAvatar(false);
    }
  };

  const activeTab = TABS.find(t => t.id === mode)!;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    fontSize: '14px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-medium)',
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const focusGlow = (color: string) => ({
    borderColor: `${color}44`,
    boxShadow: `0 0 0 3px ${color}15`,
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Tab bar */}
      <div style={{ position: 'relative', padding: '6px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {TABS.map((tab) => {
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setMode(tab.id); setShowPreview(false); setShowInfluencerPreview(false); setShowExplainerPreview(false); }}
                style={{
                  position: 'relative',
                  flex: '1 1 auto',
                  minWidth: '110px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                  color: active ? '#fff' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 'var(--radius-md)',
                      background: `linear-gradient(135deg, ${tab.color}15, ${tab.color}08)`,
                      border: `1px solid ${tab.color}30`,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <tab.icon size={15} color={active ? tab.color : 'currentColor'} />
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form content */}
      <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {/* Mode description */}
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              background: `linear-gradient(135deg, ${activeTab.color}08, transparent)`,
              border: `1px solid ${activeTab.color}15`,
              fontSize: '13px',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <activeTab.icon size={14} color={activeTab.color} />
              {isSales && 'Write a sales pitch and let Claude enhance it with emotion tags.'}
              {isInfluencer && 'Generate an AI avatar video with expressive voiceover.'}
              {isExplainer && 'Break your script into scenes and generate a motion-graphics video.'}
              {mode === 'text' && 'Paste any story text and generate expressive audio.'}
              {mode === 'url' && 'Paste a Reddit URL — we will scrape and convert it.'}
            </div>

            {/* Common fields */}
            {(isSales || isInfluencer || isExplainer) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} disabled={isLoading}
                  style={inputStyle} onFocus={e => Object.assign(e.target.style, focusGlow(activeTab.color))} onBlur={e => e.target.style.cssText = ''} />
                <input type="text" placeholder={isSales ? 'Your name' : 'Author / Brand'} value={author} onChange={e => setAuthor(e.target.value)} disabled={isLoading}
                  style={inputStyle} onFocus={e => Object.assign(e.target.style, focusGlow(activeTab.color))} onBlur={e => e.target.style.cssText = ''} />
              </div>
            )}
            {mode === 'text' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <input type="text" placeholder="Title (optional)" value={title} onChange={e => setTitle(e.target.value)} disabled={isLoading}
                  style={inputStyle} onFocus={e => Object.assign(e.target.style, focusGlow('#38bdf8'))} onBlur={e => e.target.style.cssText = ''} />
                <input type="text" placeholder="Author (optional)" value={author} onChange={e => setAuthor(e.target.value)} disabled={isLoading}
                  style={inputStyle} onFocus={e => Object.assign(e.target.style, focusGlow('#38bdf8'))} onBlur={e => e.target.style.cssText = ''} />
                <input type="text" placeholder="Subreddit (optional)" value={subreddit} onChange={e => setSubreddit(e.target.value)} disabled={isLoading}
                  style={inputStyle} onFocus={e => Object.assign(e.target.style, focusGlow('#38bdf8'))} onBlur={e => e.target.style.cssText = ''} />
              </div>
            )}

            {/* Sales website */}
            {isSales && (
              <input type="url" placeholder="Prospect website URL (optional — Claude will research it)" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} disabled={isLoading}
                style={inputStyle} onFocus={e => Object.assign(e.target.style, focusGlow('#f59e0b'))} onBlur={e => e.target.style.cssText = ''} />
            )}

            {/* Voice selector */}
            {(isSales || isInfluencer || isExplainer || mode === 'text') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Voice</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                  {VOICES.map((v) => {
                    const active = voiceId === v.id;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVoiceId(v.id)}
                        disabled={isLoading}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--radius-md)',
                          border: active ? `1px solid ${activeTab.color}50` : '1px solid var(--border-subtle)',
                          background: active ? `${activeTab.color}10` : 'var(--bg-input)',
                          color: active ? '#fff' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          textAlign: 'left',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>{v.label}</div>
                        <div style={{ fontSize: '11px', color: active ? `${activeTab.color}cc` : 'var(--text-muted)' }}>{v.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Influencer extras */}
            {isInfluencer && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>Avatar</label>
                    <select value={avatarId} onChange={e => setAvatarId(e.target.value)} disabled={isLoading}
                      style={{ ...inputStyle, appearance: 'auto' }}>
                      {avatars.map(a => <option key={a.id} value={a.id}>{a.name || a.id}</option>)}
                      {avatars.length === 0 && <option>No avatars</option>}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>Aspect Ratio</label>
                    <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} disabled={isLoading}
                      style={{ ...inputStyle, appearance: 'auto' }}>
                      {ASPECT_RATIOS.map(r => <option key={r.id} value={r.id}>{r.label} — {r.desc}</option>)}
                    </select>
                  </div>
                </div>
                <input type="text" placeholder="What is this ad for? (e.g. roofing company, fitness app)" value={influencerContext} onChange={e => setInfluencerContext(e.target.value)} disabled={isLoading}
                  style={inputStyle} onFocus={e => Object.assign(e.target.style, focusGlow('#ec4899'))} onBlur={e => e.target.style.cssText = ''} />
                <button type="button" onClick={() => setShowCreateAvatar(s => !s)} disabled={isLoading}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-medium)',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}>
                  <Upload size={14} />
                  {showCreateAvatar ? 'Hide Avatar Creator' : 'Create New Avatar'}
                </button>

                <AnimatePresence>
                  {showCreateAvatar && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      style={{
                        background: 'linear-gradient(180deg, rgba(236,72,153,0.05) 0%, rgba(236,72,153,0.02) 100%)',
                        border: '1px solid rgba(236,72,153,0.15)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        overflow: 'hidden',
                      }}
                    >
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#ec4899' }}>Create Custom Avatar</div>
                      <input type="text" placeholder="Avatar name" value={newAvatarName} onChange={e => setNewAvatarName(e.target.value)} disabled={isCreatingAvatar} style={inputStyle} />
                      <select value={newAvatarType} onChange={e => setNewAvatarType(e.target.value)} disabled={isCreatingAvatar} style={{ ...inputStyle, appearance: 'auto' }}>
                        <option value="photo">Photo Avatar — Single headshot</option>
                        <option value="digital_twin">Digital Twin — Video footage</option>
                        <option value="prompt">AI Prompt — Text description</option>
                      </select>
                      {newAvatarType !== 'prompt' ? (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input type="url" placeholder="Public image/video URL" value={newAvatarUrl} onChange={e => setNewAvatarUrl(e.target.value)} disabled={isCreatingAvatar} style={inputStyle} />
                          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*" style={{ display: 'none' }} />
                          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isCreatingAvatar}
                            style={{ padding: '10px 16px', fontSize: '13px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', background: 'var(--bg-input)', color: 'var(--text-secondary)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            <Upload size={14} />
                          </button>
                        </div>
                      ) : (
                        <textarea placeholder="Describe your avatar..." value={newAvatarUrl} onChange={e => setNewAvatarUrl(e.target.value)} disabled={isCreatingAvatar} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                      )}
                      {newAvatarUrl && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Source: {newAvatarUrl}</div>}
                      <button type="button" onClick={handleCreateAvatar} disabled={isCreatingAvatar}
                        style={{ alignSelf: 'flex-start', padding: '10px 20px', fontSize: '14px', fontWeight: 600, borderRadius: 'var(--radius-md)', border: 'none', background: isCreatingAvatar ? '#333' : '#ec4899', color: '#fff', cursor: isCreatingAvatar ? 'not-allowed' : 'pointer' }}>
                        {isCreatingAvatar ? 'Creating...' : 'Create Avatar'}
                      </button>
                      {createAvatarStatus && (
                        <div style={{ fontSize: '13px', color: createAvatarStatus.startsWith('Failed') || createAvatarStatus.startsWith('Please') ? '#ef4444' : '#22c55e' }}>
                          {createAvatarStatus}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* Explainer extras */}
            {isExplainer && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>Aspect Ratio</label>
                    <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} disabled={isLoading}
                      style={{ ...inputStyle, appearance: 'auto' }}>
                      {ASPECT_RATIOS.map(r => <option key={r.id} value={r.id}>{r.label} — {r.desc}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'block' }}>Logo</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="url" placeholder="Logo URL or upload" value={explainerLogoUrl} onChange={e => setExplainerLogoUrl(e.target.value)} disabled={isLoading}
                        style={{ ...inputStyle, flex: 1 }} onFocus={e => Object.assign(e.target.style, { ...focusGlow('#6366f1'), flex: 1 })} onBlur={e => e.target.style.cssText = ''} />
                      <input type="file" ref={logoFileRef} accept="image/*" style={{ display: 'none' }}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, setExplainerLogoUrl); }} />
                      <button type="button" onClick={() => logoFileRef.current?.click()} disabled={isLoading}
                        style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', background: 'var(--bg-input)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        <Upload size={14} />
                        Upload
                      </button>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(180deg, rgba(99,102,241,0.04) 0%, rgba(99,102,241,0.02) 100%)',
                  border: '1px solid rgba(99,102,241,0.12)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Palette size={14} /> Brand Colors
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    {[
                      { label: 'Primary', value: explainerPrimaryColor, setter: setExplainerPrimaryColor },
                      { label: 'Secondary', value: explainerSecondaryColor, setter: setExplainerSecondaryColor },
                      { label: 'Accent', value: explainerAccentColor, setter: setExplainerAccentColor },
                      { label: 'Background', value: explainerBgColor, setter: setExplainerBgColor },
                      { label: 'Text', value: explainerTextColor, setter: setExplainerTextColor },
                    ].map((c) => (
                      <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="color" value={c.value} onChange={e => c.setter(e.target.value)} disabled={isLoading}
                          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border-medium)', padding: 2, background: 'var(--bg-input)', cursor: 'pointer' }} />
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{c.label}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Optional scene images (max 3) — paste a URL or upload</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input type="url" placeholder={`Scene ${i + 1} image URL`} value={explainerImageUrls[i] || ''}
                          onChange={e => { const n = [...explainerImageUrls]; n[i] = e.target.value; setExplainerImageUrls(n); }} disabled={isLoading}
                          style={{ ...inputStyle, flex: 1, padding: '8px 10px', fontSize: '12px' }} />
                        <input type="file" ref={sceneFileRefs[i]} accept="image/*" style={{ display: 'none' }}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, (url) => { const n = [...explainerImageUrls]; n[i] = url; setExplainerImageUrls(n); }); }} />
                        <button type="button" onClick={() => sceneFileRefs[i].current?.click()} disabled={isLoading}
                          style={{ padding: '8px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', background: 'var(--bg-input)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                          <Upload size={12} />
                        </button>
                        {explainerImageUrls[i] && (
                          <img src={explainerImageUrls[i]} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border-subtle)' }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* URL input */}
            {mode === 'url' && (
              <input type="url" placeholder="https://reddit.com/r/..." value={url} onChange={e => setUrl(e.target.value)} disabled={isLoading} required
                style={inputStyle} onFocus={e => Object.assign(e.target.style, focusGlow('#38bdf8'))} onBlur={e => e.target.style.cssText = ''} />
            )}

            {/* Text area */}
            {(mode === 'text' || isSales || isInfluencer || isExplainer) && (
              <textarea
                placeholder={
                  isSales ? "Paste a cold email, story, idea, or bullet points..." :
                  isInfluencer ? "Write your influencer script here..." :
                  isExplainer ? "Paste your explainer script here... Most small businesses lose 30% of leads to missed calls. Here is how AI fixes that..." :
                  "Paste story text here..."
                }
                value={text} onChange={e => setText(e.target.value)} disabled={isLoading} required={!isSales || !websiteUrl.trim()}
                rows={isInfluencer || isExplainer ? 8 : 6}
                style={{ ...inputStyle, resize: 'vertical', fontSize: '15px', lineHeight: 1.6 }}
                onFocus={e => Object.assign(e.target.style, focusGlow(activeTab.color))}
                onBlur={e => e.target.style.cssText = ''}
              />
            )}

            {/* Preview buttons */}
            {isSales && !showPreview && (
              <button type="button" onClick={handlePreview} disabled={isPreviewing || !text.trim()}
                style={{
                  alignSelf: 'flex-start',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  background: 'rgba(245,158,11,0.08)',
                  color: '#fbbf24',
                  cursor: isPreviewing ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                {isPreviewing ? <Loader2 size={16} className="spin" /> : <Wand2 size={16} />}
                {isPreviewing ? 'Writing pitch...' : 'Preview Pitch'}
              </button>
            )}
            {isSales && showPreview && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Review and edit the pitch:</label>
                <textarea value={previewText} onChange={e => setPreviewText(e.target.value)} disabled={isLoading} rows={8}
                  style={{ ...inputStyle, borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.04)' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={handlePreview} disabled={isPreviewing}
                    style={{ padding: '8px 16px', fontSize: '13px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', background: 'var(--bg-input)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    Regenerate
                  </button>
                  <button type="submit" disabled={isLoading || !previewText.trim()}
                    style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 600, borderRadius: 'var(--radius-md)', border: 'none', background: isLoading ? '#333' : '#f59e0b', color: '#0a0a0a', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                    {isLoading ? 'Generating...' : 'Generate Audio'}
                  </button>
                </div>
              </motion.div>
            )}

            {isInfluencer && !showInfluencerPreview && (
              <button type="button" onClick={handlePreviewInfluencer} disabled={isPreviewingInfluencer || !text.trim()}
                style={{
                  alignSelf: 'flex-start',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(236,72,153,0.3)',
                  background: 'rgba(236,72,153,0.08)',
                  color: '#f472b6',
                  cursor: isPreviewingInfluencer ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                {isPreviewingInfluencer ? <Loader2 size={16} className="spin" /> : <Wand2 size={16} />}
                {isPreviewingInfluencer ? 'Writing delivery...' : 'Preview Delivery'}
              </button>
            )}
            {isInfluencer && showInfluencerPreview && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Review and edit the tagged delivery:</label>
                <textarea value={influencerTaggedText} onChange={e => setInfluencerTaggedText(e.target.value)} disabled={isLoading} rows={8}
                  style={{ ...inputStyle, borderColor: 'rgba(236,72,153,0.3)', background: 'rgba(236,72,153,0.04)' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={handlePreviewInfluencer} disabled={isPreviewingInfluencer}
                    style={{ padding: '8px 16px', fontSize: '13px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', background: 'var(--bg-input)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    Regenerate
                  </button>
                  <button type="submit" disabled={isLoading || !influencerTaggedText.trim()}
                    style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 600, borderRadius: 'var(--radius-md)', border: 'none', background: isLoading ? '#333' : '#ec4899', color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                    {isLoading ? 'Generating...' : 'Generate Video'}
                  </button>
                </div>
              </motion.div>
            )}

            {isExplainer && !showExplainerPreview && (
              <button type="button" onClick={handlePreviewExplainer} disabled={isPreviewingExplainer || !text.trim()}
                style={{
                  alignSelf: 'flex-start',
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  background: 'rgba(99,102,241,0.08)',
                  color: '#818cf8',
                  cursor: isPreviewingExplainer ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                {isPreviewingExplainer ? <Loader2 size={16} className="spin" /> : <Wand2 size={16} />}
                {isPreviewingExplainer ? 'Breaking into scenes...' : 'Preview Scenes'}
              </button>
            )}
            {isExplainer && showExplainerPreview && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>Review scenes, then generate:</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto', padding: '4px' }}>
                  {explainerScenes.map((scene, idx) => (
                    <div key={idx} style={{
                      background: 'linear-gradient(180deg, rgba(99,102,241,0.06) 0%, rgba(99,102,241,0.02) 100%)',
                      border: '1px solid rgba(99,102,241,0.15)',
                      borderRadius: 'var(--radius-md)',
                      padding: '14px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scene {idx + 1}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-faint)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '100px', textTransform: 'uppercase' }}>{scene.type || 'feature'}</span>
                      </div>
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '6px', lineHeight: 1.5 }}>{scene.scene_text}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>{scene.visual_direction}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" onClick={handlePreviewExplainer} disabled={isPreviewingExplainer}
                    style={{ padding: '8px 16px', fontSize: '13px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', background: 'var(--bg-input)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    Regenerate
                  </button>
                  <button type="submit" disabled={isLoading || explainerScenes.length === 0}
                    style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 600, borderRadius: 'var(--radius-md)', border: 'none', background: isLoading ? '#333' : '#6366f1', color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
                    {isLoading ? 'Generating...' : 'Generate Explainer Video'}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Main submit button */}
        {!isSales && !isInfluencer && !isExplainer && (
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '14px 28px',
              fontSize: '15px',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: isLoading ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #0ea5e9, #38bdf8)',
              color: '#fff',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: isLoading ? 'none' : '0 4px 20px rgba(14,165,233,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontFamily: 'inherit',
            }}
          >
            {isLoading ? <Loader2 size={18} className="spin" /> : <Sparkles size={18} />}
            {isLoading ? 'Generating...' : mode === 'url' ? 'Scrape & Generate' : 'Generate Audio'}
          </motion.button>
        )}
        {isInfluencer && !showInfluencerPreview && (
          <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '14px 28px',
              fontSize: '15px',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: isLoading ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #ec4899, #f472b6)',
              color: '#fff',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: isLoading ? 'none' : '0 4px 20px rgba(236,72,153,0.25)',
              fontFamily: 'inherit',
            }}>
            {isLoading ? 'Generating...' : 'Generate Influencer Video'}
          </motion.button>
        )}
        {isExplainer && !showExplainerPreview && (
          <motion.button type="submit" disabled={isLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '14px 28px',
              fontSize: '15px',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: isLoading ? 'var(--bg-elevated)' : 'linear-gradient(135deg, #6366f1, #818cf8)',
              color: '#fff',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: isLoading ? 'none' : '0 4px 20px rgba(99,102,241,0.25)',
              fontFamily: 'inherit',
            }}>
            {isLoading ? 'Generating...' : 'Generate Explainer Video'}
          </motion.button>
        )}
      </form>
    </motion.div>
  );
}
