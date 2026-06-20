import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth';
import { useToast } from '../components/Toast';

const USERNAME_RE = /^[a-zA-Z0-9_]{4,20}$/;
const HAS_LETTER = /[a-zA-Z]/;
const HAS_DIGIT = /[0-9]/;

function calcStrength(pwd) {
  if (!pwd) return { level: 0, width: '0%', color: 'transparent', label: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (HAS_LETTER.test(pwd) && HAS_DIGIT.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;

  const levels = [
    { level: 0, width: '0%',   color: 'transparent', label: '' },
    { level: 1, width: '20%',  color: '#b91c1c',     label: '太弱了 — 加几个数字试试' },
    { level: 2, width: '40%',  color: '#d97706',     label: '一般 — 再加长一点' },
    { level: 3, width: '60%',  color: '#ca8a04',     label: '还行 — 加个符号更安全' },
    { level: 4, width: '80%',  color: '#2d6a4f',     label: '不错' },
    { level: 5, width: '100%', color: '#2d6a4f',     label: '很强' },
  ];
  const lv = Math.min(score, levels.length - 1);
  return levels[lv];
}

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  const strength = useMemo(() => calcStrength(password), [password]);

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

    if (!username.trim()) {
      errs.username = '请输入用户名';
    } else if (!USERNAME_RE.test(username.trim())) {
      errs.username = '用户名需为 4–20 位字母、数字或下划线';
    }

    if (!password) {
      errs.password = '请设置一个密码';
    } else if (password.length < 8 || password.length > 20) {
      errs.password = '密码长度需为 8–20 位';
    } else if (!HAS_LETTER.test(password) || !HAS_DIGIT.test(password)) {
      errs.password = '密码需要同时包含字母和数字';
    }

    if (!confirm) {
      errs.confirm = '请再次输入密码';
    } else if (password && confirm !== password) {
      errs.confirm = '两次输入的密码不一致';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await register(username.trim(), password);
      toast('注册成功，去登录吧', 'success');
      navigate('/login');
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
          <h1>创建账号</h1>
          <p className="form-sub">只需几步，开始规划</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <div className="auth-field-label">
                <span>用户名</span>
                <span className="auth-field-hint">4–20 位字母、数字或下划线</span>
              </div>
              <div className="auth-input-wrap">
                <input
                  type="text"
                  placeholder="给自己起个名字"
                  autoComplete="username"
                  maxLength={20}
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); clearError('username'); }}
                  className={errors.username ? 'input-error' : ''}
                />
              </div>
              {errors.username && <div className="auth-field-error visible">{errors.username}</div>}
            </div>

            <div className="auth-field">
              <div className="auth-field-label">
                <span>密码</span>
                <span className="auth-field-hint">8–20 位，含字母和数字</span>
              </div>
              <div className="auth-input-wrap">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="设一个不容易猜到的密码"
                  autoComplete="new-password"
                  maxLength={20}
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
              <div className="auth-strength-bar">
                <div className="auth-strength-fill" style={{ width: strength.width, background: strength.color }} />
              </div>
              {strength.label && (
                <div className="auth-strength-label" style={{ color: strength.color }}>{strength.label}</div>
              )}
              {errors.password && <div className="auth-field-error visible">{errors.password}</div>}
            </div>

            <div className="auth-field">
              <div className="auth-field-label"><span>确认密码</span></div>
              <div className="auth-input-wrap">
                <input
                  type="password"
                  placeholder="再输入一次密码"
                  autoComplete="new-password"
                  maxLength={20}
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); clearError('confirm'); }}
                  className={errors.confirm ? 'input-error' : ''}
                />
              </div>
              {errors.confirm && <div className="auth-field-error visible">{errors.confirm}</div>}
            </div>

            <button type="submit" className={`auth-btn-submit${loading ? ' loading' : ''}`} disabled={loading}>
              创建账号
            </button>
          </form>

          <div className="auth-switch">
            已经有账号了？<Link to="/login">去登录</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
