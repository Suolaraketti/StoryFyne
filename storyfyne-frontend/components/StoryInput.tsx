'use client';

import { useState } from 'react';

interface StoryInputProps {
  onSubmitUrl: (url: string) => void;
  onSubmitText: (text: string, title: string, author: string, subreddit: string) => void;
  onSubmitSales: (text: string, title: string, author: string, subreddit: string) => void;
  isLoading: boolean;
}

export default function StoryInput({ onSubmitUrl, onSubmitText, onSubmitSales, isLoading }: StoryInputProps) {
  const [mode, setMode] = useState<'text' | 'url' | 'sales'>('text');
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
    } else if (mode === 'sales' && text.trim()) {
      onSubmitSales(text.trim(), title.trim() || 'Dialfyne Pitch', author.trim() || 'Dennis Kaczmarowski', subreddit.trim() || 'sales');
    }
  };

  const isSales = mode === 'sales';

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
        <button
          type="button"
          onClick={() => setMode('sales')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: '1px solid #333',
            backgroundColor: mode === 'sales' ? '#F5A623' : '#141414',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Sales Mode
        </button>
      </div>

      {isSales && (
        <div style={{
          backgroundColor: '#1a1205',
          border: '1px solid #F5A623',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '16px',
          fontSize: '14px',
          color: '#F5A623',
        }}>
          Sales Mode: Paste a story or idea and Claude will convert it into a Dialfyne sales pitch.
        </div>
      )}

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
              placeholder={isSales ? "Pitch title (optional)" : "Title (optional)"}
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
              placeholder={isSales ? "Your name (optional)" : "Author (optional)"}
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
            {!isSales && (
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
            )}
          </div>
          <textarea
            placeholder={isSales
              ? "Paste a story, idea, or bullet points and I'll turn it into a Dialfyne sales pitch..."
              : "Paste story text here..."
            }
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
          backgroundColor: isLoading ? '#333' : (isSales ? '#F5A623' : '#2563eb'),
          color: '#fff',
          cursor: isLoading ? 'not-allowed' : 'pointer',
        }}
      >
        {isLoading ? 'Generating...' : (isSales ? 'Generate Sales Pitch' : 'Generate Audio')}
      </button>
    </form>
  );
}
