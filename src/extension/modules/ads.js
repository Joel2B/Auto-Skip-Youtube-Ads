import { getOption } from 'extension/modules/data';
import { sendMessageBackground } from 'utils/chrome/runtime';
import { debug } from 'extension/modules/debug';

let methodExecuted;

const delay = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

async function m1() {
    if (!getOption('m1')) {
        return;
    }

    const reportText = getOption('report-selection').split('#')[0];
    const confirmButton = document.querySelector('.ytp-ad-feedback-dialog-confirm-button');
    if (!confirmButton) {
        sendMessageBackground({
            id: 'analytics',
            value: {
                method: 1,
                status: 0,
            },
        });
        debug('m1', 0);
        return;
    }

    const reportButton = document.querySelectorAll(
        '.ytp-ad-clickable .ytp-ad-button-icon, .ytp-ad-info-dialog-mute-button',
    );
    if (reportButton.length != 2) {
        return;
    }
    reportButton[0].click();
    await delay(200);
    reportButton[1].click();

    const options = document.getElementsByClassName('ytp-ad-feedback-dialog-reason-text');
    for (const option of options) {
        if (option.textContent != reportText) {
            continue;
        }
        option.click();
        confirmButton.click();
        methodExecuted = true;
        sendMessageBackground({
            id: 'analytics',
            value: {
                method: 1,
                status: 1,
            },
        });
        debug('m1', 1);
    }
}

function m2() {
    if (!getOption('m2') || methodExecuted) {
        return;
    }

    const adSkipButton = document.querySelector('.ytp-ad-skip-button');
    const video = document.querySelector('video');
    if (!video || !adSkipButton) {
        sendMessageBackground({
            id: 'analytics',
            value: {
                method: 2,
                status: 0,
            },
        });
        debug('m2', 0);
        return;
    }

    for (let i = 0; i < 5; i++) {
        video.currentTime += 1;
    }
    adSkipButton.click();
    methodExecuted = true;
    sendMessageBackground({
        id: 'analytics',
        value: {
            method: 2,
            status: 1,
        },
    });
    debug('m2', 1);
}

function m3() {
    if (!getOption('m3') || methodExecuted) {
        return;
    }

    const ad = document.querySelectorAll(
        '.ytp-ad-player-overlay, .ytp-ad-player-overlay-instream-info, .ytp-ad-simple-ad-badge',
    );

    const video = document.querySelector('video');
    if (!video || !isFinite(video.duration) || ad.length == 0) {
        sendMessageBackground({
            id: 'analytics',
            value: {
                method: 3,
                status: 0,
            },
        });
        debug('m3', 0);
        return;
    }

    for (let i = 0; i < 5; i++) {
        video.currentTime += 1;
    }
    video.currentTime = video.duration;
    sendMessageBackground({
        id: 'analytics',
        value: {
            method: 3,
            status: 1,
        },
    });
    debug('m3', 1);
}

export function skipAd() {
    if (!getOption('block-ads')) {
        return;
    }
    debug('skipAd');

    // Method 1 - report the video (inappropriate, repetitive, irrelevant)
    // this method only works in english language
    m1();

    // Method 2 - click the announcement skip button that appears after 5 seconds
    m2();

    // Method 3 - advance 5 seconds and force it to end
    m3();
}

export function skipOverlay() {
    if (!getOption('block-overlays-ads')) {
        return;
    }
    debug('skipOverlay');

    const closeButton = document.querySelector('.ytp-ad-overlay-close-button');
    if (!closeButton) {
        return;
    }
    closeButton.click();
    sendMessageBackground({
        id: 'analytics',
        value: 'overlayAds',
    });
}
