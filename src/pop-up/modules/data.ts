import { getLocalStorage, setLocalStorage } from 'utils/chrome/storage';
import { sendMessage } from 'utils/chrome/runtime';

export function setValue(id: string, value: unknown) {
    setLocalStorage(id, value);
    sendMessage({
        id: id,
        value: value,
    });
}

export async function getValue<T = unknown>(id: string) {
    return (await getLocalStorage(id)) as T;
}
