import { useEffect } from 'react';

let lockCount = 0;

export default function useScrollLock(locked) {
  useEffect(() => {
    if (!locked) return;

    lockCount += 1;
    if (lockCount === 1) {
      document.documentElement.classList.add('modal-open');
    }

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.documentElement.classList.remove('modal-open');
      }
    };
  }, [locked]);
}
