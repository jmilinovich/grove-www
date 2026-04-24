/**
 * Bounded body readers for API routes.
 *
 * Next 16 hands `request.json()` / `request.text()` straight to the runtime,
 * which reads as many bytes as the client cares to send. An attacker can POST
 * a multi-megabyte payload to an admin endpoint and exhaust function memory
 * before any of our handler code runs.
 *
 * `readJsonBody` enforces an explicit ceiling: it short-circuits on a
 * `Content-Length` larger than the limit, and otherwise streams the body
 * while accumulating bytes, aborting once the ceiling is crossed. The
 * buffered bytes are then parsed as JSON.
 *
 * Default limit (64 KiB) is well above any legitimate admin JSON payload
 * (key creation, share mint, invite). Routes that legitimately need more —
 * e.g. share creation that may include note content — pass an explicit
 * larger limit. Routes that already cap their inputs upstream still get a
 * generous safety net here.
 */

export class BodyTooLargeError extends Error {
  readonly statusCode = 413;
  constructor(public readonly maxBytes: number) {
    super(`request body exceeds ${maxBytes} bytes`);
    this.name = "BodyTooLargeError";
  }
}

export class BodyParseError extends Error {
  readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = "BodyParseError";
  }
}

const DEFAULT_LIMIT = 64 * 1024;

/**
 * Read the request body as JSON, enforcing a byte ceiling. Throws
 * `BodyTooLargeError` (413) when the limit is crossed and `BodyParseError`
 * (400) when the bytes don't parse as JSON.
 */
export async function readJsonBody<T = unknown>(
  request: Request,
  maxBytes: number = DEFAULT_LIMIT,
): Promise<T> {
  const declared = request.headers.get("content-length");
  if (declared !== null) {
    const n = Number.parseInt(declared, 10);
    if (Number.isFinite(n) && n > maxBytes) {
      throw new BodyTooLargeError(maxBytes);
    }
  }

  const buf = await readBoundedBytes(request, maxBytes);
  if (buf.length === 0) {
    throw new BodyParseError("request body is empty");
  }
  const text = new TextDecoder().decode(buf);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new BodyParseError("request body is not valid JSON");
  }
}

async function readBoundedBytes(request: Request, maxBytes: number): Promise<Uint8Array> {
  // No streaming body: fall back to arrayBuffer with a post-read check. This
  // covers route handlers that re-construct a Request without a stream
  // (rare in Next 16 but cheap to handle).
  if (!request.body) {
    const ab = await request.arrayBuffer();
    if (ab.byteLength > maxBytes) {
      throw new BodyTooLargeError(maxBytes);
    }
    return new Uint8Array(ab);
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        // Don't keep reading; release the reader and bail. The caller maps
        // this to 413 and the client-supplied bytes never touch JSON.parse.
        try {
          await reader.cancel();
        } catch {
          // best-effort
        }
        throw new BodyTooLargeError(maxBytes);
      }
      chunks.push(value);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // best-effort: cancel may have already released it
    }
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

/**
 * Convert a thrown body-limit error into a JSON Response. Returns null
 * when the error is unrelated, so callers can keep their own fall-through.
 */
export function bodyLimitErrorResponse(err: unknown): Response | null {
  if (err instanceof BodyTooLargeError) {
    return new Response(JSON.stringify({ error: "request body too large" }), {
      status: 413,
      headers: { "content-type": "application/json" },
    });
  }
  if (err instanceof BodyParseError) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  return null;
}
