import { describe, expect, it } from "vitest";
import { normalizeVerificationHash } from "../src/utils/verificationHash";

describe("normalizeVerificationHash", () => {
  it("accepts SHA-256 hex codes and normalizes letter case", () => {
    const hash = "A".repeat(64);
    expect(normalizeVerificationHash(hash)).toBe("a".repeat(64));
  });

  it("rejects malformed or missing codes", () => {
    expect(normalizeVerificationHash("not-a-hash")).toBeNull();
    expect(normalizeVerificationHash("a".repeat(63))).toBeNull();
    expect(normalizeVerificationHash(undefined)).toBeNull();
  });
});
