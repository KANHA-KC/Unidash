import { useEffect, useState } from 'react';

interface ToastMsg {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
}

let push: ((t: ToastMsg) => void) | null = null;
let counter = 0;

export function toast(text: string, action?: ToastMsg['action']) {
  push?.({ id: ++counter, text, action });
}

export function Toaster() {
  const [current, setCurrent] = useState<ToastMsg | null>(null);

  useEffect(() => {
    push = setCurrent;
    return () => {
      push = null;
    };
  }, []);

  useEffect(() => {
    if (!current) return;
    const t = setTimeout(() => setCurrent(null), current.action ? 5000 : 2500);
    return () => clearTimeout(t);
  }, [current]);

  if (!current) return null;
  return (
    <div className="toast" role="status" key={current.id}>
      <span>{current.text}</span>
      {current.action && (
        <button
          onClick={() => {
            current.action!.run();
            setCurrent(null);
          }}
        >
          {current.action.label}
        </button>
      )}
    </div>
  );
}
