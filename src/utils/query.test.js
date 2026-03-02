function isElement(node) {
  return node instanceof Element;
}
function isParentNode(node) {
  return !!node && typeof node.querySelector === 'function';
}

function deepQuerySelectorAll(selector, root = document) {
  return deepQuery(selector, { all: true, root });
}

function deepQuerySelector(selector, root = document) {
  return deepQuery(selector, { all: false, root });
}

function deepQuery(selector, opts) {
  const { all, root } = opts;

  const results = [];
  const seenEl = new WeakSet();
  const seenCtx = new WeakSet();
  const stack = [root];

  const pushCtx = (ctx) => {
    if (!ctx) return;

    const key = ctx;

    if (!seenCtx.has(key)) {
      seenCtx.add(key);
      stack.push(ctx);
    }
  };

  while (stack.length) {
    const ctx = stack.pop();

    if (isParentNode(ctx)) {
      try {
        if (!all) {
          const hit = ctx.querySelector(selector);
          return hit ?? null;
        } else {
          ctx.querySelectorAll(selector).forEach((el) => {
            if (!seenEl.has(el)) {
              seenEl.add(el);
              results.push(el);
            }
          });
        }
      } catch {}

      let nodes = null;

      try {
        nodes = ctx.querySelectorAll('*');
      } catch {
        nodes = null;
      }

      if (nodes) {
        for (const el of nodes) {
          if (el.shadowRoot) pushCtx(el.shadowRoot);

          const tag = el.tagName;

          if (tag === 'IFRAME' || tag === 'FRAME') {
            const frame = el;

            try {
              const doc = frame.contentDocument;
              if (doc) pushCtx(doc);
            } catch {}
          }
        }
      }
    } else if (isElement(ctx)) {
      if (ctx.shadowRoot) pushCtx(ctx.shadowRoot);
    }
  }

  return all ? results : null;
}
