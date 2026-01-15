import '../css/styles.scss';
import { getLocalStorage, setLocalStorage } from 'utils/chrome/storage';
import { createSelect } from 'pop-up/modules/selectOption';
import { sendMessage } from 'utils/chrome/runtime';
import type { Analytics } from 'types/analytics';

async function loadAnalytics() {
    let analytics = await getLocalStorage<Analytics>('analytics');
    if (!analytics) {
        analytics = {
            methods: {
                1: {
                    error: 0,
                    success: 0,
                },
                2: {
                    error: 0,
                    success: 0,
                },
                3: {
                    error: 0,
                    success: 0,
                },
            },
            overlayAds: 0,
        };
        setLocalStorage('analytics', analytics);
    }

    // we show the data
    for (const [id, stats] of Object.entries(analytics.methods)) {
        for (const [status, quantity] of Object.entries(stats)) {
            // total -> errors / successes
            const total = document.querySelector<HTMLElement>(`#m${id} .total`);
            if (total) {
                total.textContent = String(Number(total.textContent) + quantity);
            }
            // insert quantity -> error / success
            const statusElement = document.querySelector<HTMLElement>(`#m${id} .${status}`);
            if (statusElement) {
                statusElement.textContent = String(quantity);
            }
            // totals -> errors / successes
            const totals = document.querySelector<HTMLElement>(`#totals .${status}`);
            if (totals) {
                totals.textContent = String(Number(totals.textContent) + quantity);
            }
            // totals of all
            const totalsAll = document.querySelector<HTMLElement>(`#totals .total`);
            if (totalsAll) {
                totalsAll.textContent = String(Number(totalsAll.textContent) + quantity);
            }
        }
    }
    const overlayAdsElement = document.getElementById('overlayAds');
    if (overlayAdsElement) {
        overlayAdsElement.textContent = String(analytics.overlayAds);
    }
}
async function app() {
    const selectOptions = document.querySelectorAll<HTMLSelectElement>('.custom-select');
    const inputs = document.querySelectorAll<HTMLInputElement>('.tab-content input.cmn-toggle');
    const options = document.querySelectorAll<HTMLLIElement>('.tab-nav li');
    const tabs = document.querySelectorAll<HTMLElement>('.tab-content .tab-pane');

    const tabNav = document.querySelector('.tab-nav');
    if (tabNav) {
        tabNav.addEventListener(
            'click',
            (event) => {
                const target = event.target as HTMLElement | null;
                if (!target || target.nodeName !== 'A') {
                    return;
                }
                const optionList = Array.from(options);
                const tabList = Array.from(tabs);
                for (const [index, option] of optionList.entries()) {
                    if (option.className == 'active') {
                        option.classList.remove('active');
                        tabList[index]?.classList.remove('active');
                        break;
                    }
                }
                const parent = target.parentElement;
                if (!parent) {
                    return;
                }
                parent.classList.add('active');
                for (const [index, option] of optionList.entries()) {
                    if (option.className == 'active') {
                        tabList[index]?.classList.add('active');
                        break;
                    }
                }
            },
            false,
        );
    }

    for (const select of Array.from(selectOptions)) {
        createSelect(select);
    }

    for (const input of Array.from(inputs)) {
        const id = input.id;
        let value = (await getLocalStorage(id)) as boolean | null;
        if (value == null) {
            value = true;
            setLocalStorage(id, value);
        }
        const inputElement = document.getElementById(id) as HTMLInputElement | null;
        if (inputElement) {
            inputElement.checked = value;
        }
        input.addEventListener(
            'change',
            () => {
                setLocalStorage(id, input.checked);
                sendMessage({
                    id: id,
                    value: input.checked,
                });
            },
            false,
        );
    }

    loadAnalytics();
}

app();
