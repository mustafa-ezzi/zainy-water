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
  date: z.coerce.date(),
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
    BAD_REQUEST: {
      status: 400,
      message:
        "Bottle refill cannot be more than caps or empty bottles available",
    },
  })
  .handler(async ({ input, errors }) => {
    try {
      // 1. Always get today's usage
      let [usage] = await db
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

      // 2. If not exists → clone from latest
      if (!usage) {
        const [latestUsage] = await db
          .select()
          .from(BottleUsage)
          .where(eq(BottleUsage.moderator_id, input.moderator_id))
          .orderBy(desc(BottleUsage.createdAt))
          .limit(1);

        const [inserted] = await db
          .insert(BottleUsage)
          .values({
            moderator_id: input.moderator_id,
            filled_bottles: 0,
            empty_bottles: latestUsage?.empty_bottles ?? 0,
            remaining_bottles: latestUsage?.remaining_bottles ?? 0,
            caps: latestUsage?.caps ?? 0,
            expense: latestUsage?.expense ?? 0,
            createdAt: input.date,
          })
          .returning();

        usage = inserted;
      }

      // 3. Validate only if bottles > 0
      if (input.refilled_bottles > 0) {
        if (
          usage.empty_bottles < input.refilled_bottles ||
          usage.caps < input.refilled_bottles
        ) {
          throw errors.BAD_REQUEST();
        }
      }

      // 4. Always update expense, conditionally update bottles
      await db
        .update(BottleUsage)
        .set({
          empty_bottles:
            usage.empty_bottles - (input.refilled_bottles || 0),

          remaining_bottles:
            usage.remaining_bottles + (input.refilled_bottles || 0),

          caps:
            usage.caps - (input.refilled_bottles || 0),
          
          refilled_bottles:
            (usage.refilled_bottles ?? 0) + (input.refilled_bottles || 0),

          expense: usage.expense + input.amount, // 👈 NOW ALWAYS ADDS
        })
        .where(eq(BottleUsage.id, usage.id));

      // 5. Insert expense record
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
      return await db
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
    } catch (error) {
      console.error("Error fetching other expenses:", error);
      return null;
    }
  });
