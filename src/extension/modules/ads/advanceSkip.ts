import { getOption } from 'extension/modules/data';
import { sendMessageBackground } from 'utils/chrome/runtime';
import { deepQuerySelectorAll } from 'utils/query';
import { delay, waitFor } from 'utils/utils';

export async function advanceSkip() {
  if (!getOption('m3')) {
    return;
  }

  console.log('advanceSkip');

  try {
    const ad = deepQuerySelectorAll<HTMLElement | null>('.ytp-ad-module');

    console.log(ad);

    if (!ad || ad.every((el) => el.innerHTML == '')) {
      return;
    }

    const video: HTMLVideoElement | null = document.querySelector('video');

    console.log(video);

    if (video && isFinite(video.duration)) {
      for (let i = 0; i < 3; i++) {
        video.currentTime += 1;
        await delay(100);
      }

      video.currentTime = video.duration;
    }

    const adButton = await waitFor(() => deepQuerySelectorAll<HTMLElement | null>('.ytp-skip-ad-button').at(-1), {
      timeoutMs: 2000,
      intervalMs: 100,
    });

    console.log(adButton);

    if (!adButton) {
      return;
    }

    const rect = adButton.getBoundingClientRect();
    const x = Math.max(0, Math.round(rect.left + rect.width / 2));
    const y = Math.max(0, Math.round(rect.top + rect.height / 2));

    sendMessageBackground({
      id: 'debugger-click',
      value: { x, y },
    });

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
