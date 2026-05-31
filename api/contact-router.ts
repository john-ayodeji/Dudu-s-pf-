import { z } from "zod";
import { desc } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import * as schema from "../db/schema.js";

export const contactRouter = createRouter({
  submit: publicQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        email: z.string().email(),
        subject: z.string().max(255).optional(),
        message: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      await getDb().insert(schema.contacts).values({
        name: input.name,
        email: input.email,
        subject: input.subject || null,
        message: input.message,
      });
      return { success: true };
    }),

  list: adminQuery.query(async () => {
    return getDb()
      .select()
      .from(schema.contacts)
      .orderBy(desc(schema.contacts.createdAt));
  }),

  delete: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb()
        .delete(schema.contacts)
        .where(eq(schema.contacts.id, input.id));
      return { success: true };
    }),
});
