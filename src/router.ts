import { useSyncExternalStore } from 'react';

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};

/** Current route, e.g. "/" or "/b/abc123?edit=1". */
export function useRoute() {
  return useSyncExternalStore(subscribe, () => window.location.hash.slice(1) || '/');
}

export function navigate(path: string, replace = false) {
  if (replace) window.history.replaceState(null, '', `#${path}`);
  else window.location.hash = path;
  if (replace) window.dispatchEvent(new HashChangeEvent('hashchange'));
}
