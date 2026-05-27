'use client';

import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, Circle } from 'lucide-react';

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
      marginTop: '24px',
      marginBottom: '32px',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)',
      padding: '24px',
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
            {isComplete ? 'All done!' : 'Processing...'}
          </div>
          {detail && (
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{detail}</div>
          )}
        </div>
        {estimatedCost && (
          <div style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--text-muted)',
            padding: '4px 12px',
            borderRadius: '100px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border-subtle)',
          }}>
            Est. cost: ${estimatedCost}
          </div>
        )}
      </div>

      {/* Step connector line */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <div style={{
          position: 'absolute',
          top: '14px',
          left: '0',
          right: '0',
          height: '2px',
          background: 'var(--border-subtle)',
          zIndex: 0,
        }} />
        <div style={{
          position: 'absolute',
          top: '14px',
          left: '0',
          height: '2px',
          background: 'linear-gradient(90deg, #22c55e, #4ade80)',
          zIndex: 0,
          transition: 'width 0.5s ease',
          width: isComplete ? '100%' : `${Math.max(0, (currentIndex / (STEPS.length - 1)) * 100)}%`,
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          {STEPS.map((s, index) => {
            const done = index < currentIndex || isComplete;
            const active = index === currentIndex && !isComplete;
            return (
              <div key={s.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                <motion.div
                  animate={active ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: done ? '#22c55e' : active ? '#0ea5e9' : 'var(--bg-elevated)',
                    border: done ? '2px solid #22c55e' : active ? '2px solid #0ea5e9' : '2px solid var(--border-medium)',
                    color: done || active ? '#fff' : 'var(--text-muted)',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  {done ? <CheckCircle2 size={16} /> : active ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Circle size={16} />}
                </motion.div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: done ? '#4ade80' : active ? '#38bdf8' : 'var(--text-muted)',
                }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
