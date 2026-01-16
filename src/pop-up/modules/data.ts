import { getLocalStorage, setLocalStorage } from 'utils/chrome/storage';
import { sendMessage } from 'utils/chrome/runtime';
import type { OptionValue } from 'types/messages';

export function setValue(id: string, value: OptionValue) {
  setLocalStorage(id, value);

  sendMessage({
    id: id,
    value: value,
  });
}

export async function getValue<T = unknown>(id: string) {
  return (await getLocalStorage(id)) as T;
}
