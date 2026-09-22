/**
 * Postgres helpers.
 */

/**
 * Encode strings as a Postgres text[] literal.
 *
 * Every element is quoted, so a value holding a comma, brace, quote or
 * backslash survives the round trip instead of splitting into several.
 */
export function toPgTextArray(values: string[]): string {
  const encoded = values.map(
    value => `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
  )

  return `{${encoded.join(',')}}`
}
