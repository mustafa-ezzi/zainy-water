import { adminProcedure } from "@/middlewares/admin-clerk";
import { BottleUsage, Moderator } from "@/db/schema";
import { z } from "zod";
import { db } from "@/db";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";

export const BottleUsage30dDataSchema = z.object({
  moderator: z.custom<typeof Moderator.$inferSelect>(),
  bottleUsage: z.custom<typeof BottleUsage.$inferSelect>(),
});

export const get30dBottleUsage = adminProcedure
  .input(z.void())
  .output(z.object({
    success: z.boolean(),
    data: BottleUsage30dDataSchema.array(),
  }))
  .handler(async () => {
    // Use JOIN query instead of multiple database calls
    const bottleUsagesWithModerator = await db
      .select()
      .from(BottleUsage)
      .where(
        and(
          lte(BottleUsage.createdAt, endOfDay(new Date())),
          gte(
            BottleUsage.createdAt,
            startOfDay(new Date(new Date().setDate(new Date().getDate() - 30)))
          )
        )
      )
      .innerJoin(Moderator, eq(BottleUsage.moderator_id, Moderator.id))
      .orderBy(desc(BottleUsage.createdAt));

    return {
      success: true,
      data: bottleUsagesWithModerator.map((item) => ({
        moderator: item.Moderator,
        bottleUsage: item.BottleUsage,
      })),
    };
  });
