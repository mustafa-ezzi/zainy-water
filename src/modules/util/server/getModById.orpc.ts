import { adminProcedure } from "@/middlewares/admin-clerk";
import { z } from "zod";
import { Moderator } from "@/db/schema";
import { db } from "@/db";
import { eq } from "drizzle-orm";

export const getModById = adminProcedure
  .input(z.object({ mod_id: z.string() }))
  .output(z.custom<typeof Moderator.$inferSelect>())
  .handler(async ({ input }) => {
    const [moderator] = await db
      .select()
      .from(Moderator)
      .where(eq(Moderator.id, input.mod_id))
      .limit(1);

    if (!moderator) {
      throw new Error("Moderator not found");
    }

    return moderator;
  });
