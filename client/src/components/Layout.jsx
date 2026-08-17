import Navbar from './Navbar';
import Sidebar from './Sidebar';
import PageEnter from './PageEnter';

export default function Layout({ children, title, actions, fill = false }) {
  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
          <div
            className={`flex-1 bg-white app-scroll-lock p-8 ${
              fill ? 'overflow-hidden flex flex-col min-h-0' : 'overflow-y-auto'
            }`}
          >
            <PageEnter className={fill ? 'flex-1 min-h-0 flex flex-col' : ''}>
              {(title || actions) && (
                <div className={`flex items-center justify-between gap-4 flex-shrink-0 ${fill ? 'mb-4' : 'mb-8'}`}>
                  {title && <h1 className="text-xl font-bold text-gray-900">{title}</h1>}
                  {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
                </div>
              )}
              {children}
            </PageEnter>
          </div>
        </main>
      </div>
    </div>
  );
}
