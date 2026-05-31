import { authRouter } from "./auth-router.js";
import { localAuthRouter } from "./local-auth-router.js";
import { contactRouter } from "./contact-router.js";
import { messageRouter } from "./message-router.js";
import { adminRouter } from "./admin-router.js";
import { aiRouter } from "./ai-router.js";
import { createRouter, publicQuery } from "./middleware.js";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  localAuth: localAuthRouter,
  contact: contactRouter,
  message: messageRouter,
  admin: adminRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
