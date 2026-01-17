import { adminProcedure } from "@/middlewares/admin-clerk";
import { z } from "zod";
import { subDays } from "date-fns";
import { db } from "@/db";
import { and, count, desc, eq, gte, lte, sum } from "drizzle-orm";
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
  depositBottles: z.number(),
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
      const [customerRes, moderatorRes, deliveryRes, miscRes, depositRes, totalBottlesRes, expensesRes] =
        await db.transaction(async (tx) => {
          return await Promise.all([
            tx.select({ total: count() }).from(Customer),
            tx.select({ total: count() }).from(Moderator),
            tx.select({ payment: Delivery.payment })
              .from(Delivery)
              .where(and(lte(Delivery.createdAt, now), gte(Delivery.createdAt, from))),
            tx.select({ payment: Miscellaneous.payment })
              .from(Miscellaneous)
              .where(and(lte(Miscellaneous.createdAt, now), gte(Miscellaneous.createdAt, from))),
            tx.select({ deposit: Customer.deposit }).from(Customer).where(eq(Customer.isActive, true)),
            tx.select().from(TotalBottles).orderBy(desc(TotalBottles.createdAt)).limit(1),
            tx.select({ amount: OtherExpense.amount })
              .from(OtherExpense)
              .where(and(lte(OtherExpense.createdAt, now), gte(OtherExpense.createdAt, from))),
          ]);
        });

      // Calculate total revenue
      const totalRevenue =
        deliveryRes.reduce((acc, d) => acc + Number(d.payment || 0), 0) +
        miscRes.reduce((acc, d) => acc + Number(d.payment || 0), 0);

      // Deposit count
      const depositCount = depositRes.reduce((acc, d) => acc + Number(d.deposit || 0), 0);

      // Expenses
      const expenses = expensesRes.reduce((acc, e) => acc + Number(e.amount || 0), 0);

      // Bottles calculations
      const totalBottlesRow = totalBottlesRes[0] || null;

      const totalBottles = totalBottlesRow?.total_bottles || 0;
      const usedBottles = totalBottlesRow?.used_bottles || 0;
      const damagedBottles = totalBottlesRow?.damaged_bottles || 0;
      const depositBottles = totalBottlesRow?.deposit_bottles || 0;

      // Correct available bottles calculation
      const availableBottles = Math.max(totalBottles - usedBottles - damagedBottles - depositBottles, 0);

      return {
        customerCount: customerRes[0]?.total || 0,
        moderatorCount: moderatorRes[0]?.total || 0,
        totalRevenue,
        depositCount,
        expenses,
        totalBottles,
        usedBottles,
        damagedBottles,
        availableBottles,
        depositBottles,
      };
    } catch (error) {
      console.error("Error fetching dashboard analytics:", error);
      throw error;
    }
  });
