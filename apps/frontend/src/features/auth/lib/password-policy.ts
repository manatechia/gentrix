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
      message: `Debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
    });
  }
  if (!/[a-z]/.test(password)) {
    violations.push({
      code: 'needs-lowercase',
      message: 'Debe incluir una letra minúscula.',
    });
  }
  if (!/[A-Z]/.test(password)) {
    violations.push({
      code: 'needs-uppercase',
      message: 'Debe incluir una letra mayúscula.',
    });
  }
  if (!/[0-9]/.test(password)) {
    violations.push({
      code: 'needs-digit',
      message: 'Debe incluir un número.',
    });
  }
  if (!SPECIAL_CHAR_REGEX.test(password)) {
    violations.push({
      code: 'needs-special',
      message: 'Debe incluir un carácter especial.',
    });
  }

  return violations;
}
