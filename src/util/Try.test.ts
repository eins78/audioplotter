import { describe, it, expect, vi } from 'vitest'
import Try, { Crashable } from './Try'

describe('Try', () => {
  it('returns the value when function succeeds', () => {
    const result = Try(() => 42)
    expect(result).toBe(42)
  })

  it('returns undefined when function throws and no error handler provided', () => {
    const result = Try(() => {
      throw new Error('test error')
    })
    expect(result).toBeUndefined()
  })

  it('calls error handler when function throws', () => {
    const errorHandler = vi.fn()
    const testError = new Error('test error')

    Try(() => {
      throw testError
    }, errorHandler)

    expect(errorHandler).toHaveBeenCalledOnce()
    expect(errorHandler).toHaveBeenCalledWith(testError)
  })

  it('returns undefined after calling error handler', () => {
    const result = Try(
      () => {
        throw new Error('test error')
      },
      () => {
        // error handler
      },
    )
    expect(result).toBeUndefined()
  })

  it('preserves return type for successful execution', () => {
    const stringResult = Try(() => 'hello')
    const numberResult = Try(() => 123)
    const objectResult = Try(() => ({ key: 'value' }))

    expect(stringResult).toBe('hello')
    expect(numberResult).toBe(123)
    expect(objectResult).toEqual({ key: 'value' })
  })
})

describe('Crashable', () => {
  it('wraps a successful function', () => {
    const fn = () => 'success'
    const wrapped = Crashable(fn)

    expect(wrapped()).toBe('success')
  })

  it('returns undefined when wrapped function throws', () => {
    const fn = () => {
      throw new Error('test error')
    }
    const wrapped = Crashable(fn)

    expect(wrapped()).toBeUndefined()
  })

  it('creates a function that can be called multiple times', () => {
    let counter = 0
    const fn = () => ++counter
    const wrapped = Crashable(fn)

    expect(wrapped()).toBe(1)
    expect(wrapped()).toBe(2)
    expect(wrapped()).toBe(3)
  })
})
