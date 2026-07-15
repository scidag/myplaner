import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <main className="layout-main">
        {children}
      </main>
    </div>
  );
}
