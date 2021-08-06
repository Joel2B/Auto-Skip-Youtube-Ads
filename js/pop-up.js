let setLocalStorage = (key, value) => {
    chrome.storage.local.set({
        [key]: value
    });
}

let getLocalStorage = (key, callback) => {
    chrome.storage.local.get(key, result => {
        callback(result[key]);
    });
}

let createSelect = (selectOptions) => {
    const id = selectOptions.id;
    getLocalStorage(id, result => {
        let selectedOption;
        if (!result) {
            selectedOption = selectOptions.getAttribute('placeholder');
            setLocalStorage(id, selectedOption);
        } else {
            selectedOption = result;
        }

        let optionsHTML = '<div class="' + selectOptions.classList[0] + '">';
        optionsHTML += '<span class="custom-select-trigger">' + selectedOption + '</span>';
        optionsHTML += '<div class="custom-options"><div>';
        for (let i = 0; i < selectOptions.options.length; i++) {
            optionsHTML += '<span class="custom-option">' + selectOptions.options[i].textContent + '</span>';
        }
        optionsHTML += '</div></div></div>';

        selectOptions.style.display = 'none';
        selectOptions.removeAttribute('class');
        selectOptions.removeAttribute('id');

        let customSelect = document.createElement('div');
        customSelect.className = 'custom-select-wrapper';
        customSelect.id = id;

        selectOptions.insertAdjacentElement('afterend', customSelect);
        selectOptions.remove();
        document.querySelector(`#${id}.custom-select-wrapper`).innerHTML = selectOptions.outerHTML + optionsHTML;

        let customOption = document.querySelectorAll(`#${id} .custom-option`);
        for (const option of customOption) {
            if (option.textContent == selectedOption) {
                option.classList.add('selected');
                break;
            }
        }

        let customOptions = document.querySelector(`#${id} .custom-options div`);
        customOptions.addEventListener('mouseenter', () => {
            customOptions.setAttribute('tabindex', -1);
            customOptions.focus();
        }, false);
        customOptions.addEventListener('mouseleave', () => {
            customOptions.removeAttribute('tabindex');
        }, false);
        customOptions.addEventListener('keypress', e => {
            let customOption = document.querySelectorAll(`#${id} .custom-option`);
            for (let i = 0; i < customOption.length; i++) {
                if (e.key.toLowerCase() == customOption[i].textContent.toLowerCase()) {
                    document.querySelectorAll(`#${id} .custom-option`)[i].scrollIntoView();
                    break;
                }
            }
        }, false);

        document.querySelector(`#${id} .custom-select`).addEventListener('click', e => {
            if (e.target.parentNode.classList.toggle('opened')) {
                let customOption = document.querySelectorAll(`#${id} .custom-option`);
                for (const option of customOption) {
                    if (/selected/.test(option.className)) {
                        option.scrollIntoView();
                    }
                }
            }
        }, false);

        document.querySelector(`#${id} .custom-options`).addEventListener('click', e => {
            setLocalStorage(id, e.target.textContent);
            let customOption = document.querySelectorAll(`#${id} .custom-option`);
            for (const option of customOption) {
                if (/selected/.test(option.className)) {
                    option.classList.remove('selected');
                }
            }
            e.target.classList.add('selected');
            e.target.parentNode.parentNode.parentNode.classList.remove('opened');
            document.querySelector(`#${id} .custom-select-trigger`).textContent = e.target.textContent;
        }, false);
    });
}

let loadAnalytics = () => {
    getLocalStorage('analytics', result => {
        let analytics;
        if (!result) {
            analytics = {
                methods: {
                    1: {
                        error: 0,
                        success: 0
                    },
                    2: {
                        error: 0,
                        success: 0
                    },
                    3: {
                        error: 0,
                        success: 0
                    }
                },
                others: {
                    overlayAds: 0,
                }
            }
            setLocalStorage('analytics', analytics);
        } else {
            analytics = result;
        }

        // we show the data
        for (const data in analytics) {
            if (data == 'methods') {
                for (const id in analytics[data]) {
                    for (const status in analytics[data][id]) {
                        const quantity = analytics[data][id][status]
                        // total -> errors / successes
                        let total = document.querySelector(`#m${id} .total`);
                        total.textContent = Number(total.textContent) + quantity;
                        // insert quantity -> error / success
                        document.querySelector(`#m${id} .${status}`).textContent = quantity;
                        // totals -> errors / successes
                        let totals = document.querySelector(`#totals .${status}`);
                        totals.textContent = Number(totals.textContent) + quantity;
                        // totals of all
                        let totalsAll = document.querySelector(`#totals .total`);
                        totalsAll.textContent = Number(totalsAll.textContent) + quantity;
                    }
                }
            } else if (data == 'others') {
                document.getElementById('overlay-ads').textContent = analytics[data]['overlayAds'];
            }
        }
    });
}

const selectOptions = document.querySelectorAll('.custom-select');
const inputs = document.querySelectorAll('.tab-content input');
const options = document.querySelectorAll('.nav-tabs li');
const tabs = document.querySelectorAll('.tab-content .tab-pane');
const manifest = chrome.runtime.getManifest();

document.querySelector('.tab-content').addEventListener('change', (e) => {
    const id = e.target.id;
    const input = document.getElementById(id);
    setLocalStorage(id, input.checked);
    if (id == 'extension') {
        chrome.tabs.query({
            url: manifest.content_scripts[0].matches
        }, (tabs) => {
            for (let i = 0; i < tabs.length; i++) {
                chrome.tabs.sendMessage(tabs[i].id, {
                    action: 'extension',
                    value: input.checked
                });
            }
        });
    }
}, false);

document.querySelector('.nav').addEventListener('click', (e) => {
    if (e.target.nodeName == 'A') {
        for (const [index, option] of options.entries()) {
            if (option.className == 'active') {
                option.classList.remove('active');
                tabs[index].classList.remove('active');
                break;
            }
        }
        e.target.parentNode.classList.add('active');
        for (const [index, option] of options.entries()) {
            if (option.className == 'active') {
                tabs[index].classList.add('active');
                break;
            }
        }
    }
}, false);

for (const select of selectOptions) {
    createSelect(select);
}

for (const input of inputs) {
    getLocalStorage(input.id, result => {
        document.getElementById(input.id).checked = result;
    });
}

loadAnalytics();