import { describe, expect, it } from 'vitest';

import {
  generateTemporaryPassword,
  validatePasswordPolicy,
} from './password-policy';

describe('validatePasswordPolicy', () => {
  it('accepts a password that satisfies every rule', () => {
    const violations = validatePasswordPolicy('Str0ng!Pass');

    expect(violations).toEqual([]);
  });

  it('reports a min-length violation for short passwords', () => {
    const codes = validatePasswordPolicy('Ab1!').map((v) => v.code);

    expect(codes).toContain('min-length');
  });

  it('reports every missing character class', () => {
    const codes = validatePasswordPolicy('aaaaaaaa').map((v) => v.code);

    expect(codes).toEqual(
      expect.arrayContaining([
        'needs-uppercase',
        'needs-digit',
        'needs-special',
      ]),
    );
  });

  it('requires a lowercase even for otherwise-complex passwords', () => {
    const codes = validatePasswordPolicy('ABC123!!').map((v) => v.code);

    expect(codes).toContain('needs-lowercase');
  });
});

describe('generateTemporaryPassword', () => {
  it('always produces a password that satisfies the policy', () => {
    for (let i = 0; i < 100; i++) {
      const generated = generateTemporaryPassword();
      expect(validatePasswordPolicy(generated)).toEqual([]);
    }
  });
});
