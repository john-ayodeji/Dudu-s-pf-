import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User, LocalUser } from "../db/schema.js";
import { authenticateRequest } from "./kimi/auth.js";
import { verifyLocalAuthToken } from "./local-auth-utils.js";

export type UnifiedUser = {
  id: number;
  name: string;
  email?: string | null;
  avatar?: string | null;
  role: "user" | "admin";
  authType: "oauth" | "local";
};

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
  localUser?: LocalUser;
  unifiedUser?: UnifiedUser;
};

function toUnifiedUser(user?: User, localUser?: LocalUser): UnifiedUser | undefined {
  if (user) {
    return {
      id: user.id,
      name: user.name || "User",
      email: user.email,
      avatar: user.avatar,
      role: user.role as "user" | "admin",
      authType: "oauth",
    };
  }
  if (localUser) {
    return {
      id: localUser.id,
      name: localUser.displayName || localUser.username,
      email: localUser.email,
      avatar: null,
      role: localUser.role as "user" | "admin",
      authType: "local",
    };
  }
  return undefined;
}

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  // Try OAuth auth first
  try {
    ctx.user = await authenticateRequest(opts.req.headers);
  } catch {
    // OAuth auth failed, that's ok
  }

  // Try local auth token
  if (!ctx.user) {
    try {
      const token = opts.req.headers.get("x-local-auth-token");
      if (token) {
        ctx.localUser = await verifyLocalAuthToken(token);
      }
    } catch {
      // Local auth failed, that's ok
    }
  }

  ctx.unifiedUser = toUnifiedUser(ctx.user, ctx.localUser);
  return ctx;
}
