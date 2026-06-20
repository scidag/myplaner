import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';
import { useToast } from '../components/Toast';

const USERNAME_RE = /^[a-zA-Z0-9_]{4,20}$/;
const HAS_LETTER = /[a-zA-Z]/;
const HAS_DIGIT = /[0-9]/;

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!USERNAME_RE.test(username)) {
      setError('用户名必须为4-20位字母、数字或下划线');
      return;
    }
    if (password.length < 8 || password.length > 20) {
      setError('密码长度必须为8-20位');
      return;
    }
    if (!HAS_LETTER.test(password) || !HAS_DIGIT.test(password)) {
      setError('密码必须包含字母和数字');
      return;
    }
    if (password !== confirm) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      await register(username.trim(), password);
      toast('注册成功，请登录', 'success');
      navigate('/login');
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
        <p>创建一个新账号开始规划生活</p>
      </div>
      <form onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}
        <div className="form-group">
          <label htmlFor="regUsername">用户名</label>
          <input
            id="regUsername"
            type="text"
            placeholder="设置用户名 (4-20位字母、数字或下划线)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="regPassword">密码</label>
          <input
            id="regPassword"
            type="password"
            placeholder="设置密码 (8-20位，需包含字母和数字)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="regConfirm">确认密码</label>
          <input
            id="regConfirm"
            type="password"
            placeholder="请再次输入密码"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? '注册中...' : '注 册'}
        </button>
      </form>
      <div className="toggle-text">
        已有账号？ <Link to="/login">返回登录</Link>
      </div>
    </div>
  );
}
