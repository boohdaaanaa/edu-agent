import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ResultPanel({ text, isStreaming, sources, onReset }) {
  if (!text && !isStreaming) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(text || '')
  }

  const handleDownload = () => {
    const blob = new Blob([text || ''], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `edu-agent-result-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={styles.container} className="animate-fadeIn">
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.headerIcon}>📊</span>
          <span style={styles.headerTitle}>Результат аналізу</span>
          {isStreaming && (
            <span style={styles.liveTag}>
              <span style={styles.liveDot}></span>
              Генерується...
            </span>
          )}
        </div>
        {!isStreaming && text && (
          <div style={styles.actions}>
            <button onClick={handleCopy} style={styles.actionBtn} title="Копіювати">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Копіювати
            </button>
            <button onClick={handleDownload} style={styles.actionBtn} title="Завантажити">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              .md
            </button>
            <button onClick={onReset} style={styles.actionBtnPrimary}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
              </svg>
              Новий пошук
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={styles.content}>
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {(text || '') + (isStreaming ? '▋' : '')}
          </ReactMarkdown>
        </div>
      </div>

      {/* Sources footer */}
      {sources.length > 0 && !isStreaming && (
        <div style={styles.sourcesSection}>
          <div style={styles.sourcesHeader}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            Використані джерела ({sources.length})
          </div>
          <div style={styles.sourceGrid}>
            {sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.sourceCard}
              >
                <span style={styles.sourceIndex}>{i + 1}</span>
                <div style={styles.sourceInfo}>
                  <span style={styles.sourceTitle}>{s.title || 'Джерело'}</span>
                  <span style={styles.sourceUrl}>{new URL(s.url).hostname}</span>
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: 'var(--text-muted)' }}>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%,100%{opacity:1;} 50%{opacity:0;} }
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }
        .markdown-content .remark-code-title { display:none; }
      `}</style>
    </div>
  )
}

const styles = {
  container: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-elevated)',
    flexWrap: 'wrap',
    gap: '10px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  headerIcon: { fontSize: '1.1rem' },
  headerTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: '-0.01em',
  },
  liveTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 10px',
    background: 'rgba(61,214,140,0.12)',
    border: '1px solid rgba(61,214,140,0.25)',
    borderRadius: '20px',
    fontSize: '0.72rem',
    color: 'var(--accent-success)',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
  },
  liveDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: 'var(--accent-success)',
    animation: 'pulse 1.2s ease infinite',
    display: 'inline-block',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 12px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    fontSize: '0.78rem',
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  actionBtnPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 14px',
    background: 'rgba(79,142,247,0.12)',
    border: '1px solid rgba(79,142,247,0.3)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--accent-primary)',
    fontSize: '0.78rem',
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  content: {
    padding: '24px 28px',
    maxHeight: '60vh',
    overflowY: 'auto',
  },
  sourcesSection: {
    borderTop: '1px solid var(--border)',
    padding: '16px 20px',
    background: 'var(--bg-elevated)',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sourcesHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.72rem',
    fontFamily: 'var(--font-display)',
    fontWeight: 600,
    color: 'var(--text-muted)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  sourceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '8px',
  },
  sourceCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    textDecoration: 'none',
    transition: 'border-color 0.15s',
  },
  sourceIndex: {
    width: '20px',
    height: '20px',
    background: 'rgba(79,142,247,0.12)',
    color: 'var(--accent-primary)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.68rem',
    fontWeight: 700,
    flexShrink: 0,
  },
  sourceInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0,
  },
  sourceTitle: {
    fontSize: '0.8rem',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  sourceUrl: {
    fontSize: '0.72rem',
    color: 'var(--text-muted)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
}