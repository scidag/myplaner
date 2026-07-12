import request from '../utils/request';

// 抽取任务候选
export function extractTasks(sessionId) {
  return request.post(`/chat/sessions/${sessionId}/extract-tasks`);
}

// 批量创建任务
export function batchCreateTasks(tasks) {
  return request.post('/chat/tasks/batch', { tasks });
}
