/* global chrome */
export function setLocalStorage(key: string, value: unknown) {
  chrome.storage.local.set({
    [key]: value,
  });
}

export async function getLocalStorage<T = unknown>(key: string): Promise<T | null> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(key, (value) => {
        const storedValue = value[key] as T | undefined;
        resolve((storedValue ?? null) as T | null);
      });
    } catch (ex) {
      reject(ex);
    }
  });
}

export async function getAllLocalStorage(): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(null, (options) => {
        resolve(options);
      });
    } catch (ex) {
      reject(ex);
    }
  });
}
