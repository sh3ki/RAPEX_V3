import { type RefObject, useEffect } from 'react';

export function useOutsideClick<T extends HTMLElement>(
  ref: RefObject<T | null>,
  onOutsideClick: () => void,
): void {
  useEffect(() => {
    function handlePointerDown(event: MouseEvent): void {
      const target = event.target as Node;
      if (ref.current && !ref.current.contains(target)) {
        onOutsideClick();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [ref, onOutsideClick]);
}
