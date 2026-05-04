'use client';

import { useState } from 'react';

interface StoryInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export default function StoryInput({ onSubmit, isLoading }: StoryInputProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', marginBottom: '24px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="url"
          placeholder="Paste Reddit URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          required
          style={{
            flex: 1,
            padding: '14px 18px',
            fontSize: '16px',
            borderRadius: '10px',
            border: '1px solid #333',
            backgroundColor: '#141414',
            color: '#e0e0e0',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: '14px 28px',
            fontSize: '16px',
            fontWeight: 600,
            borderRadius: '10px',
            border: 'none',
            backgroundColor: isLoading ? '#333' : '#2563eb',
            color: '#fff',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {isLoading ? 'Generating...' : 'Generate Audio'}
        </button>
      </div>
    </form>
  );
}
