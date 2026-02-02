import { getLocalStorage, setLocalStorage } from 'utils/chrome/storage';
import { onMessage } from 'utils/chrome/runtime';
import type { Analytics, AnalyticsUpdateValue } from 'types/analytics';
import { isAnalyticsMessage, isDebuggerClickMessage } from 'types/messages';

const debuggerProtocolVersion = '1.3';
let analyticsWriteQueue: Promise<void> = Promise.resolve();

function createAnalyticsDefaults(): Analytics {
  return {
    methods: {
      1: { error: 0, success: 0 },
      3: { error: 0, success: 0 },
    },
    surveys: 0,
  };
}

function normalizeAnalytics(data: Analytics | null): Analytics {
  const defaults = createAnalyticsDefaults();

  if (!data || typeof data !== 'object') {
    return defaults;
  }

  const methods = data.methods ?? {};
  const normalizedMethods: Analytics['methods'] = {};

  for (const method of Object.keys(defaults.methods)) {
    const stats = methods[method];
    const error = Number(stats?.error);
    const success = Number(stats?.success);

    normalizedMethods[method] = {
      error: Number.isFinite(error) ? error : 0,
      success: Number.isFinite(success) ? success : 0,
    };
  }

  const surveys = Number(data.surveys);

  return {
    methods: normalizedMethods,
    surveys: Number.isFinite(surveys) ? surveys : 0,
  };
}

async function setLocalStorageAsync(key: string, value: unknown): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(
      {
        [key]: value,
      },
      () => {
        if (chrome.runtime.lastError) {
          console.warn('setLocalStorageAsync failed:', chrome.runtime.lastError.message);
        }

        resolve();
      },
    );
  });
}

async function updateAnalytics(value: AnalyticsUpdateValue): Promise<void> {
  const storage = await getLocalStorage<Analytics>('analytics');
  const data = normalizeAnalytics(storage);

  if (typeof value === 'string') {
    data[value] += 1;
  } else {
    const methodKey = String(value.method);

    if (!data.methods[methodKey]) {
      data.methods[methodKey] = { error: 0, success: 0 };
    }

    if (value.status) {
      data.methods[methodKey].success += 1;
    } else {
      data.methods[methodKey].error += 1;
    }
  }

  await setLocalStorageAsync('analytics', data);
}

function queueAnalyticsUpdate(value: AnalyticsUpdateValue): Promise<void> {
  analyticsWriteQueue = analyticsWriteQueue
    .catch(() => {})
    .then(async () => {
      await updateAnalytics(value);
    });

  return analyticsWriteQueue;
}

async function queryActiveTabId(): Promise<number | null> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.warn('debugger click skipped:', chrome.runtime.lastError.message);
        resolve(null);
        return;
      }

      resolve(tabs[0]?.id ?? null);
    });
  });
}

async function attachDebugger(target: chrome.debugger.Debuggee): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.debugger.attach(target, debuggerProtocolVersion, () => {
      if (chrome.runtime.lastError) {
        console.warn('debugger.attach failed:', chrome.runtime.lastError.message);
        resolve(false);
        return;
      }

      resolve(true);
    });
  });
}

async function detachDebugger(target: chrome.debugger.Debuggee): Promise<void> {
  return new Promise((resolve) => {
    chrome.debugger.detach(target, () => {
      if (chrome.runtime.lastError) {
        console.warn('debugger.detach failed:', chrome.runtime.lastError.message);
      }

      resolve();
    });
  });
}

async function sendDebuggerCommand(
  target: chrome.debugger.Debuggee,
  method: string,
  params?: Record<string, unknown>,
): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.debugger.sendCommand(target, method, params, () => {
      if (chrome.runtime.lastError) {
        console.warn(`debugger.sendCommand ${method} failed:`, chrome.runtime.lastError.message);
        resolve(false);
        return;
      }

      resolve(true);
    });
  });
}

async function dispatchDebuggerClick(point: { x: number; y: number }, senderTabId?: number) {
  const tabId = typeof senderTabId === 'number' ? senderTabId : await queryActiveTabId();

  if (tabId == null) {
    console.warn('debugger click skipped: no tab id');
    return;
  }

  const target = { tabId };
  const attached = await attachDebugger(target);

  if (!attached) {
    return;
  }

  try {
    await sendDebuggerCommand(target, 'Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: point.x,
      y: point.y,
      button: 'left',
      clickCount: 1,
    });

    await sendDebuggerCommand(target, 'Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: point.x,
      y: point.y,
      button: 'left',
      clickCount: 1,
    });
  } finally {
    await detachDebugger(target);
  }
}

function getContentScriptFiles(): string[] {
  const manifest = chrome.runtime.getManifest();
  return manifest.content_scripts?.[0]?.js ?? [];
}

async function injectContentScripts(tabId: number): Promise<boolean> {
  return new Promise((resolve) => {
    const files = getContentScriptFiles();

    if (!files.length) {
      console.warn('injectContentScripts skipped: missing content script');
      resolve(false);
      return;
    }

    chrome.scripting.executeScript(
      {
        target: { tabId },
        files,
      },
      () => {
        if (chrome.runtime.lastError) {
          console.warn('injectContentScripts failed:', chrome.runtime.lastError.message);
          resolve(false);
          return;
        }

        resolve(true);
      },
    );
  });
}

function reinjectContentScripts() {
  const manifest = chrome.runtime.getManifest();
  const matches = manifest.content_scripts?.[0]?.matches;

  if (!matches?.length) {
    console.warn('reinjectContentScripts skipped: missing matches');
    return;
  }

  chrome.tabs.query({ url: matches }, (tabs) => {
    if (chrome.runtime.lastError) {
      console.warn('reinjectContentScripts query failed:', chrome.runtime.lastError.message);
      return;
    }

    for (const tab of tabs) {
      if (tab.id == null) {
        continue;
      }

      void injectContentScripts(tab.id);
    }
  });
}

onMessage(async (request, sender) => {
  if (isDebuggerClickMessage(request)) {
    await dispatchDebuggerClick(request.value, sender?.tab?.id);
    return;
  }

  if (!isAnalyticsMessage(request)) {
    return;
  }

  const value = request.value;
  await queueAnalyticsUpdate(value);
}, true);

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.local.set({
      'skip-survey': true,
      m1: false,
      m3: true,
      experimental: false,
    });

    setLocalStorage('analytics', createAnalyticsDefaults());
  }

  if (details.reason === 'install' || details.reason === 'update') {
    reinjectContentScripts();
  }
});

chrome.runtime.onStartup.addListener(() => {
  reinjectContentScripts();
});
