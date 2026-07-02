import Navbar from './Navbar';
import Sidebar from './Sidebar';
import PageEnter from './PageEnter';

export default function Layout({ children, title, actions }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto p-8 bg-white app-scroll-lock">
            <PageEnter>
              {(title || actions) && (
                <div className="flex items-center justify-between gap-4 mb-8">
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
