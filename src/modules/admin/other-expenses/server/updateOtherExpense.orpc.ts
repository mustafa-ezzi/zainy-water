import { z } from "zod";
import { adminProcedure } from "@/middlewares/admin-clerk";
import { db } from "@/db";
import { BottleUsage, Moderator, OtherExpense } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { ORPCError } from "@orpc/client";

export const UpdateOtherExpenseDataSchema = z.object({
  moderator: z.custom<typeof Moderator.$inferSelect>(),
  otherExpense: z.custom<typeof OtherExpense.$inferSelect>(),
  data: z.object({
    amount: z.number().min(0),
    description: z.string().min(3),
    refilled_bottles: z.number().min(0),
  }),
});

export const updateOtherExpense = adminProcedure
  .input(UpdateOtherExpenseDataSchema)
  .output(z.void())
  .handler(async ({ input }) => {
    const [bottleUsage] = await db
      .select()
      .from(BottleUsage)
      .where(
        and(
          eq(BottleUsage.moderator_id, input.moderator.id),
          lte(BottleUsage.createdAt, endOfDay(input.otherExpense.createdAt)),
          gte(BottleUsage.createdAt, startOfDay(input.otherExpense.createdAt))
        )
      );

    if (!bottleUsage) {
      throw new ORPCError(
        "No bottle usage found for the given date and moderator."
      );
    }

    if (
      input.data.refilled_bottles - input.otherExpense.refilled_bottles >
      bottleUsage.empty_bottles
    ) {
      throw new ORPCError("Not enough empty bottles available.");
    }

    await db.transaction(async (tx) => {
      await Promise.all([
        tx
          .update(BottleUsage)
          .set({
            refilled_bottles:
              bottleUsage.refilled_bottles +
              input.data.refilled_bottles -
              input.otherExpense.refilled_bottles,
            empty_bottles:
              bottleUsage.empty_bottles -
              (input.data.refilled_bottles -
                input.otherExpense.refilled_bottles),
            expense:
              bottleUsage.expense +
              input.data.amount -
              input.otherExpense.amount,
          })
          .where(eq(BottleUsage.id, bottleUsage.id)),

        tx
          .update(OtherExpense)
          .set({
            amount: input.data.amount,
            description: input.data.description,
            refilled_bottles: input.data.refilled_bottles,
          })
          .where(eq(OtherExpense.id, input.otherExpense.id)),
      ]);
    });
  });
