export default function Try(fn, onErr) {
  try {
    return fn()
  } catch (err) {
    typeof onErr === 'function' && onErr(err)
  }
}

export function Crashable(fn) {
  return () => Try(fn)
}
