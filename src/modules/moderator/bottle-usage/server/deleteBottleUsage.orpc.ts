import { db } from "@/db";
import { BottleUsage, TotalBottles } from "@/db/schema";
import { ORPCError } from "@orpc/client";
import { os } from "@orpc/server";
import { endOfDay, startOfDay, addHours } from "date-fns";
import { and, eq, gte, lte, desc } from "drizzle-orm";
import z from "zod";
import { TIME_OFFSET } from "@/lib/utils";

export const deleteBottleUsage = os
  .input(
    z.object({
      dob: z.coerce.date(),
      moderator_id: z.string(),
    })
  )
  .output(z.void())
  .handler(async ({ input }) => {
    const adjustedDob = addHours(new Date(input.dob), TIME_OFFSET);

    const from = startOfDay(adjustedDob);
    const to = endOfDay(adjustedDob);

    await db.transaction(async (tx) => {
      // 1️⃣ Find usage record
      const usage = await tx.query.BottleUsage.findFirst({
        where: and(
          eq(BottleUsage.moderator_id, input.moderator_id),
          gte(BottleUsage.createdAt, from),
          lte(BottleUsage.createdAt, to)
        ),
      });

      if (!usage) {
        throw new ORPCError("Bottle usage record not found for this date");
      }

      // 2️⃣ Delete usage
      await tx
        .delete(BottleUsage)
        .where(eq(BottleUsage.id, usage.id));

      // 3️⃣ Recalculate totals from remaining usage
      const allUsage = await tx.select().from(BottleUsage);

      const totals = allUsage.reduce(
        (acc, u) => {
          acc.filled += u.filled_bottles ?? 0;
          acc.remaining += u.remaining_bottles ?? 0;
          acc.empty += u.empty_bottles ?? 0;
          acc.damaged += u.damaged_bottles ?? 0;
          acc.refilled += u.refilled_bottles ?? 0;
          acc.caps += u.caps ?? 0;
          return acc;
        },
        {
          filled: 0,
          remaining: 0,
          empty: 0,
          damaged: 0,
          refilled: 0,
          caps: 0,
        }
      );

      // 4️⃣ Get latest TotalBottles row
      const [latestTotal] = await tx
        .select()
        .from(TotalBottles)
        .orderBy(desc(TotalBottles.createdAt))
        .limit(1);

      if (!latestTotal) {
        throw new ORPCError("Total bottles record not found");
      }

      // 5️⃣ Update totals (WITH WHERE 😤)
      await tx
        .update(TotalBottles)
        .set({
          available_bottles: totals.filled,
          remaining_bottles: totals.remaining,
          empty_bottles: totals.empty,
          damaged_bottles: totals.damaged,
          refilled_bottles: totals.refilled,
          caps: totals.caps,
        })
        .where(eq(TotalBottles.id, latestTotal.id));
    });
  });
