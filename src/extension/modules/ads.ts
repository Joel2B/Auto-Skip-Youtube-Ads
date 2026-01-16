import { getOption } from 'extension/modules/data';
import { sendMessageBackground } from 'utils/chrome/runtime';
import { deepQuerySelector, deepQuerySelectorAll } from 'utils/query';
import { delay, waitFor } from 'utils/utils';

async function m1() {
  if (!getOption('m1')) {
    return;
  }

  console.log('m1');

  try {
    const video: HTMLVideoElement = document.querySelector('#movie_player video');
    video.pause();

    const adInfoButton: HTMLElement | null = await waitFor(() => document.querySelector('.ytp-ad-button-icon'), {
      timeoutMs: 4000,
      intervalMs: 100,
      minMs: 2000,
    });

    if (!adInfoButton) {
      throw new Error();
    }

    adInfoButton.click();

    let retry = 0;
    let blockButton: HTMLElement | null = null;

    while (true) {
      blockButton = await waitFor(
        () =>
          deepQuerySelectorAll<HTMLElement | null>('button').find(
            (el) => el.textContent.includes('Block') || el.textContent.includes('Bloquear'),
          ),
        {
          timeoutMs: 1000,
          intervalMs: 200,
        },
      );

      if (blockButton || retry == 5) break;

      console.log(retry);
      adInfoButton.click();

      retry++;
    }

    if (!blockButton) {
      const closeButton = await waitFor(
        () => deepQuerySelectorAll<HTMLElement | null>('button').find((el) => el.innerHTML.includes('jsname')),
        {
          timeoutMs: 2000,
          intervalMs: 100,
        },
      );

      closeButton?.click();
      throw new Error();
    }

    blockButton.click();

    const continueButton = await waitFor(() => deepQuerySelectorAll<HTMLElement | null>('[role="button"]').at(-1), {
      timeoutMs: 4000,
      intervalMs: 100,
      minMs: 2000,
    });

    if (!continueButton) {
      throw new Error();
    }

    continueButton.click();

    const closeButton = await waitFor(
      () => deepQuerySelectorAll<HTMLElement | null>('button').find((el) => el.innerHTML.includes('jsname')),
      {
        timeoutMs: 2000,
        intervalMs: 100,
        minMs: 1000,
      },
    );

    if (closeButton) {
      closeButton.click();
    }

    sendMessageBackground({
      id: 'analytics',
      value: {
        method: 1,
        status: 1,
      },
    });
  } catch (e) {
    sendMessageBackground({
      id: 'analytics',
      value: {
        method: 1,
        status: 0,
      },
    });

    console.error(e);
  }
}

function m2() {
  // if (!getOption('m2') || methodExecuted) {
  //   return;
  // }
  // const adSkipButton = document.querySelector('.ytp-ad-skip-button') as HTMLElement | null;
  // const video = document.querySelector('video') as HTMLVideoElement | null;
  // if (!video || !adSkipButton) {
  //   sendMessageBackground({
  //     id: 'analytics',
  //     value: {
  //       method: 2,
  //       status: 0,
  //     },
  //   });
  //   return;
  // }
  // for (let i = 0; i < 5; i++) {
  //   video.currentTime += 1;
  // }
  // adSkipButton.click();
  // methodExecuted = true;
  // sendMessageBackground({
  //   id: 'analytics',
  //   value: {
  //     method: 2,
  //     status: 1,
  //   },
  // });
  // debug('m2', 1);
}

async function m3() {
  if (!getOption('m3')) {
    return;
  }

  console.log('m3');

  try {
    await delay(1000);

    const ad = deepQuerySelector<HTMLElement | null>('.ytp-ad-module');

    if (!ad || ad.innerHTML == '') {
      return;
    }

    const video: HTMLVideoElement | null = document.querySelector('video');

    if (video && isFinite(video.duration)) {
      for (let i = 0; i < 5; i++) {
        video.currentTime += 1;
      }

      video.currentTime = video.duration;
    }

    const adButton = await waitFor(() => deepQuerySelector<HTMLElement | null>('.ytp-skip-ad-button'), {
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
  } catch (e) {
    sendMessageBackground({
      id: 'analytics',
      value: {
        method: 3,
        status: 0,
      },
    });

    console.error(e);
  }
}

export async function skipAd() {
  if (!getOption('block-ads')) {
    return;
  }

  console.log('skipAd init');

  // Method 1 - report the video (inappropriate, repetitive, irrelevant)
  // this method only works in english language
  await m1();

  // Method 2 - click the announcement skip button that appears after 5 seconds
  m2();

  // Method 3 - advance 5 seconds and force it to end
  await m3();

  const ad: HTMLElement | null = await waitFor(() => deepQuerySelector<HTMLElement | null>('.ytp-ad-module'), {
    timeoutMs: 4000,
    intervalMs: 100,
    minMs: 2000,
  });

  if (!ad || ad.innerHTML != '') {
    // await skipAd(true);
    return;
  }

  const closeButton = await waitFor(
    () => deepQuerySelectorAll<HTMLElement | null>('button[aria-label="Close"]').at(-1),
    {
      timeoutMs: 2000,
      intervalMs: 100,
      minMs: 1000,
    },
  );

  if (closeButton && closeButton.innerHTML.includes('svg')) {
    closeButton.click();
  }
}

export async function skipSurvey() {
  if (!getOption('block-overlays-ads')) {
    return;
  }

  const answerButton = await waitFor(
    () =>
      deepQuerySelectorAll<HTMLElement | null>('[class="ytp-ad-survey-answer"]')
        .filter(
          (o) => o.innerHTML.toLowerCase().includes('awful') || o.innerHTML.toLowerCase().includes('very dissatisfied'),
        )
        .at(-1),
    {
      timeoutMs: 4000,
      intervalMs: 100,
      minMs: 2000,
    },
  );

  answerButton?.click();

  sendMessageBackground({
    id: 'analytics',
    value: 'overlayAds',
  });
}
