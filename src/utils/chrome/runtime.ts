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
        if (chrome.runtime.lastError) {
          console.warn('sendMessage query skipped:', chrome.runtime.lastError.message);
          return;
        }

        for (const tab of tabs) {
          if (tab.id == null) {
            continue;
          }

          chrome.tabs.sendMessage(tab.id, value, () => {
            if (!chrome.runtime.lastError) {
              return;
            }

            const error = chrome.runtime.lastError.message ?? '';

            if (
              error.includes('Receiving end does not exist') ||
              error.includes('The message port closed before a response was received')
            ) {
              return;
            }

            console.warn('sendMessage skipped:', error);
          });
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
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('Extension context invalidated')) {
      return;
    }

    console.error(error);
  }
}
