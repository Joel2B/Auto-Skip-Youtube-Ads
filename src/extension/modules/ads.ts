import { getOption } from 'extension/modules/data';
import { sendMessageBackground } from 'utils/chrome/runtime';
import { debug } from 'extension/modules/debug';
import { deepQuerySelector, deepQuerySelectorAll } from 'utils/query';
import { waitFor } from 'utils/utils';

let methodExecuted = false;

async function m1() {
  if (!getOption('m1')) {
    return;
  }

  try {
    const adInfoButton: HTMLElement | null = await waitFor(() => document.querySelector('.ytp-ad-button-icon'), {
      timeoutMs: 2000,
      intervalMs: 100,
    });

    if (!adInfoButton) {
      throw new Error();
    }

    adInfoButton.click();

    const blockButton: HTMLElement = await waitFor(
      () => deepQuerySelectorAll<HTMLElement | null>('button').find((el) => el.textContent.includes('Block')),
      {
        timeoutMs: 2000,
        intervalMs: 100,
      },
    );

    if (!blockButton) {
      const closeButton: HTMLElement = await waitFor(
        () => deepQuerySelectorAll<HTMLElement>('button[aria-label="Close"]').at(-1),
        {
          timeoutMs: 2000,
          intervalMs: 100,
        },
      );

      closeButton.click();
      throw new Error();
    }

    blockButton.click();

    const continueButton: HTMLElement = await waitFor(
      () => deepQuerySelectorAll<HTMLElement | null>('[role="button"]').at(-1),
      {
        timeoutMs: 4000,
        intervalMs: 100,
        minMs: 2000,
      },
    );

    console.warn(
      deepQuerySelectorAll<HTMLElement | null>('[role="button"]').find((el) => el.textContent.includes('CONTINUE')),
    );

    if (!continueButton) {
      throw new Error();
    }

    continueButton.click();

    const closeButton: HTMLElement = await waitFor(
      () => deepQuerySelectorAll<HTMLElement>('button[aria-label="Close"]').at(-1),
      {
        timeoutMs: 2000,
        intervalMs: 100,
        minMs: 1000,
      },
    );

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

async function m3() {
  if (!getOption('m3') || methodExecuted) {
    return;
  }

  try {
    const ad = deepQuerySelectorAll<HTMLElement>('.ytp-ad-module');

    if (ad.length == 0) {
      throw new Error();
    }

    const video: HTMLVideoElement | null = document.querySelector('video');

    if (video && isFinite(video.duration)) {
      for (let i = 0; i < 5; i++) {
        video.currentTime += 1;
      }

      video.currentTime = video.duration;
    }

    const adButton: HTMLElement = await waitFor(() => deepQuerySelector<HTMLElement>('.ytp-skip-ad-button'), {
      timeoutMs: 2000,
      intervalMs: 100,
    });

    if (adButton) {
      adButton.click();
    }

    sendMessageBackground({
      id: 'analytics',
      value: {
        method: 3,
        status: 1,
      },
    });

    debug('m3', 1);
  } catch (e) {
    sendMessageBackground({
      id: 'analytics',
      value: {
        method: 3,
        status: 0,
      },
    });

    debug('m3', 0);
    console.error(e);
  }
}

export async function skipAd() {
  if (!getOption('block-ads')) {
    return;
  }
  debug('skipAd');

  // Method 1 - report the video (inappropriate, repetitive, irrelevant)
  // this method only works in english language
  await m1();

  // Method 2 - click the announcement skip button that appears after 5 seconds
  m2();

  // Method 3 - advance 5 seconds and force it to end
  await m3();
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
