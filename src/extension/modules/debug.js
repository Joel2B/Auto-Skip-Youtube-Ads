export function debug(...data) {
    if (process.env.NODE_ENV === 'development') {
        console.log('[Debug]', ...data);
    }
}
export function msg(...data) {
    console.log('[Extension]', ...data);
}
