import { useEffect } from 'react';

export default function QuickAddBar({ onOpenModal }) {
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onOpenModal();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onOpenModal]);

  return (
    <button className="add-task-trigger" onClick={onOpenModal} type="button">
      <div className="add-task-trigger-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </div>
      <div className="add-task-trigger-text">
        <div className="add-task-trigger-label">添加新任务</div>
        <div className="add-task-trigger-hint">记录待办事项，让工作更有条理</div>
      </div>
      <div className="add-task-trigger-shortcut">
        <kbd>Ctrl</kbd>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>+</span>
        <kbd>K</kbd>
      </div>
    </button>
  );
}
