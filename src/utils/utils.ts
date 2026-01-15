export const delay = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

type WaitForOpts = {
  timeoutMs?: number;
  intervalMs?: number;
  minMs?: number;
};

export async function waitFor<T>(
  getter: () => T | null | undefined,
  { timeoutMs = 2000, intervalMs = 100, minMs = 0 }: WaitForOpts = {},
): Promise<NonNullable<T> | null> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const v = getter();
      const elapsed = Date.now() - start;

      if (v != null && elapsed >= minMs) return v as NonNullable<T>;
    } catch (e) {
      console.error(e);
    }

    await delay(intervalMs);
  }

  return null;
}
