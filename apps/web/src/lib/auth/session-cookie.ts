export const SESSION_COOKIE_NAME = 'pf_session';

export function readSessionIdFromCookieHeader(cookieHeader: string | undefined): string | null {
  if (cookieHeader === undefined || cookieHeader.length === 0) {
    return null;
  }
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) {
      continue;
    }
    if (part.slice(0, separator).trim() !== SESSION_COOKIE_NAME) {
      continue;
    }
    const value = part.slice(separator + 1).trim();
    if (value.length === 0) {
      return null;
    }
    try {
      return decodeURIComponent(value);
    } catch {
      return null;
    }
  }
  return null;
}
