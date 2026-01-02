"use server";

import { db } from "@/db";
import { Delivery, Miscellaneous, Moderator, OtherExpense } from "@/db/schema";
import { startOfDay, endOfDay } from "date-fns";
import { and, eq, gte, lte } from "drizzle-orm";

export async function getSalesAndExpenses(
  moderatorId: string,
  fromDateISO: string,
  toDateISO: string
) {
  const fromDate = startOfDay(new Date(fromDateISO));
  const toDate = endOfDay(new Date(toDateISO));

  const [moderator] = await db
    .select({ id: Moderator.id })
    .from(Moderator)
    .where(eq(Moderator.id, moderatorId))
    .limit(1);

  if (!moderator) {
    throw new Error("Moderator not found");
  }

  const [deliveries, miscDeliveries, expenses] = await db.transaction(
    async (tx) => {
      return Promise.all([
        tx
          .select()
          .from(Delivery)
          .where(
            and(
              eq(Delivery.moderator_id, moderator.id),
              gte(Delivery.createdAt, fromDate),
              lte(Delivery.createdAt, toDate)
            )
          ),

        tx
          .select()
          .from(Miscellaneous)
          .where(
            and(
              eq(Miscellaneous.moderator_id, moderator.id),
              gte(Miscellaneous.createdAt, fromDate),
              lte(Miscellaneous.createdAt, toDate)
            )
          ),

        tx
          .select()
          .from(OtherExpense)
          .where(
            and(
              eq(OtherExpense.moderator_id, moderator.id),
              gte(OtherExpense.date, fromDate),
              lte(OtherExpense.date, toDate)
            )
          ),
      ]);
    }
  );

  let sales = 0;
  let totalExpenses = 0;

  deliveries.forEach((d) => (sales += d.payment));
  miscDeliveries.forEach((d) => (sales += d.payment));
  expenses.forEach((e) => (totalExpenses += e.amount));

  return {
    sales,
    expenses: totalExpenses,
    fromDate,
    toDate,
  };
}
