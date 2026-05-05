'use client';

import { useState } from 'react';

interface StoryInputProps {
  onSubmitUrl: (url: string) => void;
  onSubmitText: (text: string, title: string, author: string, subreddit: string) => void;
  isLoading: boolean;
}

export default function StoryInput({ onSubmitUrl, onSubmitText, isLoading }: StoryInputProps) {
  const [mode, setMode] = useState<'url' | 'text'>('text');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subreddit, setSubreddit] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'url' && url.trim()) {
      onSubmitUrl(url.trim());
    } else if (mode === 'text' && text.trim()) {
      onSubmitText(text.trim(), title.trim() || 'Untitled Story', author.trim() || 'Unknown', subreddit.trim() || 'pasted');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', marginBottom: '24px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          onClick={() => setMode('text')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #333',
            backgroundColor: mode === 'text' ? '#2563eb' : '#141414',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Paste Text
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #333',
            backgroundColor: mode === 'url' ? '#2563eb' : '#141414',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Reddit URL
        </button>
      </div>

      {mode === 'url' ? (
        <input
          type="url"
          placeholder="Paste Reddit URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          required
          style={{
            width: '100%',
            padding: '14px 18px',
            fontSize: '16px',
            borderRadius: '10px',
            border: '1px solid #333',
            backgroundColor: '#141414',
            color: '#e0e0e0',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '12px 14px',
                fontSize: '15px',
                borderRadius: '10px',
                border: '1px solid #333',
                backgroundColor: '#141414',
                color: '#e0e0e0',
                outline: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Author (optional)"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '12px 14px',
                fontSize: '15px',
                borderRadius: '10px',
                border: '1px solid #333',
                backgroundColor: '#141414',
                color: '#e0e0e0',
                outline: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Subreddit (optional)"
              value={subreddit}
              onChange={(e) => setSubreddit(e.target.value)}
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '12px 14px',
                fontSize: '15px',
                borderRadius: '10px',
                border: '1px solid #333',
                backgroundColor: '#141414',
                color: '#e0e0e0',
                outline: 'none',
              }}
            />
          </div>
          <textarea
            placeholder="Paste story text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
            required
            rows={8}
            style={{
              width: '100%',
              padding: '14px 18px',
              fontSize: '16px',
              borderRadius: '10px',
              border: '1px solid #333',
              backgroundColor: '#141414',
              color: '#e0e0e0',
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        style={{
          marginTop: '16px',
          width: '100%',
          padding: '14px 28px',
          fontSize: '16px',
          fontWeight: 600,
          borderRadius: '10px',
          border: 'none',
          backgroundColor: isLoading ? '#333' : '#2563eb',
          color: '#fff',
          cursor: isLoading ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading ? 'Generating...' : 'Generate Audio'}
      </button>
    </form>
  );
}
