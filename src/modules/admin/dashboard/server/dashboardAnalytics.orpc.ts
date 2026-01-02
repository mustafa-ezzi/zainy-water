import { adminProcedure } from "@/middlewares/admin-clerk";
import { z } from "zod";
import { subDays } from "date-fns";
import { db } from "@/db";
import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import {
  Customer,
  Delivery,
  Miscellaneous,
  Moderator,
  OtherExpense,
  TotalBottles,
} from "@/db/schema";

export const DashboardAnalyticsSchema = z.object({
  customerCount: z.number(),
  moderatorCount: z.number(),
  totalRevenue: z.number(),
  depositCount: z.number(),
  availableBottles: z.number(),
  totalBottles: z.number(),
  usedBottles: z.number(),
  damagedBottles: z.number(),
  expenses: z.number(),
});

export const dashboardAnalyticsOrpc = adminProcedure
  .input(z.void())
  .output(DashboardAnalyticsSchema)
  .handler(async () => {
    const now = new Date();
    const from = subDays(now, 30);

    try {
      const transaction = await db.transaction(async (tx) => {
        return await Promise.all([
          await tx.select({ total: count() }).from(Customer), // index [0] -> customerCount

          await tx.select({ total: count() }).from(Moderator), // index [1] -> moderatorCount

          await tx
            .select({ payment: Delivery.payment })
            .from(Delivery)
            .where(
              and(lte(Delivery.createdAt, now), gte(Delivery.createdAt, from))
            ), // index [2] -> deliveries

          await tx
            .select({ payment: Miscellaneous.payment })
            .from(Miscellaneous)
            .where(
              and(
                lte(Miscellaneous.createdAt, now),
                gte(Miscellaneous.createdAt, from) // index [3] -> miscellaneousDeliveries
              )
            ),

          await tx
            .select({ deposit: Customer.deposit })
            .from(Customer)
            .where(eq(Customer.isActive, true)), // index [4] -> deposit bottles

          await tx
            .select()
            .from(TotalBottles)
            .orderBy(desc(TotalBottles.createdAt))
            .limit(1), // index [5] -> total bottles (latest entry)

          await tx
            .select({ amount: OtherExpense.amount })
            .from(OtherExpense)
            .where(
              and(
                lte(OtherExpense.createdAt, now),
                gte(OtherExpense.createdAt, from)
              )
            ), // index [6] -> other expenses
        ]);
      });

      const result = {
        customerCount: transaction[0][0],
        moderatorCount: transaction[1][0],
        deliveries: transaction[2],
        miscellaneousDeliveries: transaction[3],
        deposit: transaction[4],
        totalBottles: transaction[5][0],
        expenses: transaction[6],
      };

      const totalDelivery = result.deliveries
        .map((delivery) => delivery.payment)
        .reduce((a, b) => a + b, 0);

      const totalMiscellaneous = result.miscellaneousDeliveries
        .map((delivery) => delivery.payment)
        .reduce((a, b) => a + b, 0);

      const totalRevenue = totalDelivery + totalMiscellaneous;

      const depositCount = result.deposit
        .map((d) => Number(d.deposit) || 0)
        .reduce((a, b) => a + b, 0);

      const expenses = result.expenses
        .map((e) => e.amount)
        .reduce((a, b) => a + b, 0);

      return {
        totalRevenue,
        customerCount: result.customerCount.total || 0,
        moderatorCount: result.moderatorCount.total || 0,
        depositCount: depositCount || 0,
        availableBottles: result.totalBottles.available_bottles || 0,
        totalBottles: result.totalBottles.total_bottles || 0,
        usedBottles: result.totalBottles.used_bottles || 0,
        damagedBottles: result.totalBottles.damaged_bottles || 0,
        expenses: expenses || 0,
      };
    } catch (error) {
      console.error("Error fetching dashboard analytics:", error);
      throw error;
    }
  });
