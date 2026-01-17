import { getOption } from 'extension/modules/data';
import { sendMessageBackground } from 'utils/chrome/runtime';
import { deepQuerySelectorAll } from 'utils/query';
import { waitFor } from 'utils/utils';
import { status } from 'extension/modules/ads';

export async function useBlockButton() {
  if (!getOption('m1') || status.block) {
    return;
  }

  console.log('m1');

  try {
    const video: HTMLVideoElement = document.querySelector('#movie_player video');
    video.pause();

    const adInfoButton: HTMLElement | null = await waitFor(() => document.querySelector('.ytp-ad-button-icon'), {
      timeoutMs: 4000,
      intervalMs: 100,
      minMs: 1000,
    });

    console.log(adInfoButton);

    if (!adInfoButton) {
      throw new Error();
    }

    adInfoButton.click();

    let retry = 0;
    let modal: HTMLElement | null = null;

    while (true) {
      if (retry == 3) {
        throw new Error();
      }

      modal = await waitFor(() => deepQuerySelectorAll<HTMLElement | null>('[data-bucket="panel"]').at(-1), {
        timeoutMs: 1000,
        intervalMs: 200,
      });

      if (modal) break;

      adInfoButton.click();

      retry++;
      console.log(retry);
    }

    console.log(modal);

    const blockButton = await waitFor(
      () =>
        deepQuerySelectorAll<HTMLElement | null>('button').find(
          (el) => el.textContent.includes('Block') || el.textContent.includes('Bloquear'),
        ),
      {
        timeoutMs: 1000,
        intervalMs: 200,
      },
    );

    console.log(blockButton);

    if (!blockButton) {
      const closeButton = await waitFor(
        () => deepQuerySelectorAll<HTMLElement | null>('button').find((el) => el.innerHTML.includes('jsname')),
        {
          timeoutMs: 2000,
          intervalMs: 100,
        },
      );

      console.log(closeButton);

      closeButton?.click();
      throw new Error();
    }

    blockButton.click();

    const continueButton = await waitFor(() => deepQuerySelectorAll<HTMLElement | null>('[role="button"]').at(-1), {
      timeoutMs: 4000,
      intervalMs: 100,
      minMs: 2000,
    });

    console.log(continueButton);

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

    console.log(closeButton);

    closeButton?.click();

    sendMessageBackground({
      id: 'analytics',
      value: {
        method: 1,
        status: 1,
      },
    });
  } catch (e) {
    status.block = true;

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
