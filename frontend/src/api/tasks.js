import request from '../utils/request';

export function getTasks(params, config = {}) {
  return request.get('/tasks', { params, ...config });
}

export function createTask(data) {
  return request.post('/tasks', data);
}

export function updateTask(id, data) {
  return request.put(`/tasks/${id}`, data);
}

export function updateTaskStatus(id, status) {
  return request.patch(`/tasks/${id}/status`, { status });
}

export function deleteTask(id) {
  return request.delete(`/tasks/${id}`);
}

export function batchUpdateStatus(ids, status) {
  return request.patch('/tasks/batch/status', { ids, status });
}

export function batchDelete(ids) {
  return request.delete('/tasks/batch', { data: { ids } });
}
