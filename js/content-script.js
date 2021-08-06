let getOption = (value, callback) => {
    try {
        chrome.runtime.sendMessage({
            action: 'get',
            value: value
        }, response => {
            callback(response);
        });
    } catch (error) {
        console.log('[Extension]', error);
    }
}

let setOption = value => {
    try {
        chrome.runtime.sendMessage({
            action: 'set',
            value: value
        });
    } catch (error) {
        console.log('[Extension]', error);
    }
}

let skipAd = () => {
    if (!document.querySelector('.ad-showing')) {
        return;
    }
    if (!document.querySelector('.video-ads.ytp-ad-module')) {
        return;
    }

    let methodExecuted = false;

    // Method 1 - report the video (inappropriate, repetitive, irrelevant)
    // this method only works in english language
    getOption('m1', status => {
        if (!status || methodExecuted) {
            return;
        }

        getOption('report-selection', data => {
            if (
                document.querySelector('.ytp-ad-button-icon') &&
                document.querySelector('.ytp-ad-info-dialog-mute-container')
            ) {
                document.querySelector('.ytp-ad-button-icon').click();
                document.querySelector('.ytp-ad-button.ytp-ad-info-dialog-mute-button.ytp-ad-button-link').click();

                if (!document.querySelector('.ytp-ad-feedback-dialog-confirm-button')) {
                    return;
                }

                const options = document.getElementsByClassName('ytp-ad-feedback-dialog-reason-text');
                for (const option of options) {
                    if (option.textContent == data) {
                        option.click();
                        setTimeout(() => {
                            const confirmButton = document.querySelector('.ytp-ad-feedback-dialog-confirm-button');
                            if (confirmButton) {
                                confirmButton.click();
                                setOption({
                                    id: 'analytics',
                                    method: 1,
                                    status: 1
                                });
                                methodExecuted = true;
                            }
                        }, 500);
                        break;
                    }
                }
            } else {
                setOption({
                    id: 'analytics',
                    method: 1,
                    status: 0
                });
            }
        });
    });

    getOption('m2', status => {
        if (!status || methodExecuted) {
            return;
        }
        // Method 2 - click the announcement skip button that appears after 5 seconds
        if (document.querySelector('video') && document.querySelector('.ytp-ad-skip-button.ytp-button')) {
            for (let i = 0; i < 5; i++) {
                document.querySelector('video').currentTime += 1;
            }
            document.querySelector('.ytp-ad-skip-button.ytp-button').click();
            setOption({
                id: 'analytics',
                method: 2,
                status: 1
            });
            methodExecuted = true;
        } else {
            setOption({
                id: 'analytics',
                method: 2,
                status: 0
            });
        }
    });

    getOption('m3', status => {
        if (!status || methodExecuted) {
            return;
        }
        const video = document.querySelector('video');
        if (video) {
            // Method 3 - advance 5 seconds and force it to end
            if (isFinite(video.duration)) {
                for (let i = 0; i < 5; i++) {
                    video.currentTime += 1;
                }
                video.currentTime = video.duration;
                setOption({
                    id: 'analytics',
                    method: 3,
                    status: 1
                });
                methodExecuted = true;
            }
        } else {
            setOption({
                id: 'analytics',
                method: 3,
                status: 0
            });
        }
    });
}

let startObserver = () => {
    getOption('block-ads', val => {
        if (val) {
            skipAd();
        }
    });

    let callback = mutationsList => {
        for (const mutation of mutationsList) {
            if (
                mutation.target.className == 'ytp-ad-player-overlay' &&
                mutation.target.className == 'ytp-ad-player-overlay-instream-info' ||
                mutation.target.className == 'ytp-ad-simple-ad-badge' ||
                mutation.target.className == 'video-ads ytp-ad-module'
            ) {
                getOption('block-ads', val => {
                    if (val) {
                        skipAd();
                    }
                });
            } else if (
                mutation.target.className == 'ytp-ad-overlay-container' ||
                mutation.target.className == 'ytp-ad-text-overlay' ||
                /ytp-ad-overlay-open/.test(mutation.target.className)
            ) {
                getOption('block-overlays-ads', val => {
                    if (val) {
                        const closeButton = document.querySelector('.ytp-ad-overlay-close-button');
                        if (closeButton) {
                            closeButton.click();
                            setOption({
                                id: 'analytics',
                                data: 'overlayAds'
                            });
                        }
                    }
                });
            }
        }
    };

    let observer;
    const targetNode = document.querySelector('#movie_player');
    if (targetNode) {
        const config = {
            attributes: true,
            childList: true,
            subtree: true
        };

        observer = new MutationObserver(callback);
        observer.observe(targetNode, config);
        console.log('[Extension] Observer connected');
    }

    return observer;
}

let disconnectObserver = (observer) => {
    observer.disconnect();
    console.log('[Extension] Observer disconnected');
}

window.addEventListener('load', () => {
    let observer;

    getOption('extension', val => {
        if (val) {
            observer = startObserver();
            if (!observer) {
                console.log('[Extension] Observer error');
                let timer = setInterval(() => {
                    console.log('[Extension] Trying to connect the observer');
                    observer = startObserver();
                    if (observer) {
                        clearInterval(timer);
                    }
                }, 1000);
            }
        }
    });

    chrome.runtime.onMessage.addListener(
        request => {
            if (request.action == 'extension') {
                if (request.value) {
                    observer = startObserver();
                } else {
                    disconnectObserver(observer);
                }
            }
        }
    );
}, false);