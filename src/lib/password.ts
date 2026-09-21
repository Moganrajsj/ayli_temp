import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import type { ScryptOptions as CryptoScryptOptions } from "node:crypto";

const KEY_LENGTH = 64;
const DEFAULT_COST = 16384;
const DEFAULT_BLOCK_SIZE = 8;
const DEFAULT_PARALLELIZATION = 1;

interface ScryptOptions {
  cost?: number;
  blockSize?: number;
  parallelization?: number;
}

function derive(
  password: string,
  salt: string,
  keyLength: number,
  opts: CryptoScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keyLength, opts, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

function options(overrides: ScryptOptions = {}) {
  return {
    cost: overrides.cost ?? DEFAULT_COST,
    blockSize: overrides.blockSize ?? DEFAULT_BLOCK_SIZE,
    parallelization: overrides.parallelization ?? DEFAULT_PARALLELIZATION,
  };
}

/** Hashes a password with scrypt and returns a self-describing `scrypt$N$r$p$salt$hash` string. */
export async function hashPassword(
  password: string,
  overrides: ScryptOptions = {}
): Promise<string> {
  const { cost, blockSize, parallelization } = options(overrides);
  const salt = randomBytes(16).toString("base64");
  const derived = await derive(password, salt, KEY_LENGTH, { N: cost, r: blockSize, p: parallelization });
  const parts = [cost, blockSize, parallelization, salt, derived.toString("base64")];
  return `scrypt$${parts.join("$")}`;
}

/** Constant-time comparison of a plaintext password against a stored scrypt hash. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [costStr, blockSizeStr, parallelizationStr, salt, expected] = parts.slice(1);

  let derived: Buffer;
  try {
    derived = await derive(password, salt, KEY_LENGTH, {
      N: Number(costStr),
      r: Number(blockSizeStr),
      p: Number(parallelizationStr),
    });
  } catch {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, "base64");
  if (derived.length !== expectedBuffer.length) return false;
  return timingSafeEqual(derived, expectedBuffer);
}