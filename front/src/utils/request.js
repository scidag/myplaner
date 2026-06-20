import axios from 'axios';

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body.code === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(new Error(body.message || '登录已失效'));
    }
    if (body.code !== 200) {
      return Promise.reject(new Error(body.message || '请求失败'));
    }
    return body.data;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    const msg = error.response?.data?.message || error.message || '网络异常，请重试';
    return Promise.reject(new Error(msg));
  },
);

export default request;
