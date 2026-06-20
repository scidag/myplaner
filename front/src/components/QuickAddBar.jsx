import { useState, useEffect } from 'react';

export default function QuickAddBar({ onAdd, loading }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setDueDate(today);
  }, [today]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('quickAddInput')?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title: title.trim(), dueDate: dueDate || null });
    setTitle('');
    setDueDate(today);
  };

  return (
    <form className="quick-add-bar" onSubmit={handleSubmit}>
      <input
        type="text"
        className="quick-add-input"
        id="quickAddInput"
        placeholder="✍️  准备做什么？输入任务标题..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={100}
        required
      />
      <input
        type="date"
        className="quick-add-date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        min={today}
      />
      <button type="submit" className="btn-add" disabled={loading || !title.trim()}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        添加任务
      </button>
    </form>
  );
}
