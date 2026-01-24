import { onMessage } from 'utils/chrome/runtime';
import { setOption, getAllOptions, getOption } from 'extension/modules/data';
import { skipAd } from 'extension/modules/ads';
import { isAnalyticsMessage, isDebuggerClickMessage } from 'types/messages';
import { skipSurvey } from './ads/skipSurvey';
import { deepQuerySelectorAll } from 'utils/query';
import { delay } from 'utils/utils';

let observer: MutationObserver | null = null;
let interval: NodeJS.Timeout | null = null;
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
  if (observer) {
    return;
  }

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
  observer = null;

  console.log('Observer disconnected');
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
    if (isAnalyticsMessage(request) || isDebuggerClickMessage(request)) {
      return;
    }

    const id = request.id;
    const value = request.value;

    setOption(id, value);

    if (getOption('m1') || getOption('m3')) {
      connectObserver();
    } else {
      disconnectObserver();
    }

    if (getOption('experimental')) {
      runInterval();
    } else {
      stopInterval();
    }
  });

  if (!window.location.href.includes('watch')) {
    return;
  }

  connectObserver();
  runInterval();
}

function runInterval() {
  if (interval || !getOption('experimental')) return;

  interval = setInterval(async () => {
    const containers = deepQuerySelectorAll<HTMLElement>('.ytd-popup-container').filter(
      (o) => o.innerHTML != '' && !o.getAttribute('aria-hidden') && o.getAttribute('role'),
    );

    for (const container of containers) {
      // modal video paused
      if (container.innerHTML.toLocaleLowerCase().includes('video paused')) {
        const button = container.querySelector('button');
        console.log(button);
        button?.click();
      }

      // modal ad blocker
      if (container.querySelector('img')) {
        const svg = container.querySelector('button svg');
        const button = svg.closest('button');
        console.log(button, svg);

        if (!button) {
          continue;
        }

        button.click();

        const player: HTMLVideoElement = document.querySelector('#movie_player video');

        if (!player) {
          continue;
        }

        await delay(500);

        if (player.paused) {
          player.play();
        }
      }
    }
  }, 100);

  console.log('run interval');
}

function stopInterval() {
  if (!interval) return;

  clearInterval(interval);
  interval = null;

  console.log('stop interval');
}

app();
