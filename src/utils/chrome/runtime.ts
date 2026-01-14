import { debug } from 'extension/modules/debug';

/* global chrome */
export function onMessage(callback: (request: any) => void, keepAlive = false) {
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

export function sendMessage(value: any) {
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

export function sendMessageBackground(value: any) {
    try {
        debug('sendMessageBackground', value);
        chrome.runtime.sendMessage(value);
    } catch (error) {
        debug(error);
    }
}
