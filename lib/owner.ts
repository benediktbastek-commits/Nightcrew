export const OWNER_EMAIL = 'benedikt.bastek@gmx.de';

export function isOwnerEmail(email: string | undefined | null) {
  return email?.toLowerCase() === OWNER_EMAIL;
}
