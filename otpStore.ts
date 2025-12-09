// otpStore.ts  (in project root, NOT inside app/)
export type OtpRecord = { code: string; expiresAt: number };

// single shared in‑memory store
export const otpStore = new Map<string, OtpRecord>();
