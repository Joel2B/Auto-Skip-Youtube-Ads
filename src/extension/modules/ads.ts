import { getOption } from 'extension/modules/data';
import { sendMessageBackground } from 'utils/chrome/runtime';
import { debug } from 'extension/modules/debug';
import { deepQuerySelector, deepQuerySelectorAll } from 'utils/query';

let methodExecuted = false;

const delay = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

async function m1() {
  if (!getOption('m1')) {
    return;
  }

  try {
    const adInfoButton = document.querySelector('.ytp-ad-button-icon') as HTMLElement | null;

    if (!adInfoButton) {
      throw new Error();
    }

    adInfoButton.click();
    await delay(1000);

    const blockButton = deepQuerySelectorAll<HTMLElement | null>('button').find((el) =>
      el.textContent.includes('Block'),
    );

    await delay(1000);

    if (!blockButton) {
      const closeButton = deepQuerySelector<HTMLElement>('button[aria-label="Close"]');
      closeButton.click();

      throw new Error();
    }

    blockButton.click();
    await delay(1000);

    const continueButton = deepQuerySelectorAll<HTMLElement | null>('[role="button"]').find((el) =>
      el.textContent.includes('CONTINUE'),
    );

    if (!continueButton) {
      throw new Error();
    }

    continueButton.click();
    await delay(1000);

    const closeButton = deepQuerySelectorAll<HTMLElement>('button[aria-label="Close"]').at(-1);
    closeButton.click();

    sendMessageBackground({
      id: 'analytics',
      value: {
        method: 1,
        status: 1,
      },
    });

    debug('m1', 1);
    methodExecuted = true;
  } catch (e) {
    sendMessageBackground({
      id: 'analytics',
      value: {
        method: 1,
        status: 0,
      },
    });

    debug('m1', 0);
    console.error(e);
  }
}

function m2() {
  if (!getOption('m2') || methodExecuted) {
    return;
  }

  const adSkipButton = document.querySelector('.ytp-ad-skip-button') as HTMLElement | null;
  const video = document.querySelector('video') as HTMLVideoElement | null;
  if (!video || !adSkipButton) {
    sendMessageBackground({
      id: 'analytics',
      value: {
        method: 2,
        status: 0,
      },
    });
    debug('m2', 0);
    return;
  }

  for (let i = 0; i < 5; i++) {
    video.currentTime += 1;
  }
  adSkipButton.click();
  methodExecuted = true;
  sendMessageBackground({
    id: 'analytics',
    value: {
      method: 2,
      status: 1,
    },
  });
  debug('m2', 1);
}

function m3() {
  if (!getOption('m3') || methodExecuted) {
    return;
  }

  const ad = document.querySelectorAll(
    '.ytp-ad-player-overlay, .ytp-ad-player-overlay-instream-info, .ytp-ad-simple-ad-badge',
  );

  const video = document.querySelector('video') as HTMLVideoElement | null;
  if (!video || !isFinite(video.duration) || ad.length == 0) {
    sendMessageBackground({
      id: 'analytics',
      value: {
        method: 3,
        status: 0,
      },
    });
    debug('m3', 0);
    return;
  }

  for (let i = 0; i < 5; i++) {
    video.currentTime += 1;
  }
  video.currentTime = video.duration;
  sendMessageBackground({
    id: 'analytics',
    value: {
      method: 3,
      status: 1,
    },
  });
  debug('m3', 1);
}

export async function skipAd() {
  if (!getOption('block-ads')) {
    return;
  }
  debug('skipAd');
  await delay(1000);

  // Method 1 - report the video (inappropriate, repetitive, irrelevant)
  // this method only works in english language
  m1();

  // Method 2 - click the announcement skip button that appears after 5 seconds
  m2();

  // Method 3 - advance 5 seconds and force it to end
  m3();
}

export function skipOverlay() {
  if (!getOption('block-overlays-ads')) {
    return;
  }
  debug('skipOverlay');

  const closeButton = document.querySelector('.ytp-ad-overlay-close-button') as HTMLElement | null;
  if (!closeButton) {
    return;
  }
  closeButton.click();
  sendMessageBackground({
    id: 'analytics',
    value: 'overlayAds',
  });
}
