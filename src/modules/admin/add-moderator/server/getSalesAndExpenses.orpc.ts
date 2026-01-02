import { db } from "@/db";
import { Delivery, Miscellaneous, Moderator, OtherExpense } from "@/db/schema";
import { adminProcedure } from "@/middlewares/admin-clerk";
import { startOfDay } from "date-fns";
import { and, eq, gte, lte } from "drizzle-orm";
import z from "zod";

export const getSalesAndExpenses = adminProcedure
  .input(z.string())
  .output(
    z.object({
      sales: z.number(),
      expenses: z.number(),
    })
  )
  .handler(async ({ input: name }) => {
    const now = new Date();
    const from = startOfDay(now);

    const [moderator] = await db
      .select({ id: Moderator.id })
      .from(Moderator)
      .where(eq(Moderator.name, name))
      .limit(1);

    if (!moderator) {
      throw new Error("Moderator not found");
    }

    const result = await db.transaction(async (tx) => {
      return await Promise.all([
        tx
          .select()
          .from(Delivery)
          .where(
            and(
              eq(Delivery.moderator_id, moderator.id),
              gte(Delivery.createdAt, from),
              lte(Delivery.createdAt, now)
            )
          ),

        tx
          .select()
          .from(Miscellaneous)
          .where(
            and(
              eq(Miscellaneous.moderator_id, moderator.id),
              gte(Miscellaneous.createdAt, from),
              lte(Miscellaneous.createdAt, now)
            )
          ),

        tx
          .select()
          .from(OtherExpense)
          .where(
            and(
              eq(OtherExpense.moderator_id, moderator.id),
              gte(OtherExpense.createdAt, from),
              lte(OtherExpense.createdAt, now)
            )
          ),
      ]);
    });

    const data = {
      deliveries: result[0],
      miscDeliveries: result[1],
      expenses: result[2],
    };

    let sales = 0;

    data.deliveries.forEach((delivery) => {
      sales += delivery.payment;
    });

    data.miscDeliveries.forEach((delivery) => {
      sales += delivery.payment;
    });

    let totalExpenses = 0;

    data.expenses.forEach((expense) => {
      totalExpenses += expense.amount;
    });

    return {
      sales,
      expenses: totalExpenses,
    };
  });
