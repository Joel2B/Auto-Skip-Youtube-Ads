import type { ExtensionMessage, OptionMessage } from 'types/messages';

export function onMessage(
  callback: (request: ExtensionMessage, sender?: chrome.runtime.MessageSender) => void,
  keepAlive = false,
) {
  try {
    chrome.runtime.onMessage.addListener((request, sender) => {
      console.log('onMessage', request, keepAlive);
      callback(request, sender);

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

export function sendMessageBackground(value: ExtensionMessage) {
  try {
    console.log('sendMessageBackground', value);
    chrome.runtime.sendMessage(value);
  } catch (error) {
    console.error(error);
  }
}
