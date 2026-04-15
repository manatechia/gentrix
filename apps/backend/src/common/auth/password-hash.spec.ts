import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from './password-hash';

describe('hashPassword / verifyPassword', () => {
  it('produces a self-describing scrypt string that verifies against the plaintext', async () => {
    const hashed = await hashPassword('Corr3ct!Horse');

    expect(hashed.startsWith('scrypt$')).toBe(true);
    expect(hashed.split('$')).toHaveLength(3);

    const verified = await verifyPassword('Corr3ct!Horse', hashed);
    expect(verified).toEqual({ matches: true, needsRehash: false });
  });

  it('returns a different hash each time because of the random salt', async () => {
    const a = await hashPassword('Str0ng!Pass');
    const b = await hashPassword('Str0ng!Pass');

    expect(a).not.toBe(b);
    expect((await verifyPassword('Str0ng!Pass', a)).matches).toBe(true);
    expect((await verifyPassword('Str0ng!Pass', b)).matches).toBe(true);
  });

  it('rejects wrong plaintext without leaking via the matches flag', async () => {
    const hashed = await hashPassword('Real!Pass1');

    const verified = await verifyPassword('Wrong!Pass1', hashed);
    expect(verified.matches).toBe(false);
    expect(verified.needsRehash).toBe(false);
  });

  it('still verifies legacy plaintext rows and flags them for rehash', async () => {
    const verified = await verifyPassword('legacy123', 'legacy123');

    expect(verified).toEqual({ matches: true, needsRehash: true });
  });

  it('returns a safe failure for malformed stored values', async () => {
    expect(await verifyPassword('anything', '')).toEqual({
      matches: false,
      needsRehash: false,
    });
    expect(await verifyPassword('anything', 'scrypt$invalid')).toEqual({
      matches: false,
      needsRehash: false,
    });
  });
});
