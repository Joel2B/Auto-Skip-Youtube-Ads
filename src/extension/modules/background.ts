import { getLocalStorage, setLocalStorage } from 'utils/chrome/storage';
import { onMessage } from 'utils/chrome/runtime';
import type { Analytics } from 'types/analytics';
import { isAnalyticsMessage, isDebuggerClickMessage } from 'types/messages';

const debuggerProtocolVersion = '1.3';

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

onMessage(async (request, sender) => {
  if (isDebuggerClickMessage(request)) {
    await dispatchDebuggerClick(request.value, sender?.tab?.id);
    return;
  }

  if (!isAnalyticsMessage(request)) {
    return;
  }

  const id = request.id;
  const value = request.value;

  if (id == 'analytics') {
    const data: Analytics = await getLocalStorage<Analytics>(id);

    if (typeof value === 'string') {
      data[value] += 1;
    } else {
      const methodKey = String(value.method);

      if (value.status) {
        data.methods[methodKey].success += 1;
      } else {
        data.methods[methodKey].error += 1;
      }
    }

    setLocalStorage(id, data);
  }
}, true);

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason !== 'install') return;

  chrome.storage.local.set({
    'skip-survey': true,
    m1: false,
    m3: true,
  });
});
