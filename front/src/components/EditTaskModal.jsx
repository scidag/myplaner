import { useState, useEffect } from 'react';

export default function EditTaskModal({ task, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'TODO');
      setDueDate(task.dueDate || '');
    }
  }, [task]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!task) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), description: description.trim() || null, status, dueDate: dueDate || null });
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h3>✏️ 编辑任务</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>任务标题</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} required />
          </div>
          <div className="form-group">
            <label>描述（选填）</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="添加描述..." />
          </div>
          <div className="form-group">
            <label>状态</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="TODO">待办</option>
              <option value="IN_PROGRESS">进行中</option>
              <option value="DONE">已完成</option>
            </select>
          </div>
          <div className="form-group">
            <label>截止日期</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>取消</button>
            <button type="submit" className="btn-save">保存更改</button>
          </div>
        </form>
      </div>
    </div>
  );
}
