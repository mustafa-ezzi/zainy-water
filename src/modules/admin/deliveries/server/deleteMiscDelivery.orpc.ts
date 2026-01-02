import { adminProcedure } from "@/middlewares/admin-clerk";
import z from "zod";
import { columnSchema } from "../ui/data-table-4-misc-deliveries";
import { db } from "@/db";
import { BottleUsage, Miscellaneous } from "@/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { ORPCError } from "@orpc/client";

export const deleteMiscdelivery = adminProcedure
  .input(
    z.object({
      data: z.custom<columnSchema>(),
    })
  )
  .output(z.object({ success: z.boolean() }))
  .handler(async ({ input }) => {
    const { data } = input;

    const from = startOfDay(data.Miscellaneous.createdAt);
    const to = endOfDay(from);

    const [bottleUsage] = await db
      .select()
      .from(BottleUsage)
      .where(
        and(
          eq(BottleUsage.id, data.Moderator.id),
          lte(BottleUsage.createdAt, to),
          gte(BottleUsage.createdAt, from)
        )
      )
      .limit(1);

    if (!bottleUsage) {
      throw new ORPCError(
        "Bottle usage record not found for the given date and moderator."
      );
    }

    await db.transaction(async (tx) => {
      await Promise.all([
        tx
          .update(BottleUsage)
          .set({
            sales: bottleUsage.sales - data.Miscellaneous.filled_bottles,
            revenue: bottleUsage.revenue - data.Miscellaneous.payment,
            empty_bottles:
              bottleUsage.empty_bottles - data.Miscellaneous.empty_bottles,
            damaged_bottles:
              bottleUsage.damaged_bottles - data.Miscellaneous.damaged_bottles,
          })
          .where(eq(BottleUsage.id, bottleUsage.id)),

        tx
          .delete(Miscellaneous)
          .where(eq(Miscellaneous.id, data.Miscellaneous.id)),
      ]);
    });

    return { success: true };
  });
