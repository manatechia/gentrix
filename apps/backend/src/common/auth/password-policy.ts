/**
 * Centralised password-policy enforcement. Used both when an admin resets a
 * password and when a forced user finishes their own change. Returning an
 * explicit list of violations lets the UI render them one by one instead of
 * a single opaque string.
 */
export const PASSWORD_MIN_LENGTH = 8;

export interface PasswordPolicyViolation {
  code:
    | 'min-length'
    | 'needs-lowercase'
    | 'needs-uppercase'
    | 'needs-digit'
    | 'needs-special';
  message: string;
}

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]/;

export function validatePasswordPolicy(
  password: string,
): PasswordPolicyViolation[] {
  const violations: PasswordPolicyViolation[] = [];

  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    violations.push({
      code: 'min-length',
      message: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
    });
  }

  if (!/[a-z]/.test(password)) {
    violations.push({
      code: 'needs-lowercase',
      message: 'Debe incluir al menos una letra minúscula.',
    });
  }

  if (!/[A-Z]/.test(password)) {
    violations.push({
      code: 'needs-uppercase',
      message: 'Debe incluir al menos una letra mayúscula.',
    });
  }

  if (!/[0-9]/.test(password)) {
    violations.push({
      code: 'needs-digit',
      message: 'Debe incluir al menos un número.',
    });
  }

  if (!SPECIAL_CHAR_REGEX.test(password)) {
    violations.push({
      code: 'needs-special',
      message: 'Debe incluir al menos un carácter especial.',
    });
  }

  return violations;
}

export function assertPasswordPolicy(password: string): void {
  const violations = validatePasswordPolicy(password);

  if (violations.length > 0) {
    const error = new Error(violations.map((v) => v.message).join(' '));
    (error as Error & { violations?: PasswordPolicyViolation[] }).violations =
      violations;
    throw error;
  }
}

/**
 * Generates a random password that already satisfies the policy. Used when an
 * admin resets another user's password — the admin reads the temporary
 * password once and hands it off out-of-band.
 */
export function generateTemporaryPassword(): string {
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const digits = '23456789';
  const specials = '!@#$%^&*-_=+';
  const all = lower + upper + digits + specials;

  const pick = (source: string): string =>
    source[Math.floor(Math.random() * source.length)]!;

  const required = [pick(lower), pick(upper), pick(digits), pick(specials)];
  const filler = Array.from({ length: 8 }, () => pick(all));
  const chars = [...required, ...filler];

  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }

  return chars.join('');
}
