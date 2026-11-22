import crypto from 'node:crypto';

// The QR on the organizer's screen changes every 30s, so a photo of it is
// useless to anyone who wasn't at the event.
export const SLOT_MS = 30_000;

export const currentSlot = (now = Date.now()) => Math.floor(now / SLOT_MS);

const digest = (secret, opportunityId, slot) =>
  crypto
    .createHmac('sha256', secret)
    .update(`${opportunityId}:${slot}`)
    .digest('hex')
    .slice(0, 16);

export const CODE_LENGTH = 6;

/**
 * The same signature rendered as digits, for volunteers who can't scan —
 * no camera, no camera permission, or they're on a laptop.
 */
const shortCode = (secret, opportunityId, slot) =>
  String(parseInt(digest(secret, opportunityId, slot).slice(0, 8), 16) % 10 ** CODE_LENGTH).padStart(
    CODE_LENGTH,
    '0'
  );

/** Token encoding the slot it was minted in, signed with the event's secret. */
export function mintCheckinToken(secret, opportunityId, now = Date.now()) {
  const slot = currentSlot(now);
  const token = Buffer.from(`${slot}.${digest(secret, opportunityId, slot)}`).toString('base64url');
  // Expires at the end of the NEXT slot: we accept one slot of lag for clock
  // skew and for the seconds between scanning and the request landing.
  return {
    token,
    code: shortCode(secret, opportunityId, slot),
    expiresAt: new Date((slot + 2) * SLOT_MS),
  };
}

/**
 * True when the token is a valid signature for the current or previous slot.
 * Constant-time compare so a wrong token can't be refined by timing.
 */
export function verifyCheckinToken(token, secret, opportunityId, now = Date.now()) {
  if (typeof token !== 'string' || !token) return false;

  const nowSlotForCode = currentSlot(now);
  const trimmed = token.trim();

  // A typed short code: accept the current slot or the previous one, same
  // window the scanned token gets.
  if (new RegExp(`^\\d{${CODE_LENGTH}}$`).test(trimmed)) {
    return [nowSlotForCode, nowSlotForCode - 1].some((slot) => {
      const expected = shortCode(secret, opportunityId, slot);
      const a = Buffer.from(trimmed);
      const b = Buffer.from(expected);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    });
  }

  let decoded;
  try {
    decoded = Buffer.from(token, 'base64url').toString('utf8');
  } catch {
    return false;
  }

  const [slotPart, signature] = decoded.split('.');
  const slot = Number(slotPart);
  if (!Number.isInteger(slot) || !signature) return false;

  const nowSlot = currentSlot(now);
  if (slot !== nowSlot && slot !== nowSlot - 1) return false;

  const expected = digest(secret, opportunityId, slot);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
