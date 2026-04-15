import {
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
} from 'node:crypto';

/**
 * Password hashing helpers built on top of `node:crypto.scrypt`.
 *
 * We deliberately avoid pulling in a native-binding dependency like `bcrypt`
 * or `argon2` — the Node built-in is battle-tested, portable (no Windows
 * toolchain headaches), and the storage format below is self-describing so we
 * can tune cost parameters later without a forced data migration.
 *
 * Storage format: `scrypt$saltHex$hashHex` using Node's default scrypt
 * parameters (N=16384, r=8, p=1). The prefix is what lets us distinguish a
 * hashed row from a legacy plaintext one during the rollout.
 */

const SCHEME = 'scrypt';
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

function scrypt(password: string, salt: Buffer, keyLen: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keyLen, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await scrypt(plain, salt, KEY_LENGTH);
  return `${SCHEME}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export interface VerifyPasswordResult {
  /** Whether the provided plaintext matches the stored value. */
  matches: boolean;
  /**
   * True if the stored value was in legacy plaintext form (pre-hashing rollout).
   * Callers should persist a freshly hashed version opportunistically.
   */
  needsRehash: boolean;
}

export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<VerifyPasswordResult> {
  if (!stored) {
    return { matches: false, needsRehash: false };
  }

  if (!stored.startsWith(`${SCHEME}$`)) {
    // Legacy plaintext row. We still accept it so existing users can log in,
    // but flag it so the caller migrates the row on the next write.
    return { matches: stored === plain, needsRehash: true };
  }

  const parts = stored.split('$');
  if (parts.length !== 3) {
    return { matches: false, needsRehash: false };
  }
  const [, saltHex, hashHex] = parts;

  if (!saltHex || !hashHex) {
    return { matches: false, needsRehash: false };
  }

  const expected = Buffer.from(hashHex, 'hex');
  const derived = await scrypt(
    plain,
    Buffer.from(saltHex, 'hex'),
    expected.length,
  );

  const matches =
    derived.length === expected.length && timingSafeEqual(derived, expected);
  return { matches, needsRehash: false };
}

export async function passwordMatches(
  plain: string,
  stored: string,
): Promise<boolean> {
  return (await verifyPassword(plain, stored)).matches;
}
