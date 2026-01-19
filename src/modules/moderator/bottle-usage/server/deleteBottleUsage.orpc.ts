import { db } from "@/db";
import { BottleUsage, TotalBottles } from "@/db/schema";
import { ORPCError, os } from "@orpc/server";
import { startOfDay, endOfDay } from "date-fns";
import { and, eq, gte, lte, desc } from "drizzle-orm";
import z from "zod";
  
export const deleteBottleUsage = os
  .input(
    z.object({
      dob: z.coerce.date(),
      moderator_id: z.string(),
    })
  )
  .output(
    z.object({
      success: z.boolean(),
      totalBottles: z.custom<typeof TotalBottles.$inferSelect>(),
    })
  )
  .handler(async ({ input }) => {
    const from = startOfDay(input.dob);
    const to = endOfDay(input.dob);

    return await db.transaction(async (tx) => {
      // 1️⃣ Find usage for that day
      const usage = await tx.query.BottleUsage.findFirst({
        where: and(
          eq(BottleUsage.moderator_id, input.moderator_id),
          gte(BottleUsage.createdAt, from),
          lte(BottleUsage.createdAt, to)
        ),
      });

      if (!usage) throw new ORPCError("Bottle usage record not found for this date");

      // 2️⃣ Get TotalBottles
      const [total] = await tx.select().from(TotalBottles).limit(1);
      if (!total) throw new ORPCError("Total bottles record not found");

      const rollbackAmount = usage.filled_bottles ?? 0;

      // 3️⃣ Rollback stock
      const updatedTotal = await tx.update(TotalBottles).set({
        available_bottles: total.available_bottles + rollbackAmount,
        used_bottles: Math.max(total.used_bottles - rollbackAmount, 0),
        updatedAt: new Date(),
      }).where(eq(TotalBottles.id, total.id)).returning();

      // 4️⃣ Delete usage entry
      await tx.delete(BottleUsage).where(eq(BottleUsage.id, usage.id));

      return { success: true, totalBottles: updatedTotal[0] };
    });
  });
