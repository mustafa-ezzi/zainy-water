import { adminProcedure } from "@/middlewares/admin-clerk";
import { Moderator, OtherExpense } from "@/db/schema";
import { z } from "zod";
import { subDays } from "date-fns";
import { db } from "@/db";
import { and, desc, eq, gte, lte } from "drizzle-orm";

export const OtherExpense30dRecords = z.object({
  Moderator: z.custom<typeof Moderator.$inferSelect>(),
  OtherExpense: z.custom<typeof OtherExpense.$inferSelect>(),
});

export const get30dOtherExpenses = adminProcedure
  .input(z.void())
  .output(OtherExpense30dRecords.array())
  .handler(async () => {
    const now = new Date();
    const from = subDays(now, 30);

    try {
      const otherExpense = await db
        .select()
        .from(OtherExpense)
        .where(
          and(
            gte(OtherExpense.createdAt, from),
            lte(OtherExpense.createdAt, now),
          ),
        )
        .innerJoin(Moderator, eq(Moderator.id, OtherExpense.moderator_id))
        .orderBy(desc(OtherExpense.createdAt));

      return otherExpense;
    } catch (error) {
      console.error("Error fetching 30d Other Expense: ", error);
      throw error;
    }
  });
