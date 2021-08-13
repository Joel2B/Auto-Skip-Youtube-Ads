import { getLocalStorage, setLocalStorage } from 'utils/chrome/storage';
import { onMessage } from 'utils/chrome/runtime';

onMessage(async (request) => {
    const id = request.id;
    const value = request.value;
    if (id == 'analytics') {
        const data = await getLocalStorage(id);
        if (value.method) {
            if (value.status) {
                data.methods[value.method].success += 1;
            } else {
                data.methods[value.method].error += 1;
            }
        } else {
            data[value] += 1;
        }
        setLocalStorage(id, data);
    }
}, true);
