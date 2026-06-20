import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/auth';
import { useToast } from '../components/Toast';

export default function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setLoading(true);
    try {
      const data = await login(username.trim(), password);
      localStorage.setItem('token', data.token);
      toast('登录成功', 'success');
      navigate('/');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <h1>MyPlanner</h1>
        <p>欢迎回来，请登录您的账号</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="loginUsername">用户名</label>
          <input
            id="loginUsername"
            type="text"
            placeholder="请输入用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="loginPassword">密码</label>
          <input
            id="loginPassword"
            type="password"
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? '登录中...' : '登 录'}
        </button>
      </form>
      <div className="toggle-text">
        还没有账号？ <Link to="/register">立即注册</Link>
      </div>
    </div>
  );
}
