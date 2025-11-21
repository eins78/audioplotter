/**
 * Safely execute a function and catch any errors
 * @param fn - Function to execute
 * @param onErr - Optional error handler callback
 * @returns Result of fn() or undefined if error occurred
 */
export default function Try<T>(fn: () => T, onErr?: (err: unknown) => void): T | undefined {
  try {
    return fn()
  } catch (err) {
    typeof onErr === 'function' && onErr(err)
  }
}

/**
 * Wrap a function to make it crash-safe
 * @param fn - Function to wrap
 * @returns Wrapped function that catches all errors
 */
export function Crashable<T>(fn: () => T): () => T | undefined {
  return () => Try(fn)
}
