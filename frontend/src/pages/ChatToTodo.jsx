import { useState, useEffect, useCallback } from 'react';
import SessionSelector from '../components/SessionSelector';
import TaskCandidateCard from '../components/TaskCandidateCard';
import CandidateToolbar from '../components/CandidateToolbar';
import { useToast } from '../components/Toast';
import { listSessions } from '../api/chat';
import { extractTasks, batchCreateTasks } from '../api/chatToTodo';

export default function ChatToTodo() {
  const toast = useToast();
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [creating, setCreating] = useState(false);

  // 加载会话列表
  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await listSessions();
      // 后端 SessionVO 返回 { session: {...}, lastMessage }，扁平化为 { id, title, preview }
      const list = (Array.isArray(res) ? res : []).map((item) => ({
        id: item.session?.id,
        title: item.session?.title || '新对话',
        preview: item.lastMessage || '',
        updateTime: item.session?.updateTime,
      }));
      setSessions(list);
      return list;
    } catch (err) {
      toast(err.message, 'error');
      return [];
    } finally {
      setLoadingSessions(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleExtract = async () => {
    if (!selectedSessionId || extracting) return;
    setCandidates([]);
    setExtracting(true);
    try {
      const res = await extractTasks(selectedSessionId);
      const list = Array.isArray(res) ? res : [];
      // 默认勾选，并补充缺失字段
      const normalized = list.map((c, idx) => ({
        id: c.id ?? `cand-${idx}`,
        title: c.title || '',
        description: c.description || '',
        dueDate: c.dueDate || c.due_date || '',
        source: c.sourceSnippet || c.source || c.snippet || '',
        selected: c.selected !== false,
      }));
      setCandidates(normalized);
      if (normalized.length === 0) {
        toast('未在对话中识别到候选任务', 'info');
      } else {
        toast(`已抽取 ${normalized.length} 个候选任务`, 'success');
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setExtracting(false);
    }
  };

  const handleCandidateChange = (updated) => {
    setCandidates((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleToggle = (id) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c)),
    );
  };

  const handleDelete = (id) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  const handleSelectAll = (value) => {
    setCandidates((prev) => prev.map((c) => ({ ...c, selected: !!value })));
  };

  const handleInvert = () => {
    setCandidates((prev) => prev.map((c) => ({ ...c, selected: !c.selected })));
  };

  const handleBatchCreate = async () => {
    const selected = candidates.filter((c) => c.selected);
    if (selected.length === 0 || creating) return;
    setCreating(true);
    try {
      const payload = selected.map((c) => ({
        title: c.title,
        description: c.description,
        dueDate: c.dueDate || null,
        source: c.source || undefined,
      }));
      const result = await batchCreateTasks(payload);
      // 后端返回 { created, failed }，需处理部分失败场景
      const created = result?.created ?? selected.length;
      const failed = result?.failed ?? 0;
      if (failed > 0) {
        toast(`成功 ${created} 项，失败 ${failed} 项，可重试失败项`, 'info');
        // 保留失败项供重试：后端未返回失败明细时，保留全部选中项
        // 若后端返回失败明细，可在此精确移除已成功项
      } else {
        toast(`已创建 ${created} 个任务`, 'success');
        setCandidates([]);
      }
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const selectedCount = candidates.filter((c) => c.selected).length;
  const showEmptySessions = !loadingSessions && sessions.length === 0;

  return (
    <div className="chat-to-todo-page">
      <div className="page-header">
        <div className="page-title-group">
          <h1 className="page-title">✅ 聊天记录转待办</h1>
          <span className="page-breadcrumb">/ AI 辅助</span>
        </div>
      </div>

      {showEmptySessions ? (
        <div className="empty-state ctt-empty">
          <div className="empty-illustration">💬</div>
          <div className="empty-title">暂无对话记录</div>
          <div className="empty-desc">先去 AI 对话页创建一段对话，再来这里抽取待办吧</div>
        </div>
      ) : (
        <SessionSelector
          sessions={sessions}
          selectedId={selectedSessionId}
          onSelect={setSelectedSessionId}
          onExtract={handleExtract}
          loading={extracting}
        />
      )}

      {extracting && (
        <>
          <div className="loading-banner">
            <div className="loading-spinner" />
            AI 正在分析对话，请稍候…
          </div>
          <div className="loading-state">
            {[0, 1, 2].map((i) => (
              <div className="skeleton-card" key={i}>
                <div className="skeleton-block skeleton-circle" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="skeleton-block skeleton-line long" />
                  <div className="skeleton-block skeleton-line short" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!extracting && candidates.length > 0 && (
        <>
          <div className="candidates-header">
            <div className="candidates-title">
              🎯 AI 抽取的任务候选
              <span className="candidates-count">{candidates.length} 项</span>
            </div>
          </div>
          <div className="candidates-list">
            {candidates.map((c) => (
              <TaskCandidateCard
                key={c.id}
                candidate={c}
                onChange={handleCandidateChange}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </>
      )}

      {!extracting &&
        !showEmptySessions &&
        candidates.length === 0 &&
        selectedSessionId && (
          <div className="empty-state ctt-empty">
            <div className="empty-illustration">🎯</div>
            <div className="empty-title">尚未抽取候选任务</div>
            <div className="empty-desc">点击上方「智能抽取待办」，让 AI 帮你从对话中提炼任务</div>
          </div>
        )}

      {!extracting && candidates.length > 0 && (
        <CandidateToolbar
          selectedCount={selectedCount}
          totalCount={candidates.length}
          onSelectAll={handleSelectAll}
          onInvert={handleInvert}
          onBatchCreate={handleBatchCreate}
          creating={creating}
        />
      )}
    </div>
  );
}
