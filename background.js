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

try {
    chrome.runtime.onMessage.addListener(
        (request, sender, sendResponse) => {
            if (request.action == 'get') {
                getLocalStorage(request.value, sendResponse);
            } else if (request.action == 'set') {
                const id = request.value.id;
                const value = request.value;
                if (id == 'analytics') {
                    getLocalStorage(id, analytics => {
                        const data = analytics;
                        if (value.method) {
                            if (value.status) {
                                data.methods[value.method].success += 1;
                            } else {
                                data.methods[value.method].error += 1;
                            }
                        } else {
                            data.others[value.data] += 1;
                        }
                        setLocalStorage(id, data);
                    });
                }
            }
            return true;
        }
    );
} catch (error) {
    console.log(error);
}
