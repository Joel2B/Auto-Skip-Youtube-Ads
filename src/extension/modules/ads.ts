import { getOption } from 'extension/modules/data';
import { sendMessageBackground } from 'utils/chrome/runtime';
import { debug } from 'extension/modules/debug';

let methodExecuted = false;

const delay = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

type DeepRoot = Document | ShadowRoot | Element;

function isElement(node: unknown): node is Element {
  return node instanceof Element;
}

function isParentNode(node: unknown): node is ParentNode {
  return !!node && typeof (node as ParentNode).querySelector === 'function';
}

export function deepQuerySelector<T extends Element = Element>(selector: string, root: DeepRoot = document): T | null {
  return deepQuery<T>(selector, { all: false, root }) as T | null;
}

export function deepQuerySelectorAll<T extends Element = Element>(selector: string, root: DeepRoot = document): T[] {
  return deepQuery<T>(selector, { all: true, root }) as T[];
}

function deepQuery<T extends Element>(selector: string, opts: { all: boolean; root: DeepRoot }): T[] | T | null {
  const { all, root } = opts;

  const results: T[] = [];
  const seenEl = new WeakSet<Element>();
  const seenCtx = new WeakSet<object>();
  const stack: DeepRoot[] = [root];

  const pushCtx = (ctx: DeepRoot | null | undefined) => {
    if (!ctx) return;
    const key = ctx as unknown as object;
    if (!seenCtx.has(key)) {
      seenCtx.add(key);
      stack.push(ctx);
    }
  };

  while (stack.length) {
    const ctx = stack.pop()!;

    // 1) Buscar en este contexto
    if (isParentNode(ctx)) {
      try {
        if (!all) {
          const hit = ctx.querySelector(selector);
          return (hit as T) ?? null;
        } else {
          ctx.querySelectorAll(selector).forEach((el) => {
            if (!seenEl.has(el)) {
              seenEl.add(el);
              results.push(el as T);
            }
          });
        }
      } catch {
        // selector inválido o contexto raro
      }

      // 2) Recorrer elementos para entrar a shadowRoots/iframes
      let nodes: NodeListOf<Element> | null = null;
      try {
        nodes = ctx.querySelectorAll('*');
      } catch {
        nodes = null;
      }

      if (nodes) {
        for (const el of nodes) {
          // Shadow DOM
          if ((el as Element).shadowRoot) pushCtx((el as Element).shadowRoot!);

          // Iframes/frames (solo same-origin)
          const tag = el.tagName;
          if (tag === 'IFRAME' || tag === 'FRAME') {
            const frame = el as HTMLIFrameElement | HTMLFrameElement;
            try {
              // cross-origin -> throw al acceder
              const doc = frame.contentDocument;
              if (doc) pushCtx(doc);
            } catch {
              // ignore cross-origin frames
            }
          }
        }
      }
    } else if (isElement(ctx)) {
      // Por si root llega como Element que no implementa ParentNode (raro)
      if ((ctx as Element).shadowRoot) pushCtx((ctx as Element).shadowRoot!);
    }
  }

  return all ? results : null;
}

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
    await delay(2000);

    const blockButton = deepQuerySelectorAll<HTMLElement | null>('button').find((el) =>
      el.textContent.includes('Block'),
    );

    await delay(2000);

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
