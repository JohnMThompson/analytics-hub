import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  buildPageViewPath,
  initializeAnalytics,
  injectAnalyticsScript,
  resetAnalyticsForTest,
  trackPageView,
} from './analytics';

function createDocumentStub() {
  const appendedNodes = [];
  const documentStub = {
    title: 'Analytics Hub',
    head: {
      appendChild(node) {
        appendedNodes.push(node);
      },
    },
    createElement(tagName) {
      return {
        tagName,
        async: false,
        id: '',
        src: '',
      };
    },
    getElementById(id) {
      return appendedNodes.find((node) => node.id === id) || null;
    },
  };

  return { appendedNodes, documentStub };
}

afterEach(() => {
  resetAnalyticsForTest();
  vi.unstubAllGlobals();
});

describe('buildPageViewPath', () => {
  test('combines pathname and search for router locations', () => {
    expect(buildPageViewPath({ pathname: '/dashboard/mortgage_rates', search: '?thumbnail=1' })).toBe(
      '/dashboard/mortgage_rates?thumbnail=1',
    );
  });

  test('defaults to the home route for empty locations', () => {
    expect(buildPageViewPath()).toBe('/');
  });
});

describe('injectAnalyticsScript', () => {
  test('adds the GA script tag once', () => {
    const { appendedNodes, documentStub } = createDocumentStub();
    vi.stubGlobal('document', documentStub);

    expect(injectAnalyticsScript('G-TEST123')).toBe(true);
    expect(injectAnalyticsScript('G-TEST123')).toBe(true);
    expect(appendedNodes).toHaveLength(1);
    expect(appendedNodes[0].src).toContain('gtag/js?id=G-TEST123');
  });
});

describe('initializeAnalytics', () => {
  test('skips initialization when no measurement id is provided', () => {
    vi.stubGlobal('window', {});

    expect(initializeAnalytics('')).toBe(false);
    expect(global.window.gtag).toBeUndefined();
  });

  test('creates a gtag shim and disables automatic page views', () => {
    const { documentStub } = createDocumentStub();
    vi.stubGlobal('document', documentStub);
    vi.stubGlobal('window', {});

    expect(initializeAnalytics('G-TEST123')).toBe(true);
    expect(typeof global.window.gtag).toBe('function');
    expect(global.window.dataLayer).toHaveLength(2);
    expect(Array.from(global.window.dataLayer[1])).toEqual(['config', 'G-TEST123', { send_page_view: false }]);
  });
});

describe('trackPageView', () => {
  test('returns false when analytics is not configured', () => {
    vi.stubGlobal('window', {});

    expect(trackPageView('/dashboard/mortgage_rates', '')).toBe(false);
  });

  test('tracks a route once and suppresses duplicate page views for the same path', () => {
    const { documentStub } = createDocumentStub();
    const gtag = vi.fn();

    vi.stubGlobal('document', documentStub);
    vi.stubGlobal('window', {
      dataLayer: [],
      gtag,
    });

    expect(trackPageView('/dashboard/mortgage_rates', 'G-TEST123')).toBe(true);
    expect(trackPageView('/dashboard/mortgage_rates', 'G-TEST123')).toBe(false);
    expect(trackPageView('/dashboard/swim_tracking', 'G-TEST123')).toBe(true);

    expect(gtag).toHaveBeenNthCalledWith(1, 'js', expect.any(Date));
    expect(gtag).toHaveBeenNthCalledWith(2, 'config', 'G-TEST123', { send_page_view: false });
    expect(gtag).toHaveBeenNthCalledWith(3, 'event', 'page_view', {
      page_path: '/dashboard/mortgage_rates',
      page_title: 'Analytics Hub',
    });
    expect(gtag).toHaveBeenNthCalledWith(4, 'event', 'page_view', {
      page_path: '/dashboard/swim_tracking',
      page_title: 'Analytics Hub',
    });
  });
});
