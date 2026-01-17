import { db } from "@/db";
import { BottleUsage, TotalBottles } from "@/db/schema";
import { ORPCError, os } from "@orpc/server";
import { startOfDay, endOfDay, addHours } from "date-fns";
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
      // 1️⃣ Find the usage record for that moderator/date
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

      // 2️⃣ Delete the usage
      await tx.delete(BottleUsage).where(eq(BottleUsage.id, usage.id));

      // 3️⃣ Get latest TotalBottles
      const [latestTotal] = await tx
        .select()
        .from(TotalBottles)
        .orderBy(desc(TotalBottles.createdAt))
        .limit(1);

      if (!latestTotal) {
        throw new ORPCError("Total bottles record not found");
      }

      // 4️⃣ Recalculate totals from all remaining BottleUsage records
      const allUsage = await tx.select().from(BottleUsage);

      const usedBottles = allUsage.reduce((acc, u) => acc + (u.filled_bottles ?? 0), 0);
      const damagedBottles = latestTotal.damaged_bottles;
      const depositBottles = latestTotal.deposit_bottles;
      const totalBottles = latestTotal.total_bottles;

      // 5️⃣ Correct calculation of available bottles
      const availableBottles = totalBottles - depositBottles - damagedBottles - usedBottles;

      // 6️⃣ Update TotalBottles
      await tx.update(TotalBottles).set({
        available_bottles: availableBottles,
        used_bottles: usedBottles,
      }).where(eq(TotalBottles.id, latestTotal.id));
    });
  });
