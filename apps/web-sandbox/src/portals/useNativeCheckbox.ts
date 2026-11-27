import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

// Native repair events are intentional: React's checkbox onChange uses click events.
export function useNativeCheckbox(initial = true) {
  const [checked, setChecked] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const input = ref.current;
    if (!input) return;
    const sync = () => setChecked(input.checked);
    input.addEventListener('input', sync);
    input.addEventListener('change', sync);
    return () => { input.removeEventListener('input', sync); input.removeEventListener('change', sync); };
  }, []);
  return { checked, ref, onChange: (event: ChangeEvent<HTMLInputElement>) => setChecked(event.target.checked) };
}
