import Sidebar from './Sidebar';

export default function Layout({ children, title, actions }) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Page header */}
        <div className="bg-slate-900 border-b border-slate-700/50 px-8 py-5 flex items-center justify-between flex-shrink-0">
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
        {/* Content area */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
