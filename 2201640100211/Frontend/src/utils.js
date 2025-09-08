export function isValidAlias(a) {
  if (!a) return false;
  return /^[a-zA-Z0-9_-]{2,32}$/.test(a);
}
export function isValidUrl(u) {
  try {
    const url = new URL(u);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (e) {
    return false;
  }
}
export function nowMs() { return Date.now(); }
