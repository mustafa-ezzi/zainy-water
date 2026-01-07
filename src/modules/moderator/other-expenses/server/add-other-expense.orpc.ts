import { z } from "zod";
import { os } from "@orpc/server";
import { db } from "@/db";
import { BottleUsage, OtherExpense } from "@/db/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";

export const otherExpenseDataSchema = z.object({
  moderator_id: z.string(),
  refilled_bottles: z.number(),
  amount: z.number(),
  description: z.string(),
  date: z.coerce.date(), // 👈 THIS IS THE FIX
});

export const addOtherExpense = os
  .input(otherExpenseDataSchema)
  .output(
    z.discriminatedUnion("success", [
      z.object({ success: z.literal(true) }),
      z.object({ success: z.literal(false), error: z.string() }),
    ])
  )
  .errors({
    BOTTLE_USAGE_404: {
      status: 404,
      message: "Bottle usage record not found for the given date",
    },
    BAD_REQUEST: {
      status: 400,
      message:
        "Bottle refill cannot be more than caps or empty bottles available",
    },
  })
  .handler(async ({ input, errors }) => {
    try {
      if (input.refilled_bottles > 0) {
        const [bottleUsage] = await db
          .select()
          .from(BottleUsage)
          .where(
            and(
              eq(BottleUsage.moderator_id, input.moderator_id),
              gte(BottleUsage.createdAt, startOfDay(input.date)),
              lte(BottleUsage.createdAt, endOfDay(input.date))
            )
          )
          .orderBy(desc(BottleUsage.createdAt))
          .limit(1);

        if (!bottleUsage) {
          throw errors.BOTTLE_USAGE_404();
        }

        if (
          bottleUsage.empty_bottles < input.refilled_bottles ||
          bottleUsage.caps - bottleUsage.refilled_bottles <
            input.refilled_bottles
        ) {
          throw errors.BAD_REQUEST();
        }

        await db
          .update(BottleUsage)
          .set({
            empty_bottles: bottleUsage.empty_bottles - input.refilled_bottles,
            remaining_bottles:
              bottleUsage.remaining_bottles + input.refilled_bottles,
            expense: bottleUsage.expense + input.amount,
          })
          .where(eq(BottleUsage.id, bottleUsage.id));
      }

      await db.insert(OtherExpense).values({
        moderator_id: input.moderator_id,
        amount: input.amount,
        description: input.description,
        refilled_bottles: input.refilled_bottles,
        date: input.date,
      });

      return { success: true };
    } catch (error) {
      console.error("Error creating other expense:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  });

export const getOtherExpensesByModeratorId = os
  .input(
    z.object({
      id: z.string(),
      dob: z.date(),
    })
  )
  .output(
    z.union([z.array(z.custom<typeof OtherExpense.$inferSelect>()), z.null()])
  )
  .handler(async ({ input }) => {
    try {
      // Fetch from database directly
      const expenses = await db
        .select()
        .from(OtherExpense)
        .where(
          and(
            eq(OtherExpense.moderator_id, input.id),
            gte(OtherExpense.date, startOfDay(input.dob)),
            lte(OtherExpense.date, endOfDay(input.dob))
          )
        )
        .orderBy(desc(OtherExpense.date));

      return expenses;
    } catch (error) {
      console.error("Error fetching other expenses:", error);
      return null;
    }
  });
