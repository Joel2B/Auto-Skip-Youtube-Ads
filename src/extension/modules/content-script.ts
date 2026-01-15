import { onMessage } from 'utils/chrome/runtime';
import { setOption, getAllOptions, getOption } from 'extension/modules/data';
import { skipAd, skipOverlay } from 'extension/modules/ads';
import { msg } from 'extension/modules/debug';
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

async function connectObserver() {
  const callback = (mutations: MutationRecord[]) => {
    for (const mutation of mutations) {
      const target = mutation.target as HTMLElement;
      const cssClass = target.className;
      if (typeof cssClass != 'string') {
        continue;
      }

      if (
        cssClass.includes('ytp-ad-overlay-ad-info-dialog-container') ||
        cssClass.includes('ytp-ad-overlay-container') ||
        cssClass.includes('ytp-ad-overlay-slot') ||
        cssClass.includes('ytp-ad-text-overlay') ||
        cssClass.includes('ytp-ad-overlay-open')
      ) {
        skipOverlay();
        return;
      }

      if (
        cssClass.includes('ytp-ad-text') ||
        cssClass.includes('ytp-ad-player-overlay') ||
        cssClass.includes('ytp-ad-simple-ad-badge') ||
        (cssClass.includes('video-ads') &&
          document.getElementsByClassName('video-ads')[0] &&
          (document.getElementsByClassName('video-ads')[0] as HTMLElement).innerHTML != '')
      ) {
        skipAd();
      }
    }
  };

  const playerAvailable = async (): Promise<Element | null> => {
    return new Promise((resolve) => {
      const timer = setInterval(() => {
        msg('Trying to connect the observer');
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
          msg('Observer error (time limit exceeded)');
          resolve(null);
        }
      }, 10 * 1000);
    });
  };

  const player = await playerAvailable();
  if (!player) {
    return;
  }

  const config = {
    subtree: true,
    childList: true,
  };

  observer = new MutationObserver(callback);
  observer.observe(player, config);
  msg('Observer connected');
}

function disconnectObserver() {
  if (!observer) {
    return;
  }
  observer.disconnect();
  msg('Observer disconnected');
}

function restartExecution() {
  setInterval(() => {
    const url = window.location.href;
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
    setOption('curent-path', window.location.href);
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

  // load only in videos
  if (!window.location.href.includes('watch')) {
    return;
  }

  connectObserver();
}

app();
