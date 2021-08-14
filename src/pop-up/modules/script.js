import { getLocalStorage, setLocalStorage } from 'utils/chrome/storage';
import { createSelect } from 'pop-up/modules/selectOption';
import { sendMessage } from 'utils/chrome/runtime';

async function loadAnalytics() {
    let analytics = await getLocalStorage('analytics');
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
    for (const data in analytics) {
        if (data == 'methods') {
            for (const id in analytics[data]) {
                for (const status in analytics[data][id]) {
                    const quantity = analytics[data][id][status];
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
        } else {
            document.getElementById('overlayAds').textContent = analytics['overlayAds'];
        }
    }
}
async function app() {
    const selectOptions = document.querySelectorAll('.custom-select');
    const inputs = document.querySelectorAll('.tab-content input.cmn-toggle');
    const options = document.querySelectorAll('.tab-nav li');
    const tabs = document.querySelectorAll('.tab-content .tab-pane');

    document.querySelector('.tab-nav').addEventListener(
        'click',
        (e) => {
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
        },
        false,
    );

    for (const select of selectOptions) {
        createSelect(select);
    }

    for (const input of inputs) {
        const id = input.id;
        let value = await getLocalStorage(id);
        if (value == null) {
            value = true;
            setLocalStorage(id, value);
        }
        document.getElementById(id).checked = value;
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
