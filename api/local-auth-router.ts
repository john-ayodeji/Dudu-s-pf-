import { z } from "zod";
import { eq } from "drizzle-orm";
import bcryptjs from "bcryptjs";
import { createRouter, publicQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import * as schema from "../db/schema.js";
import { signLocalToken, verifyLocalAuthToken } from "./local-auth-utils.js";
import { TRPCError } from "@trpc/server";

export const localAuthRouter = createRouter({
  register: publicQuery
    .input(
      z.object({
        username: z.string().min(3).max(50),
        password: z.string().min(6).max(100),
        displayName: z.string().max(100).optional(),
        email: z.string().email().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const existing = await getDb()
        .select()
        .from(schema.localUsers)
        .where(eq(schema.localUsers.username, input.username))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already exists",
        });
      }

      const passwordHash = await bcryptjs.hash(input.password, 12);

      const result = await getDb()
        .insert(schema.localUsers)
        .values({
          username: input.username,
          passwordHash,
          displayName: input.displayName || input.username,
          email: input.email || null,
        });

      const userId = Number(result[0].insertId);
      const token = await signLocalToken({
        userId,
        username: input.username,
      });

      return {
        token,
        user: {
          id: userId,
          username: input.username,
          displayName: input.displayName || input.username,
          name: input.displayName || input.username,
          role: "user",
        },
      };
    }),

  login: publicQuery
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const rows = await getDb()
        .select()
        .from(schema.localUsers)
        .where(eq(schema.localUsers.username, input.username))
        .limit(1);

      const user = rows.at(0);
      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or password",
        });
      }

      const valid = await bcryptjs.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid username or password",
        });
      }

      const token = await signLocalToken({
        userId: user.id,
        username: user.username,
      });

      return {
        token,
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          name: user.displayName || user.username,
          role: user.role,
        },
      };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    const token = ctx.req.headers.get("x-local-auth-token");
    if (!token) return null;

    const user = await verifyLocalAuthToken(token);
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      name: user.displayName || user.username,
      email: user.email,
      role: user.role,
    };
  }),
});
