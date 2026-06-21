import { useState } from 'react';

function getLocalDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function TaskForm({ onAdd, loading }) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (title.length > 100) return;
    if (dueDate && dueDate < getLocalDate(new Date())) return;
    onAdd({ title: title.trim(), dueDate: dueDate || null });
    setTitle('');
    setDueDate('');
  };

  const today = getLocalDate(new Date());

  return (
    <form className="add-task-section" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="准备做什么？"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={100}
        required
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        min={today}
      />
      <button type="submit" disabled={loading || !title.trim()}>
        添加
      </button>
    </form>
  );
}
