import { useState } from 'react';

export default function TaskCandidateCard({
  candidate,
  onChange,
  onToggle,
  onDelete,
}) {
  const [expanded, setExpanded] = useState(false);
  const { title, description, dueDate, source, selected } = candidate;

  const handleField = (field, value) => {
    onChange?.({ ...candidate, [field]: value });
  };

  const hasSource = source && String(source).trim().length > 0;

  return (
    <div className={`candidate-card${selected ? '' : ' unchecked'}`}>
      <div
        className={`candidate-check${selected ? ' checked' : ''}`}
        onClick={() => onToggle?.(candidate.id)}
        role="checkbox"
        aria-checked={!!selected}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onToggle?.(candidate.id);
          }
        }}
      >
        {selected && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>

      <div className="candidate-body">
        <div className="candidate-row">
          <div className="field-group">
            <label className="field-label">任务标题</label>
            <input
              className="field-input title"
              value={title || ''}
              onChange={(e) => handleField('title', e.target.value)}
              placeholder="请输入任务标题"
              maxLength={100}
            />
          </div>
          <div className="field-group">
            <label className="field-label">截止日期</label>
            <input
              className="field-input"
              type="date"
              value={dueDate || ''}
              onChange={(e) => handleField('dueDate', e.target.value)}
            />
          </div>
        </div>
        <div className="field-group" style={{ marginBottom: 0 }}>
          <label className="field-label">
            描述
            <span className="field-char-count">{(description || '').length}/100000</span>
          </label>
          <textarea
            className="field-textarea"
            rows={2}
            value={description || ''}
            onChange={(e) => handleField('description', e.target.value)}
            placeholder="补充任务描述（可选）"
            maxLength={100000}
          />
        </div>
        {hasSource && (
          <div
            className="source-snippet"
            onClick={() => setExpanded((v) => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setExpanded((v) => !v);
              }
            }}
          >
            <span className="source-snippet-icon">{expanded ? '📂' : '💬'}</span>
            <span className="source-snippet-text">
              <span className="source-snippet-label">来源：</span>
              {expanded ? source : truncate(source, 80)}
            </span>
          </div>
        )}
      </div>

      <button
        type="button"
        className="candidate-delete"
        title="删除"
        onClick={() => onDelete?.(candidate.id)}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        </svg>
      </button>
    </div>
  );
}

function truncate(text, max) {
  const str = String(text);
  return str.length > max ? `${str.slice(0, max)}…` : str;
}
