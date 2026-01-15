import { debug } from 'extension/modules/debug';
import type { AnalyticsMessage, ExtensionMessage, OptionMessage } from 'types/messages';

/* global chrome */
export function onMessage(callback: (request: ExtensionMessage) => void, keepAlive = false) {
    try {
        chrome.runtime.onMessage.addListener((request) => {
            debug('onMessage', request, keepAlive);
            callback(request);
            if (keepAlive) {
                return true;
            }
        });
    } catch (error) {
        debug(error);
    }
}

export function sendMessage(value: OptionMessage) {
    try {
        debug('sendMessage', value);
        const manifest = chrome.runtime.getManifest();
        chrome.tabs.query(
            {
                url: manifest.content_scripts[0].matches,
            },
            (tabs) => {
                for (const tab of tabs) {
                    if (tab.id != null) {
                        chrome.tabs.sendMessage(tab.id, value);
                    }
                }
            },
        );
    } catch (error) {
        debug(error);
    }
}

export function sendMessageBackground(value: AnalyticsMessage) {
    try {
        debug('sendMessageBackground', value);
        chrome.runtime.sendMessage(value);
    } catch (error) {
        debug(error);
    }
}
