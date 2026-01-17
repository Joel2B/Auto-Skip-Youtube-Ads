import { getLocalStorage, setLocalStorage } from 'utils/chrome/storage';
import { onMessage } from 'utils/chrome/runtime';
import type { Analytics } from 'types/analytics';
import { isAnalyticsMessage } from 'types/messages';

onMessage(async (request) => {
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
    extension: true,
    'block-ads': true,
    'block-overlays-ads': true,
    m1: true,
    m3: false,
  });
});
