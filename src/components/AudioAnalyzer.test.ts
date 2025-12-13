import { describe, it, expect } from 'vitest'
import { normalizeData, MIN_BANDS, MAX_BANDS, DEFAULT_BANDS } from './AudioAnalyzer'

describe('AudioAnalyzer constants', () => {
  it('has correct MIN_BANDS', () => {
    expect(MIN_BANDS).toBe(1)
  })

  it('has correct MAX_BANDS', () => {
    expect(MAX_BANDS).toBe(2048)
  })

  it('has correct DEFAULT_BANDS', () => {
    expect(DEFAULT_BANDS).toBe(1024)
  })
})

describe('normalizeData', () => {
  it('scales values to 0-1 range', () => {
    const input = [10, 20, 30, 40, 50]
    const result = normalizeData(input)

    // Expect max value to be 1
    expect(Math.max(...result)).toBeCloseTo(1.0, 5)

    // Check each value is correctly scaled
    expect(result.at(0)).toBeCloseTo(0.2, 5)
    expect(result.at(1)).toBeCloseTo(0.4, 5)
    expect(result.at(2)).toBeCloseTo(0.6, 5)
    expect(result.at(3)).toBeCloseTo(0.8, 5)
    expect(result.at(4)).toBeCloseTo(1.0, 5)
  })

  it('handles single value', () => {
    const input = [42]
    const result = normalizeData(input)

    expect(result.at(0)).toBe(1)
    expect(result.length).toBe(1)
  })

  it('handles all zeros correctly', () => {
    const input = [0, 0, 0]
    const result = normalizeData(input)

    // Infinity * 0 = NaN in JavaScript
    expect(result.every((n) => Number.isNaN(n))).toBe(true)
  })

  it('preserves array length', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const result = normalizeData(input)

    expect(result.length).toBe(input.length)
  })

  it('handles decimal values', () => {
    const input = [0.5, 1.5, 2.5]
    const result = normalizeData(input)

    expect(Math.max(...result)).toBeCloseTo(1.0, 5)
    expect(result.at(0)).toBeCloseTo(0.2, 5)
    expect(result.at(1)).toBeCloseTo(0.6, 5)
    expect(result.at(2)).toBeCloseTo(1.0, 5)
  })

  it('handles very small values', () => {
    const input = [0.001, 0.002, 0.003]
    const result = normalizeData(input)

    expect(Math.max(...result)).toBeCloseTo(1.0, 5)
    expect(result.at(2)).toBeCloseTo(1.0, 5)
  })

  it('handles very large values', () => {
    const input = [1000, 2000, 3000]
    const result = normalizeData(input)

    expect(Math.max(...result)).toBeCloseTo(1.0, 5)
    expect(result.at(2)).toBeCloseTo(1.0, 5)
  })

  it('maintains relative proportions', () => {
    const input = [5, 10, 15, 20]
    const result = normalizeData(input)

    // Each value should be double the previous
    expect(result.at(1)).toBeCloseTo((result.at(0) ?? 0) * 2, 5)
    expect(result.at(2)).toBeCloseTo((result.at(1) ?? 0) * 1.5, 5)
  })
})

// Note: filterData tests are complex due to Web Audio API dependencies
// These are better tested via component tests in browser mode or E2E tests
// where real AudioContext and AudioBuffer are available
