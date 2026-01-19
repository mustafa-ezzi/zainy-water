import { db } from "@/db";
import { BottleUsage, TotalBottles } from "@/db/schema";
import { ORPCError, os } from "@orpc/server";
import { startOfDay, endOfDay, addHours } from "date-fns";
import { and, eq, gte, lte } from "drizzle-orm";
import z from "zod";
import { TIME_OFFSET } from "@/lib/utils";

export const deleteBottleUsage = os
  .input(
    z.object({
      dob: z.coerce.date(),
      moderator_id: z.string(),
    })
  )
  .output(
    z.object({
      totalBottles: z.object({
        available_bottles: z.number(),
        used_bottles: z.number(),
      }),
    })
  )
  .handler(async ({ input }) => {
    const adjustedDob = addHours(new Date(input.dob), TIME_OFFSET);
    const from = startOfDay(adjustedDob);
    const to = endOfDay(adjustedDob);

    return await db.transaction(async (tx) => {
      // 1️⃣ Find usage
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
      const updatedTotal = await tx
        .update(TotalBottles)
        .set({
          available_bottles: total.available_bottles + rollbackAmount,
          used_bottles: Math.max(total.used_bottles - rollbackAmount, 0),
          updatedAt: new Date(),
        })
        .where(eq(TotalBottles.id, total.id))
        .returning();

      // 4️⃣ Delete the usage
      await tx.delete(BottleUsage).where(eq(BottleUsage.id, usage.id));

      return {
        totalBottles: {
          available_bottles: updatedTotal[0].available_bottles,
          used_bottles: updatedTotal[0].used_bottles,
        },
      };
    });
  });
