import { debug } from 'extension/modules/debug';

/* global chrome */
export function onMessage(callback, async) {
    try {
        chrome.runtime.onMessage.addListener((request) => {
            debug('onMessage', request, async);
            callback(request);
            if (async) {
                return true;
            }
        });
    } catch (error) {
        debug(error);
    }
}

export function sendMessage(value) {
    try {
        debug('sendMessage', value);
        const manifest = chrome.runtime.getManifest();
        chrome.tabs.query(
            {
                url: manifest.content_scripts[0].matches,
            },
            (tabs) => {
                for (const tab of tabs) {
                    chrome.tabs.sendMessage(tab.id, value);
                }
            },
        );
    } catch (error) {
        debug(error);
    }
}

export function sendMessageBackground(value) {
    try {
        debug('sendMessageBackground', value);
        chrome.runtime.sendMessage(value);
    } catch (error) {
        debug(error);
    }
}
