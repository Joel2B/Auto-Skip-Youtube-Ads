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
      } catch (e) {
        console.error(e);
      }

      let nodes: NodeListOf<Element> | null = null;
      try {
        nodes = ctx.querySelectorAll('*');
      } catch {
        nodes = null;
      }

      if (nodes) {
        for (const el of nodes) {
          if ((el as Element).shadowRoot) pushCtx((el as Element).shadowRoot!);

          const tag = el.tagName;

          if (tag === 'IFRAME' || tag === 'FRAME') {
            const frame = el as HTMLIFrameElement | HTMLFrameElement;

            try {
              const doc = frame.contentDocument;
              if (doc) pushCtx(doc);
            } catch (e) {
              console.error(e);
            }
          }
        }
      }
    } else if (isElement(ctx)) {
      if ((ctx as Element).shadowRoot) pushCtx((ctx as Element).shadowRoot!);
    }
  }

  return all ? results : null;
}
