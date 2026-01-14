import { getAllLocalStorage } from 'utils/chrome/storage';

export let optionsPool: Record<string, unknown> = {};

export function getOption<T = unknown>(id: string) {
    return optionsPool[id];
}

export function setOption(id: string, value: unknown) {
    optionsPool[id] = value;
}

export async function getAllOptions() {
    optionsPool = (await getAllLocalStorage()) as Record<string, unknown>;
}
