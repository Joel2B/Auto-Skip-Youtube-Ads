import { onMessage } from 'utils/chrome/runtime';
import { setOption, getAllOptions, getOption } from 'extension/modules/data';
import { skipAd, skipOverlay } from 'extension/modules/ads';
import { msg } from 'extension/modules/debug';

let observer;

const tasks = {
    extension: (value) => {
        if (value) {
            connectObserver();
        } else {
            disconnectObserver();
        }
    },
};

function performTask(id, value) {
    if (tasks[id]) {
        tasks[id](value);
    }
}

async function connectObserver() {
    const callback = (mutations) => {
        for (const mutation of mutations) {
            const cssClass = mutation.target.className;
            if (typeof cssClass != 'string') {
                continue;
            }

            if (
                (cssClass.includes('ytp-ad-player-overlay') &&
                    cssClass.includes('ytp-ad-player-overlay-instream-info')) ||
                cssClass.includes('ytp-ad-simple-ad-badge') ||
                (cssClass.includes('video-ads') && document.getElementsByClassName('video-ads')[0].innerHTML != '')
            ) {
                skipAd();
                return;
            }

            if (
                cssClass.includes('ytp-ad-overlay-container') ||
                cssClass.includes('ytp-ad-text-overlay') ||
                cssClass.includes('ytp-ad-overlay-open')
            ) {
                skipOverlay();
            }
        }
    };

    const playerAvailable = async () => {
        return new Promise((resolve) => {
            const timer = setInterval(() => {
                msg('Trying to connect the observer');
                const player = document.querySelector('#movie_player');
                if (player) {
                    clearInterval(timer);
                    resolve(player);
                }
            }, 50);
            setTimeout(() => {
                const player = document.querySelector('#movie_player');
                if (!player) {
                    clearInterval(timer);
                    msg('Observer error (time limit exceeded)');
                    resolve();
                }
            }, 10 * 1000);
        });
    };

    const player = await playerAvailable();
    if (!player) {
        return;
    }

    const config = {
        subtree: true,
        childList: true,
    };

    observer = new MutationObserver(callback);
    observer.observe(player, config);
    msg('Observer connected');
}

function disconnectObserver() {
    if (!observer) {
        return;
    }
    observer.disconnect();
    msg('Observer disconnected');
}

function restartExecution() {
    setInterval(() => {
        const url = window.location.href;
        if (getOption('curent-path') != url && url.includes('watch')) {
            if (observer) {
                disconnectObserver();
                setOption('subtitlesActivated', false);
            }
            connectObserver();
        }
        if (getOption('curent-path') != url) {
            setOption('curent-path', url);
        }
    }, 100);
}

async function app() {
    await getAllOptions();

    if (!getOption('curent-path')) {
        setOption('curent-path', window.location.href);
        restartExecution();
    }

    onMessage((request) => {
        const id = request.id;
        if (id == 'analytics') {
            return;
        }
        const value = request.value;
        setOption(id, value);
        performTask(id, value);
    });

    const extension = getOption('extension');
    if (!extension) {
        return;
    }

    // load only in videos
    if (!window.location.href.includes('watch')) {
        return;
    }

    connectObserver();
}

app();
