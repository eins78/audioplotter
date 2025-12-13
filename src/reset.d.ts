/**
 * ts-reset: Improved TypeScript built-in types
 *
 * Makes TypeScript's default types stricter and more sensible:
 * - JSON.parse() returns 'unknown' instead of 'any'
 * - .filter(Boolean) properly narrows types
 * - .includes() works on readonly arrays
 * - fetch().json() returns 'unknown' for safer handling
 *
 * @see https://www.totaltypescript.com/ts-reset
 */
import '@total-typescript/ts-reset'
