import { onMessage } from 'utils/chrome/runtime';
import { setOption, getAllOptions, getOption } from 'extension/modules/data';
import { skipAd, skipSurvey } from 'extension/modules/ads';
import { isAnalyticsMessage } from 'types/messages';
import type { OptionValue } from 'types/messages';

let observer: MutationObserver | null = null;

const tasks: Record<string, (value: boolean) => void> = {
  extension: (value) => {
    if (value) {
      connectObserver();
    } else {
      disconnectObserver();
    }
  },
};

function performTask(id: string, value: OptionValue) {
  const task = tasks[id];

  if (task && typeof value === 'boolean') {
    task(value);
  }
}

let lock = false;

function detectAd() {
  if (lock) {
    return;
  }

  lock = true;

  setTimeout(async () => {
    try {
      const ad = document.querySelector('.video-ads');

      if (document.querySelector('.ytp-ad-survey')) {
        await skipSurvey();
        return;
      }

      if (ad && ad.innerHTML !== '') {
        await skipAd();
      }
    } catch (e) {
      console.error(e);
    } finally {
      lock = false;
    }
  });
}

async function connectObserver() {
  const playerAvailable = async (): Promise<Element | null> => {
    return new Promise((resolve) => {
      const timer = setInterval(() => {
        console.log('Trying to connect the observer');
        const player = document.querySelector('#movie_player');

        if (player) {
          clearInterval(timer);
          resolve(player);
        }
      }, 50);

      setTimeout(() => {
        const player = document.querySelector('#movie_player');

        if (!player) {
          clearInterval(timer);
          console.log('Observer error (time limit exceeded)');
          resolve(null);
        }
      }, 10 * 1000);
    });
  };

  const player = await playerAvailable();

  if (!player) {
    return;
  }

  const config: MutationObserverInit = {
    subtree: true,
    childList: true,
    attributes: true,
  };

  const callback = () => detectAd();
  observer = new MutationObserver(callback);
  observer.observe(player, config);
  console.log('Observer connected');
}

function disconnectObserver() {
  if (!observer) {
    return;
  }

  observer.disconnect();
  console.warn('Observer disconnected');
}

function getUrl() {
  const url = new URL(window.location.href);
  const key = 'v';
  const value = url.searchParams.get(key);

  url.search = '';

  if (value != null) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

function restartExecution() {
  setInterval(() => {
    const url = getUrl();

    if (getOption('curent-path') != url && url.includes('watch')) {
      if (observer) {
        disconnectObserver();
      }

      connectObserver();
    }

    if (getOption('curent-path') != url) {
      setOption('curent-path', url);
    }
  }, 100);
}

async function app() {
  await getAllOptions();

  if (!getOption('curent-path')) {
    const url = getUrl();

    setOption('curent-path', url);
    restartExecution();
  }

  onMessage((request) => {
    if (isAnalyticsMessage(request)) {
      return;
    }

    const id = request.id;
    const value = request.value;

    setOption(id, value);
    performTask(id, value);
  });

  const extension = getOption('extension');
  if (!extension) {
    return;
  }

  if (!window.location.href.includes('watch')) {
    return;
  }

  connectObserver();
}

app();
