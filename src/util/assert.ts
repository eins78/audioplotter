/**
 * Runtime-safe utility functions for handling nullable values.
 * These functions never throw - they return sensible defaults instead.
 */

/**
 * Returns the value if defined, otherwise returns the fallback.
 * Use for nullable values that need a guaranteed non-null result.
 */
export function ensureDefined<T>(value: T | null | undefined, fallback: T): T {
  return value ?? fallback
}

/**
 * Safely converts a value to a number, returning fallback if invalid.
 * Handles: undefined, null, NaN, non-numeric strings.
 */
export function ensureNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value
  }
  const num = Number(value)
  return Number.isNaN(num) ? fallback : num
}
