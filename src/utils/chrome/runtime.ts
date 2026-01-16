import type { AnalyticsMessage, ExtensionMessage, OptionMessage } from 'types/messages';

export function onMessage(callback: (request: ExtensionMessage) => void, keepAlive = false) {
  try {
    chrome.runtime.onMessage.addListener((request) => {
      console.log('onMessage', request, keepAlive);
      callback(request);

      if (keepAlive) {
        return true;
      }
    });
  } catch (error) {
    console.error(error);
  }
}

export function sendMessage(value: OptionMessage) {
  try {
    console.log('sendMessage', value);
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
    console.error(error);
  }
}

export function sendMessageBackground(value: AnalyticsMessage) {
  try {
    console.log('sendMessageBackground', value);
    chrome.runtime.sendMessage(value);
  } catch (error) {
    console.error(error);
  }
}
