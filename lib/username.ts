export function normalizeUsername(raw: string) {
  return raw.trim().toLowerCase();
}

export function isValidUsername(username: string) {
  return /^[a-z0-9_.]{3,20}$/.test(username);
}
