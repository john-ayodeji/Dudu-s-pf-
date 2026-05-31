import { z } from "zod";
import { eq, count, desc } from "drizzle-orm";
import { createRouter, adminQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import * as schema from "../db/schema.js";

export const adminRouter = createRouter({
  stats: adminQuery.query(async () => {
    const [usersCount] = await getDb()
      .select({ count: count() })
      .from(schema.users);
    const [localUsersCount] = await getDb()
      .select({ count: count() })
      .from(schema.localUsers);
    const [contactsCount] = await getDb()
      .select({ count: count() })
      .from(schema.contacts);
    const [messagesCount] = await getDb()
      .select({ count: count() })
      .from(schema.messages);

    return {
      totalOAuthUsers: usersCount.count,
      totalLocalUsers: localUsersCount.count,
      totalContacts: contactsCount.count,
      totalMessages: messagesCount.count,
    };
  }),

  users: adminQuery.query(async () => {
    const oauthUsers = await getDb()
      .select()
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt));
    const localUsersList = await getDb()
      .select({
        id: schema.localUsers.id,
        username: schema.localUsers.username,
        displayName: schema.localUsers.displayName,
        email: schema.localUsers.email,
        role: schema.localUsers.role,
        createdAt: schema.localUsers.createdAt,
      })
      .from(schema.localUsers)
      .orderBy(desc(schema.localUsers.createdAt));

    return { oauthUsers, localUsers: localUsersList };
  }),

  updateRole: adminQuery
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "admin"]),
        type: z.enum(["oauth", "local"]),
      }),
    )
    .mutation(async ({ input }) => {
      if (input.type === "oauth") {
        await getDb()
          .update(schema.users)
          .set({ role: input.role })
          .where(eq(schema.users.id, input.userId));
      } else {
        await getDb()
          .update(schema.localUsers)
          .set({ role: input.role })
          .where(eq(schema.localUsers.id, input.userId));
      }
      return { success: true };
    }),

  contacts: adminQuery.query(async () => {
    return getDb()
      .select()
      .from(schema.contacts)
      .orderBy(desc(schema.contacts.createdAt));
  }),

  messages: adminQuery.query(async () => {
    return getDb()
      .select()
      .from(schema.messages)
      .orderBy(desc(schema.messages.createdAt));
  }),
});
