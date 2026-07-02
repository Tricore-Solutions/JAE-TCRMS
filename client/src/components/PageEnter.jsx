import { useLocation } from 'react-router-dom';

export default function PageEnter({ children, className = '' }) {
  const location = useLocation();

  return (
    <div key={location.pathname} className={`page-enter ${className}`.trim()}>
      {children}
    </div>
  );
}
