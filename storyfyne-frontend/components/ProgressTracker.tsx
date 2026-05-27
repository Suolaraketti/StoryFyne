'use client';

const STEPS_STANDARD = [
  { key: 'scraping', label: 'Scraping' },
  { key: 'tagging', label: 'Tagging' },
  { key: 'generating', label: 'Generating' },
  { key: 'uploading', label: 'Uploading' },
  { key: 'complete', label: 'Complete' },
];

const STEPS_INFLUENCER = [
  { key: 'generating', label: 'Audio' },
  { key: 'rendering', label: 'Avatar' },
  { key: 'uploading', label: 'Uploading' },
  { key: 'complete', label: 'Complete' },
];

const STEPS_EXPLAINER = [
  { key: 'tagging', label: 'Scripting' },
  { key: 'generating', label: 'Audio' },
  { key: 'rendering', label: 'Video' },
  { key: 'uploading', label: 'Uploading' },
  { key: 'complete', label: 'Complete' },
];

interface ProgressTrackerProps {
  step: string;
  detail?: string;
  charCount?: number;
  mode?: 'standard' | 'influencer' | 'explainer';
}

export default function ProgressTracker({ step, detail, charCount, mode = 'standard' }: ProgressTrackerProps) {
  const STEPS = mode === 'influencer' ? STEPS_INFLUENCER : mode === 'explainer' ? STEPS_EXPLAINER : STEPS_STANDARD;
  const currentIndex = STEPS.findIndex((s) => s.key === step);
  const isComplete = step === 'complete';
  const estimatedCost = charCount ? ((charCount * 4.20) / 1_000_000).toFixed(4) : null;

  if (!step) return null;

  return (
    <div style={{
      backgroundColor: '#141414',
      border: '1px solid #333',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '32px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#a0a0a0' }}>Progress</span>
        {estimatedCost && (
          <span style={{ fontSize: '13px', color: '#888' }}>
            Est. cost: ${estimatedCost}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {STEPS.map((s, index) => {
          let bg = '#222';
          let color = '#666';
          if (index < currentIndex || isComplete) {
            bg = '#16a34a';
            color = '#fff';
          } else if (index === currentIndex) {
            bg = '#2563eb';
            color = '#fff';
          }
          return (
            <div key={s.key} style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: '8px',
              backgroundColor: bg,
              color,
              fontSize: '12px',
              fontWeight: 600,
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {s.label}
            </div>
          );
        })}
      </div>

      {detail && (
        <p style={{ margin: 0, fontSize: '14px', color: '#aaa' }}>{detail}</p>
      )}
    </div>
  );
}
