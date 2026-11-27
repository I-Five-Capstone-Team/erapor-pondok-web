export function getDatabaseErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null) return fallback;

  const details: string[] = [];
  if ("message" in error && typeof error.message === "string") {
    details.push(error.message);
  }
  if ("details" in error && typeof error.details === "string") {
    details.push(error.details);
  }
  if ("hint" in error && typeof error.hint === "string") {
    details.push(error.hint);
  }
  if ("code" in error && typeof error.code === "string") {
    details.push(error.code);
  }

  return details.length > 0 ? `${fallback} ${details.join(" — ")}` : fallback;
}
