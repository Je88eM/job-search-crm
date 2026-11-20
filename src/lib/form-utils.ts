// Helpers for reading and validating form fields in Server Actions.

/** Trimmed text, or null when empty. Long values are cut to `max` characters. */
export function text(formData: FormData, key: string, max = 2000): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value ? value.slice(0, max) : null;
}

/** Returns the value only if it is one of the allowed options. */
export function oneOf<T extends string>(formData: FormData, key: string, allowed: readonly T[], fallback: T): T {
  const value = String(formData.get(key) ?? "");
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/**
 * Normalizes a web address. Adds https:// when missing and rejects anything that isn't http(s),
 * so a stored value can never become a `javascript:` link.
 */
export function url(formData: FormData, key: string): { value: string | null; error: string | null } {
  const raw = text(formData, key, 500);
  if (!raw) return { value: null, error: null };
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return { value: null, error: "Links must start with http:// or https://." };
    }
    return { value: parsed.toString(), error: null };
  } catch {
    return { value: null, error: `"${raw}" doesn't look like a web address.` };
  }
}

/** Only render stored links that are plain http(s). */
export function safeHref(value: string | null): string | null {
  return value && /^https?:\/\//i.test(value) ? value : null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function uuid(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "");
  return UUID.test(value) ? value : null;
}
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

/** URL search params can repeat (?q=a&q=b); use the first value. */
export function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
