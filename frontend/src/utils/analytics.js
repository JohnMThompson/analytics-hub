const GA_MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();
const GA_SCRIPT_ID = 'google-analytics';

let initializedMeasurementId = '';
let lastTrackedPagePath = '';

export function getAnalyticsMeasurementId() {
  return GA_MEASUREMENT_ID;
}

export function buildPageViewPath(location) {
  if (typeof location === 'string') {
    return location || '/';
  }

  const pathname = location?.pathname || '/';
  const search = location?.search || '';
  return `${pathname}${search}`;
}

export function injectAnalyticsScript(measurementId) {
  if (!measurementId || typeof document === 'undefined') return false;

  if (document.getElementById(GA_SCRIPT_ID)) {
    return true;
  }

  const script = document.createElement('script');
  script.id = GA_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  document.head.appendChild(script);
  return true;
}

export function initializeAnalytics(measurementId = GA_MEASUREMENT_ID) {
  if (!measurementId || typeof window === 'undefined') {
    return false;
  }

  if (initializedMeasurementId === measurementId) {
    return true;
  }

  injectAnalyticsScript(measurementId);

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });

  initializedMeasurementId = measurementId;
  return true;
}

export function trackPageView(location, measurementId = GA_MEASUREMENT_ID) {
  const pagePath = buildPageViewPath(location);

  if (!initializeAnalytics(measurementId) || typeof window.gtag !== 'function') {
    return false;
  }

  if (lastTrackedPagePath === pagePath) {
    return false;
  }

  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: typeof document === 'undefined' ? '' : document.title,
  });

  lastTrackedPagePath = pagePath;
  return true;
}

export function resetAnalyticsForTest() {
  initializedMeasurementId = '';
  lastTrackedPagePath = '';
}
