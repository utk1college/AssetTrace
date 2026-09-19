const SESSION_CODE_CHARACTERS = 'ACDEFGHJKLMNPQRTUVWXYZ234679'
const SESSION_CODE_LENGTH = 6

/**
 * Generates a 6-character uppercase session code.
 *
 * Ambiguous characters are intentionally excluded:
 * 0/O, 1/I, 5/S, 8/B
 */
export function generateSessionCode(): string {
  let code = ''

  for (let i = 0; i < SESSION_CODE_LENGTH; i += 1) {
    const randomIndex = Math.floor(
      Math.random() * SESSION_CODE_CHARACTERS.length,
    )

    code += SESSION_CODE_CHARACTERS[randomIndex]
  }

  return code
}

/**
 * Validates the format of an AssetTrace session code.
 */
export function isValidSessionCode(code: string): boolean {
  if (code.length !== SESSION_CODE_LENGTH) {
    return false
  }

  return [...code].every((character) =>
    SESSION_CODE_CHARACTERS.includes(character),
  )
}