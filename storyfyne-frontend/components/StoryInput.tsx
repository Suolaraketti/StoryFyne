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
  onSubmitExplainer: (text: string, title: string, author: string, voiceId: string, aspectRatio: string, scenesJson: string, logoUrl: string, primaryColor: string, secondaryColor: string, bgColor: string, textColor: string, accentColor: string, imageUrls: string[], renderQuality: string) => void;
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
  const [explainerPrimaryColor, setExplainerPrimaryColor] = useState('#2a93f5');
  const [explainerSecondaryColor, setExplainerSecondaryColor] = useState('#6cbef9');
  const [explainerBgColor, setExplainerBgColor] = useState('#060912');
  const [explainerTextColor, setExplainerTextColor] = useState('#ffffff');
  const [explainerAccentColor, setExplainerAccentColor] = useState('#1f86f0');
  const [explainerImageUrls, setExplainerImageUrls] = useState<string[]>([]);
  const [explainerRenderQuality, setExplainerRenderQuality] = useState<'standard' | 'premium'>('standard');
  const [pendingImgScene, setPendingImgScene] = useState<number | null>(null);
  const [uploadingScene, setUploadingScene] = useState<number | null>(null);

  const [showCreateAvatar, setShowCreateAvatar] = useState(false);
  const [newAvatarName, setNewAvatarName] = useState('');
  const [newAvatarType, setNewAvatarType] = useState('photo');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [isCreatingAvatar, setIsCreatingAvatar] = useState(false);
  const [createAvatarStatus, setCreateAvatarStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  const sceneImgRef = useRef<HTMLInputElement>(null);
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
        explainerRenderQuality,
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

  const TEMPLATE_OPTIONS: { value: string; label: string }[] = [
    { value: 'heroStatement', label: 'Hero statement' },
    { value: 'aiCall', label: 'AI call (voice)' },
    { value: 'callTranscript', label: 'Call transcript' },
    { value: 'productShowcase', label: 'Product showcase' },
    { value: 'heroImage', label: 'Hero image' },
    { value: 'screenshotCarousel', label: 'Screenshot carousel' },
    { value: 'featureSplit', label: 'Feature split' },
    { value: 'browserDashboard', label: 'Browser dashboard' },
    { value: 'phoneDemo', label: 'Phone demo' },
    { value: 'statsGrid', label: 'Stats grid' },
    { value: 'revenueCounter', label: 'Revenue counter' },
    { value: 'workflowSteps', label: 'Workflow steps' },
    { value: 'featureHighlight', label: 'Feature highlight' },
    { value: 'beforeAfter', label: 'Before / after' },
    { value: 'testimonialQuote', label: 'Testimonial' },
    { value: 'pricingTiers', label: 'Pricing tiers' },
    { value: 'typewriterCommand', label: 'Command bar' },
    { value: 'calendarBooking', label: 'Calendar booking' },
    { value: 'logoWall', label: 'Logo wall' },
    { value: 'logoReveal', label: 'Logo reveal' },
    { value: 'brandLockup', label: 'Brand lockup (CTA)' },
  ];
  const BG_OPTIONS: { value: string; label: string }[] = [
    { value: '', label: 'Auto' },
    { value: 'auroraMesh', label: 'Aurora mesh' },
    { value: 'gradientWash', label: 'Gradient wash' },
    { value: 'gridStage', label: 'Grid stage' },
    { value: 'dotGrid', label: 'Dot grid' },
    { value: 'centerSpotlight', label: 'Spotlight' },
    { value: 'subtleGlow', label: 'Subtle glow' },
    { value: 'cleanDark', label: 'Clean dark' },
  ];

  const getVisualPlan = (template: string, type: string) => {
    const plans: Record<string, string> = {
      heroStatement: 'Massive bold centered text. No decoration. One sentence dominates the frame. Clean entrance/exit.',
      phoneDemo: 'Phone frame in center showing a notification, chat bubble, or calendar block. Contextual UI mockup.',
      browserDashboard: 'Browser window frame with dashboard cards, stat bars, or search UI. Simulated SaaS interface.',
      statsGrid: '2–3 large metric numbers with labels. Numbers animate upward. Clean grid layout.',
      testimonialQuote: 'Quote text centered with subtle attribution. Minimal card, no avatar.',
      beforeAfter: 'Split layout: old state on left, new state on right. Arrow between.',
      workflowSteps: '3-step flow: A → B → C with connecting arrows and step cards.',
      pricingTiers: 'Pricing cards side by side with feature lists. Highlighted tier.',
      featureHighlight: 'Single feature with icon + description card. Spotlight layout.',
      typewriterCommand: 'Terminal-style text typing out a command or query. Cursor blink.',
      socialProofBanner: 'Scrolling company logos or review stars banner. Trust signal.',
      calendarBooking: 'Calendar grid with a selected date block. Booking CTA.',
      revenueCounter: 'Big animated revenue/counter number. Dollar sign. Rising value.',
      brandLockup: 'Logo + brand name + URL centered. Final scene. Hold longer.',
      productShowcase: 'Your screenshot in a device frame beside the copy, with a subtle 3D tilt. Attach an image below.',
      heroImage: 'One large product screenshot as the centerpiece with the headline beneath. Attach an image below.',
      screenshotCarousel: 'Several screenshots fanned in 3D depth. Attach 2–3 images below.',
      featureSplit: 'Copy + a tight screenshot detail, side by side. Attach an image below.',
      logoReveal: 'Your brand logo, large and centered. Uses the uploaded logo.',
      logoWall: '“Trusted by” grid of customer logos. Attach logos, or they fall back to names.',
      aiCall: 'Live AI-call card: pulsing avatar, reactive voice waveform, streaming transcript, outcome chips. No screenshot needed.',
      callTranscript: 'Clean transcript card — caller/AI turns stream in with a live caret. Great call proof.',
    };
    return plans[template] || 'Clean text scene with minimal motion. One thought per frame.';
  };

  const updateSceneText = (idx: number, newText: string) => {
    setExplainerScenes(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], scene_text: newText };
      return next;
    });
  };

  const updateSceneField = (idx: number, key: string, value: any) => {
    setExplainerScenes(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: value };
      return next;
    });
  };

  // Image-friendly templates default to a sensible device frame.
  const defaultDeviceFor = (tpl: string): string => {
    if (tpl === 'phoneDemo') return 'phone';
    if (tpl === 'heroImage' || tpl === 'screenshotCarousel') return 'window';
    if (tpl === 'featureSplit') return 'bare';
    return 'browser';
  };

  // Read an image's natural dimensions (works cross-origin for sizing).
  const measureImage = (url: string): Promise<{ w: number; h: number }> =>
    new Promise(resolve => {
      const img = new window.Image();
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 0, h: 0 });
      img.src = url;
    });

  // Choose the best device frame + fit from an image's aspect ratio.
  const frameForAspect = (w: number, h: number): { device: string; fit: string } => {
    if (!w || !h) return { device: 'browser', fit: 'cover' };
    const a = w / h;
    if (a < 0.72) return { device: 'phone', fit: 'cover' };       // tall → phone
    if (a > 1.45) return { device: 'browser', fit: 'cover' };     // wide → browser
    return { device: 'bare', fit: 'contain' };                    // square-ish → no crop
  };

  // Measure an image and auto-assign device/fit for a scene (respecting an
  // explicit phoneDemo template, which always wants a phone).
  const autoFrameScene = async (idx: number, url: string) => {
    if (!url) return;
    const { w, h } = await measureImage(url);
    const auto = frameForAspect(w, h);
    setExplainerScenes(prev => {
      const next = [...prev];
      const tpl = next[idx]?.template || '';
      next[idx] = {
        ...next[idx],
        device: tpl === 'phoneDemo' ? 'phone' : auto.device,
        imageFit: auto.fit,
      };
      return next;
    });
  };

  const handleSceneImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const idx = pendingImgScene;
    e.target.value = '';
    if (!file || idx === null) return;
    setUploadingScene(idx);
    try {
      const result = await onUploadAsset(file);
      setExplainerScenes(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], imageUrl: result.url };
        return next;
      });
      // Auto-pick the device frame + fit from the image's real aspect ratio.
      await autoFrameScene(idx, result.url);
    } catch (err: any) {
      alert(err.message || 'Image upload failed');
    } finally {
      setUploadingScene(null);
      setPendingImgScene(null);
    }
  };

  const moveScene = (idx: number, dir: number) => {
    setExplainerScenes(prev => {
      const next = [...prev];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= next.length) return prev;
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  const deleteScene = (idx: number) => {
    setExplainerScenes(prev => {
      if (prev.length <= 1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
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
                  {/* One-click brand presets */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {[
                      { name: 'Voice Blue', p: '#2a93f5', s: '#6cbef9', a: '#1f86f0', bg: '#060912' },
                      { name: 'Indigo', p: '#6366f1', s: '#a5b4fc', a: '#818cf8', bg: '#0a0a14' },
                      { name: 'Emerald', p: '#10b981', s: '#6ee7b7', a: '#059669', bg: '#04100c' },
                      { name: 'Violet', p: '#8b5cf6', s: '#c4b5fd', a: '#7c3aed', bg: '#0c0814' },
                      { name: 'Sunset', p: '#f97316', s: '#fdba74', a: '#ea580c', bg: '#120a06' },
                      { name: 'Mono', p: '#e5e7eb', s: '#9ca3af', a: '#ffffff', bg: '#0a0a0a' },
                    ].map(preset => (
                      <button key={preset.name} type="button" disabled={isLoading}
                        onClick={() => { setExplainerPrimaryColor(preset.p); setExplainerSecondaryColor(preset.s); setExplainerAccentColor(preset.a); setExplainerBgColor(preset.bg); setExplainerTextColor('#ffffff'); }}
                        title={preset.name}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', borderRadius: '100px', border: '1px solid var(--border-medium)', background: 'var(--bg-input)', color: 'var(--text-secondary)', cursor: isLoading ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: 600 }}>
                        <span style={{ display: 'flex' }}>
                          <span style={{ width: 12, height: 12, borderRadius: '50%', background: preset.p, border: '1.5px solid var(--bg-input)' }} />
                          <span style={{ width: 12, height: 12, borderRadius: '50%', background: preset.s, marginLeft: -5, border: '1.5px solid var(--bg-input)' }} />
                        </span>
                        {preset.name}
                      </button>
                    ))}
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
                          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--border-medium)', padding: 1, background: 'var(--bg-input)', cursor: 'pointer', flexShrink: 0 }} />
                        <input
                          type="text"
                          value={c.value}
                          onChange={e => c.setter(e.target.value)}
                          disabled={isLoading}
                          maxLength={7}
                          style={{
                            width: '70px',
                            padding: '6px 8px',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-medium)',
                            background: 'var(--bg-input)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                            textTransform: 'uppercase',
                          }}
                          onFocus={e => Object.assign(e.target.style, { borderColor: 'rgba(99,102,241,0.4)', boxShadow: '0 0 0 3px rgba(99,102,241,0.1)' })}
                          onBlur={e => { e.target.style.borderColor = 'var(--border-medium)'; e.target.style.boxShadow = 'none'; }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.label}</span>
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input type="file" ref={sceneImgRef} accept="image/*" style={{ display: 'none' }} onChange={handleSceneImageFile} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.02em' }}>
                    Scene Script & Visual Plan
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                    {explainerScenes.length} scenes · editable
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '480px', overflowY: 'auto', padding: '4px' }}>
                  {explainerScenes.map((scene, idx) => {
                    const tpl = scene.template || 'heroStatement';
                    const visualPlan = getVisualPlan(tpl, scene.type || 'statement');
                    return (
                      <motion.div
                        key={idx}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        style={{
                          background: 'linear-gradient(180deg, rgba(99,102,241,0.07) 0%, rgba(15,23,42,0.4) 100%)',
                          border: '1px solid rgba(99,102,241,0.18)',
                          borderRadius: 'var(--radius-lg)',
                          padding: '16px',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        {/* Scene header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              fontSize: '10px', fontWeight: 800, color: '#c7d2fe',
                              background: 'rgba(99,102,241,0.25)',
                              padding: '3px 10px', borderRadius: '100px',
                              textTransform: 'uppercase', letterSpacing: '0.06em',
                            }}>Scene {idx + 1}</span>
                            <span style={{
                              fontSize: '10px', color: 'var(--text-faint)',
                              background: 'rgba(255,255,255,0.04)', padding: '3px 8px',
                              borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.04em',
                            }}>{tpl}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button type="button" onClick={() => moveScene(idx, -1)} disabled={idx === 0 || isLoading}
                              style={{ padding: '4px 6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }}>↑</button>
                            <button type="button" onClick={() => moveScene(idx, 1)} disabled={idx === explainerScenes.length - 1 || isLoading}
                              style={{ padding: '4px 6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px' }}>↓</button>
                            <button type="button" onClick={() => deleteScene(idx)} disabled={isLoading || explainerScenes.length <= 1}
                              style={{ padding: '4px 6px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', cursor: 'pointer', fontSize: '11px' }}>×</button>
                          </div>
                        </div>

                        {/* Template + background controls */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 150 }}>
                            <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Template</span>
                            <select value={tpl} onChange={e => updateSceneField(idx, 'template', e.target.value)} disabled={isLoading}
                              style={{ padding: '7px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                              {TEMPLATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 150 }}>
                            <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Background</span>
                            <select value={scene.background || ''} onChange={e => updateSceneField(idx, 'background', e.target.value)} disabled={isLoading}
                              style={{ padding: '7px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                              {BG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          </div>
                        </div>

                        {/* Voice script — editable */}
                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Voice Script</div>
                          <textarea
                            value={scene.scene_text || ''}
                            onChange={e => updateSceneText(idx, e.target.value)}
                            disabled={isLoading}
                            rows={2}
                            style={{
                              width: '100%', padding: '10px 12px', fontSize: '14px', lineHeight: 1.5,
                              borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.15)',
                              background: 'rgba(0,0,0,0.2)', color: 'var(--text-primary)',
                              outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                            }}
                            onFocus={e => { e.target.style.borderColor = 'rgba(99,102,241,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                            onBlur={e => { e.target.style.borderColor = 'rgba(99,102,241,0.15)'; e.target.style.boxShadow = 'none'; }}
                          />
                        </div>

                        {/* Visual plan */}
                        <div style={{
                          background: 'rgba(99,102,241,0.04)',
                          borderRadius: 'var(--radius-md)',
                          padding: '10px 12px',
                          border: '1px solid rgba(99,102,241,0.08)',
                        }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Visual Plan</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{visualPlan}</div>
                        </div>

                        {/* Per-scene product image / screenshot */}
                        <div style={{ marginTop: '10px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Image size={11} /> Product image {scene.imageUrl ? '' : '(optional)'}
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input type="url" placeholder="Paste image URL or upload a screenshot" value={scene.imageUrl || ''} onChange={e => updateSceneField(idx, 'imageUrl', e.target.value)} onBlur={e => { if (e.target.value.trim()) autoFrameScene(idx, e.target.value.trim()); }} disabled={isLoading}
                              style={{ ...inputStyle, flex: 1, padding: '8px 10px', fontSize: '12px' }} />
                            <button type="button" onClick={() => { setPendingImgScene(idx); sceneImgRef.current?.click(); }} disabled={isLoading || uploadingScene === idx}
                              style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', background: 'var(--bg-input)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', whiteSpace: 'nowrap' }}>
                              {uploadingScene === idx ? <Loader2 size={12} className="spin" /> : <Upload size={12} />} Upload
                            </button>
                          </div>
                          {scene.imageUrl && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                              <img src={scene.imageUrl} alt="" style={{ width: 64, height: 40, borderRadius: 6, objectFit: 'cover', border: '1px solid var(--border-subtle)' }} />
                              <select value={scene.device || defaultDeviceFor(tpl)} onChange={e => updateSceneField(idx, 'device', e.target.value)} disabled={isLoading}
                                style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                                <option value="browser">Browser</option>
                                <option value="phone">Phone</option>
                                <option value="tablet">Tablet</option>
                                <option value="window">Window</option>
                                <option value="bare">Bare</option>
                              </select>
                              <select value={scene.imageFit || 'cover'} onChange={e => updateSceneField(idx, 'imageFit', e.target.value)} disabled={isLoading}
                                style={{ padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--border-medium)', background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                                <option value="cover">Fill frame</option>
                                <option value="contain">Fit inside</option>
                              </select>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Action bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button type="button" onClick={handlePreviewExplainer} disabled={isPreviewingExplainer}
                    style={{ padding: '8px 16px', fontSize: '13px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', background: 'var(--bg-input)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    Regenerate
                  </button>

                  {/* Render Quality Toggle */}
                  <div style={{ display: 'flex', gap: 0, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', overflow: 'hidden' }}>
                    <button type="button" onClick={() => setExplainerRenderQuality('standard')} disabled={isLoading}
                      style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 600, border: 'none',
                        background: explainerRenderQuality === 'standard' ? '#6366f1' : 'var(--bg-elevated)',
                        color: explainerRenderQuality === 'standard' ? '#fff' : 'var(--text-secondary)',
                        cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>Standard</button>
                    <button type="button" onClick={() => setExplainerRenderQuality('premium')} disabled={isLoading}
                      style={{ padding: '8px 14px', fontSize: '12px', fontWeight: 600, border: 'none',
                        background: explainerRenderQuality === 'premium' ? '#6366f1' : 'var(--bg-elevated)',
                        color: explainerRenderQuality === 'premium' ? '#fff' : 'var(--text-secondary)',
                        cursor: isLoading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>Premium (GPU)</button>
                  </div>

                  <div style={{ flex: 1 }} />

                  <button type="submit" disabled={isLoading || explainerScenes.length === 0}
                    style={{ padding: '10px 24px', fontSize: '14px', fontWeight: 600, borderRadius: 'var(--radius-md)', border: 'none',
                      background: isLoading ? '#333' : 'linear-gradient(135deg, #6366f1, #818cf8)',
                      color: '#fff', cursor: isLoading ? 'not-allowed' : 'pointer', boxShadow: isLoading ? 'none' : '0 4px 20px rgba(99,102,241,0.25)' }}>
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
