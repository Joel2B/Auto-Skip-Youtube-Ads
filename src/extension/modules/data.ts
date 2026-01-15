import { getAllLocalStorage } from 'utils/chrome/storage';
import type { OptionValue } from 'types/messages';

export let optionsPool: Record<string, unknown> = {};

export function getOption(id: string): OptionValue | undefined {
    return optionsPool[id] as OptionValue | undefined;
}

export function setOption(id: string, value: OptionValue) {
    optionsPool[id] = value;
}

export async function getAllOptions() {
    optionsPool = (await getAllLocalStorage()) as Record<string, unknown>;
}
