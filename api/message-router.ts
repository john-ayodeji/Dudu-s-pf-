import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import * as schema from "../db/schema.js";

export const messageRouter = createRouter({
  create: publicQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        email: z.string().email(),
        content: z.string().min(1).max(2000),
      }),
    )
    .mutation(async ({ input }) => {
      const result = await getDb()
        .insert(schema.messages)
        .values({
          name: input.name,
          email: input.email,
          content: input.content,
        });

      const insertedId = Number(result[0].insertId);
      const rows = await getDb()
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.id, insertedId))
        .limit(1);

      return rows[0];
    }),

  list: publicQuery.query(async () => {
    return getDb()
      .select()
      .from(schema.messages)
      .orderBy(desc(schema.messages.isPinned), desc(schema.messages.createdAt));
  }),

  pin: adminQuery
    .input(
      z.object({
        id: z.number(),
        isPinned: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      await getDb()
        .update(schema.messages)
        .set({ isPinned: input.isPinned })
        .where(eq(schema.messages.id, input.id));

      const rows = await getDb()
        .select()
        .from(schema.messages)
        .where(eq(schema.messages.id, input.id))
        .limit(1);

      return rows[0];
    }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb()
        .delete(schema.messages)
        .where(eq(schema.messages.id, input.id));
      return { success: true };
    }),
});
