import { db } from "@/db";
import { BottleUsage, TotalBottles, OtherExpense, Miscellaneous } from "@/db/schema";
import { ORPCError, os } from "@orpc/server";
import { startOfDay, endOfDay } from "date-fns";
import { and, eq, gte, lte } from "drizzle-orm";
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
      // 1️⃣ Find bottle usage
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

      // 2️⃣ Find all expenses of that day
      const expenses = await tx
        .select()
        .from(OtherExpense)
        .where(
          and(
            eq(OtherExpense.moderator_id, input.moderator_id),
            gte(OtherExpense.date, from),
            lte(OtherExpense.date, to)
          )
        );

      const totalExpenseAmount = expenses.reduce(
        (sum, e) => sum + e.amount,
        0
      );

      // 3️⃣ Delete expenses
      if (expenses.length > 0) {
        await tx
          .delete(OtherExpense)
          .where(
            and(
              eq(OtherExpense.moderator_id, input.moderator_id),
              gte(OtherExpense.date, from),
              lte(OtherExpense.date, to)
            )
          );
      }

      // 3.5️⃣ Delete miscellaneous entries of that day
      await tx
        .delete(Miscellaneous)
        .where(
          and(
            eq(Miscellaneous.moderator_id, input.moderator_id),
            gte(Miscellaneous.delivery_date, from),
            lte(Miscellaneous.delivery_date, to)
          )
        );





      // 4️⃣ Get total bottles
      const [total] = await tx.select().from(TotalBottles).limit(1);
      if (!total) {
        throw new ORPCError("Total bottles record not found");
      }

      const rollbackAmount = usage.filled_bottles ?? 0;

      // 5️⃣ Rollback stock
      const [updatedTotal] = await tx
        .update(TotalBottles)
        .set({
          available_bottles: total.available_bottles + rollbackAmount,
          used_bottles: Math.max(total.used_bottles - rollbackAmount, 0),
          updatedAt: new Date(),
        })
        .where(eq(TotalBottles.id, total.id))
        .returning();

      // 6️⃣ Delete bottle usage
      await tx.delete(BottleUsage).where(eq(BottleUsage.id, usage.id));

      return {
        success: true,
        totalBottles: updatedTotal,
      };
    });
  });
