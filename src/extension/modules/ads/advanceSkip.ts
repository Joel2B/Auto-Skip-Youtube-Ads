import { getOption } from 'extension/modules/data';
import { sendMessageBackground } from 'utils/chrome/runtime';
import { deepQuerySelectorAll } from 'utils/query';
import { waitFor } from 'utils/utils';

function getBufferRemaining(media: HTMLVideoElement) {
  const ct = media.currentTime;
  const b = media.buffered;

  for (let i = 0; i < b.length; i++) {
    const start = b.start(i);
    const end = b.end(i);

    if (ct >= start && ct <= end) {
      return end - ct;
    }
  }

  return 0;
}

function isAdsEmpty(ads: HTMLElement[] | null): boolean {
  return !ads || ads.length === 0 || ads.every((el) => el.innerHTML.trim() === '');
}

export async function advanceSkip() {
  if (!getOption('m3')) {
    return;
  }

  console.log('advanceSkip');

  try {
    const ad = deepQuerySelectorAll<HTMLElement | null>('.ytp-ad-module');
    console.log(ad);

    if (isAdsEmpty(ad)) {
      return;
    }

    const video: HTMLVideoElement | null = document.querySelector('video');
    console.log(video);

    const ready = await waitFor(() => (video.readyState >= 3 && Number.isFinite(video.duration) ? true : null), {
      timeoutMs: 2000,
      intervalMs: 100,
    });

    if (ready && !isAdsEmpty(ad)) {
      const bufferRemaining = getBufferRemaining(video);
      console.log(video.currentTime, bufferRemaining, video.duration);

      video.pause();
      video.currentTime += bufferRemaining / 2;
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
