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
    const data = (await getLocalStorage<Analytics>(id)) as Analytics;

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
