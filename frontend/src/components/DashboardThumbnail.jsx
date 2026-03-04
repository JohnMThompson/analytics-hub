import { useEffect, useRef, useState } from 'react';

const CACHE_KEY_PREFIX = 'dashboard-thumbnail-doc:';

function readCachedSnapshot(dashboardId) {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(`${CACHE_KEY_PREFIX}${dashboardId}`) || '';
  } catch {
    return '';
  }
}

function writeCachedSnapshot(dashboardId, html) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${CACHE_KEY_PREFIX}${dashboardId}`, html);
  } catch {
    // Ignore quota and storage access errors.
  }
}

function buildSnapshotDocument(doc) {
  const clone = doc.documentElement.cloneNode(true);
  const scripts = clone.querySelectorAll('script');
  scripts.forEach((node) => node.remove());

  const style = doc.createElement('style');
  style.textContent = `
    * {
      animation: none !important;
      transition: none !important;
      scroll-behavior: auto !important;
    }
  `;
  clone.querySelector('head')?.appendChild(style);

  return `<!doctype html>${clone.outerHTML}`;
}

export default function DashboardThumbnail({ dashboardId, title, priority = false }) {
  const liveFrameRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [cachedSnapshot, setCachedSnapshot] = useState('');
  const src = `/dashboard/${dashboardId}?thumbnail=1`;

  useEffect(() => {
    setCachedSnapshot(readCachedSnapshot(dashboardId));
  }, [dashboardId]);

  const handleLiveLoad = () => {
    setLoaded(true);

    try {
      const doc = liveFrameRef.current?.contentDocument;
      if (!doc?.documentElement) return;
      const snapshot = buildSnapshotDocument(doc);
      setCachedSnapshot(snapshot);
      writeCachedSnapshot(dashboardId, snapshot);
    } catch {
      // Best-effort snapshot cache; ignore cross-origin or serialization errors.
    }
  };

  return (
    <div className="dashboard-thumbnail" aria-hidden="true" data-testid={`dashboard-thumbnail-${dashboardId}`}>
      <div className={`dashboard-thumbnail-placeholder ${loaded || cachedSnapshot ? 'is-loaded' : ''}`} />
      {cachedSnapshot && !loaded && (
        <iframe
          className="dashboard-thumbnail-frame dashboard-thumbnail-frame-cached is-loaded"
          srcDoc={cachedSnapshot}
          title={`${title} cached preview`}
          tabIndex={-1}
          aria-hidden="true"
          style={{ pointerEvents: 'none' }}
        />
      )}
      <iframe
        ref={liveFrameRef}
        className={`dashboard-thumbnail-frame ${loaded ? 'is-loaded' : ''}`}
        src={src}
        title={`${title} preview`}
        loading={priority ? 'eager' : 'lazy'}
        tabIndex={-1}
        aria-hidden="true"
        style={{ pointerEvents: 'none' }}
        onLoad={handleLiveLoad}
      />
    </div>
  );
}
