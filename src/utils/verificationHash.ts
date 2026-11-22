export function normalizeVerificationHash(hash: string | undefined): string | null {
  const normalized = hash?.trim().toLowerCase();
  return normalized && /^[a-f0-9]{64}$/.test(normalized) ? normalized : null;
}
