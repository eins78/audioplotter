export default function Try<T>(fn: () => T, onErr?: (err: unknown) => void): T | undefined {
  try {
    return fn()
  } catch (err) {
    typeof onErr === 'function' && onErr(err)
  }
}

export function Crashable<T>(fn: () => T): () => T | undefined {
  return () => Try(fn)
}
