import { describe, expect, it } from "vitest";
import {
  BodyParseError,
  BodyTooLargeError,
  bodyLimitErrorResponse,
  readJsonBody,
} from "@/lib/body-limit";

function makeRequest(body: string | Uint8Array, contentLength?: string | null): Request {
  const bytes = typeof body === "string" ? new TextEncoder().encode(body) : body;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (contentLength === undefined) {
    headers["content-length"] = String(bytes.byteLength);
  } else if (contentLength !== null) {
    headers["content-length"] = contentLength;
  }
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers,
    body: bytes as BodyInit,
  });
}

describe("readJsonBody", () => {
  it("parses small JSON payloads", async () => {
    const out = await readJsonBody<{ hello: string }>(makeRequest(`{"hello":"world"}`));
    expect(out).toEqual({ hello: "world" });
  });

  it("rejects when Content-Length declares a body larger than the limit", async () => {
    const req = makeRequest(`{}`, "999999");
    await expect(readJsonBody(req, 64)).rejects.toBeInstanceOf(BodyTooLargeError);
  });

  it("aborts streaming once accumulated bytes exceed the limit", async () => {
    // Strip Content-Length so the streaming branch is exercised. Use ample
    // padding so the aborted-mid-stream path is hit even with a small limit.
    const req = makeRequest("a".repeat(2000), null);
    await expect(readJsonBody(req, 128)).rejects.toBeInstanceOf(BodyTooLargeError);
  });

  it("treats invalid JSON as a 400 BodyParseError", async () => {
    const req = makeRequest("{not-json");
    await expect(readJsonBody(req)).rejects.toBeInstanceOf(BodyParseError);
  });

  it("treats empty body as a 400 BodyParseError", async () => {
    const req = makeRequest(new Uint8Array());
    await expect(readJsonBody(req)).rejects.toBeInstanceOf(BodyParseError);
  });
});

describe("bodyLimitErrorResponse", () => {
  it("maps BodyTooLargeError to a 413 response", async () => {
    const res = bodyLimitErrorResponse(new BodyTooLargeError(64));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(413);
    const body = await res!.json();
    expect(body).toEqual({ error: "request body too large" });
  });

  it("maps BodyParseError to a 400 response", async () => {
    const res = bodyLimitErrorResponse(new BodyParseError("bad"));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(400);
  });

  it("returns null for unrelated errors", () => {
    const res = bodyLimitErrorResponse(new Error("something else"));
    expect(res).toBeNull();
  });
});
