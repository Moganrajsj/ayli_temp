// Shared helpers for surfacing server-side data-access failures.
//
// Catalogue / collection / search / PDP pages used to swallow database errors
// with a bare `catch {}`, so a production outage only surfaced to users as a
// generic "Could not load this …" message and produced nothing in the runtime
// logs. These helpers make the real cause — and, for Prisma/MySQL, the error
// code — visible so the underlying connection problem can be diagnosed.

/**
 * Prisma / MySQL error codes that indicate a *transient* connectivity problem
 * rather than a bug in the query. Reads hitting these are safe to retry.
 */
export const RETRYABLE_DB_CODES = [
  "P1001", // Can't reach the database server
  "P1002", // Timed out reaching the database server
  "P1017", // Server has closed the connection
  "P2024", // Timed out fetching a connection from the pool
  "1226", // MySQL: exceeded max_connections_per_hour (Hostinger cap)
  "1040", // MySQL: too many connections
] as const;

const RETRYABLE_DB_CODE_SET = new Set<string>(RETRYABLE_DB_CODES);

export function extractErrorCode(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;
  const code = (error as { code?: unknown }).code;
  if (typeof code === "string") return code;
  if (typeof code === "number") return String(code);
  return null;
}

export function isTransientDbError(error: unknown): boolean {
  const code = extractErrorCode(error);
  return code !== null && RETRYABLE_DB_CODE_SET.has(code);
}

export interface LoggedServerError {
  name: string;
  code: string | null;
  digest: string;
}

/**
 * Logs a server-side failure to the runtime console (Vercel → Functions →
 * Logs) and returns a compact digest. Never throws, so it is always safe to
 * call from a catch block.
 */
export function logServerError(
  scope: string,
  error: unknown
): LoggedServerError {
  const name =
    error && typeof error === "object" && "name" in error
      ? String((error as { name?: unknown }).name ?? "Error")
      : "Error";
  const code = extractErrorCode(error);
  const message = error instanceof Error ? error.message : String(error);
  const transient = code !== null && RETRYABLE_DB_CODE_SET.has(code);

  console.error(
    `[${scope}] ${name}${code ? ` (${code})` : ""}` +
      `${transient ? " [transient db error]" : ""}: ${message}`
  );

  return { name, code, digest: `${scope}:${code ?? name}` };
}
