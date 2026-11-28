import { hmacSha256Hex, timingSafeEqual } from "./crypto.js";

/**
 * Verifies a Stripe webhook signature header ("t=...,v1=...,v1=...") against the raw request body.
 * Rejects timestamps older (or newer) than `toleranceSec`, so a captured request cannot be replayed later.
 */
export async function verifyStripeSignature(rawBody, header, secret, nowSec, toleranceSec = 300) {
  if (!header || !secret) return false;
  let t = null;
  const sigs = [];
  for (const part of header.split(",")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k === "t") t = v;
    else if (k === "v1") sigs.push(v);
  }
  if (!t || !/^\d+$/.test(t) || sigs.length === 0) return false;
  if (Math.abs(nowSec - Number(t)) > toleranceSec) return false;
  const expected = await hmacSha256Hex(secret, `${t}.${rawBody}`);
  return sigs.some((s) => timingSafeEqual(s, expected));
}
