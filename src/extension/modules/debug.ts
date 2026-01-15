export function debug(...data: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Debug]', ...data);
  }
}
export function msg(...data: unknown[]) {
  console.log('[Extension]', ...data);
}
