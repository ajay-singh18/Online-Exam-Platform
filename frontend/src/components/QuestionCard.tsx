import { useState } from 'react';
import DOMPurify from 'dompurify';

interface QuestionCardProps {
  readonly html: string;
  readonly imageUrl?: string;
}

/**
 * Renders HTML question text safely using DOMPurify.
 * Supports rich text from Quill.js editor and optional images.
 */
export default function QuestionCard({ html, imageUrl }: QuestionCardProps) {
  const [showImage, setShowImage] = useState(false);

  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre', 'sub', 'sup', 'span', 'h1', 'h2', 'h3', 'blockquote'],
    ALLOWED_ATTR: ['class', 'style'],
  });

  return (
    <div>
      <div
        className="question-html"
        dangerouslySetInnerHTML={{ __html: clean }}
        style={{
          fontSize: '1.0625rem', fontWeight: 500, color: 'var(--on-surface)',
          lineHeight: 1.7, wordBreak: 'break-word',
        }}
      />
      {imageUrl && (
        <div style={{ marginTop: '1rem' }}>
          <button
            onClick={() => setShowImage(!showImage)}
            className="btn-ghost"
            style={{ 
              padding: '0.25rem 0.625rem', display: 'inline-flex', alignItems: 'center', gap: '0.375rem', 
              background: 'var(--surface-container-highest)', borderRadius: 'var(--radius-full)', 
              fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)', border: 'none', cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.05em'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
              {showImage ? 'visibility_off' : 'image'}
            </span>
            {showImage ? 'Hide Image' : 'View Image'}
          </button>
          
          {showImage && (
            <div style={{ marginTop: '1rem', animation: 'fadeIn 0.2s ease-out' }}>
              <img
                src={imageUrl}
                alt="Question illustration"
                style={{
                  maxWidth: '100%', maxHeight: '400px', borderRadius: 'var(--radius-xl)',
                  objectFit: 'contain', border: '1px solid var(--surface-container-highest)',
                  boxShadow: '0 8px 24px rgba(30,58,138,0.08)'
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
