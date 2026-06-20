import { useNavigate } from 'react-router-dom';

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="header">
      <h1>MyPlanner</h1>
      <button onClick={handleLogout}>退出登录</button>
    </header>
  );
}
