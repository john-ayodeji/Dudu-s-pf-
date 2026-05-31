import { z } from "zod";
import { createRouter, publicQuery } from "./middleware.js";

export const aiRouter = createRouter({
  chat: publicQuery
    .input(
      z.object({
        message: z.string().min(1).max(2000),
      }),
    )
    .mutation(async ({ input }) => {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        // Fallback responses when no API key is configured
        const responses = [
          "Logic will get you from A to B. Imagination will take you everywhere.",
          "The most beautiful thing we can experience is the mysterious. It is the source of all true art and science.",
          "In programming, as in philosophy, clarity is the ultimate sophistication.",
          "The unexamined code is not worth deploying.",
          "Every great developer you know got there by solving problems they were unqualified to solve until they actually did it.",
          "Systems thinking: understanding that the whole is greater than the sum of its parts, yet each part is essential.",
          "The best code is no code at all. The second best is code that's easy to delete.",
          "Curiosity is the engine of achievement. Never stop questioning how things work.",
        ];
        const response =
          responses[Math.floor(Math.random() * responses.length)];
        return { response };
      }

      try {
        const resp = await fetch(
          "https://api.openai.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content:
                    "You are Ayo's AI assistant on his portfolio website. You are knowledgeable about philosophy, backend development (Java, Spring Boot), mobile development (Flutter, Dart), and technology. Respond concisely and thoughtfully, reflecting Ayo's identity as a philosophy student and developer who thinks deeply about systems and logic.",
                },
                { role: "user", content: input.message },
              ],
              max_tokens: 200,
            }),
          },
        );

        const data = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
        const response = data.choices?.[0]?.message?.content ||
          "I'm thinking deeply about that...";
        return { response };
      } catch {
        return {
          response:
            "The mind is like a parachute — it works best when open. I'm processing your thoughts...",
        };
      }
    }),
});
