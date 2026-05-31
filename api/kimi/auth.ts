// Kimi OAuth code fully removed. This file is now a stub for local authentication only.
import type { User } from "../../db/schema.js";

export async function authenticateRequest(
  _headers: Headers,
): Promise<User | undefined> {
  return undefined;
}
