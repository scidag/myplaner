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
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  const clearError = (field) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!username.trim()) errs.username = '请输入用户名';
    if (!password) errs.password = '请输入密码';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

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
    <div className="auth-shell">
      {/* Left: Brand */}
      <div className="brand-panel">
        <div className="brand-content">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"/>
              <polyline points="8 12 11 15 16 9"/>
            </svg>
          </div>
          <h2>厘清每一天</h2>
          <p className="brand-sub">把要做的事情写下来，大脑就该用来思考，而不是记忆。</p>
        </div>
        <div className="brand-footer">MyPlanner</div>
      </div>

      {/* Right: Form */}
      <div className="form-panel">
        <div className="form-panel-inner">
          <h1>登录</h1>
          <p className="form-sub">欢迎回来</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <div className="auth-field-label"><span>用户名</span></div>
              <div className="auth-input-wrap">
                <input
                  type="text"
                  placeholder="输入用户名"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); clearError('username'); }}
                  className={errors.username ? 'input-error' : ''}
                />
              </div>
              {errors.username && <div className="auth-field-error visible">{errors.username}</div>}
            </div>

            <div className="auth-field">
              <div className="auth-field-label"><span>密码</span></div>
              <div className="auth-input-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="输入密码"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                  className={errors.password ? 'input-error' : ''}
                />
                <button type="button" className="auth-toggle-pass" onClick={() => setShowPass(!showPass)} tabIndex={-1} aria-label={showPass ? '隐藏密码' : '显示密码'}>
                  {showPass ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
              {errors.password && <div className="auth-field-error visible">{errors.password}</div>}
            </div>

            <button type="submit" className={`auth-btn-submit${loading ? ' loading' : ''}`} disabled={loading}>
              登录
            </button>
          </form>

          <div className="auth-switch">
            还没有账号？<Link to="/register">创建一个</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
