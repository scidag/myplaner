import request from '../utils/request';

export function getTasks(params) {
  return request.get('/tasks', { params });
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
